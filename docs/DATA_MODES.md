
# NASA POWER Data Modes

This document describes how BOZKIR retrieves and uses NASA POWER meteorological data for historical climate analysis and crop water screening.

## 1. Data Source

BOZKIR retrieves daily meteorological data from NASA POWER using the user-selected latitude and longitude.

API endpoint:

`https://power.larc.nasa.gov/api/temporal/daily/point`

The primary historical data series begin on January 1, 2005.

Live requests use a recent end date rather than a permanently fixed end year.

The actual usable period depends on the availability and completeness of the returned NASA POWER records.

## 2. Data Retrieval Lag

The current application requests meteorological data up to approximately 10 days before the current date.

This is a conservative availability buffer.

It does not guarantee that all parameters are available on the requested end date.

The application performs additional validity and completeness checks on returned records.

The latest usable date may therefore be earlier than the requested end date.

## 3. Observed Season Mode

Mode identifier:

`observed`

Observed mode is used when the complete selected growing season falls within the available daily meteorological records.

The application uses daily ETo and precipitation values for the selected dates.

It checks that both data series contain the expected number of distinct daily records.

If required daily records are missing, the observed-season calculation fails rather than silently filling those gaps.

Observed mode uses historical meteorological estimates from NASA POWER.

It does not imply direct field measurements.

## 4. Historical Climatology Mode

Mode identifier:

`historical_climatology`

This mode is used when a selected growing season extends beyond the latest available daily ETo or precipitation records.

The application constructs a daily historical-climatology scenario using calendar-day averages.

### Historical reference period

The calculation uses records beginning in 2005 and ending in the last completed year permitted by the available data.

The actual reference period may vary with data availability.

### Calendar-day matching

For each date in the selected growing season, the application identifies the corresponding month and day in historical records.

For example, the historical value for May 15 is calculated from available May 15 observations across the reference years.

Daily ETo and daily precipitation are averaged separately.

### Minimum observation requirement

At least 10 historical observations are required for each calendar day and each variable.

If the requirement is not satisfied, the application raises an error.

Leap-day calculations also depend on this requirement. A February 29 scenario may be unavailable when fewer than 10 historical February 29 observations exist.

### Entire-season behavior

When historical climatology mode is selected, the application uses historical calendar-day averages for the entire growing season.

It does not combine observed values from the beginning of the season with historical means for the remaining dates.

### Interpretation

Historical climatology provides an illustrative average-weather scenario.

It is not:

- A short-term weather forecast
- A seasonal climate forecast
- A prediction of future rainfall
- A prediction of future crop yield
- A representation of extreme-weather risk

Averages do not reproduce the full variability or timing of historical weather events.

## 5. Reference Evapotranspiration

BOZKIR calculates daily ETo using the FAO-56 Penman-Monteith method.

The calculation uses NASA POWER temperature, humidity, wind, solar radiation, and pressure inputs.

NASA `ALLSKY_SFC_SW_DWN` radiation values are converted as follows:

`MJ/m²/day = kWh/m²/day × 3.6`

Mean relative humidity is used as an approximation when actual vapor pressure is unavailable.

Elevation may be approximated from atmospheric pressure.

These assumptions are documented in `SCIENTIFIC_ASSUMPTIONS.md`.

## 6. Crop Evapotranspiration

Crop evapotranspiration is estimated using:

`ETc = Kc × ETo`

The application applies stage-dependent Kc values over a configurable growing-season calendar.

The default initial Kc is an illustrative assumption.

Reference crop coefficients and stage durations require local validation.

## 7. Gross Precipitation Gap

For a selected crop scenario, BOZKIR calculates:

`gross_precipitation_gap_mm = max(0, ETc - gross_precipitation)`

This is a screening indicator.

Gross precipitation is not effective rainfall.

The calculation does not explicitly model soil water storage, runoff, drainage, or irrigation efficiency.

The gross precipitation gap is not an irrigation requirement.

## 8. Rotation Comparison

The rotation comparison uses two prototype indicators:

- Rotation structure score
- Water screening score

The structural score evaluates crop and family diversity, repeated crops, and legume presence.

The water screening score is derived from estimated ETc and gross precipitation.

User-selected priorities determine the relative weights of these indicators.

The results are comparative screening scores, not validated agricultural outcome predictions.

Crop scenarios are calculated independently rather than as consecutive simulated years.

## 9. Data Caching

NASA POWER retrieval functions use in-process Python caching.

The cache can reduce repeated API requests during a running backend process.

It is not a persistent database or shared cache across separate backend processes.

Restarting the backend may require data to be retrieved again.

## 10. Limitations

- NASA POWER values are gridded meteorological estimates.
- Historical climatology is not a forecast.
- Daily historical averages do not reproduce extreme-weather sequences.
- Crop coefficients and calendars are not universally valid.
- Gross precipitation is not effective rainfall.
- Water screening scores are not irrigation recommendations.
- Soil moisture and crop yields are not directly measured or predicted.
- The prototype requires local scientific validation before operational use.

For additional methodology and scientific limitations, see:

[Scientific Assumptions and Limitations](SCIENTIFIC_ASSUMPTIONS.md)

## References

NASA POWER:

https://power.larc.nasa.gov/

FAO-56:

https://www.fao.org/4/X0490E/X0490E00.htm
