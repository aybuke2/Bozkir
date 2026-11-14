
from pathlib import Path

import pandas as pd

from nasa_power import aggregate_complete_periods

DATA_DIR = Path(__file__).resolve().parent / "data"


def load_climate_data():
    df = pd.read_csv(
        DATA_DIR / "daily_climate.csv",
        parse_dates=["date"],
        index_col="date",
    )

    df = df.sort_index()

    if df.index.has_duplicates:
        raise ValueError("Tekrarlanan tarihler var.")

    if not {"PRECTOTCORR", "T2M"}.issubset(df.columns):
        raise ValueError("Gerekli iklim sütunları eksik.")

    return df


def calculate_growing_season_rainfall(df, months):
    """
    Aynı takvim yılı içindeki seçilen aylara ait
    yağış toplamlarını hesaplar.
    """

    if not months or any(
        not isinstance(m, int) or m < 1 or m > 12
        for m in months
    ):
        raise ValueError("Aylar 1-12 arasında olmalı.")

    if len(months) != len(set(months)):
        raise ValueError("Tekrarlanan ay seçilemez.")

    # Önce eksiksiz aylık sonuçları hesapla
    monthly = aggregate_complete_periods(df, "MS")

    selected = monthly[
        monthly.index.month.isin(months)
    ]

    grouped = selected.groupby(selected.index.year)

    rainfall = grouped["rainfall_mm"].sum(
        min_count=1
    )

    # Seçilen bütün aylar mevcut ve eksiksiz olmalı
    month_counts = grouped["rainfall_mm"].count()

    rainfall.loc[
        month_counts != len(months)
    ] = float("nan")

    rainfall.index.name = "year"

    return rainfall


def calculate_rainfall_variability(df):
    annual = aggregate_complete_periods(df, "YE")
    rainfall = annual["rainfall_mm"].dropna()

    if len(rainfall) < 2:
        return float("nan")

    mean = rainfall.mean()

    if mean <= 0:
        return float("nan")

    return rainfall.std() / mean * 100


def calculate_monthly_distribution(df):
    monthly = aggregate_complete_periods(df, "MS")

    distribution = monthly["rainfall_mm"].groupby(
        monthly.index.month
    ).mean()

    distribution.index.name = "month"
    return distribution


def main():
    df = load_climate_data()

    growing_months = [3, 4, 5, 6]

    growing_rainfall = (
        calculate_growing_season_rainfall(
            df, growing_months
        )
    )

    variability = calculate_rainfall_variability(df)
    monthly = calculate_monthly_distribution(df)

    print("\nMART-HAZİRAN YAĞIŞ ANALİZİ")
    print(growing_rainfall.round(2).to_string())

    print("\nOrtalama yetişme dönemi yağışı:")
    print(f"{growing_rainfall.mean():.2f} mm")

    print("\nYıllık yağış değişkenliği (CV):")
    print(f"%{variability:.2f}")

    print("\nAYLIK ORTALAMA YAĞIŞ")
    print(monthly.round(2).to_string())

    print("\nVERİ KALİTESİ")
    print("Eksik günlük değerler:")
    print(df.isna().sum().to_string())

    print(
        "Eksiksiz yetişme dönemi sayısı:",
        growing_rainfall.notna().sum()
    )

    growing_rainfall.to_csv(
        DATA_DIR / "growing_season_rainfall.csv"
    )

    monthly.to_csv(
        DATA_DIR / "monthly_distribution.csv"
    )

    print("\nİklim göstergeleri kaydedildi.")


if __name__ == "__main__":
    main()
