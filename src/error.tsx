import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary.tsx";

const el = document.getElementById("root");
if (!el) throw new Error("Root element #root not found");

// Surface background errors in console (helps when white screen hides issues)
window.addEventListener("error", (e) => {
  console.error("Global error:", e.error || e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

createRoot(el).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
