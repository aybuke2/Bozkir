
from datetime import date, timedelta
from functools import lru_cache
import math

import pandas as pd
import requests


NASA_POWER_URL = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
)

START_YEAR = 2005
END_YEAR = 2024


@lru_cache(maxsize=32)
def fetch_nasa_data(latitude, longitude):
    """
    Seçilen koordinat için NASA POWER günlük
    yağış ve sıcaklık verilerini getirir.
    """

    params = {
        "parameters": "PRECTOTCORR,T2M",
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": f"{START_YEAR}0101",
        "end": f"{END_YEAR}1231",
        "format": "JSON",
        "time-standard": "LST",
    }

    response = requests.get(
        NASA_POWER_URL,
        params=params,
        timeout=60,
    )

    response.raise_for_status()

    data = response.json()

    parameters = data["properties"]["parameter"]

    rainfall = parameters["PRECTOTCORR"]
    temperature = parameters["T2M"]

    rows = []

    for day, rain_value in rainfall.items():
        temp_value = temperature.get(day)

        if temp_value is None:
            continue

        if rain_value in (-999, -999.0):
            continue

        if temp_value in (-999, -999.0):
            continue

        rows.append({
            "date": pd.to_datetime(
                day,
                format="%Y%m%d",
            ),
            "rainfall_mm": rain_value,
            "temperature_c": temp_value,
        })

    if not rows:
        raise ValueError(
            "Seçilen konum için geçerli NASA verisi bulunamadı."
        )

    df = pd.DataFrame(rows)

    df["rainfall_mm"] = pd.to_numeric(
        df["rainfall_mm"],
        errors="coerce",
    )

    df["temperature_c"] = pd.to_numeric(
        df["temperature_c"],
        errors="coerce",
    )

    df = df.dropna()

    df = df[
        (df["rainfall_mm"] >= 0)
        & df["rainfall_mm"].map(math.isfinite)
        & df["temperature_c"].map(math.isfinite)
    ]

    df = df.sort_values("date").reset_index(drop=True)

    return df


def analyze_location(latitude, longitude):
    """
    NASA POWER verilerini analiz ederek
    konuma özel iklim özeti oluşturur.
    """

    if not (-90 <= latitude <= 90):
        raise ValueError("Enlem -90 ile 90 arasında olmalı.")

    if not (-180 <= longitude <= 180):
        raise ValueError("Boylam -180 ile 180 arasında olmalı.")

    # Koordinatları önbellek için yuvarla
    latitude = round(latitude, 4)
    longitude = round(longitude, 4)

    df = fetch_nasa_data(latitude, longitude).copy()

    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    # Yalnızca tam yılları değerlendir
    expected_days = {
        year: (
            date(year + 1, 1, 1)
            - date(year, 1, 1)
        ).days
        for year in range(START_YEAR, END_YEAR + 1)
    }

    yearly_counts = df.groupby("year")["date"].nunique()

    complete_years = [
        year
        for year, expected in expected_days.items()
        if yearly_counts.get(year, 0) == expected
    ]

    if not complete_years:
        raise ValueError(
            "Analiz için yeterli sayıda tam yıl bulunamadı."
        )

    complete_df = df[
        df["year"].isin(complete_years)
    ].copy()

    annual = complete_df.groupby("year").agg(
        rainfall_mm=("rainfall_mm", "sum"),
        temperature_c=("temperature_c", "mean"),
    )

    # Her yılın Haziran-Ağustos toplamı
    summer = complete_df[
        complete_df["month"].isin([6, 7, 8])
    ]

    summer_annual = summer.groupby("year")[
        "rainfall_mm"
    ].sum()

    mean_summer_rainfall = summer_annual.mean()

    annual_rainfall_mean = annual[
        "rainfall_mm"
    ].mean()

    annual_rainfall_std = annual[
        "rainfall_mm"
    ].std(ddof=0)

    rainfall_cv = (
        annual_rainfall_std
        / annual_rainfall_mean
        * 100
        if annual_rainfall_mean > 0
        else None
    )

    return {
        "latitude": latitude,
        "longitude": longitude,
        "period": f"{START_YEAR}-{END_YEAR}",
        "complete_years": len(complete_years),
        "mean_annual_rainfall_mm": round(
            float(annual_rainfall_mean), 2
        ),
        "mean_temperature_c": round(
            float(annual["temperature_c"].mean()), 2
        ),
        "mean_june_august_rainfall_mm": round(
            float(mean_summer_rainfall), 2
        ),
        "annual_rainfall_cv_percent": (
            round(float(rainfall_cv), 2)
            if rainfall_cv is not None
            else None
        ),
        "source": "NASA POWER",
        "note": (
            "Geçmiş iklim gözlemlerine dayalı analizdir. "
            "Hava tahmini, toprak nemi ölçümü veya "
            "ürün bazlı sulama ihtiyacı değildir."
        ),
    }
