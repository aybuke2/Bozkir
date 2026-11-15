
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, MapPin, Pencil, Trash2, X, Sprout,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import FieldMap from "../components/FieldMap";

const STORAGE_KEY = "bozkir_fields";

const CROP_OPTIONS = [
  ["wheat", "Wheat"],
  ["barley", "Barley"],
  ["chickpea", "Chickpea"],
  ["lentil", "Lentil"],
  ["fallow", "Fallow"],
];

const IRRIGATION_OPTIONS = [
  ["rainfed", "Rainfed"],
  ["irrigated", "Irrigated"],
];

const CROP_ALIASES = {
  "Buğday": "wheat",
  "Arpa": "barley",
  "Nohut": "chickpea",
  "Mercimek": "lentil",
  "Nadas": "fallow",
  "Wheat": "wheat",
  "Barley": "barley",
  "Chickpea": "chickpea",
  "Lentil": "lentil",
  "Fallow": "fallow",
};

const IRRIGATION_ALIASES = {
  "Kuru tarım": "rainfed",
  "Sulu tarım": "irrigated",
  "Rainfed": "rainfed",
  "Irrigated": "irrigated",
};

const EMPTY_FORM = {
  fieldName: "",
  area: "",
  crop: "wheat",
  irrigation: "rainfed",
};

function normalizeField(field) {
  return {
    ...field,
    crop: CROP_ALIASES[field.crop] || field.crop || "wheat",
    irrigation:
      IRRIGATION_ALIASES[field.irrigation] ||
      field.irrigation ||
      "rainfed",
  };
}

function readFields() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    return Array.isArray(data) ? data.map(normalizeField) : [];
  } catch {
    return [];
  }
}

function optionLabel(options, value) {
  return options.find(([id]) => id === value)?.[1] || value;
}

