import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './styles/pvii-theme.css';  // 1. Token variables first
import './index.css';              // 2. Tailwind and overrides next

// ✨ order matters
import "./index.css";           // Tailwind layers
import "./styles/pvii-theme.css"; // tokens & utilities

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
