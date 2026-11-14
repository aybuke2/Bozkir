
"""Bozkır: NASA POWER ve FAO-56 ile açıklanabilir rotasyon karşılaştırması.

Sonuçlar prototip senaryo göstergeleridir; sulama ihtiyacı veya
doğrulanmış tarımsal öneri değildir.
"""

from datetime import date, timedelta
from typing import Dict, List, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from crop_data import get_crop
from eto_calculator import calculate_eto_dataframe
from location_climate import fetch_nasa_data
from crop_water import calculate_kc


router = APIRouter(
    prefix="/decision",
    tags=["Decision Support"],
)


class CropCalendar(BaseModel):
    planting_date: date

    initial_days: int = Field(gt=0, le=180)
    development_days: int = Field(gt=0, le=180)
    mid_days: int = Field(gt=0, le=180)
    late_days: int = Field(gt=0, le=180)

    kc_initial: float = Field(ge=0, le=2)
    kc_mid: float = Field(ge=0, le=2)
    kc_end: float = Field(ge=0, le=2)


class DecisionRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    current: List[str] = Field(
        min_length=2, max_length=10
    )
    alternative_a: List[str] = Field(
        min_length=2, max_length=10
    )
    alternative_b: List[str] = Field(
        min_length=2, max_length=10
    )

    crop_calendars: Dict[str, CropCalendar]

    priority: Literal[
        "balanced", "water", "soil"
    ] = "balanced"

    @model_validator(mode="after")
    def check_calendars(self):
        selected = set(
            self.current
            + self.alternative_a
            + self.alternative_b
        )

        for crop_id in selected:
            try:
                crop = get_crop(crop_id)
            except (KeyError, ValueError):
                raise ValueError(
                    f"Bilinmeyen ürün: {crop_id}"
                )

            if crop is None:
                raise ValueError(
                    f"Bilinmeyen ürün: {crop_id}"
                )

            if crop_id not in self.crop_calendars:
                raise ValueError(
                    f"Eksik ürün takvimi: {crop_id}"
                )

        return self


def _crop_attr(crop, key):
    if isinstance(crop, dict):
        return crop[key]

    return getattr(crop, key)


def structural_score(rotation):
    """
    Şeffaf prototip rotasyon puanı.

    Gerçek bir toprak sağlığı ölçümü değildir.
    """

    crops = [
        get_crop(crop_id)
        for crop_id in rotation
    ]

    families = [
        _crop_attr(crop, "family")
        for crop in crops
    ]

    legumes = [
        _crop_attr(crop, "is_legume")
        for crop in crops
    ]

    score = 50

    score += 10 * max(
        0, len(set(families)) - 1
    )

    score += 5 * max(
        0, len(set(rotation)) - 1
    )

    if any(legumes):
        score += 10

    for i in range(1, len(rotation)):
        if rotation[i] == rotation[i - 1]:
            score -= 15

        if families[i] == families[i - 1]:
            score -= 10

    return max(0, min(100, score))


def _crop_water_metrics(
    crop_id,
    calendar,
    eto_df,
    rain_df,
):
    stages = [
        calendar.initial_days,
        calendar.development_days,
        calendar.mid_days,
        calendar.late_days,
    ]

    total_days = sum(stages)

    start = calendar.planting_date

    end = start + timedelta(
        days=total_days - 1
    )

    eto = eto_df.loc[
        (
            eto_df["date"].dt.date >= start
        )
        & (
            eto_df["date"].dt.date <= end
        )
    ].sort_values("date")

    rain = rain_df.loc[
        (
            rain_df["date"].dt.date >= start
        )
        & (
            rain_df["date"].dt.date <= end
        )
    ].sort_values("date")

    if (
        len(eto) != total_days
        or eto["date"].dt.date.nunique() != total_days
        or len(rain) != total_days
        or rain["date"].dt.date.nunique() != total_days
    ):
        raise ValueError(
            f"{crop_id}: Seçilen tarihler için "
            "eksiksiz günlük veri bulunamadı."
        )

    coefficients = [
        calendar.kc_initial,
        calendar.kc_mid,
        calendar.kc_end,
    ]

    kc_values = [
        calculate_kc(
            i, stages, coefficients
        )[0]
        for i in range(total_days)
    ]

    eto_total = float(
        eto["eto_mm_day"].sum()
    )

    etc_total = sum(
        float(value) * kc
        for value, kc in zip(
            eto["eto_mm_day"],
            kc_values,
        )
    )

    rain_total = float(
        rain["rainfall_mm"].sum()
    )

    gap = max(
        0.0,
        etc_total - rain_total,
    )

    gap_ratio = (
        gap / etc_total
        if etc_total > 0
        else 0.0
    )

    return {
        "crop_id": crop_id,
        "planting_date": str(start),
        "end_date": str(end),
        "eto_mm": round(eto_total, 2),
        "etc_mm": round(etc_total, 2),
        "precipitation_mm": round(
            rain_total, 2
        ),
        "gross_precipitation_gap_mm": round(
            gap, 2
        ),
        "gap_ratio": round(
            gap_ratio, 4
        ),
        "water_screening_score": round(
            100 * (1 - gap_ratio), 2
        ),
        "interpretation": (
            "Tarama göstergesi; "
            "sulama gereksinimi değildir."
        ),
    }


