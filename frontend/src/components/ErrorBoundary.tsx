// Release-Haertung: faengt JEDEN Render-/Laufzeitfehler unterhalb und zeigt
// statt eines weissen Bildschirms eine lesbare Meldung mit Neu-laden-Button.
// Bewusst mit Inline-Styles und ohne Abhaengigkeit zum Design-System oder zu
// React-Context, damit die Fehlerseite auch dann rendert, wenn genau die
// kaputt sind.

import { Component, type ErrorInfo, type ReactNode } from "react";

// Zentrale, wiederverwendbare Vollbild-Fehleranzeige.
export function FatalError({ title, detail }: { title: string; detail?: string }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        color: "#1a1a1a",
        background: "#F8F7F5",
      }}
    >
      <div style={{ fontSize: 40, lineHeight: 1 }}>🧭</div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{title}</h1>
      {detail && (
        <p style={{ fontSize: 14, color: "#6b6b6b", maxWidth: 360, margin: 0, lineHeight: 1.5 }}>
          {detail}
        </p>
      )}
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 8,
          padding: "10px 20px",
          fontSize: 15,
          fontWeight: 600,
          color: "#fff",
          background: "#1a1a1a",
          border: "none",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        Neu laden
      </button>
    </div>
  );
}

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Fuer die Server-/Browser-Diagnose - kein Krachen mehr ins Leere.
    console.error("Unerwarteter Fehler in der App:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <FatalError
          title="Etwas ist schiefgelaufen."
          detail="Die App ist auf einen unerwarteten Fehler gestossen. Bitte lade die Seite neu."
        />
      );
    }
    return this.props.children;
  }
}
