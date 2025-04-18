import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function TrendsView({ timeSeriesData }) {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dengue Incidence Trends</h2>
        <div className="flex gap-2">
          <button className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
            Cases
          </button>
          <button className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
            Incidence Rate
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" orientation="left" stroke="#2563EB" />
            <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cases"
              stroke="#2563EB"
              activeDot={{ r: 8 }}
              name="Cases"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="incidenceRate"
              stroke="#6B7280"
              name="Incidence Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-medium mb-2">Trend Analysis</h3>
        <p className="text-sm text-gray-700">
          Dengue cases have shown a steady increase from January to May, with a
          peak of 52 cases in May. The incidence rate follows a similar pattern,
          peaking at 7.8 per 1,000 population. June and July show a declining
          trend, suggesting seasonal patterns or effective intervention
          measures.
        </p>
      </div>
    </div>
  );
}
