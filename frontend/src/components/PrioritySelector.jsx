
function PrioritySelector({ waterWeight, setWaterWeight }) {
  const soilWeight = 100 - waterWeight;

  return (
    <div className="priority-card">
      <h2>Önceliklerini Belirle</h2>

      <p>
        Rotasyon değerlendirmesinde hangi kriter
        senin için daha önemli?
      </p>

      <div className="priority-item">
        <label>
          Su Yönetimi: %{waterWeight}
        </label>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={waterWeight}
        onChange={(e) =>
          setWaterWeight(Number(e.target.value))
        }
      />

      <div className="priority-item">
        <label>
          Toprak Sağlığı: %{soilWeight}
        </label>
      </div>

      <div className="priority-info">
        Toplam ağırlık: 100%
      </div>
    </div>
  );
}

export default PrioritySelector;
