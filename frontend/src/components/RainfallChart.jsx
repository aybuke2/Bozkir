
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function RainfallChart({ data = [] }) {
  const values = data
    .map((item) => ({
      year: String(item.year),
      rainfall: Number(item.rainfall_mm),
    }))
    .filter((item) => Number.isFinite(item.rainfall));

  return (
    <div className="chart-card">
      <h3>Historical Annual Rainfall</h3>
      <p>Annual precipitation (mm)</p>

      {values.length === 0 ? (
        <p>No rainfall data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={values}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis unit=" mm" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="rainfall"
              name="Rainfall"
              stroke="#286443"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
