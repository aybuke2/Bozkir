
"""Explainable crop rotation screening using NASA POWER and FAO-56.

Results are prototype indicators, not validated agronomic
recommendations or irrigation requirements.
"""

from datetime import date, timedelta
from typing import Dict, List, Literal

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from crop_data import get_crop
from crop_water import calculate_kc
from eto_calculator import calculate_eto_dataframe
from location_climate import fetch_nasa_data


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

    current: List[str] = Field(min_length=2, max_length=10)
    alternative_a: List[str] = Field(min_length=2, max_length=10)
    alternative_b: List[str] = Field(min_length=2, max_length=10)

    crop_calendars: Dict[str, CropCalendar]
    priority: Literal["balanced", "water", "soil"] = "balanced"

    @model_validator(mode="after")
    def check_calendars(self):
        selected = set(
            self.current + self.alternative_a + self.alternative_b
        )

        for crop_id in selected:
            try:
                crop = get_crop(crop_id)
            except (KeyError, ValueError) as exc:
                raise ValueError(
                    f"Unknown crop: {crop_id}"
                ) from exc

            if crop is None:
                raise ValueError(f"Unknown crop: {crop_id}")

            if crop_id not in self.crop_calendars:
                raise ValueError(
                    f"Missing crop calendar: {crop_id}"
                )

        return self


def _crop_attr(crop, key):
    if isinstance(crop, dict):
        return crop[key]
    return getattr(crop, key)


def structural_score(rotation):
    """Transparent structural rotation score (0–100)."""

    crops = [get_crop(crop_id) for crop_id in rotation]
    families = [_crop_attr(crop, "family") for crop in crops]
    legumes = [_crop_attr(crop, "is_legume") for crop in crops]

    score = 50
    score += 10 * max(0, len(set(families)) - 1)
    score += 5 * max(0, len(set(rotation)) - 1)

    if any(legumes):
        score += 10

    for i in range(1, len(rotation)):
        if rotation[i] == rotation[i - 1]:
            score -= 15
        if families[i] == families[i - 1]:
            score -= 10

    return max(0, min(100, score))


def _crop_water_metrics(crop_id, calendar, eto_df, rain_df):
    stages = [
        calendar.initial_days,
        calendar.development_days,
        calendar.mid_days,
        calendar.late_days,
    ]

    total_days = sum(stages)
    start = calendar.planting_date
    end = start + timedelta(days=total_days - 1)

    eto = eto_df.loc[
        (eto_df["date"].dt.date >= start)
        & (eto_df["date"].dt.date <= end)
    ].sort_values("date")

    rain = rain_df.loc[
        (rain_df["date"].dt.date >= start)
        & (rain_df["date"].dt.date <= end)
    ].sort_values("date")

    if (
        len(eto) != total_days
        or eto["date"].dt.date.nunique() != total_days
        or len(rain) != total_days
        or rain["date"].dt.date.nunique() != total_days
    ):
        raise ValueError(
            f"{crop_id}: Complete daily data are unavailable "
            "for the selected dates."
        )

    coefficients = [
        calendar.kc_initial,
        calendar.kc_mid,
        calendar.kc_end,
    ]

    kc_values = [
        calculate_kc(i, stages, coefficients)[0]
        for i in range(total_days)
    ]

    eto_total = float(eto["eto_mm_day"].sum())

    etc_total = sum(
        float(value) * kc
        for value, kc in zip(eto["eto_mm_day"], kc_values)
    )

    rain_total = float(rain["rainfall_mm"].sum())
    gap = max(0.0, etc_total - rain_total)
    gap_ratio = gap / etc_total if etc_total > 0 else 0.0

    return {
        "crop_id": crop_id,
        "planting_date": str(start),
        "end_date": str(end),
        "eto_mm": round(eto_total, 2),
        "etc_mm": round(etc_total, 2),
        "precipitation_mm": round(rain_total, 2),
        "gross_precipitation_gap_mm": round(gap, 2),
        "gap_ratio": round(gap_ratio, 4),
        "water_screening_score": round(
            100 * (1 - gap_ratio), 2
        ),
        "interpretation": (
            "Prototype water screening indicator; "
            "not an irrigation requirement."
        ),
    }


def build_decision(request: DecisionRequest):
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

    soil_weight, water_weight = weights[request.priority]

    options = {
        "current": request.current,
        "alternative_a": request.alternative_a,
        "alternative_b": request.alternative_b,
    }

    comparisons = []

    for option_id, rotation in options.items():
        soil = structural_score(rotation)

        water = sum(
            crop_metrics[crop_id]["water_screening_score"]
            for crop_id in rotation
        ) / len(rotation)

        total = soil_weight * soil + water_weight * water

        explanations = [
            (
                f"Rotation structure score: {soil}/100. "
                "Crop diversity, repeated families and "
                "the presence of legumes were evaluated."
            ),
            (
                f"Water screening score: {water:.1f}/100. "
                "Estimated crop ET and gross precipitation "
                "were used for this prototype indicator."
            ),
            (
                f"Priority: {request.priority}. "
                f"Structure weight: {soil_weight:.0%}; "
                f"water weight: {water_weight:.0%}."
            ),
        ]

        comparisons.append({
            "option_id": option_id,
            "rotation": rotation,
            "structural_score": soil,
            "water_screening_score": round(water, 2),
            "combined_prototype_score": round(total, 2),
            "explanations": explanations,
        })

    comparisons.sort(
        key=lambda item: (
            -item["combined_prototype_score"],
            item["option_id"],
        )
    )

    for rank, item in enumerate(comparisons, start=1):
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
                "FAO-56 Penman-Monteith; approximate humidity "
                "and elevation inputs"
            ),
            "etc_method": (
                "FAO-56 single Kc; historical crop-calendar scenarios, "
                "FAO-56 reference mid/end coefficients and illustrative "
                "initial Kc; locally unvalidated"
            ),
            "structural_score": (
                "Transparent, unvalidated prototype scoring"
            ),
            "water_score": (
                "100 * (1 - max(0, ETc - gross rainfall) / ETc)"
            ),
            "important_limitations": [
                (
                    "Crop calendars are independent scenarios; "
                    "successive rotation years are not simulated."
                ),
                (
                    "Gross precipitation is not effective rainfall. "
                    "The calculated gap is not an irrigation requirement."
                ),
                (
                    "Soil type, soil water storage, irrigation, yield "
                    "and local crop calendar validation are not included."
                ),
                (
                    "Scores are demonstration indicators, "
                    "not validated agricultural recommendations."
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

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="NASA POWER service is unavailable.",
        ) from exc
