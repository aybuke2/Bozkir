
# BOZKIR

### Smarter Crop Rotation with NASA Earth Data

**Turning historical climate data into clearer farming decisions.**

BOZKIR is an interactive crop rotation decision-support prototype developed for the **NASA Space Apps Challenge 2026**, addressing the challenge **Field Shift: Adapting Farms with NASA Data**.

The application combines NASA POWER historical meteorological data, crop water indicators, and transparent rotation scoring to help users explore alternative crop sequences and understand their potential trade-offs.

BOZKIR is designed to make climate-informed agricultural planning more accessible and understandable.

## The Problem

Choosing the next crop is not always straightforward.

Agricultural planning involves balancing crop diversity, climate variability, water availability, and long-term field management.

Although valuable meteorological data are publicly available, translating these datasets into understandable agricultural decisions can be challenging.

Farmers and other users need accessible tools that connect climate information with practical crop planning questions.

## Our Solution

BOZKIR brings historical climate analysis and crop rotation comparison into a single web application.

Users can:

- Create and manage fields.
- Define field coordinates, area, current crop, and irrigation conditions.
- Explore historical rainfall and temperature patterns.
- Review location-based climate indicators.
- Configure crop planting dates and growth stages.
- Compare current and alternative crop rotations.
- Adjust evaluation priorities.
- Examine crop water screening indicators.
- Understand how rotation scores are calculated.

Instead of presenting a single unexplained recommendation, BOZKIR displays comparative scores and supporting information.

## How BOZKIR Works

### 1. Create a Field

Users create a field by entering its location and basic agricultural information.

Field information is currently stored in the browser using local storage.

### 2. Explore Historical Climate Data

BOZKIR retrieves daily NASA POWER meteorological data for the selected coordinates.

The application uses historical weather information to visualize and summarize climate conditions.

### 3. Estimate Crop Water Indicators

Daily reference evapotranspiration (ETo) is calculated using the FAO-56 Penman-Monteith method.

Crop coefficients (Kc) are used to estimate crop evapotranspiration (ETc) for selected growing seasons.

The application also calculates a preliminary gross precipitation gap.

This gap is not a validated irrigation requirement.

### 4. Compare Crop Rotations

Users can compare their current crop rotation with two alternatives.

The application evaluates:

- Crop diversity
- Botanical family diversity
- Repeated consecutive crops
- Legume inclusion
- Crop water screening indicators

### 5. Select Evaluation Priorities

Users can choose among three weighting options:

| Priority | Rotation Structure | Water Screening |
| --- | ---: | ---: |
| Balanced | 50% | 50% |
| Water Priority | 30% | 70% |
| Rotation Diversity Priority | 70% | 30% |

BOZKIR calculates a combined prototype score for each rotation.

These scores support comparison and exploration. They are not validated predictions of agricultural performance.

## NASA Data Integration

BOZKIR uses the **NASA POWER** daily point API.

Data source:

https://power.larc.nasa.gov/

Meteorological parameters used by the application include:

| Parameter | Description |
| --- | --- |
| PRECTOTCORR | Corrected precipitation |
| T2M | Air temperature at 2 m |
| T2M_MAX | Maximum air temperature at 2 m |
| T2M_MIN | Minimum air temperature at 2 m |
| RH2M | Relative humidity at 2 m |
| WS2M | Wind speed at 2 m |
| ALLSKY_SFC_SW_DWN | Surface shortwave radiation |
| PS | Surface atmospheric pressure |

The application retrieves location-dependent historical data rather than using a single fixed location for every user.

Historical climate summaries use complete years where required.

For crop seasons extending beyond available meteorological records, the application can construct illustrative historical-climatology scenarios.

These scenarios are not weather forecasts.

For details, see [NASA POWER Data Modes](docs/DATA_MODES.md).

## Scientific Methodology

### Reference Evapotranspiration

BOZKIR calculates daily reference evapotranspiration using the FAO-56 Penman-Monteith method.

### Crop Evapotranspiration

Crop evapotranspiration is estimated using:

`ETc = Kc × ETo`

Crop coefficients vary across the growing stages.

### Water Screening

A preliminary gross precipitation gap is calculated as:

`max(0, ETc - gross precipitation)`

The water screening score uses the ratio between this gap and estimated ETc.

Gross precipitation is not effective rainfall, and the gap is not an irrigation requirement.

### Rotation Structure

The structural score uses transparent heuristic rules related to crop diversity, crop families, consecutive repetitions, and legume presence.

### Combined Prototype Score

