
# Scientific Assumptions and Limitations

BOZKIR is a prototype crop rotation decision-support application developed for NASA Space Apps Challenge 2026.

It combines NASA POWER historical meteorological data, FAO-56 reference evapotranspiration calculations, crop coefficient assumptions, and transparent rotation scoring.

The results are intended for exploratory planning and comparison. They are not validated agronomic recommendations, weather forecasts, soil measurements, or irrigation prescriptions.

## 1. Weather Data

### Data source

BOZKIR uses NASA POWER daily meteorological data at user-selected latitude and longitude coordinates.

The main data retrieval modules request records beginning on January 1, 2005 and ending at a recent available date, subject to a conservative retrieval lag.

Historical climate summaries use complete calendar years where required. Consequently, the actual analysis period may vary with data availability and completeness.

NASA POWER provides gridded meteorological estimates. These values are not equivalent to direct measurements at an individual field or weather station.

### Meteorological variables

The application uses the following NASA POWER parameters:

- `PRECTOTCORR`: corrected precipitation
- `T2M`: air temperature at 2 m
- `T2M_MAX`: maximum air temperature at 2 m
- `T2M_MIN`: minimum air temperature at 2 m
- `RH2M`: relative humidity at 2 m
- `WS2M`: wind speed at 2 m
- `ALLSKY_SFC_SW_DWN`: all-sky surface shortwave radiation
- `PS`: surface atmospheric pressure

Variables are used according to the requirements of the relevant climate or evapotranspiration calculation.

### Data completeness

Historical summaries and crop-season analyses apply completeness checks before reporting results.

Missing meteorological records may prevent an observed season from being analyzed.

The availability of a historical data series does not guarantee that every date or parameter is valid.

## 2. Observed and Historical-Climatology Modes

BOZKIR distinguishes between observed growing seasons and seasons extending beyond the latest available meteorological data.

### Observed seasons

When the complete selected growing season is covered by available daily ETo and precipitation records, BOZKIR uses the corresponding historical daily values.

The season must contain the expected number of distinct daily records.

If the required daily records are incomplete, the calculation raises an error rather than silently treating the season as complete.

### Historical climatology for future or incomplete seasons

If a selected growing season extends beyond the latest available daily records, BOZKIR uses historical calendar-day means.

For each calendar day in the selected season, the application calculates historical mean daily ETo and precipitation using records from 2005 through the last completed year available to the calculation.

At least 10 historical observations are required for each calendar day and variable.

The historical-climatology method is applied to the entire selected growing season. It does not combine observed values for the first part of a season with climatological values for the remainder.

These values represent illustrative historical-average conditions.

They are not weather forecasts, seasonal predictions, or guarantees of future rainfall.

Daily historical averages also do not reproduce the variability, sequencing, or extremes of an actual future season.

## 3. Reference Evapotranspiration (ETo)

BOZKIR calculates daily reference evapotranspiration using the FAO-56 Penman-Monteith method.

The calculation uses air temperature, wind speed, solar radiation, atmospheric pressure, latitude, and humidity-related inputs.

### Solar radiation

NASA POWER `ALLSKY_SFC_SW_DWN` values are converted from kWh/m²/day to MJ/m²/day by multiplying by 3.6.

### Relative humidity

Where actual vapor pressure is not supplied, the current implementation approximates actual vapor pressure using mean relative humidity and mean saturation vapor pressure.

This is an approximation and may differ from more detailed FAO-56 humidity calculations using daily maximum and minimum humidity observations.

### Elevation and pressure

When elevation is not provided, the calculation estimates elevation from atmospheric pressure using a standard-atmosphere approximation.

### Wind speed

The calculation assumes that the wind-speed input is appropriate for the FAO-56 reference height of 2 m.

### Validation limitations

The implementation includes an automated test based on a FAO reference calculation.

Passing this test verifies agreement for the tested reference case. It does not establish observational accuracy for every location or season.

Additional validation against independent meteorological and evapotranspiration measurements is required before operational agricultural use.

## 4. Crop Coefficients (Kc)

BOZKIR uses the FAO-56 single crop coefficient approach.

Crop evapotranspiration is estimated as:

`ETc = Kc × ETo`

Crop coefficients vary across four growing stages:

1. Initial stage
2. Crop development stage
3. Mid-season stage
4. Late-season stage

The implementation uses stage-dependent coefficients to calculate daily ETc.

### Reference coefficients

Mid-season and end-season reference coefficients are included for:

- Wheat
- Barley
- Chickpea
- Lentil

The application exposes crop profile metadata through:

`GET /crops/profiles`

The profiles include coefficient values, source references, stage durations, and notes describing their limitations.

### Initial crop coefficient

The default initial coefficient is:

`Kc_initial = 0.40`

This is an illustrative scenario assumption, not a universally applicable FAO-56 coefficient.

Initial-stage Kc depends on factors including soil wetness, irrigation or rainfall frequency, evaporation conditions, and soil characteristics.

### Crop coefficient limitations

Reference coefficients may differ from locally appropriate values because of:

- Crop variety and cultivar
- Climate
- Planting season
- Growth duration
- Crop management
- Soil evaporation conditions
- Local agricultural practices

The current values require further source verification and local validation.

## 5. Crop Calendars and Growth Stages

BOZKIR provides default planting dates and growth-stage durations to support interactive comparisons.

These are demonstration scenarios rather than validated planting recommendations for every location.

Users can edit planting dates and growth-stage lengths.

