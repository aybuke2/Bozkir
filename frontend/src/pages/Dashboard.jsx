
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Map,
  Sprout,
  Droplets,
  Activity,
  Plus
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";

function Dashboard() {
  const navigate = useNavigate();

  const [fields] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("bozkir_fields") || "[]"
      );
    } catch {
      return [];
    }
  });

  const totalArea = fields.reduce(
    (total, field) => total + Number(field.area || 0),
    0
  );

  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-content">

        <Navbar />

        <section className="welcome">

          <div>
            <h1>Hoş geldin!</h1>
            <p>
              Tarla verilerini incele ve rotasyonunu planla.
            </p>
          </div>

          <button onClick={() => navigate("/new-field")}>
            <Plus size={18} />
            Yeni Tarla Ekle
          </button>

        </section>

        {/* İstatistikler */}

        <section className="stats-grid">

          <StatCard
            title="Kayıtlı Tarlalar"
            value={fields.length}
            description="Toplam kayıt"
            icon={<Map />}
          />

          <StatCard
            title="Toplam Alan"
            value={`${totalArea.toLocaleString("tr-TR")} ha`}
            description="Kayıtlı tarla alanı"
            icon={<Sprout />}
          />

          <StatCard
            title="Ortalama Yağış"
            value="320 mm"
            description="Örnek yıllık veri"
            icon={<Droplets />}
          />

          <StatCard
            title="Analiz Sayısı"
            value="0"
            description="Tamamlanan analiz"
            icon={<Activity />}
          />

        </section>

        {/* Kayıtlı tarlalar */}

        <section className="fields-section">

          <div className="fields-header">
            <div>
              <h2>Tarlalarım</h2>
              <p>Kayıtlı arazilerine göz at.</p>
            </div>

            <button
              onClick={() => navigate("/new-field")}
            >
              Tüm Tarlaları Gör
            </button>
          </div>

          {fields.length === 0 ? (

            <div className="empty-fields">
              <Sprout size={40} />

              <h3>Henüz kayıtlı tarla yok.</h3>

              <p>İlk tarlanı ekleyerek başlayabilirsin.</p>

              <button
                onClick={() => navigate("/new-field")}
              >
                + Yeni Tarla Ekle
              </button>
            </div>

          ) : (

            <div className="fields-grid">

              {fields.slice(0, 3).map(field => (

                <div
                  className="field-card"
                  key={field.id}
                >

                  <h3>{field.fieldName}</h3>

                  <p>
                    Alan: {field.area} hektar
                  </p>

                  <p>
                    Mevcut ürün: {field.crop}
                  </p>

                  <p>
                    Sulama: {field.irrigation}
                  </p>

                  <button
                    onClick={() => navigate("/new-field")}
                  >
                    İncele
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

export default Dashboard;
