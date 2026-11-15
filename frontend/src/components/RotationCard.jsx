
const CROP_NAMES = {
  wheat: "Wheat",
  barley: "Barley",
  chickpea: "Chickpea",
  lentil: "Lentil",
};

const OPTION_NAMES = {
  current: "Current Rotation",
  alternative_a: "Alternative A",
  alternative_b: "Alternative B",
};

function ScoreBar({ label, score }) {
  const value = Number(score) || 0;

  return (
    <>
      <div className="score-row">
        <span>{label}</span>
        <strong>{value.toFixed(1)}/100</strong>
      </div>
      <div className="score-bar">
        <div
          className="score-fill"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </>
  );
}

export default function RotationCard({ rotation }) {
  if (!rotation) return null;

  return (
    <article className="rotation-card">
      <h3>
        #{rotation.rank} — {OPTION_NAMES[rotation.option_id] || rotation.option_id}
      </h3>

      <p>
        {(rotation.rotation || [])
          .map((crop) => CROP_NAMES[crop] || crop)
          .join(" → ")}
      </p>

      <ScoreBar
        label="Water Screening"
        score={rotation.water_screening_score}
      />

      <ScoreBar
        label="Rotation Structure"
        score={rotation.structural_score}
      />

      <div className="overall-score">
        <span>Combined Prototype Score</span>
        <h2>{Number(rotation.combined_prototype_score).toFixed(1)}/100</h2>
      </div>

      <h4>Evaluation Details</h4>
      <ul>
        {(rotation.explanations || []).map((explanation, index) => (
          <li key={index}>{explanation}</li>
        ))}
      </ul>

      <small>
        These are screening indicators, not validated agricultural
        recommendations or measured soil health.
      </small>
    </article>
  );
}
