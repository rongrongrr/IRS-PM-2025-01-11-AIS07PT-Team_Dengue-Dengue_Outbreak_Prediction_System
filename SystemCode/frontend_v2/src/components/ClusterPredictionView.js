import { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { fetchPrediction } from "../utils/api"; // Import the reusable function

export default function ClusterPredictionView() {
  const [postalCode, setPostalCode] = useState("");
  const [searchedPostalCode, setSearchedPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // Add result state for prediction data

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchPrediction(postalCode, setLoading, setError, setResult);
    setSearchedPostalCode(postalCode); // Update the searched postal code
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dengue Cluster Prediction</h2>
      </div>

      <div className="flex flex-col md:flex-row-reverse gap-4">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white p-4 shadow-md rounded">
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="mb-3">
              <label
                htmlFor="postalCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Postal Code
              </label>
              <input
                type="text"
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Enter postal code"
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex justify-center items-center"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : null}
              {loading ? "Loading..." : "Search"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div>
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-800">
                  Location Information
                </h3>
                {result.street_address &&
                  result.street_address.trim() !== "" &&
                  result.street_address !== "Unknown" && (
                    <p className="text-sm text-gray-700">
                      Street Address: {result.street_address}
                    </p>
                  )}
                <br></br>
                <p className="text-sm text-gray-700">
                  Land Use Category:{" "}
                  {result.location_info.landuse_type
                    .toLowerCase()
                    .replace(/\b\w/g, (char) => char.toUpperCase()) + " Area"}
                </p>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium text-blue-800">
                  Prediction Results
                </h3>
                <p className="text-sm text-blue-700">
                  Risk Level:{" "}
                  <span
                    style={{
                      color:
                        result.risk_level === "High"
                          ? "red"
                          : result.risk_level === "Medium"
                          ? "orange"
                          : "green",
                      fontWeight: "bold",
                    }}
                  >
                    {result.risk_level}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-grow bg-white p-4 shadow-md rounded">
          {result?.map_file ? (
            <>
              <iframe
                src={`http://localhost:8000/${result.map_file}`} // Ensure result.map_file contains "static/risk_map_560234.html"
                title="Risk Map"
                className="w-full h-96 border rounded"
              ></iframe>
            </>
          ) : (
            <p className="text-gray-500 text-sm">
              Enter a postal code and click "Search" to view the risk map.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
