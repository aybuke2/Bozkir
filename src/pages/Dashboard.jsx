
import { useNavigate } from "react-router-dom";
import { Map, Sprout, Droplets, Activity } from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        <section className="welcome">
          <div>
            <h1>Hoş geldin!</h1>
            <p>Tarla verilerini incele ve rotasyonunu planla.</p>
          </div>

          <button onClick={() => navigate("/new-field")}>
            + Yeni Tarla Ekle
          </button>
        </section>

        <section className="stats-grid">
          <StatCard
            title="Kayıtlı Tarlalar"
            value="3"
            description="Toplam kayıt"
            icon={<Map />}
          />

          <StatCard
            title="Toplam Alan"
            value="45 ha"
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
            value="8"
            description="Tamamlanan analiz"
            icon={<Activity />}
          />
        </section>

        <section className="fields-section">
          <h2>Tarlalarım</h2>

          <div className="field-card">
            <h3>Konya - Pilot Tarla</h3>
            <p>Alan: 10 hektar</p>
            <p>Mevcut ürün: Buğday</p>
            <button onClick={() => navigate("/new-field")}>
              İncele
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
