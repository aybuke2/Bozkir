
from pathlib import Path

import pandas as pd
import requests

NASA_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

LATITUDE = 37.87
LONGITUDE = 32.49
START_DATE = "20050101"
END_DATE = "20241231"

OUTPUT_DIR = Path(__file__).resolve().parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)

PARAMETERS = ["PRECTOTCORR", "T2M"]


def fetch_nasa_data(latitude, longitude, start, end):
    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "latitude": latitude,
        "longitude": longitude,
        "start": start,
        "end": end,
        "format": "JSON",
        "time-standard": "LST",
    }

    print("NASA POWER verileri indiriliyor...")

    response = requests.get(
        NASA_URL, params=params, timeout=120
    )
    response.raise_for_status()

    data = response.json()
    values = data["properties"]["parameter"]

    df = pd.DataFrame(values)

    for parameter in PARAMETERS:
        if parameter not in df.columns:
            raise ValueError(
                f"NASA yanıtında {parameter} bulunamadı."
            )

    df.index = pd.to_datetime(
        df.index, format="%Y%m%d"
    )

    if df.index.has_duplicates:
        raise ValueError("Tekrarlanan tarihler bulundu.")

    df.index.name = "date"
    df = df.sort_index()

    # Sayısal dönüşüm ve eksik veri temizliği
    for column in PARAMETERS:
        df[column] = pd.to_numeric(
            df[column], errors="coerce"
        )

    fill_value = data.get("header", {}).get(
        "fill_value", -999
    )

    df = df.replace(fill_value, float("nan"))
    df = df.replace(-999, float("nan"))

    # Beklenen bütün tarihleri kontrol et
    expected_dates = pd.date_range(
        start=pd.to_datetime(start, format="%Y%m%d"),
        end=pd.to_datetime(end, format="%Y%m%d"),
        freq="D",
        name="date",
    )

    missing_dates = expected_dates.difference(df.index)

    if len(missing_dates):
        print(
            f"Uyarı: {len(missing_dates)} tarih eksik."
        )

    df = df.reindex(expected_dates)

    # Fiziksel olarak geçersiz yağış değerleri
    df.loc[
        df["PRECTOTCORR"] < 0, "PRECTOTCORR"
    ] = float("nan")

    print(f"Günlük kayıt: {len(df)}")
    print("\nEksik değer sayıları:")
    print(df.isna().sum())

    return df


def aggregate_complete_periods(df, frequency):
    rain = df["PRECTOTCORR"].resample(frequency)
    temp = df["T2M"].resample(frequency)

    result = pd.DataFrame({
        "rainfall_mm": rain.sum(min_count=1),
        "temperature_c": temp.mean(),
        "rainfall_missing_days": rain.apply(
            lambda x: int(x.isna().sum())
        ),
        "temperature_missing_days": temp.apply(
            lambda x: int(x.isna().sum())
        ),
    })

    # Eksik gün varsa tam dönem sonucu üretme
    result.loc[
        result["rainfall_missing_days"] > 0,
        "rainfall_mm",
    ] = float("nan")

    result.loc[
        result["temperature_missing_days"] > 0,
        "temperature_c",
    ] = float("nan")

    return result


def analyze_annual(df):
    annual = aggregate_complete_periods(df, "YE")
    annual.index = annual.index.year
    annual.index.name = "year"

    mean_rainfall = annual["rainfall_mm"].mean()

    if pd.notna(mean_rainfall) and mean_rainfall > 0:
        annual["rainfall_anomaly_mm"] = (
            annual["rainfall_mm"] - mean_rainfall
        )
        annual["rainfall_anomaly_pct"] = (
            annual["rainfall_anomaly_mm"]
            / mean_rainfall * 100
        )
    else:
        annual["rainfall_anomaly_mm"] = float("nan")
        annual["rainfall_anomaly_pct"] = float("nan")

    return annual


def analyze_monthly(df):
    monthly = aggregate_complete_periods(df, "MS")
    monthly.index.name = "month"
    return monthly


def main():
    df = fetch_nasa_data(
        LATITUDE, LONGITUDE, START_DATE, END_DATE
    )

    annual = analyze_annual(df)
    monthly = analyze_monthly(df)

    print("\n20 YILLIK İKLİM ÖZETİ")
    print("--------------------------")

    print(
        "Ortalama yıllık yağış:",
        round(annual["rainfall_mm"].mean(), 2),
        "mm"
    )

    print(
        "Ortalama sıcaklık:",
        round(annual["temperature_c"].mean(), 2),
        "°C"
    )

    print("\nYILLIK SONUÇLAR")
    print(annual.round(2).to_string())

    print("\nEN DÜŞÜK YAĞIŞLI 5 YIL")
    print(
        annual.nsmallest(
            5, "rainfall_mm"
        ).round(2).to_string()
    )

    print("\nEN YÜKSEK YAĞIŞLI 5 YIL")
    print(
        annual.nlargest(
            5, "rainfall_mm"
        ).round(2).to_string()
    )

    df.to_csv(OUTPUT_DIR / "daily_climate.csv")
    annual.to_csv(OUTPUT_DIR / "annual_climate.csv")
    monthly.to_csv(OUTPUT_DIR / "monthly_climate.csv")

    print("\nVeri analizi tamamlandı.")


if __name__ == "__main__":
    main()
