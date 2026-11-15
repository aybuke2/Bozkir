
import math

import numpy as np
import pandas as pd

from eto_data import fetch_eto_weather


SOLAR_CONSTANT = 0.0820
STEFAN_BOLTZMANN = 4.903e-9
ALBEDO = 0.23


def saturation_vapor_pressure(temperature):
    """Doygun buhar basıncı, kPa."""
    return 0.6108 * math.exp(
        17.27 * temperature / (temperature + 237.3)
    )


def extraterrestrial_radiation(latitude, day_of_year):
    """FAO-56 atmosfer dışı radyasyon, MJ/m2/gün."""
    phi = math.radians(latitude)

    dr = 1 + 0.033 * math.cos(
        2 * math.pi * day_of_year / 365
    )

    solar_declination = 0.409 * math.sin(
        2 * math.pi * day_of_year / 365 - 1.39
    )

    x = -math.tan(phi) * math.tan(solar_declination)
    x = max(-1.0, min(1.0, x))

    sunset_angle = math.acos(x)

    ra = (
        24 * 60 / math.pi
        * SOLAR_CONSTANT
        * dr
        * (
            sunset_angle
            * math.sin(phi)
            * math.sin(solar_declination)
            + math.cos(phi)
            * math.cos(solar_declination)
            * math.sin(sunset_angle)
        )
    )

    return max(0.0, ra)


def pressure_to_elevation(pressure_kpa):
    """Standart atmosferden yaklaşık rakım, metre."""
    return 44330 * (
        1 - (pressure_kpa / 101.325) ** 0.1903
    )


def calculate_eto_components(
    *,
    tmean,
    tmax,
    tmin,
    wind,
    solar_radiation,
    pressure,
    latitude,
    day_of_year,
    relative_humidity=None,
    actual_vapor_pressure=None,
    elevation=None,
):
    """
    Günlük FAO-56 Penman-Monteith hesabı.

    solar_radiation: MJ/m2/gün
    pressure: kPa
    wind: m/s, 2 metre yükseklikte
    eto_mm_day: mm/gün

    Nem girdisi:
    - actual_vapor_pressure verilirse doğrudan kullanılır.
    - Aksi hâlde RHmean ile yaklaşık hesaplanır.
    """

    values = [
        tmean, tmax, tmin, wind,
        solar_radiation, pressure, latitude,
    ]

    if not all(math.isfinite(float(v)) for v in values):
        raise ValueError("Meteorolojik girdiler sonlu olmalıdır.")

    if (
        tmin > tmax
        or wind < 0
        or solar_radiation < 0
        or pressure <= 0
        or not -90 <= latitude <= 90
        or not 1 <= day_of_year <= 366
    ):
        raise ValueError("Geçersiz meteorolojik girdi.")

    es = (
        saturation_vapor_pressure(tmax)
        + saturation_vapor_pressure(tmin)
    ) / 2

    if actual_vapor_pressure is not None:
        ea = float(actual_vapor_pressure)
        humidity_method = "actual_vapor_pressure"
    elif relative_humidity is not None:
        rh = float(relative_humidity)
        if not 0 <= rh <= 100:
            raise ValueError("Bağıl nem 0-100 arasında olmalı.")

        ea = es * rh / 100
        humidity_method = "mean_relative_humidity"
    else:
        raise ValueError(
            "Bağıl nem veya gerçek buhar basıncı gerekli."
        )

    if not math.isfinite(ea) or ea < 0:
        raise ValueError("Geçersiz gerçek buhar basıncı.")

    vpd = max(0.0, es - ea)

    delta = (
        4098 * saturation_vapor_pressure(tmean)
        / (tmean + 237.3) ** 2
    )

    gamma = 0.000665 * pressure

    ra = extraterrestrial_radiation(
        latitude, day_of_year
    )

    if elevation is None:
        elevation = pressure_to_elevation(pressure)

    rso = (0.75 + 2e-5 * elevation) * ra

    if rso <= 0:
        raise ValueError(
            "Açık gökyüzü radyasyonu hesaplanamadı."
        )

    radiation_ratio = max(
        0.3, min(1.0, solar_radiation / rso)
    )

    rns = (1 - ALBEDO) * solar_radiation

    rnl = (
        STEFAN_BOLTZMANN
        * (
            ((tmax + 273.16) ** 4
             + (tmin + 273.16) ** 4) / 2
        )
        * (0.34 - 0.14 * math.sqrt(ea))
        * (1.35 * radiation_ratio - 0.35)
    )

    rn = rns - rnl

    # Günlük hesapta G = 0
    numerator = (
        0.408 * delta * rn
        + gamma
        * (900 / (tmean + 273))
        * wind
        * vpd
    )

    denominator = (
        delta + gamma * (1 + 0.34 * wind)
    )

    eto = max(0.0, numerator / denominator)

    return {
        "eto_mm_day": eto,
        "es_kpa": es,
        "ea_kpa": ea,
        "vpd_kpa": vpd,
        "ra_mj_m2_day": ra,
        "rso_mj_m2_day": rso,
        "rns_mj_m2_day": rns,
        "rnl_mj_m2_day": rnl,
        "rn_mj_m2_day": rn,
        "humidity_method": humidity_method,
    }


