// Router + Screen-Uebergaenge. Auth ist unsichtbar (anonyme Session,
// state/AuthContext.tsx) - kein Login-Screen, App wartet nur kurz auf die
// Session-Aufloesung. App-Start mit gespeichertem Ergebnis springt direkt
// zu /results (screens.md, Navigationsmodell).
//
// Uebergangs-Pattern: Entrance-only. Ein keyed motion.div remountet bei
// jedem Pfadwechsel und animiert den neuen Screen herein. Bewusst KEIN
// AnimatePresence/Exit: mode="wait" haengt unter React StrictMode
// (Exit-Callback feuert nicht zuverlaessig) — Entrance-only ist robust
// und traegt den iOS-Push-Charakter ohnehin ueber den eintretenden Screen.

import { motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./state/AuthContext";
import { OnboardingProvider } from "./state/OnboardingContext";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { DetailScreen } from "./screens/DetailScreen";
import { NoCandidatesScreen } from "./screens/NoCandidatesScreen";
import { loadResult } from "./lib/storage";

const EASE = [0.32, 0.72, 0, 1] as const;

function StartRedirect() {
  // Zweiter App-Start mit vorhandenem Ergebnis -> direkt zu den Empfehlungen
  return loadResult() !== null ? <Navigate to="/results" replace /> : <WelcomeScreen />;
}

function AppRoutes() {
  const location = useLocation();
  const { loading } = useAuth();

  // Anonyme Session aufloesen/erstellen - normalerweise <100ms, kein
  // sichtbarer Ladezustand noetig (kein Login-Screen mehr vorhanden).
  if (loading) return null;

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <Routes location={location}>
        <Route path="/" element={<StartRedirect />} />
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/onboarding/:step" element={<OnboardingScreen />} />
        <Route path="/loading" element={<LoadingScreen />} />
        <Route path="/results" element={<ResultsScreen />} />
        <Route path="/destination/:id" element={<DetailScreen />} />
        <Route path="/too-narrow" element={<NoCandidatesScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <AppRoutes />
      </OnboardingProvider>
    </AuthProvider>
  );
}
