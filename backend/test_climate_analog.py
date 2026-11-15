from datetime import date
import pandas as pd
import pytest
from climate_analog import weather_for_season

def test_future_climatology_is_not_forecast():
    dates = pd.date_range('2005-01-01','2025-12-31',freq='D')
    eto = pd.DataFrame({'date':dates, 'eto_mm_day':3.0})
    rain = pd.DataFrame({'date':dates, 'rainfall_mm':2.0})
    e,r,mode,latest = weather_for_season(eto,rain,date(2027,3,1),120)
    assert mode == 'historical_climatology'
    assert len(e)==len(r)==120
    assert abs(e.eto_mm_day.sum()-360)<1e-8

def test_observed_complete_season():
    dates = pd.date_range('2005-01-01','2025-12-31',freq='D')
    eto = pd.DataFrame({'date':dates, 'eto_mm_day':3.0})
    rain = pd.DataFrame({'date':dates, 'rainfall_mm':2.0})
    e,r,mode,latest = weather_for_season(eto,rain,date(2024,3,1),120)
    assert mode == 'observed'
    assert len(e)==120