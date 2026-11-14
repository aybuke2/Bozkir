
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import PrioritySelector from "../components/PrioritySelector";
import RotationCard from "../components/RotationCard";
import { compareDecision, getApiError } from "../services/api";

const CROPS = [
  { id: "wheat", name: "Wheat" },
  { id: "barley", name: "Barley" },
  { id: "chickpea", name: "Chickpea" },
  { id: "lentil", name: "Lentil" },
];

const INITIAL_ROTATIONS = {
  current: ["wheat", "wheat", "barley"],
  alternative_a: ["wheat", "chickpea", "barley"],
  alternative_b: ["wheat", "lentil", "barley"],
};

// Editable demonstration assumptions, not validated planting advice.
const INITIAL_CALENDARS = {
  wheat: {
    planting_date: "2023-10-01",
    initial_days: 30,
    development_days: 60,
    mid_days: 100,
    late_days: 50,
    kc_initial: 0.4,
    kc_mid: 1.15,
    kc_end: 0.25,
  },
  barley: {
    planting_date: "2023-10-01",
    initial_days: 30,
    development_days: 50,
    mid_days: 90,
    late_days: 40,
    kc_initial: 0.4,
    kc_mid: 1.15,
    kc_end: 0.25,
  },
  chickpea: {
    planting_date: "2024-03-01",
    initial_days: 25,
    development_days: 35,
    mid_days: 45,
    late_days: 30,
    kc_initial: 0.4,
    kc_mid: 1.0,
    kc_end: 0.35,
  },
  lentil: {
    planting_date: "2024-03-01",
    initial_days: 25,
    development_days: 35,
    mid_days: 45,
    late_days: 30,
    kc_initial: 0.4,
    kc_mid: 1.1,
    kc_end: 0.3,
  },
};

const OPTION_LABELS = {
  current: "Current Rotation",
  alternative_a: "Alternative A",
  alternative_b: "Alternative B",
};

const CALENDAR_FIELDS = [
  ["initial_days", "Initial Stage (days)"],
  ["development_days", "Development Stage (days)"],
  ["mid_days", "Mid Stage (days)"],
  ["late_days", "Late Stage (days)"],
  ["kc_initial", "Initial Kc"],
  ["kc_mid", "Mid-Season Kc"],
  ["kc_end", "End-Season Kc"],
];

function readFields() {
  try {
    const fields = JSON.parse(
      localStorage.getItem("bozkir_fields") || "[]"
    );
    return Array.isArray(fields) ? fields : [];
  } catch {
    return [];
  }
}

function readSelectedId() {
  try {
    const field = JSON.parse(
      localStorage.getItem("selectedField") || "null"
    );
    return field?.id == null ? "" : String(field.id);
  } catch {
    return "";
  }
}

