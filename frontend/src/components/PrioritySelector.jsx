
import { SlidersHorizontal, Info, Scale } from "lucide-react";

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

export default function PrioritySelector({
  priority,
  setPriority,
}) {
  const selectedOption = OPTIONS.find(
    (option) => option.value === priority
  );

  return (
    <section className="priority-card bozkir-priority-panel">
      <div className="bozkir-panel-header">
        <div className="bozkir-panel-icon bozkir-panel-icon-gold">
          <SlidersHorizontal size={25} />
        </div>

        <div>
          <h2>Evaluation Priorities</h2>
          <p>Choose what matters most in your comparison.</p>
        </div>
      </div>

      <div className="bozkir-priority-content">
        <div className="priority-item">
          <label htmlFor="priority">Priority</label>

          <select
            id="priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
          >
            {OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bozkir-priority-illustration" aria-hidden="true">
          <Scale size={54} strokeWidth={1.5} />
        </div>
      </div>

      <div className="bozkir-priority-info">
        <Info size={18} />
        <span>{selectedOption?.description}</span>
      </div>

      <small>
        Rotation diversity is a structural indicator,
        not a measured soil health value.
      </small>
    </section>
  );
}
