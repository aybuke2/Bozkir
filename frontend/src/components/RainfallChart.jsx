
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CloudRain } from "lucide-react";

export default function RainfallChart({ data = [] }) {
  const chartData = (Array.isArray(data) ? data : [])
    .map((item) => ({
      year: String(item.year ?? ""),
      rainfall: Number(
        item.rainfall_mm ??
        item.total_rainfall_mm ??
        item.precipitation_mm ??
        0
      ),
    }))
    .filter(
      (item) =>
        item.year &&
        Number.isFinite(item.rainfall)
    );

  return (
    <section className="chart-card">
      <div className="bozkir-chart-heading">
        <span className="bozkir-chart-icon">
          <CloudRain size={22} />
        </span>
        <div>
          <h3>Historical Annual Rainfall</h3>
          <p>Annual precipitation totals (mm)</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p>No rainfall data available.</p>
      ) : (
        <div className="bozkir-chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e6ece5"
              />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={45}
                unit=" mm"
              />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(2)} mm`,
                  "Rainfall",
                ]}
              />
              <Bar
                dataKey="rainfall"
                fill="#4c8a60"
                radius={[5, 5, 0, 0]}
                maxBarSize={34}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
