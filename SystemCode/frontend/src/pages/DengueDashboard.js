import { AlertCircle, BarChart3, Calendar, Map } from "lucide-react";
import { useEffect, useState } from "react";

import ClusterAnalysisView from "../components/ClusterAnalysisView";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SummaryCards from "../components/SummaryCards";
import TrendsView from "../components/TrendsView";

// Sample dengue data - replace with actual data
const dengueData = [
  {
    id: 1,
    district: "Central Region",
    activeCases: 28,
    newCases: 7,
    incidenceRate: 4.2,
    clusterSize: "Medium",
    alert: "Warning",
  },
  {
    id: 2,
    district: "Eastern Area",
    activeCases: 45,
    newCases: 12,
    incidenceRate: 6.7,
    clusterSize: "Large",
    alert: "Critical",
  },
  {
    id: 3,
    district: "Northern District",
    activeCases: 16,
    newCases: 3,
    incidenceRate: 2.1,
    clusterSize: "Small",
    alert: "Moderate",
  },
  {
    id: 4,
    district: "Western Zone",
    activeCases: 32,
    newCases: 9,
    incidenceRate: 5.3,
    clusterSize: "Medium",
    alert: "Warning",
  },
  {
    id: 5,
    district: "Southern Territory",
    activeCases: 8,
    newCases: 2,
    incidenceRate: 1.5,
    clusterSize: "Small",
    alert: "Low",
  },
];

// Time series data for tracking
const timeSeriesData = [
  { month: "Jan", cases: 12, incidenceRate: 1.8 },
  { month: "Feb", cases: 19, incidenceRate: 2.9 },
  { month: "Mar", cases: 27, incidenceRate: 4.1 },
  { month: "Apr", cases: 42, incidenceRate: 6.3 },
  { month: "May", cases: 52, incidenceRate: 7.8 },
  { month: "Jun", cases: 39, incidenceRate: 5.9 },
  { month: "Jul", cases: 26, incidenceRate: 3.9 },
];

// Alert status color mapping
const alertColors = {
  Critical: "text-red-600 bg-red-100",
  Warning: "text-amber-600 bg-amber-100",
  Moderate: "text-yellow-600 bg-yellow-100",
  Low: "text-green-600 bg-green-100",
};

export default function DengueDashboard() {
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [activeView, setActiveView] = useState("clusters");
  const [timeFilter, setTimeFilter] = useState("6m");
  const [summaryCardsInfo, setSummaryCardsInfo] = useState({
    totalActiveCases: 123,
    newCases: -25,
    averageIncidenceRate: 5.94,
    activeClusters: {
      total: 10,
      critical: 1,
      warning: 2,
    },
    weeklyNewCases: 33,
    weeklyChange: -12,
  });
  const [dataTimeStamp, setDataTimeStamp] = useState([
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
      .replace(/\//g, "-"),
  ]);
  // Fetch data for total active cases
  useEffect(() => {
    fetch("/api/dengue-data")
      .then((response) => response.json())
      .then((data) => {
        setSummaryCardsInfo(data.summaryCardsInfo);
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
      });
  }, []);

  const handleRowClick = (district) => {
    setActiveDistrict(district === activeDistrict ? null : district);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header dataTimeStamp={dataTimeStamp} />

      <SummaryCards summaryCardsInfo={summaryCardsInfo} />

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 px-4 pb-4 gap-4">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          activeDistrict={activeDistrict}
          setActiveDistrict={setActiveDistrict}
          alertColors={alertColors}
        />

        {/* Main Panel */}
        <div className="flex-1 bg-white rounded-lg shadow">
          {activeView === "clusters" ? (
            <ClusterAnalysisView
              dengueData={dengueData}
              activeDistrict={activeDistrict}
              handleRowClick={handleRowClick}
              alertColors={alertColors}
            />
          ) : (
            <TrendsView timeSeriesData={timeSeriesData} />
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
