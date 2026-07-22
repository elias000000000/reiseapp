// Monatsauswahl (S2): 12 Pills, Multi-Select + "Ich bin flexibel"-Toggle.
// Wire-Regel: flexibel => leeres Array, NIE null (api-contract.md).

import { Chip } from "./Chip";
import { monthShort } from "../lib/format";

interface MonthGridProps {
  /** null = noch nichts gewaehlt, [] = flexibel, sonst Monate 1-12 */
  value: number[] | null;
  onChange: (value: number[] | null) => void;
}

export function MonthGrid({ value, onChange }: MonthGridProps) {
  const flexible = value !== null && value.length === 0;
  const months = value ?? [];

  function toggleMonth(m: number) {
    const next = months.includes(m) ? months.filter((x) => x !== m) : [...months, m];
    // Alles abgewaehlt => zurueck zu "noch nichts gewaehlt" (nicht "flexibel")
    onChange(next.length === 0 ? null : next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <Chip
            key={m}
            selected={months.includes(m)}
            disabled={flexible}
            onClick={() => toggleMonth(m)}
          >
            {monthShort(m)}
          </Chip>
        ))}
      </div>
      <Chip selected={flexible} onClick={() => onChange(flexible ? null : [])}>
        Ich bin flexibel
      </Chip>
    </div>
  );
}