The application combines structural and water screening scores using user-selected weights.

The calculations are deterministic and explainable.

BOZKIR does not use a generative AI model to predict weather, soil conditions, or crop yields.

For the complete methodology and limitations, see:

[Scientific Assumptions and Limitations](docs/SCIENTIFIC_ASSUMPTIONS.md)

## Supported Crops

The current prototype includes:

- Wheat
- Barley
- Chickpea
- Lentil

The crop profiles contain reference coefficients and default growth-stage durations.

These are demonstration assumptions and require local validation.

Additional crops and region-specific calendars may be added in future versions.

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- Recharts
- Leaflet
- Lucide React
- Axios

### Backend

- Python
- FastAPI
- Pydantic
- Pandas
- NumPy
- Requests

### Data and Scientific Methods

- NASA POWER daily meteorological data
- FAO-56 Penman-Monteith
- FAO-56 single crop coefficient approach
- Historical climate analysis
- Rule-based rotation evaluation
- Weighted multi-criteria scoring

### Development and Testing

- Git
- GitHub
- pytest

## Getting Started

### Prerequisites

Install:

- Python 3.11 or newer
- Node.js compatible with the project's Vite version
- npm
- Git

An internet connection is required for NASA POWER API requests.

### 1. Clone the Repository

```bash
git clone https://github.com/aybuke2/Bozkir.git
cd Bozkir
```

### 2. Set Up the Backend

Open a terminal in the `backend` directory.

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate the environment.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS or Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Start the FastAPI server:

```bash
python -m uvicorn main:app --reload
```

The backend runs at:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

### 3. Set Up the Frontend

Open a second terminal and navigate to the `frontend` directory.

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a local environment file based on `.env.example`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS or Linux:

```bash
cp .env.example .env.local
```

The default API URL is:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Open the local address shown by Vite, typically:

http://localhost:5173

Both the frontend and backend must be running for the full application to work.

## Running Tests

The backend includes automated tests for climate calculations, crop profiles, evapotranspiration, rotation logic, and decision-support functionality.

From the `backend` directory, install pytest if necessary:

```bash
python -m pip install pytest
```

Run the test suite:

```bash
python -m pytest -v
```

At the latest local verification before this documentation update, 17 automated backend tests passed.

This result does not establish complete scientific validation or production readiness.

## Main API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/` | API status |
| GET | `/crops` | Supported crops |
| GET | `/crops/profiles` | Crop profile metadata |
| POST | `/climate/location` | Location-based climate summary |
| POST | `/climate/history` | Historical climate information |
| POST | `/rainfall/period` | Rainfall analysis |
| POST | `/crop/season` | Historical crop-season analysis |
| POST | `/water/crop` | Crop water indicators |
| POST | `/decision/compare` | Weighted crop rotation comparison |

Additional endpoints are available in the FastAPI documentation.

## Current Limitations

BOZKIR is a hackathon prototype, not a validated agricultural advisory system.

Important limitations include:

- NASA POWER data are gridded meteorological estimates.
- Historical climatology is not a weather forecast.
- Crop coefficients and planting calendars require local validation.
- Gross precipitation is not effective rainfall.
- Soil-water storage and irrigation efficiency are not modeled.
- Crop yields and soil health are not directly predicted or measured.
- Rotation scenarios are evaluated independently.
- Rotation scores are heuristic prototype indicators.
- Field records are stored locally in the user's browser.

The application should not be used as the sole basis for operational farming decisions.

## Future Development

Potential improvements include:

- Additional crop profiles
- Locally validated planting calendars
- Crop-specific regional reference data
- Improved evapotranspiration validation
- Effective rainfall calculations
- Soil-water balance modeling
- Expanded uncertainty analysis
- More detailed comparison explanations
- User testing with farmers and agricultural specialists
- Persistent field storage and account-based field management

## References

**NASA POWER**

https://power.larc.nasa.gov/

**FAO Irrigation and Drainage Paper 56**

Allen, R. G., Pereira, L. S., Raes, D., and Smith, M. (1998).

*Crop Evapotranspiration: Guidelines for Computing Crop Water Requirements.*

https://www.fao.org/4/X0490E/X0490E00.htm

**FAO Irrigation Water Needs**

https://www.fao.org/4/s2022e/s2022e07.htm

## Project Information

**Project:** BOZKIR

**Challenge:** Field Shift: Adapting Farms with NASA Data

**Event:** NASA Space Apps Challenge 2026

---

*BOZKIR — Turning historical climate data into clearer farming decisions.*
