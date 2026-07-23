import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/index.css";

const rootEl = document.getElementById("root");

// Release-Haertung: sollte selbst das Mounten fehlschlagen (fehlendes #root),
// wenigstens eine nackte Meldung ins DOM schreiben statt einen weissen
// Bildschirm zu hinterlassen.
if (!rootEl) {
  document.body.innerHTML =
    '<div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;font-family:system-ui;color:#1a1a1a">App konnte nicht geladen werden (#root fehlt).</div>';
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  );
}
