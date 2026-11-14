
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const rainfallData = [
  { year: "2019", rainfall: 310 },
  { year: "2020", rainfall: 280 },
  { year: "2021", rainfall: 260 },
  { year: "2022", rainfall: 340 },
  { year: "2023", rainfall: 295 },
  { year: "2024", rainfall: 320 }
];

function RainfallChart({ data = rainfallData }) {
  return (
    <div className="chart-card">
      <h3>Yıllık Yağış Değişimi</h3>
      <p>Yıllık toplam yağış (mm)</p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="year" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="rainfall"
            stroke="#286443"
            strokeWidth={3}
            name="Yağış"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RainfallChart;
