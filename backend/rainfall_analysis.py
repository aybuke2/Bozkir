
import math

import pandas as pd

from location_climate import fetch_nasa_data


def analyze_rainfall_period(
    latitude,
    longitude,
    months,
):
    """
    Seçilen ayların 2005-2024 dönemindeki
    yağış miktarını ve yıllar arası değişkenliğini
    hesaplar.

    Bu analiz ürün su ihtiyacını hesaplamaz.
    """

    if not -90 <= latitude <= 90:
        raise ValueError("Geçersiz enlem.")

    if not -180 <= longitude <= 180:
        raise ValueError("Geçersiz boylam.")

    if not months:
        raise ValueError("En az bir ay seçilmelidir.")

    if (
        len(set(months)) != len(months)
        or any(
            not isinstance(month, int)
            or isinstance(month, bool)
            or not 1 <= month <= 12
            for month in months
        )
    ):
        raise ValueError(
            "Aylar 1-12 arasında ve tekrarsız olmalıdır."
        )

    months = sorted(months)

    df = fetch_nasa_data(
        round(latitude, 4),
        round(longitude, 4),
    ).copy()

    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    # Yalnızca eksiksiz takvim yıllarını kullan.
    # Böylece seçilen dönemlerde eksik günlerin
    # sonuçları yanıltması engellenir.
    expected_dates = pd.date_range(
        "2005-01-01",
        "2024-12-31",
        freq="D",
    )

    df = df.drop_duplicates(subset=["date"])
    df = df.set_index("date").sort_index()

    valid_years = []

    for year in range(2005, 2025):
        dates = expected_dates[
            expected_dates.year == year
        ]

        yearly = df.reindex(dates)

        if (
            yearly["rainfall_mm"].notna().all()
            and yearly["temperature_c"].notna().all()
        ):
            valid_years.append(year)

    if len(valid_years) < 10:
        raise ValueError(
            "Güvenilir analiz için en az 10 "
            "eksiksiz yıl gereklidir."
        )

    df = df.reset_index().rename(
        columns={"index": "date"}
    )

    selected = df[
        df["year"].isin(valid_years)
        & df["month"].isin(months)
    ].copy()

    yearly = selected.groupby("year").agg(
        rainfall_mm=("rainfall_mm", "sum"),
        mean_temperature_c=(
            "temperature_c", "mean"
        ),
    )

    rainfall = yearly["rainfall_mm"]

    mean_rainfall = float(rainfall.mean())
    std_rainfall = float(
        rainfall.std(ddof=0)
    )

    cv = (
        std_rainfall / mean_rainfall * 100
        if mean_rainfall > 0
        else None
    )

    # Tarihsel ortalamanın altında yağış
    # görülen yılların oranı.
    below_average_count = int(
        (rainfall < mean_rainfall).sum()
    )

    below_average_frequency = (
        below_average_count / len(rainfall) * 100
    )

    # 20. yüzdelik dilim: tarihsel dağılımın
    # görece düşük yağışlı kısmını gösterir.
    p20 = float(rainfall.quantile(0.20))

    annual_results = [
        {
            "year": int(year),
            "rainfall_mm": round(
                float(row["rainfall_mm"]), 2
            ),
            "mean_temperature_c": round(
                float(row["mean_temperature_c"]), 2
            ),
        }
        for year, row in yearly.iterrows()
    ]

    result = {
        "latitude": round(latitude, 4),
        "longitude": round(longitude, 4),
        "months": months,
        "period": "2005-2024",
        "complete_years": len(valid_years),
        "mean_rainfall_mm": round(
            mean_rainfall, 2
        ),
        "min_rainfall_mm": round(
            float(rainfall.min()), 2
        ),
        "max_rainfall_mm": round(
            float(rainfall.max()), 2
        ),
        "rainfall_p20_mm": round(p20, 2),
        "rainfall_cv_percent": (
            round(cv, 2)
            if cv is not None
            and math.isfinite(cv)
            else None
        ),
        "below_average_years": below_average_count,
        "below_average_frequency_percent": round(
            below_average_frequency, 2
        ),
        "annual_results": annual_results,
        "source": "NASA POWER",
        "methodology": (
            "Seçilen takvim aylarının tarihsel yağış "
            "dağılımı analiz edilmiştir. "
            "Yüzdelik dilimler geçmiş gözlemlerden "
            "hesaplanır, gelecek için olasılık tahmini "
            "değildir. Bu analiz ürün su ihtiyacını, "
            "toprak nemini veya sulama gereksinimini "
            "hesaplamaz."
        ),
    }

    return result
