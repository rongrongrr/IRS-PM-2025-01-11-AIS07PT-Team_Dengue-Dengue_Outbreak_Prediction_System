import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function ClusterPredictionView() {
  const [postcode, setPostcode] = useState("120000");
  const [searchedPostcode, setSearchedPostcode] = useState("120000");
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [showLegend, setShowLegend] = useState(true);

  // Dummy data for our visualization
  const dummyAreaData = [
    {
      id: 1,
      name: "Queenstown",
      postcode: "120000",
      incidenceRate: 65,
      cases: 35,
      risk: "High",
      position: [1.2998, 103.7862], // lat, lng
    },
    {
      id: 2,
      name: "Commonwealth",
      postcode: "120001",
      incidenceRate: 25,
      cases: 12,
      risk: "Low",
      position: [1.3025, 103.7925],
    },
    {
      id: 3,
      name: "Buona Vista",
      postcode: "120002",
      incidenceRate: 45,
      cases: 22,
      risk: "Medium",
      position: [1.3071, 103.7899],
    },
    {
      id: 4,
      name: "Dover",
      postcode: "120003",
      incidenceRate: 18,
      cases: 8,
      risk: "Low",
      position: [1.3118, 103.7775],
    },
    {
      id: 5,
      name: "Clementi",
      postcode: "120004",
      incidenceRate: 72,
      cases: 41,
      risk: "Very High",
      position: [1.3143, 103.7652],
    },
  ];

  // Initialize selectedArea if null
  useEffect(() => {
    if (selectedArea === null) {
      setSelectedArea(
        dummyAreaData.find((area) => area.postcode === postcode) ||
          dummyAreaData[0]
      );
    }
  }, []);

  // Initialize the map when the component mounts
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Create the map instance
      mapRef.current = L.map(mapContainerRef.current).setView(
        [1.3055, 103.7825],
        14
      );

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Add initial markers
      updateMapMarkers();
    }

    // Return a cleanup function to destroy the map when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when selectedArea changes
  useEffect(() => {
    updateMapMarkers();
  }, [selectedArea]);

  // Function to update map markers
  const updateMapMarkers = () => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        mapRef.current.removeLayer(layer);
      }
    });

    // Add markers for each area
    dummyAreaData.forEach((area) => {
      // Get color based on incidence rate
      const colorHex = getColorHexForRate(area.incidenceRate);

      // Create circle marker with radius based on case count
      const marker = L.circleMarker(area.position, {
        radius: Math.max(8, Math.sqrt(area.cases) * 2),
        fillColor: colorHex,
        color: "#1e40af",
        weight: area.id === selectedArea?.id ? 3 : 1,
        opacity: 1,
        fillOpacity: area.id === selectedArea?.id ? 0.8 : 0.6,
      }).addTo(mapRef.current);

      // Add popup with info
      marker.bindPopup(`
        <strong>${area.name}</strong><br>
        Postcode: ${area.postcode}<br>
        Cases: ${area.cases}<br>
        Incidence Rate: ${area.incidenceRate}<br>
        Risk Level: ${area.risk}
      `);

      // Add click handler
      marker.on("click", () => {
        selectArea(area);
      });
    });

    // If there is a selected area, pan to it
    if (selectedArea) {
      const area = dummyAreaData.find((a) => a.id === selectedArea.id);
      if (area) {
        mapRef.current.setView(area.position, 15);
      }
    }
  };

  const handlePostcodeChange = (e) => {
    setPostcode(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call with slight delay
    setTimeout(() => {
      setSearchedPostcode(postcode);
      // Find matching area or default to first one
      const matchingArea =
        dummyAreaData.find((area) => area.postcode === postcode) ||
        dummyAreaData[0];
      setSelectedArea(matchingArea);
      setLoading(false);
    }, 800);
  };

  const selectArea = (area) => {
    setSelectedArea(area);
    setPostcode(area.postcode);
    setSearchedPostcode(area.postcode);
  };

  // Helper function to determine color class based on incidence rate
  const getColorForRate = (rate) => {
    if (rate < 10) return "bg-yellow-100";
    if (rate < 30) return "bg-yellow-300";
    if (rate < 50) return "bg-orange-300";
    if (rate < 70) return "bg-orange-500";
    return "bg-red-500";
  };

  // Helper function to get actual color hex values based on incidence rate
  const getColorHexForRate = (rate) => {
    if (rate < 10) return "#fef9c3"; // yellow-100
    if (rate < 30) return "#fde047"; // yellow-300
    if (rate < 50) return "#fdba74"; // orange-300
    if (rate < 70) return "#f97316"; // orange-500
    return "#ef4444"; // red-500
  };

  const toggleLegend = () => {
    setShowLegend((prev) => !prev);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dengue Cluster Prediction</h2>
      </div>

      <div className="flex flex-col md:flex-row-reverse gap-4">
        {/* Left sidebar with search and stats */}
        <div className="w-full md:w-64 bg-white p-4 shadow-md rounded">
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="mb-3">
              <label
                htmlFor="postcode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Postcode
              </label>
              <input
                type="text"
                id="postcode"
                value={postcode}
                onChange={handlePostcodeChange}
                placeholder="Enter postcode"
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

          {searchedPostcode && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
              <h3 className="font-medium text-blue-800">Current View</h3>
              <p className="text-sm text-blue-700">
                Postcode: {searchedPostcode}
              </p>
              {selectedArea && (
                <p className="text-sm text-blue-700">
                  Area: {selectedArea.name}
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-medium mb-2">Statistics</h3>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Total Cases:</span>
              <span className="font-medium">118</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Active Clusters:</span>
              <span className="font-medium">5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg. Incidence Rate:</span>
              <span className="font-medium">45.0</span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6">
            <h3 className="font-medium mb-2 flex justify-between items-center">
              <span>Dengue Incidence Rate</span>
              <button
                onClick={toggleLegend}
                className="text-blue-500 text-xs hover:text-blue-700"
              >
                {showLegend ? "Hide" : "Show"}
              </button>
            </h3>

            {showLegend && (
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-100 mr-2"></div>
                  <span className="text-xs">0-10: Very Low</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-300 mr-2"></div>
                  <span className="text-xs">10-30: Low</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-300 mr-2"></div>
                  <span className="text-xs">30-50: Moderate</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 mr-2"></div>
                  <span className="text-xs">50-70: High</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 mr-2"></div>
                  <span className="text-xs">70-100: Very High</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main visualization area */}
        <div className="flex-grow">
          {loading ? (
            <div className="h-96 flex items-center justify-center bg-white rounded shadow-md">
              <div className="flex items-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-4"></div>
                <p className="text-lg">Loading map data...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Map visualization with Leaflet */}
              <div className="bg-white rounded shadow-md p-4">
                <h2 className="text-lg font-medium mb-4">
                  {selectedArea
                    ? `Dengue Map - ${selectedArea.name}`
                    : "Dengue Map"}
                </h2>

                {/* Leaflet map container */}
                <div
                  ref={mapContainerRef}
                  className="h-96 bg-blue-50 border border-blue-100 rounded overflow-hidden"
                ></div>
              </div>

              {/* Area details */}
              {selectedArea && (
                <div className="bg-white rounded shadow-md p-4">
                  <h3 className="font-medium text-lg border-b pb-2 mb-3">
                    Details - {selectedArea.name}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">General Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Postcode:</span>
                          <span className="font-medium">
                            {selectedArea.postcode}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Risk Level:</span>
                          <span
                            className={`font-medium ${
                              selectedArea.risk === "Low"
                                ? "text-yellow-500"
                                : selectedArea.risk === "Medium"
                                ? "text-orange-400"
                                : selectedArea.risk === "High"
                                ? "text-red-500"
                                : "text-red-700"
                            }`}
                          >
                            {selectedArea.risk}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="font-medium">April 18, 2025</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Dengue Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active Cases:</span>
                          <span className="font-medium">
                            {selectedArea.cases}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Incidence Rate:</span>
                          <span className="font-medium">
                            {selectedArea.incidenceRate} per 100,000
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Week-over-week:</span>
                          <span className="font-medium text-red-500">+12%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white rounded shadow-md p-4 mt-4">
        <h3 className="font-medium text-lg mb-3">All Areas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Postcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incidence Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dummyAreaData.map((area) => (
                <tr
                  key={area.id}
                  className={`cursor-pointer hover:bg-blue-50 ${
                    selectedArea && area.id === selectedArea.id
                      ? "bg-blue-100"
                      : ""
                  }`}
                  onClick={() => selectArea(area)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {area.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {area.postcode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {area.cases}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {area.incidenceRate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        area.risk === "Low"
                          ? "bg-yellow-100 text-yellow-800"
                          : area.risk === "Medium"
                          ? "bg-orange-100 text-orange-800"
                          : area.risk === "High"
                          ? "bg-red-100 text-red-800"
                          : "bg-red-100 text-red-900"
                      }`}
                    >
                      {area.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
