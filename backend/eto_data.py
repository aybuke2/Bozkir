
import math
from datetime import date, timedelta
from functools import lru_cache

import pandas as pd
import requests


NASA_POWER_URL = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
)

PARAMETERS = [
    "T2M",
    "T2M_MAX",
    "T2M_MIN",
    "RH2M",
    "WS2M",
    "ALLSKY_SFC_SW_DWN",
    "PS",
]

START_DATE = "20050101"
END_DATE = "20241231"  # legacy constant; live requests use latest date


@lru_cache(maxsize=16)
def _fetch_eto_weather_cached(latitude, longitude, end_date):
    """
    FAO Penman-Monteith ETo hesabı için
    NASA POWER meteoroloji verilerini getirir.
    """

    if not (
        math.isfinite(latitude)
        and -90 <= latitude <= 90
    ):
        raise ValueError("Geçersiz enlem.")

    if not (
        math.isfinite(longitude)
        and -180 <= longitude <= 180
    ):
        raise ValueError("Geçersiz boylam.")

    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "latitude": latitude,
        "longitude": longitude,
        "start": START_DATE,
        "end": end_date,
        "format": "JSON",
        "time-standard": "LST",
    }

    response = requests.get(
        NASA_POWER_URL,
        params=params,
        timeout=90,
    )

    response.raise_for_status()

    payload = response.json()

    weather = payload["properties"]["parameter"]

    missing_parameters = [
        parameter
        for parameter in PARAMETERS
        if parameter not in weather
    ]

    if missing_parameters:
        raise ValueError(
            "NASA yanıtında eksik parametreler: "
            + ", ".join(missing_parameters)
        )

    rows = []

    for day in weather["T2M"]:
        row = {
            "date": pd.to_datetime(
                day,
                format="%Y%m%d",
            )
        }

        for parameter in PARAMETERS:
            value = weather[parameter].get(day)

            if value is None:
                value = float("nan")

            row[parameter] = value

        rows.append(row)

    df = pd.DataFrame(rows)

    if df.empty:
        raise ValueError(
            "NASA POWER meteoroloji verisi bulunamadı."
        )

    for parameter in PARAMETERS:
        df[parameter] = pd.to_numeric(
            df[parameter],
            errors="coerce",
        )

        df.loc[
            df[parameter] <= -990,
            parameter,
        ] = float("nan")

    df = df.dropna(
        subset=PARAMETERS
    ).copy()

    # Fiziksel tutarlılık kontrolleri
    df = df[
        (df["RH2M"] >= 0)
        & (df["RH2M"] <= 100)
        & (df["WS2M"] >= 0)
        & (df["PS"] > 0)
        & (df["ALLSKY_SFC_SW_DWN"] >= 0)
        & (df["T2M_MIN"] <= df["T2M_MAX"])
    ]

    df = df.sort_values(
        "date"
    ).reset_index(drop=True)

    return df


def fetch_eto_weather(latitude, longitude):
    end_date = (date.today() - timedelta(days=10)).strftime("%Y%m%d")
    return _fetch_eto_weather_cached(round(latitude, 4), round(longitude, 4), end_date).copy()


def summarize_eto_weather(latitude, longitude):
    df = fetch_eto_weather(
        latitude,
        longitude,
    )

    return {
        "latitude": latitude,
        "longitude": longitude,
        "valid_days": len(df),
        "first_date": str(
            df["date"].min().date()
        ),
        "last_date": str(
            df["date"].max().date()
        ),
        "mean_temperature_c": round(
            float(df["T2M"].mean()), 2
        ),
        "mean_humidity_percent": round(
            float(df["RH2M"].mean()), 2
        ),
        "mean_wind_speed_m_s": round(
            float(df["WS2M"].mean()), 2
        ),
        "mean_solar_radiation_mj_m2_day": round(
            float(
                df["ALLSKY_SFC_SW_DWN"].mean() * 3.6
            ),
            2,
        ),
        "mean_surface_pressure_kpa": round(
            float(df["PS"].mean()), 2
        ),
        "source": "NASA POWER",
        "status": "meteorological_inputs_ready",
        "note": (
            "Meteorolojik girdiler hazırlanmıştır. "
            "ETo henüz hesaplanmamıştır."
        ),
    }


if __name__ == "__main__":
    result = summarize_eto_weather(
        37.87,
        32.49,
    )

    for key, value in result.items():
        print(f"{key}: {value}")