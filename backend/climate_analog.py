"""Historical daily seasonal analogues, not a forecast."""
from datetime import date, timedelta
import pandas as pd


def weather_for_season(eto_df, rain_df, planting_date, total_days):
    end_date = planting_date + timedelta(days=total_days - 1)
    latest = min(eto_df["date"].max().date(), rain_df["date"].max().date())
    # Use observed weather only if the whole season has been observed.
    if end_date <= latest:
        eto = eto_df.loc[(eto_df["date"].dt.date >= planting_date) & (eto_df["date"].dt.date <= end_date)].sort_values("date").copy()
        rain = rain_df.loc[(rain_df["date"].dt.date >= planting_date) & (rain_df["date"].dt.date <= end_date)].sort_values("date").copy()
        if len(eto) != total_days or len(rain) != total_days or eto["date"].dt.date.nunique() != total_days or rain["date"].dt.date.nunique() != total_days:
            raise ValueError("Incomplete daily NASA POWER data for the selected historical season.")
        return eto, rain, "observed", str(latest)

    # A future season uses the same calendar days in historical complete years.
    # Avoid pretending that climatological daily values are a weather forecast.
    max_full_year = min(latest.year - (latest.month != 12 or latest.day != 31), date.today().year - 1)
    eto_hist = eto_df.loc[(eto_df["date"].dt.year >= 2005) & (eto_df["date"].dt.year <= max_full_year)].copy()
    rain_hist = rain_df.loc[(rain_df["date"].dt.year >= 2005) & (rain_df["date"].dt.year <= max_full_year)].copy()
    def monthly_day_means(df, column):
        df["key"] = df["date"].dt.strftime("%m-%d")
        return df.groupby("key")[column].agg(["mean", "count"])
    eto_stats = monthly_day_means(eto_hist, "eto_mm_day")
    rain_stats = monthly_day_means(rain_hist, "rainfall_mm")
    eto_rows, rain_rows = [], []
    for i in range(total_days):
        day = planting_date + timedelta(days=i)
        key = day.strftime("%m-%d")
        if key not in eto_stats.index or key not in rain_stats.index or eto_stats.loc[key,"count"] < 10 or rain_stats.loc[key,"count"] < 10:
            raise ValueError("At least 10 historical observations per calendar day are needed for future planning.")
        eto_rows.append({"date": pd.Timestamp(day), "eto_mm_day": float(eto_stats.loc[key,"mean"])})
        rain_rows.append({"date": pd.Timestamp(day), "rainfall_mm": float(rain_stats.loc[key,"mean"])})
    return pd.DataFrame(eto_rows), pd.DataFrame(rain_rows), "historical_climatology", str(latest)