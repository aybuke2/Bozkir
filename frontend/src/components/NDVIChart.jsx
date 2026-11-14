
function NDVIChart({ value = 0.48 }) {
  return (
    <div className="chart-card">
      <h3>Bitki Örtüsü Göstergesi</h3>

      <div className="ndvi-value">
        {value.toFixed(2)}
      </div>

      <p>
        NDVI değeri, uydu görüntülerinden
        hesaplanan bitki örtüsü göstergesidir.
      </p>
    </div>
  );
}

export default NDVIChart;
