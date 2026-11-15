
# Scientific assumptions and limitations

## Weather

NASA POWER daily historical meteorological series (2005–2024),
at the selected latitude/longitude.

These are gridded/reanalysis-derived estimates, not field-station
measurements. The user-selected location is passed to the backend.

## ETo

FAO-56 Penman–Monteith reference evapotranspiration.

Current implementation uses mean relative humidity as an approximation
where vapor-pressure inputs are unavailable and infers elevation
from pressure.

NASA POWER solar, wind, humidity and pressure inputs require
unit/height checks for strict FAO-56 consistency.

The passing FAO reference unit test validates one reference case,
not site-specific observational accuracy.

## Kc and crop calendars

Mid-season and end-season reference crop coefficients are published
through GET /crops/profiles, citing FAO-56.

Initial Kc = 0.40 in the comparison UI is explicitly an illustrative
soil-wetness-dependent assumption, not a universally valid
FAO coefficient.

All default planting dates and stage lengths are demonstration
scenarios, not validated local calendars.

Users can edit planting dates and stage lengths.

These values must be locally verified before farm use.

Crop coefficients and stage durations may differ by cultivar,
climate, sowing season and management.

## ETc and precipitation

Daily standard-condition ETc is calculated as Kc × ETo and summed
over the chosen historical growing season.

The displayed gross_precipitation_gap_mm =
max(0, ETc - total precipitation) is a screening indicator only.

Gross precipitation is not effective rainfall.

Soil storage, runoff, drainage, water stress and irrigation
efficiency are not modeled.

Do not present it as irrigation requirement.

## Rotation ranking

Rotation scores use transparent heuristic rules and user-selected
weights, not a validated agronomic outcome model.

Crop seasons are analyzed independently, not as consecutive
simulated years.

Historical analysis is not a future-weather forecast.

## References

- FAO Irrigation and Drainage Paper 56:
  https://www.fao.org/4/X0490E/X0490E00.htm
- NASA POWER:
  https://power.larc.nasa.gov/

## Remaining scientific work

- Verify exact FAO-56 tabular Kc entries and crop variants.
- Select locally relevant planting calendars and stage durations,
  especially for chickpea.
- Improve humidity and radiation inputs.
- Validate ETo against independent weather/ET observations.
- Implement effective rainfall and soil-water balance before
  estimating irrigation demand.
