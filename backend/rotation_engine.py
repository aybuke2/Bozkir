
import json
from pathlib import Path

import pandas as pd

from crop_data import get_crop


DATA_DIR = Path(__file__).resolve().parent / "data"


def evaluate_rotation(rotation):
    """
    Rotasyonun yapısal özelliklerini değerlendirir.

    Puanlar prototip amaçlıdır; bilimsel olarak
    kalibre edilmiş tarımsal performans puanları değildir.
    """

    if len(rotation) < 2:
        raise ValueError(
            "Rotasyon en az iki ürün içermelidir."
        )

    crops = [get_crop(crop_id) for crop_id in rotation]
    families = [crop.family for crop in crops]

    unique_families = len(set(families))
    unique_crops = len(set(rotation))

    consecutive_same_crop = sum(
        rotation[i] == rotation[i + 1]
        for i in range(len(rotation) - 1)
    )

    consecutive_same_family = sum(
        families[i] == families[i + 1]
        for i in range(len(families) - 1)
    )

    legume_count = sum(crop.is_legume for crop in crops)

    # Açıklanabilir prototip puanlama
    score = 50
    score += 10 * (unique_families - 1)
    score += 5 * (unique_crops - 1)

    if legume_count > 0:
        score += 10

    score -= 15 * consecutive_same_crop
    score -= 10 * consecutive_same_family

    score = max(0, min(100, score))

    observations = []

    if consecutive_same_crop > 0:
        observations.append(
            "Ardışık yıllarda aynı ürün bulunuyor."
        )

    if consecutive_same_family > 0:
        observations.append(
            "Ardışık yıllarda aynı botanik aileden "
            "ürünler bulunuyor."
        )

    if legume_count > 0:
        observations.append(
            "Rotasyonda baklagil bulunuyor. "
            "Azot döngüsü açısından değerlendirmeye değer."
        )
    else:
        observations.append(
            "Rotasyonda baklagil bulunmuyor."
        )

    if unique_families > 1:
        observations.append(
            "Rotasyonda birden fazla botanik aile var."
        )

    return {
        "rotation": rotation,
        "crop_names": [crop.name for crop in crops],
        "score": score,
        "score_type": "prototype_structural",
        "metrics": {
            "unique_crops": unique_crops,
            "unique_families": unique_families,
            "legume_years": legume_count,
            "consecutive_same_crop": consecutive_same_crop,
            "consecutive_same_family": consecutive_same_family,
        },
        "observations": observations,
    }


