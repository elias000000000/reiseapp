// Layout-Shell: Safe Areas, 480px-Maxbreite, Standard-Screenrand 20px.

import type { ReactNode } from "react";

interface ScreenProps {
  children: ReactNode;
  /** true = kein horizontaler Rand (Full-bleed-Bilder, z. B. Detail-Hero). */
  fullBleed?: boolean;
  className?: string;
}

export function Screen({ children, fullBleed = false, className = "" }: ScreenProps) {
  return (
    <div className={`mx-auto min-h-dvh w-full max-w-[480px] ${fullBleed ? "" : "px-5"} ${className}`}>
      {children}
    </div>
  );
}
