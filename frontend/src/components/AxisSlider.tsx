// Bipolarer Geschmacks-Slider (S7-S10): zwei Bild-Pole, die auf den Wert
// reagieren (bevorzugter Pol groesser/heller), Mittel-Raste bei 0.
// Wire-Format: -100..100, 0 = neutral — siehe api-contract.md.

interface Pole {
  label: string;
  image: string; // URL unter /images/, darf fehlen (Gradient-Fallback)
}

interface AxisSliderProps {
  value: number; // -100..100
  onChange: (value: number) => void;
  poleA: Pole; // links, negativ
  poleB: Pole; // rechts, positiv
}

const SNAP_ZONE = 8; // |v| < 8 rastet auf neutral

function PoleImage({ pole, emphasis }: { pole: Pole; emphasis: number }) {
  // emphasis 0..1: wie stark dieser Pol gerade bevorzugt wird
  const otherEmphasis = 1 - emphasis;
  return (
    <div className="flex-1">
      <div
        className="relative aspect-square overflow-hidden transition-transform duration-300"
        style={{
          borderRadius: "var(--radius-lg)",
          transform: `scale(${1 + 0.04 * emphasis})`,
          opacity: 1 - 0.45 * Math.max(0, otherEmphasis * 2 - 1),
          background: "linear-gradient(160deg, var(--accent-soft), var(--line))",
        }}
      >
        <img
          src={pole.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <div className="t-subhead mt-2 text-center text-ink-2">{pole.label}</div>
    </div>
  );
}

export function AxisSlider({ value, onChange, poleA, poleB }: AxisSliderProps) {
  const norm = value / 100; // -1..1
  const emphasisA = Math.max(0, -norm);
  const emphasisB = Math.max(0, norm);

  function handleChange(raw: number) {
    onChange(Math.abs(raw) < SNAP_ZONE ? 0 : raw);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <PoleImage pole={poleA} emphasis={emphasisA} />
        <PoleImage pole={poleB} emphasis={emphasisB} />
      </div>
      <div>
        <input
          type="range"
          min={-100}
          max={100}
          step={1}
          value={value}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="axis-range w-full"
          aria-label={`${poleA.label} bis ${poleB.label}`}
        />
        <div className="t-footnote mt-1 text-center text-ink-3">
          {value === 0 ? "Ausgeglichen" : ""}
        </div>
      </div>
    </div>
  );
}