def build_decision(request: DecisionRequest):
    """
    Üç rotasyonu karşılaştırır.

    Aynı konum için ETo ve yağış verilerini
    birer kez alır.
    """

    eto_df = calculate_eto_dataframe(
        request.latitude,
        request.longitude,
    )

    rain_df = fetch_nasa_data(
        request.latitude,
        request.longitude,
    )

    crop_ids = set(
        request.current
        + request.alternative_a
        + request.alternative_b
    )

    crop_metrics = {
        crop_id: _crop_water_metrics(
            crop_id,
            request.crop_calendars[crop_id],
            eto_df,
            rain_df,
        )
        for crop_id in sorted(crop_ids)
    }

    weights = {
        "balanced": (0.5, 0.5),
        "water": (0.3, 0.7),
        "soil": (0.7, 0.3),
    }

    soil_weight, water_weight = weights[
        request.priority
    ]

    options = {
        "current": request.current,
        "alternative_a": request.alternative_a,
        "alternative_b": request.alternative_b,
    }

    comparisons = []

    for option_id, rotation in options.items():
        soil = structural_score(rotation)

        water = sum(
            crop_metrics[crop_id][
                "water_screening_score"
            ]
            for crop_id in rotation
        ) / len(rotation)

        total = (
            soil_weight * soil
            + water_weight * water
        )

        explanations = [
            (
                f"Yapısal rotasyon puanı: "
                f"{soil}/100. "
                "Ürün çeşitliliği, familya tekrarları "
                "ve baklagil varlığı değerlendirildi."
            ),
            (
                f"Su tarama puanı: "
                f"{water:.1f}/100. "
                "Senaryo ETc ve brüt yağış farkı "
                "kullanıldı."
            ),
            (
                f"Öncelik: {request.priority}. "
                f"Yapısal ağırlık: {soil_weight:.0%}, "
                f"su ağırlığı: {water_weight:.0%}."
            ),
        ]

        comparisons.append({
            "option_id": option_id,
            "rotation": rotation,
            "structural_score": soil,
            "water_screening_score": round(
                water, 2
            ),
            "combined_prototype_score": round(
                total, 2
            ),
            "explanations": explanations,
        })

    comparisons.sort(
        key=lambda item: (
            -item["combined_prototype_score"],
            item["option_id"],
        )
    )

    for rank, item in enumerate(
        comparisons, start=1
    ):
        item["rank"] = rank

    return {
        "location": {
            "latitude": request.latitude,
            "longitude": request.longitude,
        },
        "priority": request.priority,
        "ranking": comparisons,
        "crop_water_scenarios": crop_metrics,
        "methodology": {
            "weather_source": "NASA POWER",
            "eto_method": (
                "FAO-56 Penman-Monteith; "
                "yaklaşık nem ve rakım hesabı"
            ),
            "etc_method": (
                "FAO-56 single Kc; "
                "kullanıcı tarafından verilen "
                "gelişme dönemleri ve katsayılar"
            ),
            "structural_score": (
                "Doğrulanmamış, şeffaf prototip "
                "puanlama yöntemi"
            ),
            "water_score": (
                "100 * (1 - max(0, ETc - brüt yağış) / ETc)"
            ),
            "important_limitations": [
                (
                    "Ürün takvimleri bağımsız "
                    "senaryolardır; ardışık rotasyon "
                    "yılları simüle edilmemiştir."
                ),
                (
                    "Brüt yağış etkin yağış değildir. "
                    "Hesaplanan fark sulama ihtiyacı "
                    "olarak yorumlanamaz."
                ),
                (
                    "Toprak tipi, toprak su depolaması, "
                    "sulama, verim ve yerel takvim "
                    "doğrulaması henüz yoktur."
                ),
                (
                    "Puanlar doğrulanmış tarımsal "
                    "öneriler değil, demo amaçlı "
                    "karşılaştırma göstergeleridir."
                ),
            ],
        },
    }


@router.post("/compare")
def compare_decision(request: DecisionRequest):
    try:
        return build_decision(request)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
