import { BarChart3, Map } from "lucide-react";
import { toProperCase } from "../utils/helpers"; // Import the helper function

export default function Sidebar({
  activeView,
  setActiveView,
  activeDistrict,
  setActiveDistrict,
  alertColors,
}) {
  return (
    <div className="w-full md:w-64 bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Dashboard Views</h2>
      <ul className="space-y-2">
        <li>
          <button
            className={`flex items-center p-2 w-full rounded ${
              activeView === "cluster-prediction"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
            onClick={() => {
              setActiveView("cluster-prediction");
              setActiveDistrict(null); // Reset activeDistrict
            }}
          >
            <Map className="mr-2" size={18} />
            Cluster Prediction
          </button>
        </li>
        <li>
          <button
            className={`flex items-center p-2 w-full rounded ${
              activeView === "clusters"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
            onClick={() => {
              setActiveView("clusters");
              setActiveDistrict(null); // Reset activeDistrict
            }}
          >
            <Map className="mr-2" size={18} />
            Cluster Visualization
          </button>
        </li>
        <li>
          <button
            className={`flex items-center p-2 w-full rounded ${
              activeView === "trends"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
            onClick={() => {
              setActiveView("trends");
              setActiveDistrict(null); // Reset activeDistrict
            }}
          >
            <BarChart3 className="mr-2" size={18} />
            Incidence Trends
          </button>
        </li>
      </ul>

      {activeDistrict && (
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Cluster Detail</h2>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setActiveDistrict(null)}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mt-3 bg-blue-50 p-3 rounded">
            <h3 className="font-medium text-blue-800">
              {toProperCase(activeDistrict.district)}
            </h3>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="text-gray-600">Active Cases:</span>{" "}
                <span className="font-medium">
                  {activeDistrict.activeCases}
                </span>
              </p>
              <p>
                <span className="text-gray-600">New Cases:</span>{" "}
                <span className="font-medium">{activeDistrict.newCases}</span>
              </p>
              <p>
                <span className="text-gray-600">Total Cases:</span>{" "}
                <span className="font-medium">{activeDistrict.totalCases}</span>
              </p>
              <br></br>
              <p className="mt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    alertColors[activeDistrict.alert]
                  }`}
                >
                  {activeDistrict.alert}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
