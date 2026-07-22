// Welcome (S0): Full-bleed-Hero mit Ken-Burns, ein Satz, ein CTA.

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { loadResult } from "../lib/storage";

export function WelcomeScreen() {
  const navigate = useNavigate();
  const hasResult = loadResult() !== null;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col overflow-hidden">
      {/* Hero mit sanftem Ken-Burns-Zoom (einmalig, 12s) */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(160deg, #3d5a6c, #0c6170)" }}
      >
        <motion.img
          src="/images/welcome-hero.jpg"
          alt=""
          initial={{ scale: 1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 12, ease: "linear" }}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.65) 100%)" }}
        />
      </div>

      <div className="pb-safe relative z-10 mt-auto flex flex-col gap-6 px-5 pb-8 text-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="t-caption opacity-80">Deine nächste Reise</div>
          <h1 className="t-display mt-2">Orte, die dich umhauen.</h1>
          <p className="t-body mt-3 opacity-90">
            Beantworte ein paar Fragen — ich finde Ziele, die wirklich zu dir passen.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-2"
        >
          <Button onClick={() => navigate("/onboarding/1")}>Reise finden</Button>
          {hasResult && (
            <Button variant="quiet" onClick={() => navigate("/results")} className="text-white/80">
              Letzte Empfehlungen ansehen
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
