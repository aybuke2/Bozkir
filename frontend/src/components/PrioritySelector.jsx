
const OPTIONS = [
  {
    value: "balanced",
    label: "Balanced",
    description: "50% rotation structure, 50% water screening",
  },
  {
    value: "water",
    label: "Water Priority",
    description: "30% rotation structure, 70% water screening",
  },
  {
    value: "soil",
    label: "Rotation Diversity Priority",
    description: "70% rotation structure, 30% water screening",
  },
];

export default function PrioritySelector({ priority, setPriority }) {
  return (
    <section className="priority-card">
      <h2>Evaluation Priorities</h2>
      <p>Choose what matters most in your comparison.</p>

      <div className="priority-item">
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className="priority-info">
        {OPTIONS.find((option) => option.value === priority)?.description}
      </p>

      <small>
        Rotation diversity is a structural indicator, not a measured
        soil health value.
      </small>
    </section>
  );
}
