
import json
import math

import pandas as pd

from rotation_engine import (
    DATA_DIR,
    evaluate_rotation,
    compare_rotations,
    get_climate_context,
)


def test_rotation():
    """
    Rotasyon puanlarını ve yapısal göstergeleri test eder.
    """

    existing = evaluate_rotation(
        ["wheat", "wheat", "barley"]
    )

    alternative_a = evaluate_rotation(
        ["wheat", "chickpea", "barley"]
    )

    alternative_b = evaluate_rotation(
        ["wheat", "lentil", "barley"]
    )

    assert existing["score"] == 20
    assert alternative_a["score"] == 80
    assert alternative_b["score"] == 80

    assert alternative_a["score"] > existing["score"]

    assert existing["metrics"]["legume_years"] == 0
    assert alternative_a["metrics"]["legume_years"] == 1
    assert alternative_b["metrics"]["legume_years"] == 1

    assert (
        existing["metrics"]["consecutive_same_crop"]
        == 1
    )

    assert (
        existing["metrics"]["consecutive_same_family"]
        == 2
    )

    print("Rotasyon puanlama testi başarılı.")


def test_invalid_crop():
    """
    Tanımlanmamış ürünlerin kabul edilmediğini test eder.
    """

    try:
        evaluate_rotation(["wheat", "unknown"])
    except ValueError:
        print("Geçersiz ürün testi başarılı.")
        return

    raise AssertionError(
        "Geçersiz ürün kabul edilmemeliydi."
    )


def test_invalid_rotation():
    """
    Yetersiz uzunluktaki rotasyonları kontrol eder.
    """

    try:
        evaluate_rotation(["wheat"])
    except ValueError:
        print("Geçersiz rotasyon testi başarılı.")
        return

    raise AssertionError(
        "Tek ürünlü rotasyon kabul edilmemeliydi."
    )


def test_climate_context():
    """
    İklim göstergelerinin geçerli olduğunu test eder.
    """

    climate = get_climate_context()

    assert climate["location"] == "Konya (pilot)"

    assert climate["period"] == "2005-2024"

    assert (
        climate["mean_annual_rainfall_mm"] > 0
    )

    assert math.isfinite(
        climate["mean_temperature_c"]
    )

    assert (
        climate["mean_june_august_rainfall_mm"] > 0
    )

    # Yaz yağışını aylık dosyadan bağımsız hesapla
    monthly = pd.read_csv(
        DATA_DIR / "monthly_distribution.csv"
    )

    expected = monthly.loc[
        monthly["month"].isin([6, 7, 8]),
        "rainfall_mm",
    ].sum()

    assert math.isclose(
        climate["mean_june_august_rainfall_mm"],
        expected,
        abs_tol=0.01,
    )

    print("İklim bağlamı testi başarılı.")


def test_comparison():
    """
    Üç rotasyonun karşılaştırılmasını test eder.
    """

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

    result = compare_rotations(rotations)

    assert len(result["ranking"]) == 3

    scores = [
        item["score"]
        for item in result["ranking"]
    ]

    assert scores == [80, 80, 20]

    assert "climate" in result
    assert "methodology" in result

    # Standart JSON uyumluluğunu kontrol et
    json.dumps(
        result,
        ensure_ascii=False,
        allow_nan=False,
    )

    print("Rotasyon karşılaştırma testi başarılı.")


def test_invalid_comparison():
    """
    Üçten farklı sayıda rotasyon kabul edilmemeli.
    """

    try:
        compare_rotations({
            "Mevcut": ["wheat", "barley"]
        })
    except ValueError:
        print("Geçersiz karşılaştırma testi başarılı.")
        return

    raise AssertionError(
        "Eksik alternatiflerle karşılaştırma yapılmamalı."
    )


if __name__ == "__main__":
    test_rotation()
    test_invalid_crop()
    test_invalid_rotation()
    test_climate_context()
    test_comparison()
    test_invalid_comparison()

    print("\nTüm rotasyon testleri başarılı!")
