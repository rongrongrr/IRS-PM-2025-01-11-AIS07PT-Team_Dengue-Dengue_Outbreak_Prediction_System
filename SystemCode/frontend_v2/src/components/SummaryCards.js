import { AlertCircle, BarChart3, Map } from "lucide-react";

export default function SummaryCards({ summaryCardsInfo }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
      {/* Total Active Cases */}
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
      </div>

      {/* Average Incidence Rate */}
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

      {/* Active Clusters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between">
          <h3 className="text-gray-500 text-sm font-medium">Active Clusters</h3>
          <Map size={18} className="text-blue-500" />
        </div>
        <p className="text-2xl font-bold mt-2">
          {summaryCardsInfo.activeClusters.total}
        </p>
      </div>

      {/* Highest Case Cluster */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between">
          <h3 className="text-gray-500 text-sm font-medium">
            Active Cluster with Highest Number of Cases
          </h3>
          <AlertCircle size={18} className="text-blue-500" />
        </div>
        <p className="text-sm mt-1">
          <span className="font-bold">Location:</span>{" "}
          {summaryCardsInfo.highestCaseCluster.street_address || "N/A"}
        </p>
        <p className="text-sm mt-1">
          <span className="font-bold">Cases:</span>{" "}
          {summaryCardsInfo.highestCaseCluster.number_of_cases || 0}
        </p>
      </div>
    </div>
  );
}
