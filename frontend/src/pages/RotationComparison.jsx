
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import PrioritySelector from "../components/PrioritySelector";
import RotationCard from "../components/RotationCard";
import {
  compareDecision,
  getCropProfiles,
  getApiError,
} from "../services/api";

const CROPS = [
  {
    id: "wheat",
    name: "Wheat",
    scientific: "Triticum aestivum",
    type: "Cereal",
    symbol: "🌾",
    detail:
      "A cereal crop commonly grown for grain. Rotation with a legume can diversify crop families.",
  },
  {
    id: "barley",
    name: "Barley",
    scientific: "Hordeum vulgare",
    type: "Cereal",
    symbol: "🌾",
    detail:
      "A cereal crop used for food, feed and malt. It belongs to the same plant family as wheat.",
  },
  {
    id: "chickpea",
    name: "Chickpea",
    scientific: "Cicer arietinum",
    type: "Legume",
    symbol: "🫘",
    detail:
      "A pulse crop that can form nitrogen-fixing symbioses with rhizobia; benefits depend on field conditions.",
  },
  {
    id: "lentil",
    name: "Lentil",
    scientific: "Lens culinaris",
    type: "Legume",
    symbol: "🫘",
    detail:
      "A pulse crop from the legume family, useful for diversifying cereal-based crop sequences.",
  },
];

const INITIAL_ROTATIONS = {
  current: ["wheat", "wheat", "barley"],
  alternative_a: ["wheat", "chickpea", "barley"],
  alternative_b: ["wheat", "lentil", "barley"],
};

// FAO reference durations; sowing dates are provided by the user.
const INITIAL_CALENDARS = {
  wheat: {
    planting_date: "",
    initial_days: 15,
    development_days: 25,
    mid_days: 50,
    late_days: 30,
    kc_initial: 0.4,
    kc_mid: 1.15,
    kc_end: 0.25,
  },
  barley: {
    planting_date: "",
    initial_days: 15,
    development_days: 25,
    mid_days: 50,
    late_days: 30,
    kc_initial: 0.4,
    kc_mid: 1.15,
    kc_end: 0.25,
  },
  chickpea: {
    planting_date: "",
    initial_days: 20,
    development_days: 30,
    mid_days: 60,
    late_days: 40,
    kc_initial: 0.4,
    kc_mid: 1.0,
    kc_end: 0.35,
  },
  lentil: {
    planting_date: "",
    initial_days: 20,
    development_days: 30,
    mid_days: 60,
    late_days: 40,
    kc_initial: 0.4,
    kc_mid: 1.1,
    kc_end: 0.3,
  },
};

const FAO_STAGE_SOURCE =
  "https://www.fao.org/4/s2022e/s2022e07.htm";

const OPTION_LABELS = {
  current: "Current Rotation",
  alternative_a: "Alternative A",
  alternative_b: "Alternative B",
};

