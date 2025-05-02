// filepath: src/utils/api.js
export async function fetchDengueData() {
  const response = await fetch("/api/dengue-data");
  return response.json();
}

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

    const data = await response.json();

    if (data.status === "error") {
      setError(data.message);
    } else {
      setResult(data);
    }
  } catch (err) {
    setError("Failed to connect to the server. Please try again later.");
  } finally {
    setLoading(false);
  }
}
