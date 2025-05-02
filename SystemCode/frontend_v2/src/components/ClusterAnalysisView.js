import { Info, Map as MapIcon } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toProperCase } from "../utils/helpers"; // Import the helper function

export default function ClusterAnalysisView({
  dengueData,
  loading,
  error,
  activeDistrict,
  handleRowClick,
  alertColors,
}) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [legend, setLegend] = useState(false);

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
      Warning: "#EF4444", // red-500
      Moderate: "#F59E0B", // amber-500
      Low: "#10B981", // green-500
      default: "#3B82F6", // blue-500
    };

    // This is a simplification - in a real app you might want a more robust approach
    // based on how your alertColors are structured
    if (className.includes("bg-red")) return "#EF4444";
    if (className.includes("bg-amber")) return "#F59E0B";
    if (className.includes("bg-yellow")) return "#EAB308";
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

      // Create GeoJSON features from dengueData using actual coordinates from API
      const features = dengueData.map((district) => {
        // Use the actual latitude and longitude from the API data
        // Fall back to Singapore center if coordinates not available
        const lat = district.latitude || 1.3521;
        const lng = district.longitude || 103.8198;

        return {
          type: "Feature",
          properties: {
            id: district.id,
            district: district.district,
            activeCases: district.activeCases,
            newCases: district.newCases,
            totalCases: district.totalCases,
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
          const alertColorClass = feature.properties.alertColorClass; // Get the Tailwind class
          const alertColor = extractColorFromTailwindClass(alertColorClass); // Extract the actual color

          layer.bindPopup(`
            <div class="font-medium">Street Address: ${toProperCase(
              feature.properties.district
            )}</div>
            <div>Active Cases: ${feature.properties.activeCases}</div>
            <div>New Cases: ${feature.properties.newCases}</div>
            <div>Total Cases: ${feature.properties.totalCases}</div>
            <div>
              Alert Level: 
              <span style="color: ${alertColor}; font-weight: bold;">
                ${feature.properties.alert}
              </span>
            </div>
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
        <h2 className="text-xl font-semibold">Dengue Cluster Visualization</h2>
        <div className="flex items-center">
          <button
            className="flex items-center ml-4 text-sm text-gray-600 hover:text-blue-700"
            onClick={toggleLegend}
          >
            <Info size={16} className="mr-1" />
            Legend
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading cluster data...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error loading cluster data</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Interactive Map */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-64 rounded mb-4 border border-gray-200"
        ></div>
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
                Cluster Street Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Cases
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                New Cases
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cases
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dengueData.length > 0 ? (
              dengueData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  className={`${
                    activeDistrict?.id === row.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  } cursor-pointer`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {toProperCase(row.district)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.activeCases}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.newCases}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.totalCases}
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
              ))
            ) : !loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No cluster data available
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
