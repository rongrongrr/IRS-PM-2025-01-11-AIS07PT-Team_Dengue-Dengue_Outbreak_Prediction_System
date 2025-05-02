import DengueDashboard from "./pages/DengueDashboard";
import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import Toastify styles

export default function App() {
  return (
    <>
      <DengueDashboard />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="text-sm font-sans" // Tailwind classes for container
        bodyClassName="bg-white text-gray-800 font-sans" // Tailwind classes for toast body
        progressClassName="bg-blue-500" // Tailwind class for progress bar
      />
    </>
  );
}
