
"""Bozkır karar destek modülü testleri."""

from decision_api import (
    structural_score,
    DecisionRequest,
)


def run():
    assert structural_score(
        ["wheat", "chickpea", "barley"]
    ) == 80

    assert structural_score(
        ["wheat", "wheat", "barley"]
    ) == 20

    print("PASS: Rotasyon puanlama")

    payload = {
        "latitude": 37.87,
        "longitude": 32.49,
        "current": [
            "wheat", "wheat", "barley"
        ],
        "alternative_a": [
            "wheat", "chickpea", "barley"
        ],
        "alternative_b": [
            "wheat", "lentil", "barley"
        ],
        "priority": "balanced",
        "crop_calendars": {},
    }

    try:
        DecisionRequest(**payload)

    except ValueError:
        print(
            "PASS: Eksik ürün takvimi reddedildi"
        )

    else:
        raise AssertionError(
            "Eksik ürün takvimi kabul edildi."
        )

    print(
        "\nTÜM KARAR DESTEK TESTLERİ BAŞARILI"
    )


if __name__ == "__main__":
    run()
