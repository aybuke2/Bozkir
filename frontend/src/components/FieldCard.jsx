function FieldCard({ title, area, crop, onInspect }) {
  return (
    <div className="field-card">
      <h3>{title}</h3>
      <p>Alan: {area}</p>
      <p>Mevcut ürün: {crop}</p>
      <button onClick={onInspect}>
        İncele
      </button>
    </div>
  );
}

export default FieldCard;