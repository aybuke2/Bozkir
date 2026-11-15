
import { useEffect, useState } from "react";
import { Droplets, Thermometer, Activity } from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import RainfallChart from "../components/RainfallChart";
import TemperatureChart from "../components/TemperatureChart";

import {
  getClimateByLocation,
  getClimateHistory,
  getApiError,
} from "../services/api";

function readSelectedField() {
  try {
    const selected = JSON.parse(
      localStorage.getItem("selectedField") || "null"
    );
    if (!selected) return null;

    const fields = JSON.parse(
      localStorage.getItem("bozkir_fields") || "[]"
    );

    return fields.find((field) => field.id === selected.id) || null;
  } catch {
    return null;
  }
}

export default function FieldAnalysis() {
  const [fields] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("bozkir_fields") || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch { return []; }
  });
  const [fieldId, setFieldId] = useState(() => {
    const initial = readSelectedField();
    return initial?.id == null ? "" : String(initial.id);
  });
  const field = fields.find((item) => String(item.id) === fieldId) || null;
  const [climate, setClimate] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(Boolean(field));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!field) {
      setClimate(null); setHistory(null); setLoading(false); setError("");
      return;
    }
    setLoading(true); setError(""); setClimate(null); setHistory(null);

    let cancelled = false;

    async function load() {
      const location = {
        latitude: Number(field.latitude),
        longitude: Number(field.longitude),
      };

      try {
        const [climateData, historyData] = await Promise.all([
          getClimateByLocation(location),
          getClimateHistory(location),
        ]);

        if (!cancelled) {
          setClimate(climateData);
          setHistory(historyData);
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [fieldId]);

  function format(value, unit) {
    return value == null
      ? "N/A"
      : `${Number(value).toFixed(2)} ${unit}`;
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        <h1>Field Analysis</h1>
        <section className="bozkir-analysis-field-picker">
          <label htmlFor="analysis-field-select">Select a Field</label>
          <select id="analysis-field-select" aria-label="Select a field" value={fieldId} onChange={(event) => {
            const nextId = event.target.value;
            setFieldId(nextId);
            const selected = fields.find((item) => String(item.id) === nextId);
            localStorage.setItem("selectedField", JSON.stringify(selected || null));
          }}>
            <option value="">Choose a saved field</option>
            {fields.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.fieldName} ({item.latitude}, {item.longitude})
              </option>
            ))}
          </select>
          {fields.length === 0 && <p>Add a field in My Fields first.</p>}
        </section>

        {!field && (
          <p>
            No field selected. Open My Fields and select
            a field to analyze.
          </p>
        )}

        {field && (
          <p>
            {field.fieldName} — {Number(field.latitude).toFixed(4)},{" "}
            {Number(field.longitude).toFixed(4)}
          </p>
        )}

        {loading && <p>Loading NASA climate data...</p>}

        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}

        {!loading && !error && climate && history && (
          <>
            <p>
              Historical period: {climate.period} |
              Source: NASA POWER
            </p>

            <div className="stats-grid">
              <StatCard
                title="Average Annual Rainfall"
                value={format(climate.mean_annual_rainfall_mm, "mm")}
                description="Historical average"
                icon={<Droplets />}
              />

              <StatCard
                title="Average Temperature"
                value={format(climate.mean_temperature_c, "°C")}
                description="Historical average"
                icon={<Thermometer />}
              />

              <StatCard
                title="Rainfall Variability"
                value={format(climate.annual_rainfall_cv_percent, "%")}
                description="Annual coefficient of variation"
                icon={<Activity />}
              />
            </div>

            <div className="charts-grid">
              <RainfallChart data={history.annual_rainfall} />
              <TemperatureChart data={history.monthly_temperature} />
            </div>

            <p>
              These values describe historical climate conditions.
              They are not weather forecasts, NDVI measurements,
              or irrigation recommendations.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
