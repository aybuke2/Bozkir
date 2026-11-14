import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  MapPin,
  Pencil,
  Trash2,
  X,
  Sprout,
  Map
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import FieldMap from "../components/FieldMap";

const STORAGE_KEY = "bozkir_fields";

const emptyForm = {
  fieldName: "",
  area: "",
  crop: "Buğday",
  irrigation: "Kuru tarım"
};

function FieldSelection() {
  const navigate = useNavigate();

  // Kayıtlı tarlaları yükle
  const [fields, setFields] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [position, setPosition] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Her değişiklikte kayıtları sakla
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(fields)
    );
  }, [fields]);

  // Form alanlarını değiştir
  function handleChange(e) {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  // Yeni tarla formu
  function handleAddNew() {
    setFormData(emptyForm);
    setPosition(null);
    setEditingId(null);
    setShowForm(true);
  }

  // Tarla düzenleme formu
  function handleEdit(field) {
    setFormData({
      fieldName: field.fieldName,
      area: String(field.area),
      crop: field.crop,
      irrigation: field.irrigation
    });

    setPosition({
      lat: field.latitude,
      lng: field.longitude
    });

    setEditingId(field.id);
    setShowForm(true);
  }

  // Kaydet veya güncelle
  function handleSave(e) {
    e.preventDefault();

    if (!formData.fieldName.trim()) {
      alert("Lütfen tarla adını girin.");
      return;
    }

    if (
      !formData.area ||
      !Number.isFinite(Number(formData.area)) ||
      Number(formData.area) <= 0
    ) {
      alert("Lütfen geçerli bir tarla alanı girin.");
      return;
    }

    if (!position) {
      alert("Lütfen haritadan tarla konumunu seçin.");
      return;
    }

    const fieldData = {
      ...formData,
      fieldName: formData.fieldName.trim(),
      area: Number(formData.area),
      latitude: position.lat,
      longitude: position.lng
    };

    if (editingId !== null) {
      // Var olan tarlayı güncelle
      setFields(prev =>
        prev.map(field =>
          field.id === editingId
            ? { ...field, ...fieldData }
            : field
        )
      );

      alert("Tarla bilgileri güncellendi!");
    } else {
      // Yeni tarla ekle
      const newField = {
        id: globalThis.crypto?.randomUUID
          ? globalThis.crypto.randomUUID()
          : Date.now(),
        ...fieldData
      };

      setFields(prev => [...prev, newField]);

      alert("Tarla başarıyla kaydedildi!");
    }

    closeForm();
  }

  // Seçilen tarlanın karnesini aç
  function handleViewAnalysis(field) {
    localStorage.setItem(
      "selectedField",
      JSON.stringify(field)
    );

    navigate("/analysis");
  }

  // Tarla sil
  function handleDelete(id) {
    const confirmed = window.confirm(
      "Bu tarlayı silmek istediğinize emin misiniz?"
    );

    if (!confirmed) return;

    setFields(prev =>
      prev.filter(field => field.id !== id)
    );

    if (editingId === id) {
      closeForm();
    }
  }

  // Formu kapat
  function closeForm() {
    setFormData(emptyForm);
    setPosition(null);
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">

        {/* Sayfa başlığı */}
        <section className="fields-page-header">
          <div>
            <h1>Tarlalarım</h1>
            <p>
              Kayıtlı arazilerini görüntüle, yeni tarla ekle
              veya mevcut bilgilerini düzenle.
            </p>
          </div>

          {!showForm && (
            <button
              className="add-field-btn"
              onClick={handleAddNew}
            >
              <Plus size={20} />
              Yeni Tarla Ekle
            </button>
          )}
        </section>

        {/* Tarla ekleme / düzenleme alanı */}
        {showForm && (
          <section className="field-form-section">

            <div className="form-header">
              <div>
                <h2>
                  {editingId !== null
                    ? "Tarla Bilgilerini Düzenle"
                    : "Yeni Tarla Ekle"}
                </h2>

                <p>
                  Tarla bilgilerini doldur ve haritadan konum seç.
                </p>
              </div>

              <button
                type="button"
                className="close-btn"
                onClick={closeForm}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSave}>

              <div className="field-form-grid">

                <div className="form-group">
                  <label>Tarla Adı</label>

                  <input
                    name="fieldName"
                    value={formData.fieldName}
                    onChange={handleChange}
                    placeholder="Örn: Konya Pilot Tarla"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tarla Alanı (Hektar)</label>

                  <input
                    type="number"
                    name="area"
                    min="0.01"
                    step="any"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Örn: 10"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mevcut Ürün</label>

                  <select
                    name="crop"
                    value={formData.crop}
                    onChange={handleChange}
                  >
                    <option>Buğday</option>
                    <option>Arpa</option>
                    <option>Mercimek</option>
                    <option>Nohut</option>
                    <option>Nadas</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Sulama Durumu</label>

                  <select
                    name="irrigation"
                    value={formData.irrigation}
                    onChange={handleChange}
                  >
                    <option>Kuru tarım</option>
                    <option>Sulu tarım</option>
                  </select>
                </div>

              </div>

              {/* Harita */}
              <div className="field-map-section">
                <h3>
                  <MapPin size={19} />
                  Tarla Konumu
                </h3>

                <p>
                  Haritaya tıklayarak tarlanın konumunu belirle.
                  Düzenleme yaparken mevcut konumu değiştirebilirsin.
                </p>

                <FieldMap
                  position={position}
                  setPosition={setPosition}
                />

                {position && (
                  <div className="selected-position">
                    <span>
                      Enlem: {position.lat.toFixed(5)}
                    </span>

                    <span>
                      Boylam: {position.lng.toFixed(5)}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeForm}
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="save-field-btn"
                >
                  {editingId !== null
                    ? "Değişiklikleri Kaydet"
                    : "Tarlayı Kaydet"}
                </button>
              </div>

            </form>
          </section>
        )}

        {/* Kayıtlı tarlalar */}
        {!showForm && (
          <section className="my-fields-section">

            <div className="my-fields-title">
              <div>
                <h2>Kayıtlı Tarlalar</h2>
                <p>
                  Toplam {fields.length} tarla kayıtlı.
                </p>
              </div>

              <div className="field-count">
                {fields.length} Tarla
              </div>
            </div>

            {fields.length === 0 ? (

              <div className="empty-fields">
                <Sprout size={48} />

                <h3>Henüz tarla eklemedin.</h3>

                <p>
                  İlk tarlanı ekleyerek tarım yönetimine başlayabilirsin.
                </p>

                <button
                  className="add-field-btn"
                  onClick={handleAddNew}
                >
                  <Plus size={19} />
                  İlk Tarlanı Ekle
                </button>
              </div>

            ) : (

              <div className="fields-grid">

                {fields.map(field => (

                  <article
                    className="field-card"
                    key={field.id}
                  >

                    <div className="field-card-header">
                      <div>
                        <h3>{field.fieldName}</h3>

                        <p className="field-location">
                          <MapPin size={15} />
                          {Number(field.latitude).toFixed(4)},
                          {" "}
                          {Number(field.longitude).toFixed(4)}
                        </p>
                      </div>

                      <button
                        className="delete-field-btn"
                        title="Tarlayı Sil"
                        onClick={() => handleDelete(field.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="field-card-details">

                      <div>
                        <span>Tarla Alanı</span>
                        <strong>{field.area} ha</strong>
                      </div>

                      <div>
                        <span>Mevcut Ürün</span>
                        <strong>{field.crop}</strong>
                      </div>

                      <div>
                        <span>Sulama</span>
                        <strong>{field.irrigation}</strong>
                      </div>

                    </div>

                    {/* Düzenle ve tarla karnesi butonları */}
                    <div className="field-card-actions">

                      <button
                        className="inspect-field-btn"
                        onClick={() => handleEdit(field)}
                      >
                        <Pencil size={16} />
                        Düzenle
                      </button>

                      <button
                        className="inspect-field-btn"
                        onClick={() => handleViewAnalysis(field)}
                      >
                        <Sprout size={16} />
                        Tarla Karnesi
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

export default FieldSelection;