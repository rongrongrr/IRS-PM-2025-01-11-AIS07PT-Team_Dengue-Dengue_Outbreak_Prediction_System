import { useEffect, useState } from "react";
import {
  fetchLatestStatistics,
  fetchIncidenceRateData,
  fetchLatestClusters,
} from "../utils/api"; // Import the API functions

import ClusterAnalysisView from "../components/ClusterAnalysisView";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SummaryCards from "../components/SummaryCards";
import TrendsView from "../components/TrendsView";
import ClusterPredictionView from "../components/ClusterPredictionView";

// Fallback data in case API fails
const fallbackTimeSeriesData = [
  { month: "Jan", year: "2025", cases: 570, incidenceRate: 0.1 },
  { month: "Feb", year: "2025", cases: 430, incidenceRate: 0.08 },
  { month: "Mar", year: "2025", cases: 380, incidenceRate: 0.07 },
  { month: "Apr", year: "2025", cases: 420, incidenceRate: 0.08 },
  { month: "May", year: "2025", cases: 490, incidenceRate: 0.09 },
];

// Alert status color mapping
const alertColors = {
  Warning: "text-red-600 bg-red-100",
  Moderate: "text-amber-600 bg-amber-100",
  Low: "text-green-600 bg-green-100",
};

export default function DengueDashboard() {
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [activeView, setActiveView] = useState("cluster-prediction");
  const [summaryCardsInfo, setSummaryCardsInfo] = useState({
    totalActiveCases: 0,
    averageIncidenceRate: 0,
    activeClusters: {
      total: 0,
    },
    highestCaseCluster: {
      cluster_number: null,
      number_of_cases: 0,
      street_address: "",
    },
  });
  const [dataTimeStamp, setDataTimeStamp] = useState(
    new Date()
      .toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(",", "")
      .replace(/\//g, "-")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for trends view
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState(null);

  // Fetch data for summary cards
  useEffect(() => {
    fetchLatestStatistics(setLoading, setError, (data) => {
      // Only update state if data is not null and has the expected structure
      if (data) {
        setSummaryCardsInfo({
          totalActiveCases: data.total_cases || 0,
          averageIncidenceRate: data.average_incidence_rate || 0,
          activeClusters: {
            total: data.active_clusters || 0,
          },
          highestCaseCluster: data.highest_case_cluster || {
            cluster_number: null,
            number_of_cases: 0,
            street_address: "",
          },
        });

        // Update timestamp
        setDataTimeStamp(
          new Date()
            .toLocaleString("en-GB", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
            .replace(",", "")
            .replace(/\//g, "-")
        );
      } else {
        console.error("Received null or invalid data from API");
      }
    });
  }, []);

  const [dengueData, setDengueData] = useState([]);
  const [clustersLoading, setClustersLoading] = useState(false);
  const [clustersError, setClustersError] = useState(null);

  useEffect(() => {
    if (activeView === "clusters" && dengueData.length === 0) {
      setClustersLoading(true);
      fetchLatestClusters(setClustersLoading, setClustersError, (data) => {
        if (data && Array.isArray(data.clusters)) {
          const formattedData = data.clusters.map((cluster) => ({
            id: cluster["Cluster Number"],
            district: cluster["Street Address"] || "Unknown",
            activeCases: cluster["Number Of Cases"] || 0,
            newCases: cluster["Recent Cases In Cluster"] || 0,
            totalCases: cluster["Total Cases In Cluster"] || 0,
            alert: determineAlertLevel(cluster["Number Of Cases"]),
            latitude: cluster["Latitude"],
            longitude: cluster["Longitude"],
          }));
          setDengueData(formattedData);
        } else {
          console.error("Invalid clusters data format:", data);
          setClustersError("Failed to parse cluster data");
        }
      });
    }
  }, [activeView]);

  // Helper function to determine alert level based on numnber of active cases
  const determineAlertLevel = (activeCases) => {
    if (activeCases >= 10) return "Warning";
    if (activeCases < 10 && activeCases > 0) return "Moderate";
    return "Low";
  };

  // Fetch incidence rate data when trends view is selected
  useEffect(() => {
    if (activeView === "trends") {
      // Fetch incidence rate data
      fetchIncidenceRateData(setTrendsLoading, setTrendsError, (data) => {
        if (data && data.length > 0) {
          setTimeSeriesData(data);
        } else {
          setTimeSeriesData(fallbackTimeSeriesData);
        }
      });
    }
  }, [activeView]);

  const handleRowClick = (district) => {
    setActiveDistrict(district === activeDistrict ? null : district);
  };

  // Modified setActiveView function to handle view changes
  const handleViewChange = (view) => {
    setActiveView(view);

    // Clear any previous errors
    if (view === "trends") {
      setTrendsError(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header dataTimeStamp={dataTimeStamp} />

      <SummaryCards summaryCardsInfo={summaryCardsInfo} />

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 px-4 pb-4 gap-4">
        <Sidebar
          activeView={activeView}
          setActiveView={handleViewChange}
          activeDistrict={activeDistrict}
          setActiveDistrict={setActiveDistrict}
          alertColors={alertColors}
        />

        {/* Main Panel */}
        <div className="flex-1 bg-white rounded-lg shadow">
          {activeView === "cluster-prediction" ? (
            <ClusterPredictionView />
          ) : activeView === "clusters" ? (
            <ClusterAnalysisView
              dengueData={dengueData}
              loading={clustersLoading}
              error={clustersError}
              activeDistrict={activeDistrict}
              handleRowClick={handleRowClick}
              alertColors={alertColors}
            />
          ) : (
            <TrendsView
              timeSeriesData={timeSeriesData || fallbackTimeSeriesData}
              loading={trendsLoading}
              error={trendsError}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 p-3 text-center text-gray-600 text-sm border-t">
        Dengue Outbreak Prediction System • NUS AIS07 Group 1
      </div>
    </div>
  );
}
