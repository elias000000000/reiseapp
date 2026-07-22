import { ChevronLeft } from "lucide-react";

interface AppHeaderProps {
  onBack?: () => void;
  title?: string;
  /** overlay = weiss auf Bild (Detail-Hero). */
  variant?: "default" | "overlay";
}

export function AppHeader({ onBack, title, variant = "default" }: AppHeaderProps) {
  const color = variant === "overlay" ? "text-white" : "text-ink";
  return (
    <div className="flex h-11 items-center gap-2">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Zurück"
          className={`-ml-2 flex h-11 w-11 items-center justify-center ${color}`}
        >
          <ChevronLeft size={26} strokeWidth={2.25} />
        </button>
      )}
      {title && <span className={`t-headline ${color}`}>{title}</span>}
    </div>
  );
}
