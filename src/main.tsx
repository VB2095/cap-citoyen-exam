import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../styles.css";
import { App } from "./App";

if (window.location.hash.startsWith("#/")) {
  const legacyPath = window.location.hash.slice(1);
  window.history.replaceState(null, "", legacyPath);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
