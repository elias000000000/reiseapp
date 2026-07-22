"use client";
import { useState } from "react";
import type { Place, PlaceKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { mapsPlaceUrl } from "@/lib/deep-links";

const KIND_LABEL: Record<PlaceKind, string> = {
  hotel: "Hotel",
  sight: "Sehenswürdigkeit",
  food: "Essen",
  nature: "Natur",
  transit: "Transit",
  note: "Notiz",
};

interface Props {
  places: Place[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onRemove?: (id: string) => void;
  onAdd?: (input: { name: string; kind: PlaceKind }) => void;
}

export function PlaceList({ places, selectedId, onSelect, onRemove, onAdd }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PlaceKind>("sight");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wide font-medium text-muted">
          Orte ({places.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Schließen" : "+ Ort"}
        </Button>
      </div>

      {showAdd && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onAdd?.({ name: name.trim(), kind });
            setName("");
            setShowAdd(false);
          }}
          className="rounded-card bg-white border border-line p-3 flex flex-col gap-2"
        >
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Café Central"
              autoFocus
            />
          </Field>
          <Field label="Typ">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as PlaceKind)}
              className="h-10 px-3 rounded-card border border-line bg-white text-sm"
            >
              {Object.entries(KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end">
            <Button type="submit" size="sm">
              Hinzufügen
            </Button>
          </div>
        </form>
      )}

      <ul className="flex flex-col gap-1">
        {places.length === 0 && (
          <li className="text-sm text-muted py-3">Noch keine Orte. Füge welche hinzu.</li>
        )}
        {places.map((p) => (
          <li
            key={p.id}
            onClick={() => onSelect?.(p.id)}
            className={`group flex items-center gap-3 p-2.5 rounded-card cursor-pointer transition ${
              selectedId === p.id ? "bg-accent-soft" : "hover:bg-white"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: {
                  hotel:   "#1D3D5E",
                  sight:   "#92400E",
                  food:    "#7C2D12",
                  nature:  "#1A3D2E",
                  transit: "#374151",
                  note:    "#6B6560",
                }[p.kind],
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{p.name}</div>
              {p.description && (
                <div className="text-xs text-muted truncate">{p.description}</div>
              )}
            </div>
            <a
              href={mapsPlaceUrl(p.name)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-muted hover:text-ink opacity-0 group-hover:opacity-100 transition"
            >
              Maps ↗
            </a>
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`"${p.name}" entfernen?`)) onRemove(p.id);
                }}
                className="text-xs text-muted hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
