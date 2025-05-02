import React, { useState } from "react";
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

export default function TrendsView({ timeSeriesData, loading, error }) {
  const [activeMetric, setActiveMetric] = useState("cases");

  // Handle the case when data is loading
  if (loading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading incidence data...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Handle no data
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-bold">No Data Available</p>
          <p>No incidence rate data is currently available.</p>
        </div>
      </div>
    );
  }

  // Calculate trend analysis
  const calculateTrend = () => {
    // Ensure we have data points
    if (timeSeriesData.length < 2)
      return "Insufficient data for trend analysis.";

    // Find peak month and value
    let peakCases = { month: "", value: 0 };
    let peakIncidence = { month: "", value: 0 };

    timeSeriesData.forEach((data) => {
      if (data.cases > peakCases.value) {
        peakCases = { month: data.month, value: data.cases };
      }
      if (data.incidenceRate > peakIncidence.value) {
        peakIncidence = { month: data.month, value: data.incidenceRate };
      }
    });

    // Determine trend direction by looking at the whole dataset slope
    let casesTrend, rateTrend;

    // Simple calculation for trend direction (considering all data points)
    const firstHalf = timeSeriesData.slice(
      0,
      Math.ceil(timeSeriesData.length / 2)
    );
    const secondHalf = timeSeriesData.slice(
      Math.ceil(timeSeriesData.length / 2)
    );

    const firstHalfAvgCases =
      firstHalf.reduce((sum, item) => sum + item.cases, 0) / firstHalf.length;
    const secondHalfAvgCases =
      secondHalf.reduce((sum, item) => sum + item.cases, 0) / secondHalf.length;

    const firstHalfAvgRate =
      firstHalf.reduce((sum, item) => sum + item.incidenceRate, 0) /
      firstHalf.length;
    const secondHalfAvgRate =
      secondHalf.reduce((sum, item) => sum + item.incidenceRate, 0) /
      secondHalf.length;

    casesTrend =
      secondHalfAvgCases > firstHalfAvgCases
        ? "increasing"
        : secondHalfAvgCases < firstHalfAvgCases
        ? "decreasing"
        : "stable";

    rateTrend =
      secondHalfAvgRate > firstHalfAvgRate
        ? "increasing"
        : secondHalfAvgRate < firstHalfAvgRate
        ? "decreasing"
        : "stable";

    // Get the latest month's data for current status
    const latestData = timeSeriesData[timeSeriesData.length - 1];
    const incidenceRateFormatted = latestData.incidenceRate.toFixed(2);

    // Calculate the total cases for the year
    const totalCases = timeSeriesData.reduce(
      (sum, item) => sum + item.cases,
      0
    );

    return `For the year, dengue cases have shown an overall ${casesTrend} trend with a peak of ${peakCases.value.toLocaleString()} cases in ${
      peakCases.month
    }. 
    The incidence rate ${
      rateTrend === casesTrend
        ? "follows a similar pattern"
        : "shows a different pattern"
    }, 
    peaking at ${peakIncidence.value.toFixed(2)} per 1,000 population in ${
      peakIncidence.month
    }.
    A total of ${totalCases.toLocaleString()} cases have been recorded so far this year.
    The most recent data (${
      latestData.month
    }) shows ${latestData.cases.toLocaleString()} cases with an incidence rate of ${incidenceRateFormatted}.
    This ${casesTrend} pattern may be affected by seasonal factors or public health interventions.`;
  };

  const trendAnalysis = calculateTrend();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dengue Incidence Trends</h2>
        <div className="flex gap-2">
          <button
            className={`px-2 py-1 text-xs font-medium rounded ${
              activeMetric === "cases"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveMetric("cases")}
          >
            Cases
          </button>
          <button
            className={`px-2 py-1 text-xs font-medium rounded ${
              activeMetric === "incidenceRate"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveMetric("incidenceRate")}
          >
            Incidence Rate
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            {activeMetric === "cases" && (
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#2563EB"
                domain={[0, "auto"]}
                tickFormatter={(value) => value.toLocaleString()}
              />
            )}
            {activeMetric === "incidenceRate" && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6B7280"
                domain={[0, "auto"]}
                tickFormatter={(value) => value.toFixed(2)}
              />
            )}
            <Tooltip
              formatter={(value, name) => {
                if (name === "Cases") return value.toLocaleString();
                if (name === "Incidence Rate") return value.toFixed(2);
                return value;
              }}
            />
            <Legend />
            {activeMetric === "cases" && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cases"
                stroke="#2563EB"
                activeDot={{ r: 8 }}
                name="Cases"
                strokeWidth={2}
              />
            )}
            {activeMetric === "incidenceRate" && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="incidenceRate"
                stroke="#6B7280"
                name="Incidence Rate"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-medium mb-2">Trend Analysis</h3>
        <p className="text-sm text-gray-700">{trendAnalysis}</p>
      </div>
    </div>
  );
}