const STAGE_FIELDS = [
  ["initial_days", "Initial Stage (days)"],
  ["development_days", "Development Stage (days)"],
  ["mid_days", "Mid Stage (days)"],
  ["late_days", "Late Stage (days)"],
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
  const [profiles, setProfiles] = useState({});
  const [profileError, setProfileError] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getCropProfiles()
      .then((data) => {
        if (!active) return;

        const byId = Object.fromEntries(
          data.map((item) => [item.id, item])
        );

        setProfiles(byId);

        setCalendars((previous) =>
          Object.fromEntries(
            Object.entries(previous).map(([id, calendar]) => {
              const profile = byId[id];

              return [
                id,
                profile
                  ? {
                      ...calendar,
                      kc_initial: profile.kc_initial_scenario,
                      kc_mid: profile.kc_mid_reference,
                      kc_end: profile.kc_end_reference,
                      initial_days:
                        profile.initial_days ??
                        calendar.initial_days,
                      development_days:
                        profile.development_days ??
                        calendar.development_days,
                      mid_days:
                        profile.mid_days ??
                        calendar.mid_days,
                      late_days:
                        profile.late_days ??
                        calendar.late_days,
                    }
                  : calendar,
              ];
            })
          )
        );
      })
      .catch(() => {
        if (active) {
          setProfileError(
            "Could not load crop coefficients from the backend."
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
        [key]:
          key === "planting_date" ? value : Number(value),
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

    if (
      selectedCrops.some(
        (id) => !calendars[id]?.planting_date
      )
    ) {
      setError(
        "Enter a planting date for every selected crop."
      );
      return;
    }

    if (selectedCrops.some((id) => !profiles[id])) {
      setError(
        "Crop reference profiles are not loaded. Check the backend connection."
      );
      return;
    }

    for (const id of selectedCrops) {
      const calendar = calendars[id];

      const totalDays = STAGE_FIELDS.reduce(
        (sum, [key]) => sum + calendar[key],
        0
      );

      const start = new Date(
        `${calendar.planting_date}T12:00:00Z`
      );

      if (
        !calendar.planting_date ||
        !Number.isFinite(start.getTime()) ||
        STAGE_FIELDS.some(
          ([key]) =>
            !Number.isInteger(calendar[key]) ||
            calendar[key] < 1 ||
            calendar[key] > 180
        ) ||
        start.getUTCFullYear() < 2005 ||
        totalDays > 720
      ) {
        setError(
          `${id}: Enter a valid planting date (2005 or later) and stage lengths (1–180 days per stage, up to 720 days total).`
        );
        return;
      }
    }

    setLoading(true);
    setError("");
    setResult(null);

    const crop_calendars = Object.fromEntries(
      selectedCrops.map((id) => [
        id,
        calendars[id],
      ])
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
          Compare crop sequences using historical NASA POWER
          data and transparent prototype screening indicators.
        </p>

        {/* =====================================
            FIELD + PRIORITY SELECTION
            These two cards share one grid.
           ===================================== */}

        <div className="bozkir-setup-grid">
          {/* SELECT A FIELD */}

          <section className="priority-card bozkir-field-panel">
            <div className="bozkir-panel-header">
              <div className="bozkir-panel-icon">
                <MapPin size={25} />
              </div>

              <div>
                <h2>Select a Field</h2>
                <p>
                  Choose one of your saved fields
                  for the analysis.
                </p>
              </div>
            </div>

            <select
              aria-label="Select a field"
              value={fieldId}
              onChange={(event) => {
                const nextId = event.target.value;

                setFieldId(nextId);

                const chosen = fields.find(
                  (item) =>
                    String(item.id) === nextId
                );

                localStorage.setItem(
                  "selectedField",
                  JSON.stringify(chosen || null)
                );

                setResult(null);
              }}
            >
              <option value="">
                Choose a saved field
              </option>

              {fields.map((field) => (
                <option
                  key={field.id}
                  value={String(field.id)}
                >
                  {field.fieldName} (
                  {field.latitude}, {field.longitude})
                </option>
              ))}
            </select>

            {fields.length === 0 && (
              <p>
                Add a field in My Fields before
                comparing rotations.
              </p>
            )}
          </section>

          {/* EVALUATION PRIORITIES */}

          <PrioritySelector
            priority={priority}
            setPriority={(value) => {
              setPriority(value);
              setResult(null);
            }}
          />
        </div>

        {/* =====================================
            ROTATION SCENARIOS
           ===================================== */}

        <h2 className="section-heading">
          Rotation Scenarios
        </h2>

        <div className="rotation-grid">
          {Object.entries(rotations).map(
            ([option, cropIds]) => (
              <section
                className="rotation-card"
                key={option}
              >
                <h3>{OPTION_LABELS[option]}</h3>

                {cropIds.map((cropId, index) => (
                  <div
                    className="priority-item"
                    key={index}
                  >
                    <label>
                      Year {index + 1}

                      <select
                        value={cropId}
                        onChange={(event) =>
                          changeCrop(
                            option,
                            index,
                            event.target.value
                          )
                        }
                      >
                        {CROPS.map((crop) => (
                          <option
                            key={crop.id}
                            value={crop.id}
                          >
                            {crop.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}

                <div className="bozkir-year-actions">
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
                    onClick={() =>
                      removeYear(option)
                    }
                  >
                    Remove Last Year
                  </button>
                </div>
              </section>
            )
          )}
        </div>

        {/* =====================================
            CROP GROWTH CALENDARS
           ===================================== */}

        <h2 className="section-heading">
          Crop Growth Calendars
        </h2>

        <p>
          Enter a planting date for each crop.
          Default stage durations are published
          FAO reference values, not location-specific
          predictions. Chickpea durations use lentil
          as a provisional legume proxy, not a
          chickpea-specific FAO calendar. You can
          edit every stage. Kc initial = 0.40 is
          a wetness-dependent reference assumption,
          not a field measurement. Observed NASA
          weather is used for completed seasons;
          future seasons use historical daily climate
          averages, not forecasts. Crop ET is not
          irrigation demand.
        </p>

        <div className="bozkir-calendar-grid">
          {selectedCrops.map((cropId) => (
            <section
              className="rotation-card"
              key={cropId}
            >
              {(() => {
                const crop = CROPS.find(
                  (item) => item.id === cropId
                );

                return (
                  <div className="bozkir-crop-heading">
                    <h3>{crop?.name}</h3>

                    <div className="bozkir-crop-info">
                      <button
                        type="button"
                        className="bozkir-crop-info-trigger"
                        aria-label={`About ${crop?.name}`}
                        aria-describedby={`crop-info-${cropId}`}
                      >
                        <span aria-hidden="true">
                          ✦
                        </span>
                        <span>Discover</span>
                      </button>

                      <div
                        className={`bozkir-crop-popover bozkir-crop-popover-${cropId}`}
                        id={`crop-info-${cropId}`}
                        role="tooltip"
                      >
                        <div className="bozkir-crop-popover-art">
                          <img
                            className="bozkir-crop-popover-image"
                            src={`/crops/${cropId}.png`}
                            alt={`${crop?.name || cropId} illustration`}
                            loading="lazy"
                          />
                        </div>

                        <div className="bozkir-crop-popover-body">
                          <span className="bozkir-crop-type">
                            {crop?.type}
                          </span>

                          <strong>
                            {crop?.name}
                          </strong>

                          <em>
                            {crop?.scientific}
                          </em>

                          <p>{crop?.detail}</p>

                          <small>
                            Crop rotation information
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="priority-item">
                <label>
                  Planting Date

                  <input
                    type="date"
                    value={
                      calendars[cropId].planting_date
                    }
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

              <p>
                Kc initial:{" "}
                {calendars[cropId].kc_initial}
                {" "}
                (illustrative wetness-dependent
                assumption) · mid:{" "}
                {calendars[cropId].kc_mid} ·
                end:{" "}
                {calendars[cropId].kc_end}
              </p>

              <p className="bozkir-kc-note">
                Initial Kc depends on soil wetness;
                these values are reference estimates,
                not field measurements.
              </p>

              {STAGE_FIELDS.map(
                ([key, label]) => (
                  <div
                    className="priority-item"
                    key={key}
                  >
                    <label>
                      {label}

                      <input
                        type="number"
                        min={1}
                        max={180}
                        step={1}
                        value={
                          calendars[cropId][key]
                        }
                        onChange={(event) =>
                          changeCalendar(
                            cropId,
                            key,
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>
                )
              )}

              <div className="bozkir-calendar-footer">
                <strong>
                  Total:{" "}
                  {STAGE_FIELDS.reduce(
                    (sum, [key]) =>
                      sum +
                      (Number(
                        calendars[cropId][key]
                      ) || 0),
                    0
                  )}{" "}
                  days
                </strong>

                <p className="bozkir-calendar-basis">
                  {profiles[cropId]
                    ?.stage_lengths_basis ||
                    (cropId === "chickpea"
                      ? "Lentil-based duration proxy; not chickpea-specific"
                      : "General FAO reference")}
                </p>

                <div className="bozkir-calendar-links">
                  <a
                    href={
                      profiles[cropId]
                        ?.stage_lengths_source ||
                      FAO_STAGE_SOURCE
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    FAO growth-stage source
                  </a>

                  {profiles[cropId]
                    ?.kc_source && (
                    <a
                      href={
                        profiles[cropId].kc_source
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      FAO Kc reference
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  className="bozkir-reset-button"
                  onClick={() => {
                    const profile =
                      profiles[cropId];

                    if (!profile) return;

                    setCalendars(
                      (previous) => ({
                        ...previous,
                        [cropId]: {
                          ...previous[cropId],
                          initial_days:
                            profile.initial_days ??
                            INITIAL_CALENDARS[
                              cropId
                            ].initial_days,
                          development_days:
                            profile.development_days ??
                            INITIAL_CALENDARS[
                              cropId
                            ].development_days,
                          mid_days:
                            profile.mid_days ??
                            INITIAL_CALENDARS[
                              cropId
                            ].mid_days,
                          late_days:
                            profile.late_days ??
                            INITIAL_CALENDARS[
                              cropId
                            ].late_days,
                        },
                      })
                    );

                    setResult(null);
                  }}
                >
                  Reset to Reference
                </button>
              </div>
            </section>
          ))}
        </div>

        {profileError && (
          <p role="alert">
            {profileError}
          </p>
        )}

        {/* =====================================
            COMPARE BUTTON
           ===================================== */}

        <button
          type="button"
          disabled={
            loading ||
            !selectedField ||
            Object.keys(profiles).length === 0
          }
          onClick={compare}
        >
          {loading
            ? "Analyzing..."
            : "Compare Rotations"}
        </button>

        {error && (
          <p
            role="alert"
            style={{ color: "#b91c1c" }}
          >
            {error}
          </p>
        )}

        {/* =====================================
            COMPARISON RESULTS
           ===================================== */}

        {result && (
          <>
            <h2 className="section-heading">
              Comparison Results
            </h2>

            <p>
              Location:{" "}
              {result.location.latitude},{" "}
              {result.location.longitude}
            </p>

            <div className="rotation-grid">
              {result.ranking.map(
                (rotation) => (
                  <RotationCard
                    key={rotation.option_id}
                    rotation={rotation}
                  />
                )
              )}
            </div>

            <h2 className="section-heading">
              Crop Water Indicators
            </h2>

            <div className="rotation-grid bozkir-water-grid">
              {Object.values(
                result.crop_water_scenarios
              ).map((crop) => (
                <article
                  className="rotation-card"
                  key={crop.crop_id}
                >
                  <h3>
                    {
                      CROPS.find(
                        (item) =>
                          item.id === crop.crop_id
                      )?.name
                    }
                  </h3>

                  <p>
                    <strong>
                      {crop.data_mode ===
                      "historical_climatology"
                        ? "Based on historical climate averages"
                        : "Based on observed weather data"}
                    </strong>
                  </p>

                  <p>
                    Reference ET:{" "}
                    {crop.eto_mm} mm
                  </p>

                  <p>
                    Estimated Crop ET:{" "}
                    {crop.etc_mm} mm
                  </p>

                  <p>
                    Gross Precipitation:{" "}
                    {crop.precipitation_mm} mm
                  </p>

                  <p>
                    Gross Precipitation Gap:{" "}
                    {
                      crop.gross_precipitation_gap_mm
                    }{" "}
                    mm
                  </p>
                </article>
              ))}
            </div>

            <p>
              Rotation sequences are compared using
              crop diversity, rotation rules, and
              climate-based water indicators.
              Soil changes, crop yields, and
              interactions between successive
              growing seasons are not simulated.
              The ETc–rainfall gap is a screening
              indicator, not an irrigation
              recommendation.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
