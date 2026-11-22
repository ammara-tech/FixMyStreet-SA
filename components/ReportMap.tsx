"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup, Marker, CircleMarker } from "leaflet";
import Icon from "@/components/Icon";
import { locate, locateMessage, type Place } from "@/lib/geo";
import { pickPinSvg, pinSvg } from "@/lib/pin";
import { SA_CENTRE, STATUSES } from "@/lib/reports";
import type { Report } from "@/lib/types";

/*
  The map, drawn with Leaflet and OpenStreetMap's tiles (free, no account or key). Three jobs:
  - browse: every report as a pin (red ! reported, blue clock acknowledged, green tick fixed). Tapping a pin selects it.
  - pick:   the report form. Tap the map (or drag the yellow pin, or press Enter with the keyboard) to say where the problem is.
  - single: one report's place, on its own page.
  Leaflet is loaded only when a map is on screen, and only in the browser, so it never slows the sign-in screen.
  The list beside the map holds the same reports, for anyone who can't use a map.
*/

type Leaflet = typeof import("leaflet");

export default function ReportMap({
  mode,
  label,
  reports = [],
  selectedId = null,
  onSelect,
  pick = null,
  onPick,
  onLocate,
  className = "h-80",
}: {
  mode: "browse" | "pick" | "single";
  label: string;
  reports?: Report[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  pick?: Place | null;
  onPick?: (p: Place) => void;
  onLocate?: (p: Place) => void;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const live = useRef<{ L: Leaflet; map: LeafletMap; layer: LayerGroup; pin: Marker | null; me: CircleMarker | null; fitted: boolean; lastPick: Place | null } | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [finding, setFinding] = useState(false);

  // The latest callbacks, so the map (made once) always calls the current ones
  const callbacks = useRef({ onSelect, onPick, onLocate });
  useEffect(() => {
    callbacks.current = { onSelect, onPick, onLocate };
  });

  // Make the map, once
  useEffect(() => {
    let cancelled = false;
    let made: LeafletMap | null = null;
    (async () => {
      const mod = await import("leaflet");
      const L = ((mod as unknown as { default?: Leaflet }).default ?? mod) as Leaflet;
      const element = box.current;
      if (cancelled || !element) return;
      const map: LeafletMap = L.map(element, { center: [SA_CENTRE.lat, SA_CENTRE.lng], zoom: SA_CENTRE.zoom, minZoom: 4, maxZoom: 19, worldCopyJump: false });
      made = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);
      const layer = L.layerGroup().addTo(map);
      live.current = { L, map, layer, pin: null, me: null, fitted: false, lastPick: null };

      if (mode === "pick") {
        map.on("click", (e) => {
          const p = { lat: e.latlng.lat, lng: e.latlng.lng };
          callbacks.current.onPick?.(p);
        });
        // Keyboard: pan with the arrow keys, then Enter drops the pin in the middle of the map
        map.getContainer().addEventListener("keydown", (e) => {
          if (e.key === "Enter" && e.target === map.getContainer()) {
            const c = map.getCenter();
            callbacks.current.onPick?.({ lat: c.lat, lng: c.lng });
          }
        });
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
      made?.remove();
      live.current = null;
      setReady(false);
    };
    // The mode never changes while a map is on screen
  }, [mode]);

  // Redraw the pins only when a report really changed, not each time the page hands over a new list
  const reportsKey = reports.map((r) => `${r.id}:${r.status}:${r.lat}:${r.lng}`).join("|");

  // Draw the reports as pins
  useEffect(() => {
    const m = live.current;
    if (!ready || !m) return;
    const { L, map, layer } = m;
    layer.clearLayers();
    const points: [number, number][] = [];
    for (const r of reports) {
      if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) continue;
      points.push([r.lat, r.lng]);
      const marker = L.marker([r.lat, r.lng], {
        icon: L.divIcon({ className: "pin", html: pinSvg(r.status), iconSize: [34, 42], iconAnchor: [17, 40] }),
        title: `${r.title} (${STATUSES[r.status].label})`,
        keyboard: false,
        interactive: mode === "browse",
      });
      if (mode === "browse") marker.on("click", () => callbacks.current.onSelect?.(r.id));
      marker.addTo(layer);
      marker.getElement()?.setAttribute("data-selected", String(r.id === selectedId));
    }
    // The first time there are reports, show them all. A single report is centred and close up.
    if (!m.fitted && points.length) {
      m.fitted = true;
      if (mode === "single" || points.length === 1) map.setView(points[0], mode === "single" ? 16 : 15);
      else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    }
  }, [ready, reports, selectedId, mode]);

  // The selected report: keep its pin in view
  useEffect(() => {
    const m = live.current;
    if (!ready || !m || mode !== "browse" || !selectedId) return;
    const r = reports.find((x) => x.id === selectedId);
    if (r) m.map.panInside([r.lat, r.lng], { padding: [60, 60] });
  }, [ready, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // The yellow pin that says where the new problem is
  useEffect(() => {
    const m = live.current;
    if (!ready || !m || mode !== "pick") return;
    const { L, map } = m;
    if (!pick) {
      m.pin?.remove();
      m.pin = null;
      m.lastPick = null;
      return;
    }
    const moved = !m.lastPick || m.lastPick.lat !== pick.lat || m.lastPick.lng !== pick.lng;
    m.lastPick = pick;
    if (!m.pin) {
      const pin = L.marker([pick.lat, pick.lng], {
        draggable: true,
        keyboard: false,
        title: "The problem is here. Drag to move it.",
        icon: L.divIcon({ className: "pin", html: pickPinSvg(), iconSize: [38, 47], iconAnchor: [19, 45] }),
      }).addTo(map);
      pin.on("dragend", () => {
        const at = pin.getLatLng();
        callbacks.current.onPick?.({ lat: at.lat, lng: at.lng });
      });
      m.pin = pin;
    } else if (moved) {
      m.pin.setLatLng([pick.lat, pick.lng]);
    }
    // Pins placed by tapping are already on screen; a place from "Use my location" may not be
    if (!map.getBounds().contains([pick.lat, pick.lng])) map.setView([pick.lat, pick.lng], Math.max(map.getZoom(), 16));
  }, [ready, pick, mode]);

  async function findMe() {
    const m = live.current;
    if (!m) return;
    setFinding(true);
    setMessage("");
    try {
      const here = await locate();
      m.me?.remove();
      m.me = m.L.circleMarker([here.lat, here.lng], { radius: 8, color: "#ffffff", weight: 3, fillColor: "#0b57d0", fillOpacity: 1, interactive: false }).addTo(m.map);
      m.map.setView([here.lat, here.lng], Math.max(m.map.getZoom(), 15));
      callbacks.current.onLocate?.(here);
    } catch (e) {
      setMessage(locateMessage(e));
    } finally {
      setFinding(false);
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border-2 border-asphalt ${className}`}>
      <div ref={box} role="region" aria-label={label} className="h-full w-full" />
      {!ready && (
        <p role="status" className="pointer-events-none absolute inset-0 grid place-items-center bg-card text-sm text-ink-soft">
          Loading the map…
        </p>
      )}
      {mode !== "single" && (
        <button
          type="button"
          onClick={findMe}
          disabled={!ready || finding}
          className="btn-quiet absolute right-2 top-2 z-[500] !px-3 !py-1.5 text-sm shadow"
        >
          <Icon name="locate" className="h-4 w-4" />
          {finding ? "Finding…" : "Use my location"}
        </button>
      )}
      {message && (
        <p role="status" className="absolute inset-x-2 bottom-8 z-[500] rounded-md border border-line bg-card px-3 py-2 text-sm shadow">
          {message}
        </p>
      )}
    </div>
  );
}