The crop profiles use general reference stage durations.

### Chickpea-specific limitation

The current chickpea growth-stage durations use a provisional lentil-based reference proxy.

This is not a validated chickpea-specific growth calendar.

Chickpea stage durations should be replaced with crop-specific, locally relevant references before practical agricultural deployment.

### Independent crop scenarios

Crop water calculations are performed independently for each crop calendar.

A displayed crop rotation is not simulated as a continuous sequence of consecutive agricultural years.

The model does not carry soil moisture, nutrient conditions, or previous-crop effects from one season into the next.

## 6. Crop Evapotranspiration and Precipitation

Daily crop evapotranspiration is calculated using the stage-specific Kc and daily ETo.

The values are summed over the selected growing season.

BOZKIR also calculates gross precipitation over the same period.

The prototype gross precipitation gap is:

`gross_precipitation_gap_mm = max(0, ETc - gross_precipitation)`

This is a preliminary screening indicator only.

### Important distinction

Gross precipitation is not equivalent to effective rainfall.

The current model does not explicitly simulate:

- Soil water storage
- Runoff
- Deep drainage
- Infiltration
- Root-zone water availability
- Irrigation efficiency
- Water stress
- Capillary rise
- Soil moisture measurements

Therefore, the gross precipitation gap must not be interpreted as an irrigation requirement.

It also does not establish actual crop water stress or predict crop yield.

## 7. Rotation Structure Score

BOZKIR evaluates rotation structure using transparent heuristic rules.

The structural score considers:

- Diversity of crop families
- Diversity of crops in the sequence
- Presence of legumes
- Repeated consecutive crops
- Repeated consecutive botanical families

The result is bounded between 0 and 100.

The scoring rules are prototype assumptions.

The structural score is not a measured soil health index and does not quantify nutrient balances, soil organic matter, pest pressure, or yield outcomes.

## 8. Water Screening Score

For each crop scenario, BOZKIR calculates:

`gap_ratio = gross_precipitation_gap / ETc`

When ETc is positive, the water screening score is:

`water_screening_score = 100 × (1 - gap_ratio)`

The calculation assigns a higher score to scenarios where gross precipitation covers a larger proportion of estimated ETc.

This score is not a direct measure of water-use efficiency, irrigation efficiency, drought resistance, or actual crop water sufficiency.

For a crop rotation, the prototype uses the arithmetic mean of its crop-level water screening scores.

This is a screening approach, not a multi-year hydrological simulation.

## 9. Combined Rotation Ranking

BOZKIR combines the rotation structure score and water screening score using user-selected weights.

Available priorities are:

| Priority | Rotation Structure | Water Screening |
| --- | ---: | ---: |
| Balanced | 50% | 50% |
| Water Priority | 30% | 70% |
| Rotation Diversity Priority | 70% | 30% |

The combined prototype score is:

`combined_score = structure_weight × structural_score + water_weight × water_screening_score`

The application ranks the compared alternatives according to their combined scores.

The rankings are relative to the selected scenarios and weights.

They are not validated predictions of agricultural performance or guarantees that a particular rotation will be optimal.

## 10. Geographic Applicability

BOZKIR accepts user-selected geographic coordinates and retrieves location-dependent NASA POWER meteorological data.

However, access to location-based climate data does not mean that crop calendars, coefficients, or rotation rules have been validated for every geographic region.

The prototype can support exploratory comparisons across locations where the required data are available.

Local agronomic validation remains necessary before practical use.

## 11. Use of Artificial Intelligence

BOZKIR's rotation evaluations are based on deterministic calculations, explicit rules, and weighted scoring.

The application does not use a generative AI model to predict crop yields, soil conditions, or future weather.

AI-assisted development tools were used during project development, including support for coding, debugging, documentation, and design.

Such development assistance should not be confused with an AI-based agricultural prediction system.

## 12. References

### NASA POWER

NASA Prediction of Worldwide Energy Resources:

https://power.larc.nasa.gov/

### FAO-56

Allen, R. G., Pereira, L. S., Raes, D., and Smith, M. (1998).

*Crop Evapotranspiration: Guidelines for Computing Crop Water Requirements.*

FAO Irrigation and Drainage Paper 56.

https://www.fao.org/4/X0490E/X0490E00.htm

### FAO Crop Growth Stages

FAO, *Irrigation Water Needs*, crop growth stage references.

https://www.fao.org/4/s2022e/s2022e07.htm

## 13. Remaining Scientific Work

Before using BOZKIR for operational agricultural decisions, the following improvements are recommended:

1. Independently verify crop-specific FAO coefficient values and reference crop variants.
2. Replace provisional chickpea growth-stage assumptions with validated chickpea-specific data.
3. Establish locally appropriate planting calendars and growth-stage durations.
4. Improve humidity and radiation input validation.
5. Validate calculated ETo against independent weather-station or evapotranspiration observations.
6. Introduce effective rainfall calculations and a soil-water balance model.
7. Account for soil characteristics, management practices, and irrigation conditions.
8. Evaluate rotation outcomes against independent agronomic observations.
9. Quantify uncertainty and sensitivity to weather, crop coefficients, and scoring weights.
10. Validate the decision-support system with agricultural specialists and potential users.

## Disclaimer

BOZKIR is a hackathon research and demonstration prototype.

Its outputs are intended for educational exploration and preliminary comparison.

They should not be used as the sole basis for planting, irrigation, financial, or other operational agricultural decisions.
