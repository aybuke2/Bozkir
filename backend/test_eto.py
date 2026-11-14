
import math

from eto_calculator import (
    calculate_eto_components,
    extraterrestrial_radiation,
    saturation_vapor_pressure,
)


def test_fao_example_18():
    """
    FAO-56, Chapter 4, Example 18.
    Uccle, Belgium - 6 July.
    Beklenen ETo: yaklaşık 3.88 mm/gün.
    """

    tmax = 21.5
    tmin = 12.3
    tmean = 16.9

    rhmax = 84
    rhmin = 63

    # FAO Eq. 17
    ea = (
        saturation_vapor_pressure(tmin)
        * rhmax / 100
        + saturation_vapor_pressure(tmax)
        * rhmin / 100
    ) / 2

    # 10 km/h rüzgâr, 10 m -> 2 m
    wind_10m = 10 / 3.6
    wind_2m = (
        wind_10m
        * 4.87
        / math.log(67.8 * 10 - 5.42)
    )

    result = calculate_eto_components(
        tmean=tmean,
        tmax=tmax,
        tmin=tmin,
        wind=wind_2m,
        solar_radiation=22.07,
        pressure=100.1,
        latitude=50.80,
        day_of_year=187,
        actual_vapor_pressure=ea,
        elevation=100,
    )

    print(
        "FAO Example 18 ETo:",
        round(result["eto_mm_day"], 3),
        "mm/gün",
    )

    assert abs(result["eto_mm_day"] - 3.88) < 0.06
    assert abs(result["ra_mj_m2_day"] - 41.09) < 0.3
    assert abs(result["rn_mj_m2_day"] - 13.28) < 0.3

    print("PASS: FAO Example 18")


def test_radiation():
    ra = extraterrestrial_radiation(
        50.80, 187
    )

    assert abs(ra - 41.09) < 0.3
    print("PASS: Atmosfer dışı radyasyon")


def test_humidity_effect():
    base = {
        "tmean": 25,
        "tmax": 32,
        "tmin": 18,
        "wind": 2,
        "solar_radiation": 24,
        "pressure": 90,
        "latitude": 37.87,
        "day_of_year": 180,
    }

    dry = calculate_eto_components(
        **base,
        relative_humidity=30,
    )

    humid = calculate_eto_components(
        **base,
        relative_humidity=80,
    )

    assert dry["eto_mm_day"] > humid["eto_mm_day"]

    print("PASS: Nem duyarlılığı")


def test_invalid_inputs():
    try:
        calculate_eto_components(
            tmean=20,
            tmax=15,
            tmin=25,
            wind=2,
            solar_radiation=20,
            pressure=90,
            latitude=37.87,
            day_of_year=180,
            relative_humidity=50,
        )
    except ValueError:
        print("PASS: Geçersiz veri kontrolü")
    else:
        raise AssertionError(
            "Geçersiz sıcaklıklar reddedilmedi."
        )


if __name__ == "__main__":
    test_fao_example_18()
    test_radiation()
    test_humidity_effect()
    test_invalid_inputs()

    print("\nTÜM ETo TESTLERİ BAŞARILI")
