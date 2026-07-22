// Grosse Antwortkarte fuers Onboarding (Budget, Reiseform, Komfortzone …).
// Auswahl bestaetigt sich visuell (Akzentrahmen + Scale) — Auto-Advance
// steuert der aufrufende Screen.

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface SelectCardProps {
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
  selected: boolean;
  onSelect: () => void;
}

export function SelectCard({ label, sublabel, icon: Icon, selected, onSelect }: SelectCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      animate={{ scale: selected ? [0.97, 1] : 1 }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      onClick={onSelect}
      className="w-full text-left"
      aria-pressed={selected}
    >
      <div
        className="flex min-h-[64px] items-center gap-4 px-5 py-4 transition-colors duration-150"
        style={{
          borderRadius: "var(--radius-lg)",
          background: selected ? "var(--accent-soft)" : "var(--surface)",
          border: `1.5px solid ${selected ? "var(--accent)" : "var(--line)"}`,
          boxShadow: selected ? "none" : "var(--sh-card)",
        }}
      >
        {Icon && (
          <Icon
            size={24}
            strokeWidth={1.75}
            style={{ color: selected ? "var(--accent)" : "var(--ink-2)" }}
          />
        )}
        <div className="min-w-0">
          <div className="t-headline">{label}</div>
          {sublabel && <div className="t-subhead mt-0.5 text-ink-2">{sublabel}</div>}
        </div>
      </div>
    </motion.button>
  );
}