def get_climate_context():
    """
    Konya pilot bölgesinin daha önce hazırlanmış
    iklim CSV dosyalarını okur.
    """

    annual_path = DATA_DIR / "annual_climate.csv"
    monthly_path = DATA_DIR / "monthly_distribution.csv"

    if not annual_path.exists():
        raise FileNotFoundError(
            f"Yıllık iklim verisi bulunamadı: {annual_path}"
        )

    if not monthly_path.exists():
        raise FileNotFoundError(
            f"Aylık iklim verisi bulunamadı: {monthly_path}"
        )

    annual = pd.read_csv(annual_path)
    monthly = pd.read_csv(monthly_path)

    required_annual = {"rainfall_mm", "temperature_c"}

    if not required_annual.issubset(annual.columns):
        raise ValueError(
            "Yıllık iklim dosyasında gerekli sütunlar eksik."
        )

    if not {"month", "rainfall_mm"}.issubset(
        monthly.columns
    ):
        raise ValueError(
            "Aylık iklim dosyasında gerekli sütunlar eksik."
        )

    month_numbers = pd.to_numeric(
        monthly["month"],
        errors="raise",
    )

    if (
        month_numbers.isna().any()
        or not month_numbers.between(1, 12).all()
        or not (month_numbers % 1 == 0).all()
    ):
        raise ValueError(
            "Aylık iklim dosyasında geçersiz ay numarası var."
        )

    monthly["month"] = month_numbers.astype(int)

    if monthly["month"].duplicated().any():
        raise ValueError(
            "Aylık iklim dosyasında tekrarlanan ay var."
        )

    annual["rainfall_mm"] = pd.to_numeric(
        annual["rainfall_mm"],
        errors="coerce",
    )

    annual["temperature_c"] = pd.to_numeric(
        annual["temperature_c"],
        errors="coerce",
    )

    monthly["rainfall_mm"] = pd.to_numeric(
        monthly["rainfall_mm"],
        errors="coerce",
    )

    summer_months = monthly.loc[
        monthly["month"].isin([6, 7, 8]),
        "rainfall_mm",
    ]

    if (
        len(summer_months) != 3
        or summer_months.isna().any()
        or (summer_months < 0).any()
    ):
        raise ValueError(
            "Haziran-Ağustos yağış verileri eksik veya geçersiz."
        )

    summer_rainfall = summer_months.sum()

    annual_rainfall = annual["rainfall_mm"].mean()
    annual_temperature = annual["temperature_c"].mean()

    if (
        pd.isna(annual_rainfall)
        or pd.isna(annual_temperature)
        or annual_rainfall < 0
    ):
        raise ValueError(
            "Geçerli yıllık iklim ortalaması hesaplanamadı."
        )

    return {
        "location": "Konya (pilot)",
        "period": "2005-2024",
        "mean_annual_rainfall_mm": round(
            float(annual_rainfall), 2
        ),
        "mean_temperature_c": round(
            float(annual_temperature), 2
        ),
        "mean_june_august_rainfall_mm": round(
            float(summer_rainfall), 2
        ),
        "note": (
            "Yağış göstergeleri NASA POWER verilerinden "
            "hesaplanmıştır. Sulama ihtiyacı veya "
            "ürün bazlı su yeterliliği anlamına gelmez."
        ),
    }


def compare_rotations(rotations, climate_context=None):
    """
    Üç rotasyonu karşılaştırır.

    climate_context verilirse konuma özel iklim
    verileri kullanılır. Verilmezse Konya pilot
    verileri kullanılır.
    """

    if len(rotations) != 3:
        raise ValueError(
            "Mevcut rotasyon ve iki alternatif gerekli."
        )

    results = []

    for name, rotation in rotations.items():
        result = evaluate_rotation(rotation)
        result["name"] = name
        results.append(result)

    results.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    if climate_context is None:
        climate_context = get_climate_context()

    return {
        "climate": climate_context,
        "ranking": results,
        "methodology": (
            "Rotasyon puanları prototip yapısal kurallara "
            "dayanmaktadır. İklim göstergeleri sonuçlara "
            "eklenir ancak henüz puanlamayı etkilemez. "
            "Ürün bazlı su ihtiyacı ve toprak sağlığı "
            "etkileri ayrıca değerlendirilecektir."
        ),
    }


def main():
    rotations = {
        "Mevcut": [
            "wheat", "wheat", "barley"
        ],
        "Alternatif A": [
            "wheat", "chickpea", "barley"
        ],
        "Alternatif B": [
            "wheat", "lentil", "barley"
        ],
    }

    results = compare_rotations(rotations)

    print("\nBOZKIR ROTASYON KARŞILAŞTIRMASI")
    print("--------------------------------")

    for result in results["ranking"]:
        print(f"\n{result['name']}")

        print(
            "Ürünler:",
            " → ".join(result["crop_names"]),
        )

        print("Prototip puan:", result["score"])

        for observation in result["observations"]:
            print("-", observation)

    print("\nİKLİM BAĞLAMI")

    print(
        json.dumps(
            results["climate"],
            ensure_ascii=False,
            indent=2,
            allow_nan=False,
        )
    )

    output_path = DATA_DIR / "rotation_results.json"

    with open(
        output_path,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            results,
            file,
            ensure_ascii=False,
            indent=2,
            allow_nan=False,
        )

    print("\nSonuçlar kaydedildi:", output_path)


if __name__ == "__main__":
    main()
