import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "./styles/platform.css";
import "./styles/patient.css";
import "./styles/dashboard.css";
import "./styles/portals.css";
import "./styles/tables.css";
import "./styles/inventory.css";
import "./styles/responsive.css";

let savedTheme: string | null = null;
try { savedTheme = localStorage.getItem("dentiq-theme"); } catch { /* Storage may be unavailable. */ }
document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
