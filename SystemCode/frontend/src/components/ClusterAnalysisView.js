import { Filter, Info, Map as MapIcon } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function ClusterAnalysisView({
  dengueData,
  activeDistrict,
  handleRowClick,
  alertColors,
}) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [legend, setLegend] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Initialize the map when the component mounts
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Create the map instance
      mapRef.current = L.map(mapContainerRef.current).setView(
        [1.3521, 103.8198],
        12
      );

      // Add base map tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Return a cleanup function to destroy the map when component unmounts
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []);

  // Helper function to extract the actual color from Tailwind classes
  const extractColorFromTailwindClass = (className) => {
    // Default fallback colors in case we can't parse the class
    const fallbackColors = {
      High: "#EF4444", // red-500
      Medium: "#F59E0B", // amber-500
      Low: "#10B981", // green-500
      default: "#3B82F6", // blue-500
    };

    // This is a simplification - in a real app you might want a more robust approach
    // based on how your alertColors are structured
    if (className.includes("bg-red")) return "#EF4444";
    if (className.includes("bg-amber")) return "#F59E0B";
    if (className.includes("bg-yellow")) return "#F59E0B";
    if (className.includes("bg-green")) return "#10B981";
    if (className.includes("bg-blue")) return "#3B82F6";

    // Return the fallback color if we can't determine it from the class
    return fallbackColors.default;
  };

  // Update the map when dengueData changes
  useEffect(() => {
    if (mapRef.current && dengueData && dengueData.length > 0) {
      // Clear existing GeoJSON layers
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.GeoJSON) {
          mapRef.current.removeLayer(layer);
        }
      });

      // Create GeoJSON features from dengueData
      const features = dengueData.map((district) => {
        // In a real app, you would have accurate polygon or point geometries for each district
        // This is a simplified example using random points near Singapore
        const lat = 1.3521 + (Math.random() - 0.5) * 0.1;
        const lng = 103.8198 + (Math.random() - 0.5) * 0.1;

        return {
          type: "Feature",
          properties: {
            id: district.id,
            district: district.district,
            activeCases: district.activeCases,
            newCases: district.newCases,
            incidenceRate: district.incidenceRate,
            alert: district.alert,
            alertColorClass: alertColors[district.alert],
          },
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        };
      });

      const geoJsonData = {
        type: "FeatureCollection",
        features: features,
      };

      // Add the GeoJSON layer to the map
      L.geoJSON(geoJsonData, {
        pointToLayer: (feature, latlng) => {
          // Get color from alertColors using the same mapping as the table
          const alertLevel = feature.properties.alert;
          const alertColorClass = feature.properties.alertColorClass;

          // Extract color from Tailwind class
          const color = extractColorFromTailwindClass(alertColorClass);

          // Scale marker size based on active cases
          const radius = 5 + Math.sqrt(feature.properties.activeCases) * 0.5;

          return L.circleMarker(latlng, {
            radius: radius,
            fillColor: color,
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
          });
        },
        onEachFeature: (feature, layer) => {
          // Add popup with district information
          layer.bindPopup(`
            <div class="font-medium">${feature.properties.district}</div>
            <div>Active Cases: ${feature.properties.activeCases}</div>
            <div>New Cases: ${feature.properties.newCases}</div>
            <div>Incidence Rate: ${feature.properties.incidenceRate.toFixed(
              1
            )}</div>
            <div>Alert Level: ${feature.properties.alert}</div>
          `);

          // Highlight district when clicked
          layer.on({
            click: () => {
              const district = dengueData.find(
                (d) => d.id === feature.properties.id
              );
              if (district) handleRowClick(district);
            },
          });
        },
      }).addTo(mapRef.current);

      // Fit map bounds to GeoJSON data
      mapRef.current.fitBounds(L.geoJSON(geoJsonData).getBounds(), {
        padding: [30, 30],
      });
    }
  }, [dengueData, handleRowClick, alertColors]);

  // Update highlighted district on activeDistrict change
  useEffect(() => {
    if (mapRef.current && activeDistrict) {
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.GeoJSON) {
          layer.eachLayer((featureLayer) => {
            const properties = featureLayer.feature.properties;
            if (properties.id === activeDistrict.id) {
              featureLayer.openPopup();
              // Ensure it's visible - pan to this location
              mapRef.current.panTo(featureLayer.getLatLng());
            }
          });
        }
      });
    }
  }, [activeDistrict]);

  const toggleLegend = () => {
    console.log("Toggling legend");
    setLegend((prev) => !prev);
  };

  // Generate legend items dynamically from alertColors
  const legendItems = Object.entries(alertColors).map(([alert, colorClass]) => {
    const color = extractColorFromTailwindClass(colorClass);
    return { alert, color };
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dengue Cluster Analysis</h2>
        <div className="flex items-center">
          <button
            className="flex items-center text-sm text-gray-600 hover:text-blue-700"
            onClick={() => setShowFilterModal(true)}
          >
            <Filter size={16} className="mr-1" />
            Filter
          </button>
          <button
            className="flex items-center ml-4 text-sm text-gray-600 hover:text-blue-700"
            onClick={toggleLegend}
          >
            <Info size={16} className="mr-1" />
            Legend
          </button>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-64 rounded mb-4 border border-gray-200"
        ></div>
        {/* Filter */}
        {showFilterModal && (
          <div
            style={{
              zIndex: 999, // Ensure it's above the map
            }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white p-4 rounded shadow-lg max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4">Filter Options</h3>
              <div className="space-y-2">
                <label className="block">
                  <span className="text-sm text-gray-700">Alert Level</span>
                  <select className="block w-full mt-1 border-gray-300 rounded">
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  onClick={() => setShowFilterModal(false)}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Floating Legend */}
        {legend && (
          <div
            style={{
              zIndex: 999, // Ensure it's above the map
            }}
            className="absolute top-2 right-2 bg-white p-2 rounded shadow-md border border-gray-200"
          >
            <h4 className="text-sm font-medium mb-1">Alert Levels</h4>
            {legendItems.map((item, index) => (
              <div key={index} className="flex items-center text-xs mb-1">
                <div
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span>{item.alert}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                District
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Cases
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                New Cases
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Incidence Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dengueData.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row)}
                className={`${
                  activeDistrict?.id === row.id
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                } cursor-pointer`}
              >
                <td className="px-6 py-4 whitespace-nowrap">{row.district}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {row.activeCases}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{row.newCases}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {row.incidenceRate.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alertColors[row.alert]
                    }`}
                  >
                    {row.alert}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
