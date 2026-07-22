// Empfehlungs-Karte (screens.md S14): 4:5-Bild mit Scrim + Eyebrow/Name,
// MatchBadge, darunter Begruendungs-Teaser + Meta-Chips.

import { motion } from "framer-motion";
import { DestinationImage } from "./DestinationImage";
import { MatchBadge, MetaChip } from "./Badges";
import { budgetSymbol, durationLabel, monthsLabel } from "../lib/format";
import type { Destination, RecommendationItem } from "../lib/types";

interface RecommendationCardProps {
  item: RecommendationItem;
  destination: Destination;
  onOpen: () => void;
  /** Position im Feed fuer Stagger-Entrance. */
  index: number;
}

/** Erster Satz der Begruendung als Teaser (voller Text steht im Detail). */
function teaser(reasoning: string): string {
  const match = reasoning.match(/^.+?[.!?](\s|$)/);
  return match ? match[0].trim() : reasoning;
}

export function RecommendationCard({ item, destination, onOpen, index }: RecommendationCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1], delay: index * 0.06 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="w-full text-left"
    >
      <div
        className="overflow-hidden"
        style={{
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          boxShadow: "var(--sh-card)",
        }}
      >
        <div className="relative">
          <DestinationImage
            imageUrl={destination.image_url}
            categories={destination.categories}
            alt={destination.name}
            aspect="4 / 5"
            eager={index === 0}
            className="!rounded-none"
          >
            <div className="scrim absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
              <div className="t-caption opacity-80">{destination.country}</div>
              <div className="t-title2 mt-1">{destination.name}</div>
            </div>
            <div className="absolute right-4 top-4 z-10">
              <MatchBadge score={item.match_score} />
            </div>
          </DestinationImage>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p
            className="t-subhead text-ink-2"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {teaser(item.reasoning)}
          </p>
          <div className="flex flex-wrap gap-2">
            <MetaChip>{durationLabel(destination.minimum_days, destination.ideal_days)}</MetaChip>
            <MetaChip>{budgetSymbol(destination.estimated_budget_level)}</MetaChip>
            <MetaChip>{monthsLabel(destination.best_months)}</MetaChip>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
