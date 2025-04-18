import { AlertCircle, BarChart3, Calendar, Map } from "lucide-react";

export default function SummaryCards({ summaryCardsInfo }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between">
          <h3 className="text-gray-500 text-sm font-medium">
            Total Active Cases
          </h3>
          <AlertCircle size={18} className="text-blue-500" />
        </div>
        <p className="text-2xl font-bold mt-2">
          {summaryCardsInfo.totalActiveCases}
        </p>
        <p
          className={`text-sm mt-1 ${
            summaryCardsInfo.newCases > 0 ? "text-red-500" : "text-green-500"
          }`}
        >
          {summaryCardsInfo.newCases > 0 ? "↑" : "↓"}{" "}
          {Math.abs(summaryCardsInfo.newCases)} from previous week
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between">
          <h3 className="text-gray-500 text-sm font-medium">
            Average Incidence Rate
          </h3>
          <BarChart3 size={18} className="text-blue-500" />
        </div>
        <p className="text-2xl font-bold mt-2">
          {summaryCardsInfo.averageIncidenceRate}
        </p>
        <p className="text-sm text-gray-500 mt-1">per 1,000 population</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between">
          <h3 className="text-gray-500 text-sm font-medium">Active Clusters</h3>
          <Map size={18} className="text-blue-500" />
        </div>
        <p className="text-2xl font-bold mt-2">
          {summaryCardsInfo.activeClusters.total}
        </p>
        <p className="text-sm mt-1">
          <span className="text-red-600">
            {summaryCardsInfo.activeClusters.critical} critical
          </span>
          ,{" "}
          <span className="text-amber-600">
            {summaryCardsInfo.activeClusters.warning} warning
          </span>
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between">
          <h3 className="text-gray-500 text-sm font-medium">
            Weekly New Cases
          </h3>
          <Calendar size={18} className="text-blue-500" />
        </div>
        <p className="text-2xl font-bold mt-2">
          {summaryCardsInfo.weeklyNewCases}
        </p>
        <p
          className={`text-sm mt-1 ${
            summaryCardsInfo.weeklyChange > 0
              ? "text-red-500"
              : "text-green-500"
          }`}
        >
          {summaryCardsInfo.weeklyChange > 0 ? "↑" : "↓"}{" "}
          {Math.abs(summaryCardsInfo.weeklyChange)}% from previous week
        </p>
      </div>
    </div>
  );
}
