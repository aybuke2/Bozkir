
import pandas as pd

from nasa_power import aggregate_complete_periods
from climate_indicators import (
    calculate_growing_season_rainfall,
    calculate_rainfall_variability,
)


def test_missing_daily_rainfall():
    dates = pd.date_range(
        "2024-01-01", "2024-12-31", freq="D"
    )

    df = pd.DataFrame(
        {
            "PRECTOTCORR": [1.0] * len(dates),
            "T2M": [15.0] * len(dates),
        },
        index=dates,
    )

    df.loc["2024-03-15", "PRECTOTCORR"] = float("nan")

    annual = aggregate_complete_periods(df, "YE")

    assert pd.isna(annual.iloc[0]["rainfall_mm"])
    assert annual.iloc[0]["temperature_c"] == 15.0

    growing = calculate_growing_season_rainfall(
        df, [3, 4, 5, 6]
    )

    assert pd.isna(growing.loc[2024])


def test_complete_data():
    dates = pd.date_range(
        "2023-01-01", "2024-12-31", freq="D"
    )

    df = pd.DataFrame(
        {
            "PRECTOTCORR": [1.0] * len(dates),
            "T2M": [15.0] * len(dates),
        },
        index=dates,
    )

    annual = aggregate_complete_periods(df, "YE")

    assert annual.iloc[0]["rainfall_mm"] == 365.0
    assert annual.iloc[1]["rainfall_mm"] == 366.0

    cv = calculate_rainfall_variability(df)
    assert pd.notna(cv)


if __name__ == "__main__":
    test_missing_daily_rainfall()
    test_complete_data()
    print("Tüm iklim testleri başarılı!")
