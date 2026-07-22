// S17 — NO_CANDIDATES: ein Ergebnis, kein Fehler. Ruhig, ohne Rot,
// mit gezielten Anpassungs-Angeboten (Antworten bleiben erhalten).

import { useNavigate } from "react-router-dom";
import { Screen } from "../components/Screen";
import { AppHeader } from "../components/AppHeader";
import { SelectCard } from "../components/SelectCard";
import { CalendarPlus, Coins, Mountain } from "lucide-react";

export function NoCandidatesScreen() {
  const navigate = useNavigate();

  return (
    <Screen className="pt-safe">
      <AppHeader onBack={() => navigate("/onboarding/13")} />
      <h1 className="t-display mt-10">Zu speziell — noch.</h1>
      <p className="t-body mt-3 text-ink-2">
        Deine Kombination aus Startort, Dauer, Budget und Komfort passt gerade auf keines der 300 Ziele.
        Eine kleine Anpassung genügt meist.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <SelectCard
          label="Mehr Zeit geben"
          sublabel="Reisedauer anpassen"
          icon={CalendarPlus}
          selected={false}
          onSelect={() => navigate("/onboarding/2")}
        />
        <SelectCard
          label="Budget öffnen"
          sublabel="Eine Stufe macht oft den Unterschied"
          icon={Coins}
          selected={false}
          onSelect={() => navigate("/onboarding/4")}
        />
        <SelectCard
          label="Mutiger sein"
          sublabel="Komfortzone erweitern"
          icon={Mountain}
          selected={false}
          onSelect={() => navigate("/onboarding/6")}
        />
      </div>
    </Screen>
  );
}
