"use client";
import { useState } from "react";
import type { Place } from "@/lib/types";

interface Props {
  places: Place[];
  onReorder: (orderedIds: string[]) => void;
  onUnassign: (placeId: string) => void;
}

/**
 * Schlanke native HTML5-Drag-Drop. Reicht für eine Liste pro Tag.
 * Wenn das später nicht reicht, swap zu @dnd-kit — gleiche Daten-API.
 */
export function DayTimeline({ places, onReorder, onUnassign }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const sorted = [...places].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const ids = sorted.map((p) => p.id);
    const from = ids.indexOf(draggingId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    onReorder(ids);
  };

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-muted italic p-3">
        Noch nichts geplant. Zieh Orte aus der Karte hierher.
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-1.5">
      {sorted.map((p, i) => (
        <li
          key={p.id}
          draggable
          onDragStart={() => setDraggingId(p.id)}
          onDragEnd={() => {
            setDraggingId(null);
            setHoverId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setHoverId(p.id);
          }}
          onDrop={() => handleDrop(p.id)}
          className={`place-row ${draggingId === p.id ? "dragging opacity-40" : ""} ${
            hoverId === p.id && draggingId !== p.id ? "ring-1 ring-accent/40" : ""
          } group flex items-center gap-3 px-3 py-2.5 rounded-card bg-white border border-line/60 cursor-grab active:cursor-grabbing`}
        >
          <span className="text-xs text-muted w-5 tabular-nums">{i + 1}</span>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: {
                hotel: "#2D5F3F",
                sight: "#B45309",
                food: "#7C2D12",
                nature: "#166534",
                transit: "#1E3A8A",
                note: "#6B6B6B",
              }[p.kind],
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{p.name}</div>
            {p.description && (
              <div className="text-xs text-muted truncate">{p.description}</div>
            )}
          </div>
          <button
            onClick={() => onUnassign(p.id)}
            className="text-xs text-muted hover:text-ink opacity-0 group-hover:opacity-100 transition"
            title="Aus Tag entfernen"
          >
            ↺
          </button>
        </li>
      ))}
    </ol>
  );
}