def calculate_daily_eto(row, latitude):
    result = calculate_eto_components(
        tmean=float(row["T2M"]),
        tmax=float(row["T2M_MAX"]),
        tmin=float(row["T2M_MIN"]),
        wind=float(row["WS2M"]),
        solar_radiation=float(
            row["ALLSKY_SFC_SW_DWN"] * 3.6
        ),
        pressure=float(row["PS"]),
        latitude=latitude,
        day_of_year=row["date"].day_of_year,
        relative_humidity=float(row["RH2M"]),
    )

    return result["eto_mm_day"]


def calculate_eto_dataframe(latitude, longitude):
    weather = fetch_eto_weather(
        latitude, longitude
    ).copy()

    weather["eto_mm_day"] = weather.apply(
        lambda row: calculate_daily_eto(
            row, latitude
        ),
        axis=1,
    )

    if not np.isfinite(
        weather["eto_mm_day"].to_numpy()
    ).all():
        raise ValueError("Geçersiz ETo sonucu.")

    return weather


def summarize_eto(latitude, longitude):
    df = calculate_eto_dataframe(
        latitude, longitude
    )

    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    complete_years = []

    for year, group in df.groupby("year"):
        expected_days = (
            pd.Timestamp(year=int(year), month=12, day=31)
            - pd.Timestamp(year=int(year), month=1, day=1)
        ).days + 1

        if group["date"].nunique() == expected_days:
            complete_years.append(int(year))

    if not complete_years:
        raise ValueError("Eksiksiz analiz yılı yok.")

    valid = df[
        df["year"].isin(complete_years)
    ].copy()

    annual = valid.groupby("year")[
        "eto_mm_day"
    ].sum()

    monthly = valid.groupby(
        ["year", "month"]
    )["eto_mm_day"].sum().reset_index()

    monthly_mean = monthly.groupby(
        "month"
    )["eto_mm_day"].mean()

    return {
        "latitude": latitude,
        "longitude": longitude,
        "period": (
            f"{min(complete_years)}-"
            f"{max(complete_years)}"
        ),
        "complete_years": len(complete_years),
        "mean_daily_eto_mm": round(
            float(valid["eto_mm_day"].mean()), 2
        ),
        "mean_annual_eto_mm": round(
            float(annual.mean()), 2
        ),
        "min_annual_eto_mm": round(
            float(annual.min()), 2
        ),
        "max_annual_eto_mm": round(
            float(annual.max()), 2
        ),
        "monthly_mean_eto_mm": {
            str(int(month)): round(float(value), 2)
            for month, value in monthly_mean.items()
        },
        "source": "NASA POWER",
        "method": "FAO-56 Penman-Monteith",
        "humidity_method": "mean_relative_humidity",
        "note": (
            "Yaklaşık referans evapotranspirasyon. "
            "Ürün su ihtiyacı veya sulama gereksinimi "
            "değildir. Ortalama bağıl nem ve basınçtan "
            "tahmini rakım kullanılmıştır."
        ),
    }


if __name__ == "__main__":
    result = summarize_eto(37.87, 32.49)

    print("\nBOZKIR - ETo ANALİZİ")
    print("-------------------------")

    for key, value in result.items():
        print(f"{key}: {value}")