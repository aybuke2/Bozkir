# NASA POWER data modes

- Observed seasons: actual daily NASA POWER values where every day is available.
- Future/incomplete seasons: historical daily calendar-day means from 2005 through the last completed year, using at least ten historical observations per day. This is **not a forecast**.
- Daily NASA POWER retrieval uses a conservative ten-day lag to accommodate parameter availability. Actual valid days may differ; data completeness is checked. Cache is per running backend process.
- ETo radiation: NASA `ALLSKY_SFC_SW_DWN` kWh/m²/day converted to MJ/m²/day (×3.6) before FAO-56 calculations.
- Reference Kc and crop durations remain general assumptions and must be locally validated.
- Future daily climatological rainfall means are *not* effective rainfall; the gross precipitation gap is not irrigation demand.