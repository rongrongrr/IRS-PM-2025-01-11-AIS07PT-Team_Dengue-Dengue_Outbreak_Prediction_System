import { useState } from "react";

export default function Header({ dataTimeStamp }) {
  const [showModal, setShowModal] = useState(false);

  const contributors = [
    "Brian Zheng",
    "Chan Jing Rong",
    "Johann Oh Hock Seng",
    "Velu",
    "Weiqiao Li",
  ];

  return (
    <div className="bg-blue-800 text-white px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Dengue Outbreak Prediction System
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-semibold hover:bg-blue-500 transition-colors"
            aria-label="Show contributors"
          >
            ?
          </button>
        </div>
      </div>

      {/* Contributors Modal */}
      {showModal && (
        <div
          style={{
            zIndex: 9999, // Ensure it's above the map
          }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <div className="bg-white text-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Contributors</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-2">
              {contributors.map((contributor, index) => (
                <li
                  key={index}
                  className="py-1 border-b border-gray-200 last:border-0"
                >
                  {contributor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
