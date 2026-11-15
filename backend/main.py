
import requests

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from climate_history import router as climate_history_router
from crop_water import router as crop_water_router
from decision_api import router as decision_router

from crop_data import CROPS
from crop_profiles import get_crop_profiles
from crop_season import analyze_crop_season
from location_climate import analyze_location
from rainfall_analysis import analyze_rainfall_period
from rotation_engine import compare_rotations

app = FastAPI(
    title="Bozkır API",
    description=(
        "Agricultural decision-support prototype "
        "using NASA POWER Earth observation data."
    ),
    version="0.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(decision_router)
app.include_router(crop_water_router)
app.include_router(climate_history_router)


class RotationRequest(BaseModel):
    current: list[str] = Field(min_length=2, max_length=10)
    alternative_a: list[str] = Field(min_length=2, max_length=10)
    alternative_b: list[str] = Field(min_length=2, max_length=10)


class LocationRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class LocationRotationRequest(LocationRequest, RotationRequest):
    pass


class RainfallRequest(LocationRequest):
    months: list[int] = Field(min_length=1, max_length=12)


class CropSeasonRequest(LocationRequest):
    crop_id: str
    start_month: int = Field(ge=1, le=12)
    end_month: int = Field(ge=1, le=12)


def rotation_payload(request):
    return {
        "Current": request.current,
        "Alternative A": request.alternative_a,
        "Alternative B": request.alternative_b,
    }


@app.get("/")
def home():
    return {
        "project": "Bozkır",
        "status": "running",
        "version": "0.5.0",
    }


@app.get("/crops")
def list_crops():
    return [
        {
            "id": crop.id,
            "name": crop.name,
            "family": crop.family,
            "is_legume": crop.is_legume,
        }
        for crop in CROPS.values()
    ]


@app.get("/crops/profiles")
def list_crop_profiles():
    return get_crop_profiles()


@app.post("/compare")
def compare(request: RotationRequest):
    try:
        return compare_rotations(rotation_payload(request))
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail="Local climate reference files are unavailable.",
        ) from exc


@app.post("/climate/location")
def climate_by_location(request: LocationRequest):
    try:
        return analyze_location(
            request.latitude,
            request.longitude,
        )
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


@app.post("/compare/location")
def compare_by_location(request: LocationRotationRequest):
    try:
        climate = analyze_location(
            request.latitude,
            request.longitude,
        )

        return compare_rotations(
            rotation_payload(request),
            climate_context=climate,
        )
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


@app.post("/rainfall/period")
def rainfall_by_period(request: RainfallRequest):
    try:
        return analyze_rainfall_period(
            request.latitude,
            request.longitude,
            request.months,
        )
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


@app.post("/crop/season")
def crop_season_by_location(request: CropSeasonRequest):
    try:
        return analyze_crop_season(
            latitude=request.latitude,
            longitude=request.longitude,
            crop_id=request.crop_id,
            start_month=request.start_month,
            end_month=request.end_month,
        )
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
