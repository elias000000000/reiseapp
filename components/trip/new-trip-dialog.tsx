"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useTrips } from "@/stores/trips-store";

export function NewTripDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const createTrip = useTrips((s) => s.createTrip);

  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // Escape-Taste schließt Dialog
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const t = createTrip({
      title: title.trim(),
      startDate: start || undefined,
      endDate: end || undefined,
    });
    router.push(`/trips/${t.id}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ backgroundColor: "rgba(26,23,20,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md bg-white rounded-2xl shadow-float p-6 flex flex-col gap-5"
      >
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Neue Reise</h2>
          <p className="text-sm text-muted mt-1">Gib einen Titel und optional Reisedaten an.</p>
        </div>

        <Field label="Titel">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Frühling in der Provence"
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Anreise">
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Abreise">
            <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" variant="pop" disabled={!title.trim()}>
            Erstellen
          </Button>
        </div>
      </form>
    </div>
  );
}
