
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function TemperatureChart({ data = [] }) {
  const values = data
    .map((item) => ({
      month: MONTHS[Number(item.month) - 1],
      temperature: Number(item.temperature_c),
    }))
    .filter(
      (item) => item.month && Number.isFinite(item.temperature)
    );

  return (
    <div className="chart-card">
      <h3>Average Monthly Temperature</h3>
      <p>Historical monthly averages (°C)</p>

      {values.length === 0 ? (
        <p>No temperature data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={values}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis unit="°C" />
            <Tooltip />
            <Bar
              dataKey="temperature"
              name="Temperature"
              fill="#D49A43"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
