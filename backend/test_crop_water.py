
from crop_water import calculate_kc


def test_kc_stages():
    stages = [20, 30, 40, 30]
    coefficients = [0.4, 1.15, 0.25]

    kc, stage = calculate_kc(
        0, stages, coefficients
    )
    assert stage == "initial"
    assert abs(kc - 0.4) < 1e-9

    kc, stage = calculate_kc(
        49, stages, coefficients
    )
    assert stage == "development"
    assert abs(kc - 1.15) < 1e-9

    kc, stage = calculate_kc(
        50, stages, coefficients
    )
    assert stage == "mid"
    assert abs(kc - 1.15) < 1e-9

    kc, stage = calculate_kc(
        119, stages, coefficients
    )
    assert stage == "late"
    assert abs(kc - 0.25) < 1e-9

    print("PASS: Dört gelişme dönemi")
    print("PASS: Kc geçişleri")
    print("TÜM ÜRÜN SU ANALİZİ TESTLERİ BAŞARILI")


if __name__ == "__main__":
    test_kc_stages()
