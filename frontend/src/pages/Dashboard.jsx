
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Sprout, Plus, MapPin } from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";

const CROP_NAMES = {
  wheat: "Wheat", barley: "Barley",
  chickpea: "Chickpea", lentil: "Lentil",
  fallow: "Fallow",
  "Buğday": "Wheat", "Arpa": "Barley",
  "Nohut": "Chickpea", "Mercimek": "Lentil",
  "Nadas": "Fallow",
};

const IRRIGATION_NAMES = {
  rainfed: "Rainfed", irrigated: "Irrigated",
  "Kuru tarım": "Rainfed", "Sulu tarım": "Irrigated",
};

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [fields] = useState(readFields);

  const totalArea = fields.reduce(
    (sum, field) => sum + Number(field.area || 0),
    0
  );

  function openAnalysis(field) {
    localStorage.setItem(
      "selectedField",
      JSON.stringify(field)
    );
    navigate("/analysis");
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />

        <section className="welcome">
          <div>
            <h1>Welcome to Bozkır!</h1>
            <p>
              Explore your fields and compare crop rotation scenarios.
            </p>
          </div>
          <button onClick={() => navigate("/new-field")}>
            <Plus size={18} />
            Add New Field
          </button>
        </section>

        <section className="stats-grid">
          <StatCard
            title="Saved Fields"
            value={fields.length}
            description="Fields saved in this browser"
            icon={<Map />}
          />
          <StatCard
            title="Total Field Area"
            value={`${totalArea.toLocaleString("en-US")} ha`}
            description="Combined registered area"
            icon={<Sprout />}
          />
        </section>

        <section className="fields-section">
          <div className="fields-header">
            <div>
              <h2>My Fields</h2>
              <p>Explore your saved fields.</p>
            </div>
            <button onClick={() => navigate("/new-field")}>
              View All Fields
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="empty-fields">
              <Sprout size={40} />
              <h3>No fields saved yet.</h3>
              <p>Add your first field to get started.</p>
              <button onClick={() => navigate("/new-field")}>
                Add Field
              </button>
            </div>
          ) : (
            <div className="fields-grid">
              {fields.slice(0, 3).map((field) => (
                <div className="field-card" key={field.id}>
                  <h3>{field.fieldName}</h3>
                  <p>
                    <MapPin size={15} />{" "}
                    {Number(field.latitude).toFixed(4)},{" "}
                    {Number(field.longitude).toFixed(4)}
                  </p>
                  <p>Area: {field.area} ha</p>
                  <p>
                    Current Crop:{" "}
                    {CROP_NAMES[field.crop] || field.crop}
                  </p>
                  <p>
                    Irrigation:{" "}
                    {IRRIGATION_NAMES[field.irrigation] ||
                      field.irrigation}
                  </p>
                  <button onClick={() => openAnalysis(field)}>
                    View Analysis
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
