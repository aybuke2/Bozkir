
from datetime import date

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from location_climate import (
    fetch_nasa_data,
    START_YEAR,
    END_YEAR,
)

router = APIRouter(
    prefix="/climate",
    tags=["Climate Analysis"],
)


class ClimateHistoryRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


@router.post("/history")
def climate_history(request: ClimateHistoryRequest):
    try:
        df = fetch_nasa_data(
            round(request.latitude, 4),
            round(request.longitude, 4),
        ).copy()

        df["year"] = df["date"].dt.year
        df["month"] = df["date"].dt.month

        counts = df.groupby("year")["date"].nunique()

        complete_years = [
            year
            for year in range(START_YEAR, END_YEAR + 1)
            if counts.get(year, 0)
            == (date(year + 1, 1, 1) - date(year, 1, 1)).days
        ]

        if not complete_years:
            raise ValueError(
                "No complete years are available for this location."
            )

        complete = df[df["year"].isin(complete_years)]

        annual = complete.groupby("year").agg(
            rainfall_mm=("rainfall_mm", "sum")
        )

        monthly = complete.groupby("month").agg(
            temperature_c=("temperature_c", "mean")
        )

        return {
            "latitude": request.latitude,
            "longitude": request.longitude,
            "period": f"{min(complete_years)}-{max(complete_years)}",
            "complete_years": len(complete_years),
            "annual_rainfall": [
                {
                    "year": int(year),
                    "rainfall_mm": round(float(row.rainfall_mm), 2),
                }
                for year, row in annual.iterrows()
            ],
            "monthly_temperature": [
                {
                    "month": int(month),
                    "temperature_c": round(
                        float(row.temperature_c), 2
                    ),
                }
                for month, row in monthly.iterrows()
            ],
            "latest_available_date": str(df["date"].max().date()),
            "source": "NASA POWER",
            "note": (
                "Historical observations, not a forecast. "
                "Monthly temperatures are multi-year averages."
            ),
        }

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