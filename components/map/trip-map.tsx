"use client";
import { useEffect, useMemo, useRef } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import type { Place, PlaceKind } from "@/lib/types";
import { placeImageUrl } from "@/lib/images";
import { mapsDirectionsUrl } from "@/lib/deep-links";

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export const PIN_COLOR: Record<PlaceKind, string> = {
  hotel:   "#1D3D5E",
  sight:   "#92400E",
  food:    "#7C2D12",
  nature:  "#1A3D2E",
  transit: "#374151",
  note:    "#6B6560",
};

export const KIND_ICON: Record<PlaceKind, string> = {
  hotel:   "H",
  sight:   "S",
  food:    "F",
  nature:  "N",
  transit: "T",
  note:    "·",
};

interface Props {
  places: Place[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}

export function TripMap({ places, selectedId, onSelect }: Props) {
  const mapRef = useRef<MapRef>(null);

  const located = useMemo(
    () =>
      places.filter(
        (p): p is Place & { lat: number; lng: number } =>
          typeof p.lat === "number" && typeof p.lng === "number",
      ),
    [places],
  );

  const initialView = useMemo(() => {
    if (located.length === 0) return { longitude: 13, latitude: 47, zoom: 4 };
    const lats = located.map((p) => p.lat);
    const lngs = located.map((p) => p.lng);
    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude:  (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: located.length === 1 ? 12 : 8,
    };
  }, [located]);

  // Fit bounds wenn Pins sich ändern
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || located.length < 2) return;
    const lats = located.map((p) => p.lat);
    const lngs = located.map((p) => p.lng);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 60, duration: 700, maxZoom: 13 },
    );
  }, [located]);

  // Fly-to wenn Pin ausgewählt
  useEffect(() => {
    if (!selectedId) return;
    const p = located.find((x) => x.id === selectedId);
    if (!p) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 13), duration: 600 });
  }, [selectedId, located]);

  const selected = located.find((p) => p.id === selectedId);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapStyle={OSM_STYLE as never}
        initialViewState={initialView}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
        onClick={() => onSelect?.(null)}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {located.map((p) => {
          const active = selectedId === p.id;
          return (
            <Marker
              key={p.id}
              longitude={p.lng}
              latitude={p.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onSelect?.(active ? null : p.id);
              }}
            >
              <div
                className="flex flex-col items-center"
                style={{ cursor: "pointer" }}
              >
                <div
                  className="grid place-items-center text-white font-semibold shadow-md ring-2 ring-white transition-all duration-200"
                  style={{
                    backgroundColor: PIN_COLOR[p.kind],
                    width: active ? 36 : 28,
                    height: active ? 36 : 28,
                    borderRadius: "50%",
                    fontSize: active ? 13 : 11,
                  }}
                >
                  {KIND_ICON[p.kind]}
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Popup-Karte wenn Pin aktiv */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white rounded-card shadow-card overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Bild */}
          <div className="h-28 bg-line/40 overflow-hidden">
            <img
              src={placeImageUrl({
                imageSearch: selected.meta?.imageSearch as string | undefined,
                name: selected.name,
                existingUrl: selected.imageUrl,
              })}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          {/* Info */}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div
                  className="text-[10px] font-medium uppercase tracking-wide mb-0.5"
                  style={{ color: PIN_COLOR[selected.kind] }}
                >
                  {selected.kind}
                </div>
                <div className="font-medium text-sm leading-snug">{selected.name}</div>
                {selected.description && (
                  <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">
                    {selected.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => onSelect?.(null)}
                className="text-muted hover:text-ink text-xl font-light leading-none shrink-0 mt-0.5"
              >
                ×
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <a
                href={mapsDirectionsUrl(selected.lat!, selected.lng!, selected.name)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent hover:underline"
              >
                Google Maps ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
