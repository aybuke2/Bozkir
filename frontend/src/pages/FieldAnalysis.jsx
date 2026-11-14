import { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import StatCard from "../components/StatCard";
import RainfallChart from "../components/RainfallChart";
import TemperatureChart from "../components/TemperatureChart";
import NDVIChart from "../components/NDVIChart";

import {
  getClimateByLocation,
  getRainfallByPeriod
} from "../services/api";

import {
  Droplets,
  Thermometer,
  Sprout
} from "lucide-react";

function FieldAnalysis() {
  const [climate, setClimate] = useState(null);
  const [rainfall, setRainfall] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const savedFields = JSON.parse(localStorage.getItem("bozkir_fields") || "[]");
        const targetField = savedFields.length > 0 
          ? savedFields[savedFields.length - 1] 
          : { latitude: 37.87, longitude: 32.48 };

        const payload = {
          latitude: targetField.latitude,
          longitude: targetField.longitude,
          start_date: "2005-01-01",
          end_date: "2025-12-31"
        };

        const climateResult = await getClimateByLocation(payload);
        setClimate(climateResult);
      } catch (err) {
        console.error(err);
        setError("Analiz verileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        <h1>Tarla Karnesi</h1>

        {loading && <p>Analiz verileri yükleniyor...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && climate && (
          <>
            {/* İstatistik kartları */}
            <div className="stats-grid">
              <StatCard
                title="Yıllık Yağış"
                value={`${climate.annual_rainfall || 320} mm`}
                description="NASA Verisi"
                icon={<Droplets />}
              />

              <StatCard
                title="Ortalama Sıcaklık"
                value={`${climate.average_temperature || 14.2} °C`}
                description="NASA Verisi"
                icon={<Thermometer />}
              />

              <StatCard
                title="NDVI"
                value={climate.ndvi || "0.48"}
                description="Uydu İndeksi"
                icon={<Sprout />}
              />
            </div>

            {/* Yağış ve sıcaklık grafikleri */}
            <div className="charts-grid">
              <RainfallChart data={climate.rainfall_history} />
              <TemperatureChart data={climate.temperature_history} />
            </div>

            {/* NDVI grafiği */}
            <NDVIChart data={climate.ndvi_history} />
          </>
        )}

      </main>
    </div>
  );
}

export default FieldAnalysis;