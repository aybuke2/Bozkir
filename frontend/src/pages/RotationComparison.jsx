
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import PrioritySelector from "../components/PrioritySelector";
import RotationCard from "../components/RotationCard";

import { rotationData } from "../data/rotationData";

function RotationComparison() {

  const [waterWeight, setWaterWeight] = useState(50);

  function handleCompare() {

    const preferences = {
      waterWeight: waterWeight / 100,
      soilWeight: (100 - waterWeight) / 100
    };

    console.log("Çiftçi öncelikleri:", preferences);

    alert("Karşılaştırma isteği hazırlandı!");
  }

  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-content">

        <Navbar />

        <h1>Rotasyon Karşılaştırması</h1>

        <p>
          Farklı ürün rotasyonlarını çevresel
          koşullara göre karşılaştır.
        </p>

        <PrioritySelector
          waterWeight={waterWeight}
          setWaterWeight={setWaterWeight}
        />

        <button onClick={handleCompare}>
          Önceliklerimi Kaydet
        </button>

        <h2 className="section-heading">
          Rotasyon Seçenekleri
        </h2>

        <div className="rotation-grid">

          {rotationData.map((rotation) => (
            <RotationCard
              key={rotation.id}
              rotation={rotation}
            />
          ))}

        </div>

      </main>

    </div>
  );
}

export default RotationComparison;
