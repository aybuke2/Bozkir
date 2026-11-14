
import math

import pandas as pd

from crop_data import get_crop
from location_climate import fetch_nasa_data


def analyze_crop_season(
    latitude,
    longitude,
    crop_id,
    start_month,
    end_month,
):
    """
    Seçilen ürünün kullanıcı tarafından belirtilen
    yetişme dönemindeki tarihsel yağışı analiz eder.

    Ekim-Haziran gibi yıl aşan dönemleri destekler.
    """

    crop = get_crop(crop_id)

    if not -90 <= latitude <= 90:
        raise ValueError("Geçersiz enlem.")

    if not -180 <= longitude <= 180:
        raise ValueError("Geçersiz boylam.")

    if not (
        isinstance(start_month, int)
        and not isinstance(start_month, bool)
        and isinstance(end_month, int)
        and not isinstance(end_month, bool)
        and 1 <= start_month <= 12
        and 1 <= end_month <= 12
    ):
        raise ValueError(
            "Başlangıç ve bitiş ayları 1-12 arasında olmalı."
        )

    latitude = round(latitude, 4)
    longitude = round(longitude, 4)

    df = fetch_nasa_data(
        latitude,
        longitude,
    ).copy()

    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    # Yıl aşan dönem: örn. Ekim-Haziran
    crosses_year = start_month > end_month

    if crosses_year:
        selected = df[
            (df["month"] >= start_month)
            | (df["month"] <= end_month)
        ].copy()

        # Dönemi bitiş yılının adıyla etiketle.
        selected["season_year"] = selected["year"]

        selected.loc[
            selected["month"] >= start_month,
            "season_year",
        ] += 1

    else:
        selected = df[
            (df["month"] >= start_month)
            & (df["month"] <= end_month)
        ].copy()

        selected["season_year"] = selected["year"]

    results = []

    first_season_year = (
        2006 if crosses_year else 2005
    )

    for season_year in range(
        first_season_year, 2025
    ):
        if crosses_year:
            season_start = pd.Timestamp(
                season_year - 1,
                start_month,
                1,
            )
        else:
            season_start = pd.Timestamp(
                season_year,
                start_month,
                1,
            )

        season_end = (
            pd.Timestamp(
                season_year,
                end_month,
                1,
            )
            + pd.offsets.MonthEnd(0)
        )

        expected_dates = pd.date_range(
            season_start,
            season_end,
            freq="D",
        )

        season = selected[
            selected["season_year"] == season_year
        ].copy()

        season = season.drop_duplicates(
            subset=["date"]
        )

        season = season.set_index("date").reindex(
            expected_dates
        )

        if (
            season["rainfall_mm"].isna().any()
            or season["temperature_c"].isna().any()
        ):
            continue

        results.append({
            "season_year": season_year,
            "rainfall_mm": float(
                season["rainfall_mm"].sum()
            ),
            "mean_temperature_c": float(
                season["temperature_c"].mean()
            ),
        })

    if len(results) < 10:
        raise ValueError(
            "En az 10 eksiksiz yetişme dönemi gerekli."
        )

    rainfall = pd.Series([
        item["rainfall_mm"]
        for item in results
    ])

    mean_rainfall = float(rainfall.mean())
    rainfall_std = float(
        rainfall.std(ddof=0)
    )

    cv = (
        rainfall_std / mean_rainfall * 100
        if mean_rainfall > 0
        else None
    )

    return {
        "crop_id": crop_id,
        "crop_name": crop.name,
        "latitude": latitude,
        "longitude": longitude,
        "start_month": start_month,
        "end_month": end_month,
        "crosses_year": crosses_year,
        "complete_seasons": len(results),
        "mean_season_rainfall_mm": round(
            mean_rainfall, 2
        ),
        "min_season_rainfall_mm": round(
            float(rainfall.min()), 2
        ),
        "max_season_rainfall_mm": round(
            float(rainfall.max()), 2
        ),
        "rainfall_p20_mm": round(
            float(rainfall.quantile(0.20)), 2
        ),
        "rainfall_cv_percent": (
            round(cv, 2)
            if cv is not None and math.isfinite(cv)
            else None
        ),
        "annual_results": [
            {
                "season_year": item["season_year"],
                "rainfall_mm": round(
                    item["rainfall_mm"], 2
                ),
                "mean_temperature_c": round(
                    item["mean_temperature_c"], 2
                ),
            }
            for item in results
        ],
        "source": "NASA POWER",
        "methodology": (
            "Kullanıcının belirttiği takvim ayları "
            "için tarihsel yağış analizi yapılmıştır. "
            "Yetişme dönemi tarihleri yerel olarak "
            "doğrulanmalıdır. Sonuçlar su ihtiyacı, "
            "sulama gereksinimi veya verim tahmini "
            "değildir."
        ),
    }
