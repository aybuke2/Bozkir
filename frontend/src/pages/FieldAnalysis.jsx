
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
  const [field] = useState(readSelectedField);
  const [climate, setClimate] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(Boolean(field));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!field) return;

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
  }, [field]);

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
