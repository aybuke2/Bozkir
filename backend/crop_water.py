
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from eto_calculator import calculate_eto_dataframe
from location_climate import fetch_nasa_data
from climate_analog import weather_for_season


router = APIRouter(prefix="/water", tags=["Crop Water"])


class CropWaterRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    crop_id: str
    planting_date: date

    initial_days: int = Field(gt=0)
    development_days: int = Field(gt=0)
    mid_days: int = Field(gt=0)
    late_days: int = Field(gt=0)

    kc_initial: float = Field(ge=0, le=2)
    kc_mid: float = Field(ge=0, le=2)
    kc_end: float = Field(ge=0, le=2)


def calculate_kc(day_index, stages, coefficients):
    """
    FAO-56 yaklaşımına göre dört dönemli Kc eğrisi.
    Gelişme ve son dönemlerde doğrusal geçiş.
    """
    initial, development, mid, late = stages
    kc_initial, kc_mid, kc_end = coefficients

    if day_index < initial:
        return kc_initial, "initial"

    day_index -= initial

    if day_index < development:
        progress = (day_index + 1) / development
        kc = kc_initial + (
            kc_mid - kc_initial
        ) * progress
        return kc, "development"

    day_index -= development

    if day_index < mid:
        return kc_mid, "mid"

    day_index -= mid

    progress = (day_index + 1) / late
    kc = kc_mid + (
        kc_end - kc_mid
    ) * progress

    return kc, "late"


def analyze_crop_water(request: CropWaterRequest):
    stages = [
        request.initial_days,
        request.development_days,
        request.mid_days,
        request.late_days,
    ]

    coefficients = [
        request.kc_initial,
        request.kc_mid,
        request.kc_end,
    ]

    total_days = sum(stages)

    end_date = (
        request.planting_date
        + timedelta(days=total_days - 1)
    )

    weather = calculate_eto_dataframe(
        request.latitude,
        request.longitude,
    )

    rain_data = fetch_nasa_data(round(request.latitude, 4), round(request.longitude, 4))
    weather, rain_data, data_mode, latest_date = weather_for_season(
        weather, rain_data, request.planting_date, total_days
    )
    weather = weather.sort_values("date")

    stage_totals = {
        "initial": 0.0,
        "development": 0.0,
        "mid": 0.0,
        "late": 0.0,
    }

    eto_total = 0.0
    etc_total = 0.0

    for index, (_, row) in enumerate(
        weather.iterrows()
    ):
        kc, stage = calculate_kc(
            index, stages, coefficients
        )

        eto = float(row["eto_mm_day"])
        etc = eto * kc

        eto_total += eto
        etc_total += etc
        stage_totals[stage] += etc

    return {
        "crop_id": request.crop_id,
        "data_mode": data_mode,
        "latest_available_date": latest_date,
        "latitude": request.latitude,
        "longitude": request.longitude,
        "planting_date": str(request.planting_date),
        "end_date": str(end_date),
        "total_days": total_days,
        "eto_total_mm": round(eto_total, 2),
        "etc_total_mm": round(etc_total, 2),
        "etc_by_stage_mm": {
            stage: round(value, 2)
            for stage, value in stage_totals.items()
        },
        "kc": {
            "initial": request.kc_initial,
            "mid": request.kc_mid,
            "end": request.kc_end,
        },
        "method": "FAO-56 single crop coefficient",
        "source": "NASA POWER",
        "status": "scenario_estimate",
        "note": (
            "ETc, standart koşullardaki tahmini ürün "
            "evapotranspirasyonudur. Sulama ihtiyacı "
            "değildir. Ekim tarihi, dönem uzunlukları "
            "ve Kc değerleri kullanıcı senaryosudur; "
            "yerel doğrulama gerektirir."
        ),
    }


@router.post("/crop")
def crop_water_endpoint(request: CropWaterRequest):
    try:
        return analyze_crop_water(request)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )