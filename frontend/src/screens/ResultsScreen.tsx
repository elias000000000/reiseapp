// Empfehlungs-Feed (S14): Ergebnis aus localStorage + Details via Cache.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { RecommendationCard } from "../components/RecommendationCard";
import { SkeletonCard } from "../components/Skeleton";
import { getDestinations } from "../lib/destinationsCache";
import { loadResult } from "../lib/storage";
import type { Destination } from "../lib/types";

export function ResultsScreen() {
  const navigate = useNavigate();
  const stored = loadResult();
  const [destinations, setDestinations] = useState<Map<string, Destination> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!stored) {
      navigate("/", { replace: true });
      return;
    }
    const controller = new AbortController();
    getDestinations(
      stored.result.recommendations.map((r) => r.destination_id),
      controller.signal
    )
      .then((list) => setDestinations(new Map(list.map((d) => [d.id, d]))))
      .catch((e) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) setLoadFailed(true);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stored) return null;
  const items = stored.result.recommendations;

  return (
    <Screen className="pt-safe pb-12">
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <div className="t-caption text-ink-3">Deine Empfehlungen</div>
          <h1 className="t-title1 mt-1">Für dich gefunden</h1>
          <p className="t-subhead mt-1 text-ink-2">
            {items.length} Orte, passend zu deinen Antworten
          </p>
        </div>
        <Button
          variant="quiet"
          onClick={() => navigate("/onboarding/1")}
          className="!h-auto !w-auto shrink-0 !px-0 pb-1"
        >
          Neue Suche
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {destinations === null && !loadFailed &&
          items.map((r) => <SkeletonCard key={r.destination_id} />)}

        {loadFailed && (
          <div className="flex flex-col gap-4">
            <p className="t-body text-ink-2">
              Die Details konnten nicht geladen werden. Läuft das Backend?
            </p>
            <Button onClick={() => window.location.reload()}>Nochmal versuchen</Button>
          </div>
        )}

        {destinations !== null &&
          items.map((item, i) => {
            const dest = destinations.get(item.destination_id);
            if (!dest) return null;
            return (
              <RecommendationCard
                key={item.destination_id}
                item={item}
                destination={dest}
                index={i}
                onOpen={() => navigate(`/destination/${item.destination_id}`)}
              />
            );
          })}
      </div>
    </Screen>
  );
}
