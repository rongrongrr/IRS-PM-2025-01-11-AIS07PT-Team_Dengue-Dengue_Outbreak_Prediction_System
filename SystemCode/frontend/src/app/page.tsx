'use client';

import { useState } from 'react';

export default function Home() {
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postal_code: postalCode }),
      });

      const data = await response.json();

      if (data.status === 'error') {
        setError(data.message);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Dengue Risk Prediction
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="postal-code"
                    id="postal-code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter postal code"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Predict Risk'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Prediction Results</h2>
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <span className="text-gray-600 font-medium">Risk Level: </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold
                        ${result.risk_level === 'High' ? 'bg-red-600' : result.risk_level === 'Medium' ? 'bg-yellow-500' : result.risk_level === 'Low' ? 'bg-green-600' : 'bg-gray-400'}`}>
                        {result.risk_level}
                      </span>
                      {result.risk_level === 'Unknown' && (
                        <span className="block text-xs text-gray-500 mt-1">No prediction available for this location.</span>
                      )}
                    </div>
                    {result.prediction_value !== null && result.prediction_value !== undefined && (
                      <div>
                        <span className="text-gray-600 font-medium">Confidence: </span>
                        <span className="text-gray-900">{result.prediction_value.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                  {result.location_info && (
                    <div className="mb-4">
                      <h3 className="text-md font-semibold text-gray-700 mb-2">Location Info</h3>
                      <ul className="text-gray-700 text-sm space-y-1">
                        <li><b>Lat:</b> {result.location_info.latitude}, <b>Lon:</b> {result.location_info.longitude}</li>
                        <li><b>Land Use:</b> {result.location_info.landuse_name} ({result.location_info.landuse_type})</li>
                        <li><b>Nearby Clusters:</b> {result.location_info.nearby_clusters}</li>
                        <li><b>Total Cases:</b> {result.location_info.total_cases}</li>
                        <li><b>Humidity Score:</b> {result.location_info.humidity_score}</li>
                        <li><b>Rainfall Score:</b> {result.location_info.rainfall_score}</li>
                      </ul>
                    </div>
                  )}
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Risk Map</h3>
                    {result.map_file ? (
                      <iframe
                        src={`http://localhost:8000/${result.map_file}`}
                        width="100%"
                        height="500"
                        style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                        title="Dengue Risk Map"
                        className="w-full rounded-md"
                      />
                    ) : (
                      <div className="text-gray-500 italic">No map available for this location.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 