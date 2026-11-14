
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const temperatureData = [
  { month: "Oca", temperature: 2 },
  { month: "Şub", temperature: 4 },
  { month: "Mar", temperature: 8 },
  { month: "Nis", temperature: 13 },
  { month: "May", temperature: 18 },
  { month: "Haz", temperature: 23 },
  { month: "Tem", temperature: 26 },
  { month: "Ağu", temperature: 25 },
  { month: "Eyl", temperature: 20 },
  { month: "Eki", temperature: 14 },
  { month: "Kas", temperature: 8 },
  { month: "Ara", temperature: 3 }
];

function TemperatureChart() {
  return (
    <div className="chart-card">
      <h3>Aylık Ortalama Sıcaklık</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={temperatureData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis unit="°C" />

          <Tooltip />

          <Bar
            dataKey="temperature"
            fill="#D49A43"
            name="Sıcaklık"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TemperatureChart;
