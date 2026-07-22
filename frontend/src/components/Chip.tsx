import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function Chip({ children, selected = false, disabled = false, onClick }: ChipProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className="t-subhead flex h-11 items-center justify-center rounded-full px-4 transition-colors duration-150 disabled:opacity-35"
      style={{
        background: selected ? "var(--accent-soft)" : "var(--surface)",
        border: `1.5px solid ${selected ? "var(--accent)" : "var(--line)"}`,
        color: selected ? "var(--accent)" : "var(--ink)",
        fontWeight: selected ? 600 : 400,
      }}
    >
      {children}
    </motion.button>
  );
}