export default function FieldSelection() {
  const navigate = useNavigate();
  const [fields, setFields] = useState(readFields);
  const [position, setPosition] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
  }, [fields]);

  function closeForm() {
    setForm(EMPTY_FORM);
    setPosition(null);
    setEditingId(null);
    setShowForm(false);
  }

  function addField() {
    closeForm();
    setShowForm(true);
  }

  function editField(field) {
    setForm({
      fieldName: field.fieldName,
      area: String(field.area),
      crop: field.crop,
      irrigation: field.irrigation,
    });
    setPosition({
      lat: Number(field.latitude),
      lng: Number(field.longitude),
    });
    setEditingId(field.id);
    setShowForm(true);
  }

  function saveField(event) {
    event.preventDefault();

    const area = Number(form.area);
    if (!form.fieldName.trim() || !Number.isFinite(area) || area <= 0) {
      alert("Enter a valid field name and area.");
      return;
    }

    if (
      !position ||
      !Number.isFinite(Number(position.lat)) ||
      !Number.isFinite(Number(position.lng))
    ) {
      alert("Select a field location on the map.");
      return;
    }

    const data = {
      ...form,
      fieldName: form.fieldName.trim(),
      area,
      latitude: Number(position.lat),
      longitude: Number(position.lng),
    };

    if (editingId !== null) {
      const updated = fields.map((field) =>
        field.id === editingId ? { ...field, ...data } : field
      );
      setFields(updated);

      try {
        const selected = JSON.parse(
          localStorage.getItem("selectedField") || "null"
        );
        if (selected?.id === editingId) {
          localStorage.setItem(
            "selectedField",
            JSON.stringify({ ...selected, ...data })
          );
        }
      } catch {
        localStorage.removeItem("selectedField");
      }
    } else {
      setFields((previous) => [
        ...previous,
        {
          id: globalThis.crypto?.randomUUID?.() || Date.now(),
          ...data,
        },
      ]);
    }

    closeForm();
  }

  function deleteField(id) {
    if (!window.confirm("Are you sure you want to delete this field?")) {
      return;
    }

    setFields((previous) =>
      previous.filter((field) => field.id !== id)
    );

    try {
      const selected = JSON.parse(
        localStorage.getItem("selectedField") || "null"
      );
      if (selected?.id === id) {
        localStorage.removeItem("selectedField");
      }
    } catch {
      localStorage.removeItem("selectedField");
    }

    if (editingId === id) closeForm();
  }

  function openPage(field, route) {
    localStorage.setItem(
      "selectedField",
      JSON.stringify(field)
    );
    navigate(route);
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <section className="fields-page-header">
          <div>
            <h1>My Fields</h1>
            <p>
              Manage your fields and select locations for analysis.
            </p>
          </div>

          {!showForm && (
            <button className="add-field-btn" onClick={addField}>
              <Plus size={20} />
              Add New Field
            </button>
          )}
        </section>

        {showForm && (
          <section className="field-form-section">
            <div className="form-header">
              <div>
                <h2>
                  {editingId !== null ? "Edit Field" : "Add New Field"}
                </h2>
                <p>Enter field details and select a map location.</p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={closeForm}
                aria-label="Close form"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={saveField}>
              <div className="field-form-grid">
                <div className="form-group">
                  <label htmlFor="fieldName">Field Name</label>
                  <input
                    id="fieldName"
                    value={form.fieldName}
                    onChange={(event) =>
                      setForm({ ...form, fieldName: event.target.value })
                    }
                    placeholder="e.g. Konya Pilot Field"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="area">Field Area (hectares)</label>
                  <input
                    id="area"
                    type="number"
                    min="0.01"
                    step="any"
                    value={form.area}
                    onChange={(event) =>
                      setForm({ ...form, area: event.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="crop">Current Crop</label>
                  <select
                    id="crop"
                    value={form.crop}
                    onChange={(event) =>
                      setForm({ ...form, crop: event.target.value })
                    }
                  >
                    {CROP_OPTIONS.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="irrigation">Irrigation Type</label>
                  <select
                    id="irrigation"
                    value={form.irrigation}
                    onChange={(event) =>
                      setForm({ ...form, irrigation: event.target.value })
                    }
                  >
                    {IRRIGATION_OPTIONS.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-map-section">
                <h3><MapPin size={19} /> Field Location</h3>
                <p>Click the map to select the field location.</p>

                <FieldMap
                  position={position}
                  setPosition={setPosition}
                />

                {position && (
                  <div className="selected-position">
                    <span>Latitude: {Number(position.lat).toFixed(5)}</span>
                    <span>Longitude: {Number(position.lng).toFixed(5)}</span>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button type="submit" className="save-field-btn">
                  {editingId !== null ? "Save Changes" : "Save Field"}
                </button>
              </div>
            </form>
          </section>
        )}

        {!showForm && (
          <section className="my-fields-section">
            <div className="my-fields-title">
              <div>
                <h2>Saved Fields</h2>
                <p>{fields.length} registered field(s).</p>
              </div>
              <div className="field-count">
                {fields.length} Fields
              </div>
            </div>

            {fields.length === 0 ? (
              <div className="empty-fields">
                <Sprout size={48} />
                <h3>No fields added yet.</h3>
                <p>Add your first field to begin exploring climate data.</p>
                <button className="add-field-btn" onClick={addField}>
                  <Plus size={19} />
                  Add Your First Field
                </button>
              </div>
            ) : (
              <div className="fields-grid">
                {fields.map((field) => (
                  <article className="field-card" key={field.id}>
                    <div className="field-card-header">
                      <div>
                        <h3>{field.fieldName}</h3>
                        <p className="field-location">
                          <MapPin size={15} />
                          {Number(field.latitude).toFixed(4)},{" "}
                          {Number(field.longitude).toFixed(4)}
                        </p>
                      </div>
                      <button
                        className="delete-field-btn"
                        title="Delete Field"
                        onClick={() => deleteField(field.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="field-card-details">
                      <div>
                        <span>Field Area</span>
                        <strong>{field.area} ha</strong>
                      </div>
                      <div>
                        <span>Current Crop</span>
                        <strong>
                          {optionLabel(CROP_OPTIONS, field.crop)}
                        </strong>
                      </div>
                      <div>
                        <span>Irrigation</span>
                        <strong>
                          {optionLabel(
                            IRRIGATION_OPTIONS,
                            field.irrigation
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="field-card-actions">
                      <button
                        className="inspect-field-btn"
                        onClick={() => editField(field)}
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button
                        className="inspect-field-btn"
                        onClick={() => openPage(field, "/analysis")}
                      >
                        Field Analysis
                      </button>
                      <button
                        className="inspect-field-btn"
                        onClick={() => openPage(field, "/rotations")}
                      >
                        Rotation Planning
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
