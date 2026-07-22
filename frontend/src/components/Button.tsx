import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "quiet";
  disabled?: boolean;
  className?: string;
}

const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-accent-ink shadow-[var(--sh-float)]",
  ghost: "border border-line bg-surface text-ink",
  quiet: "text-ink-2",
};

export function Button({ children, onClick, variant = "primary", disabled, className = "" }: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      disabled={disabled}
      className={`t-headline flex h-[52px] w-full items-center justify-center px-5 transition-opacity disabled:opacity-40 ${styles[variant]} ${className}`}
      style={{ borderRadius: "var(--radius-md)" }}
    >
      {children}
    </motion.button>
  );
}
