// Import Toastify
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export async function fetchPrediction(
  postalCode,
  setLoading,
  setError,
  setResult
) {
  setLoading(true);
  setError(null);
  setResult(null);

  try {
    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postal_code: postalCode }),
    });

    // Check for 404 response
    if (response.status === 404) {
      const errorMessage = "Postal code not found. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, {
        autoClose: 5000, // Automatically dismiss after 5 seconds
        closeOnClick: true, // Allow manual dismissal
        pauseOnHover: true, // Pause timer when hovered
      });
      return; // Exit early
    }

    const data = await response.json();

    if (data.status === "success") {
      toast.success("Prediction generated successfully!", {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
      });
      setResult(data);
    } else {
      setError(data.message);
      toast.error(data.message, {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  } catch (err) {
    const errorMessage =
      "Failed to connect to the server. Please try again later.";
    setError(errorMessage);
    toast.error(errorMessage, {
      autoClose: 5000,
      closeOnClick: true,
      pauseOnHover: true,
    });
  } finally {
    setLoading(false);
  }
}

// Function to call the /clusters/latest API
export async function fetchLatestClusters(setLoading, setError, setClusters) {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch("http://localhost:8000/clusters/latest", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorMessage = `Failed to fetch latest clusters: ${response.statusText}`;
      setError(errorMessage);
      toast.error(errorMessage, {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    const data = await response.json();

    // Check if the data has the expected structure
    if (data.status === "success" && Array.isArray(data.clusters)) {
      setClusters(data); // Pass the entire data object with clusters array
    } else {
      const errorMessage = data.message || "Failed to fetch latest clusters.";
      setError(errorMessage);
      toast.error(errorMessage, {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  } catch (err) {
    console.error("Error fetching clusters:", err);
    const errorMessage =
      "Failed to connect to the server. Please try again later.";
    setError(errorMessage);
    toast.error(errorMessage, {
      autoClose: 5000,
      closeOnClick: true,
      pauseOnHover: true,
    });
  } finally {
    setLoading(false);
  }
}

// Function to call the /statistics/latest API
export async function fetchLatestStatistics(
  setLoading,
  setError,
  setStatistics
) {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch("http://localhost:8000/statistics/latest", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorMessage = `Failed to fetch latest statistics: ${response.statusText}`;
      setError(errorMessage);
      toast.error(errorMessage, {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    const data = await response.json();

    if (data.status === "success") {
      // Extract relevant data or use default values if properties don't exist
      const processedData = {
        total_cases: data.total_cases || 0,
        average_incidence_rate: data.average_incidence_rate || 0,
        active_clusters: data.active_clusters || 0,
        highest_case_cluster: data.highest_case_cluster || {
          cluster_number: null,
          number_of_cases: 0,
          street_address: "",
        },
      };

      // Call the callback with the processed data
      setStatistics(processedData);
    } else {
      const errorMessage = data.message || "Failed to fetch latest statistics.";
      setError(errorMessage);
      toast.error(errorMessage, {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  } catch (err) {
    console.error("Error fetching statistics:", err);
    const errorMessage =
      "Failed to connect to the server. Please try again later.";
    setError(errorMessage);
    toast.error(errorMessage, {
      autoClose: 5000,
      closeOnClick: true,
      pauseOnHover: true,
    });
  } finally {
    setLoading(false);
  }
}

// Function to fetch incidence rate data for trends
export async function fetchIncidenceRateData(
  setLoading,
  setError,
  setIncidenceData
) {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch(
      "http://localhost:8000/statistics/incidence-rate",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorMessage = `Failed to fetch incidence rate data: ${response.statusText}`;
      setError(errorMessage);
      toast.error(errorMessage, {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    const data = await response.json();

    if (
      data.status === "success" &&
      Array.isArray(data.monthly_incidence_rate)
    ) {
      // Find the latest year in the dataset
      const years = data.monthly_incidence_rate.map((item) =>
        item.Month.substring(0, 4)
      );
      const latestYear = Math.max(...years.map((year) => parseInt(year)));

      // Filter data to only include the latest year
      const filteredData = data.monthly_incidence_rate.filter((item) =>
        item.Month.startsWith(latestYear.toString())
      );

      // Format the data for the chart
      const chartData = filteredData.map((item) => {
        // Extract month name from the YYYY-MM format
        const monthDate = new Date(item.Month + "-01");
        const monthName = monthDate.toLocaleString("default", {
          month: "short",
        });

        return {
          month: monthName,
          year: item.Month.substring(0, 4),
          cases: item["Number Of Cases"],
          incidenceRate: item["Incidence Rate"],
        };
      });

      // Sort by month (optional, in case the API doesn't return sorted data)
      chartData.sort((a, b) => {
        const monthsOrder = {
          Jan: 1,
          Feb: 2,
          Mar: 3,
          Apr: 4,
          May: 5,
          Jun: 6,
          Jul: 7,
          Aug: 8,
          Sep: 9,
          Oct: 10,
          Nov: 11,
          Dec: 12,
        };
        return monthsOrder[a.month] - monthsOrder[b.month];
      });

      setIncidenceData(chartData);
    } else {
      const errorMessage =
        data.message || "Failed to fetch incidence rate data.";
      setError(errorMessage);
      toast.error(errorMessage, {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  } catch (err) {
    console.error("Error fetching incidence rate data:", err);
    const errorMessage =
      "Failed to connect to the server. Please try again later.";
    setError(errorMessage);
    toast.error(errorMessage, {
      autoClose: 5000,
      closeOnClick: true,
      pauseOnHover: true,
    });
  } finally {
    setLoading(false);
  }
}