export default function RotationComparison() {
  const [fields] = useState(readFields);
  const [fieldId, setFieldId] = useState(readSelectedId);
  const [priority, setPriority] = useState("balanced");
  const [rotations, setRotations] = useState(INITIAL_ROTATIONS);
  const [calendars, setCalendars] = useState(INITIAL_CALENDARS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedField = fields.find(
    (field) => String(field.id) === fieldId
  );

  const selectedCrops = [
    ...new Set(Object.values(rotations).flat()),
  ];

  function changeCrop(option, index, cropId) {
    setRotations((previous) => ({
      ...previous,
      [option]: previous[option].map((crop, i) =>
        i === index ? cropId : crop
      ),
    }));
    setResult(null);
  }

  function changeCalendar(cropId, key, value) {
    setCalendars((previous) => ({
      ...previous,
      [cropId]: {
        ...previous[cropId],
        [key]: key === "planting_date" ? value : Number(value),
      },
    }));
    setResult(null);
  }

  function addYear(option) {
    setRotations((previous) => ({
      ...previous,
      [option]: [...previous[option], "wheat"],
    }));
    setResult(null);
  }

  function removeYear(option) {
    setRotations((previous) => ({
      ...previous,
      [option]: previous[option].slice(0, -1),
    }));
    setResult(null);
  }

  async function compare() {
    if (!selectedField) {
      setError("Please select a saved field.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const crop_calendars = Object.fromEntries(
      selectedCrops.map((id) => [id, calendars[id]])
    );

    try {
      const data = await compareDecision({
        latitude: Number(selectedField.latitude),
        longitude: Number(selectedField.longitude),
        ...rotations,
        crop_calendars,
        priority,
      });
      setResult(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        <h1>Crop Rotation Comparison</h1>
        <p>
          Compare crop sequences using historical NASA POWER data
          and transparent prototype screening indicators.
        </p>

        <section className="priority-card">
          <h2>Select a Field</h2>
          <select
            aria-label="Select a field"
            value={fieldId}
            onChange={(event) => {
              setFieldId(event.target.value);
              setResult(null);
            }}
          >
            <option value="">Choose a saved field</option>
            {fields.map((field) => (
              <option key={field.id} value={String(field.id)}>
                {field.fieldName} ({field.latitude}, {field.longitude})
              </option>
            ))}
          </select>
          {fields.length === 0 && (
            <p>Add a field in My Fields before comparing rotations.</p>
          )}
        </section>

        <PrioritySelector
          priority={priority}
          setPriority={(value) => {
            setPriority(value);
            setResult(null);
          }}
        />

        <h2 className="section-heading">Rotation Scenarios</h2>

        <div className="rotation-grid">
          {Object.entries(rotations).map(([option, cropIds]) => (
            <section className="rotation-card" key={option}>
              <h3>{OPTION_LABELS[option]}</h3>

              {cropIds.map((cropId, index) => (
                <div className="priority-item" key={index}>
                  <label>
                    Year {index + 1}
                    <select
                      value={cropId}
                      onChange={(event) =>
                        changeCrop(option, index, event.target.value)
                      }
                    >
                      {CROPS.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}

              <button
                type="button"
                disabled={cropIds.length >= 10}
                onClick={() => addYear(option)}
              >
                Add Year
              </button>

              <button
                type="button"
                disabled={cropIds.length <= 2}
                onClick={() => removeYear(option)}
              >
                Remove Last Year
              </button>
            </section>
          ))}
        </div>

        <h2 className="section-heading">Crop Calendar Assumptions</h2>
        <p>
          The initial dates, stage lengths, and Kc values are editable
          demonstration assumptions. Validate them locally before use.
          Available historical data covers 2005–2024.
        </p>

        <div className="rotation-grid">
          {selectedCrops.map((cropId) => (
            <section className="rotation-card" key={cropId}>
              <h3>{CROPS.find((crop) => crop.id === cropId)?.name}</h3>

              <div className="priority-item">
                <label>
                  Planting Date
                  <input
                    type="date"
                    value={calendars[cropId].planting_date}
                    onChange={(event) =>
                      changeCalendar(
                        cropId,
                        "planting_date",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              {CALENDAR_FIELDS.map(([key, label]) => (
                <div className="priority-item" key={key}>
                  <label>
                    {label}
                    <input
                      type="number"
                      min={key.endsWith("_days") ? 1 : 0}
                      max={key.endsWith("_days") ? 180 : 2}
                      step={key.endsWith("_days") ? 1 : 0.01}
                      value={calendars[cropId][key]}
                      onChange={(event) =>
                        changeCalendar(cropId, key, event.target.value)
                      }
                    />
                  </label>
                </div>
              ))}
            </section>
          ))}
        </div>

        <button
          type="button"
          disabled={loading || !selectedField}
          onClick={compare}
        >
          {loading ? "Analyzing..." : "Compare Rotations"}
        </button>

        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}

        {result && (
          <>
            <h2 className="section-heading">Comparison Results</h2>
            <p>
              Location: {result.location.latitude},{" "}
              {result.location.longitude}
            </p>

            <div className="rotation-grid">
              {result.ranking.map((rotation) => (
                <RotationCard
                  key={rotation.option_id}
                  rotation={rotation}
                />
              ))}
            </div>

            <h2 className="section-heading">Crop Water Indicators</h2>
            <div className="rotation-grid">
              {Object.values(result.crop_water_scenarios).map((crop) => (
                <article className="rotation-card" key={crop.crop_id}>
                  <h3>
                    {CROPS.find((item) => item.id === crop.crop_id)?.name}
                  </h3>
                  <p>Reference ET: {crop.eto_mm} mm</p>
                  <p>Estimated Crop ET: {crop.etc_mm} mm</p>
                  <p>Gross Precipitation: {crop.precipitation_mm} mm</p>
                  <p>
                    Gross Precipitation Gap:{" "}
                    {crop.gross_precipitation_gap_mm} mm
                  </p>
                </article>
              ))}
            </div>

            <p>
              The scores are prototype indicators, not measured soil
              health, yield predictions, or irrigation requirements.
              Crop calendars are evaluated independently; successive
              rotation years are not simulated.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
