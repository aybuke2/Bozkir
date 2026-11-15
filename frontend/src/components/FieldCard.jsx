
export default function FieldCard({
  title, area, crop, onInspect,
}) {
  return (
    <div className="field-card">
      <h3>{title}</h3>
      <p>Area: {area}</p>
      <p>Current Crop: {crop}</p>
      <button type="button" onClick={onInspect}>
        View Field
      </button>
    </div>
  );
}
