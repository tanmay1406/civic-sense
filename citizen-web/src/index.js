import React from "react";
import { createRoot } from "react-dom/client";

// Minimal App component import
import App from "./App";

// Get the root element
const container = document.getElementById("root");
const root = createRoot(container);

// Render the application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
