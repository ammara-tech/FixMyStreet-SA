import type { IconName } from "@/components/Icon";
import type { Category, Report, ReportInput, Status } from "@/lib/types";

/*
  The rules of a report, as plain functions with no Firebase, so tests/reports.test.ts checks them all:
  the categories and statuses, tickets, whether a place is in South Africa, nearby duplicates,
  filtering and sorting, and the numbers at the top of the council page.
*/

export const CATEGORIES: Record<Category, { label: string; short: string; icon: IconName; hint: string }> = {
  pothole: { label: "Pothole or damaged road", short: "Pothole", icon: "road", hint: "Deep pothole outside the taxi rank" },
  streetlight: { label: "Streetlight not working", short: "Streetlight", icon: "bulb", hint: "Three lights out on the walkway to school" },
  water: { label: "Water leak or burst pipe", short: "Water leak", icon: "drop", hint: "Pipe leaking onto the road since Monday" },
  sewage: { label: "Sewage or blocked drain", short: "Sewage", icon: "manhole", hint: "Manhole overflowing into the street" },
  refuse: { label: "Illegal dumping or missed refuse", short: "Dumping", icon: "trash", hint: "Rubbish dumped on the open lot" },
  signal: { label: "Traffic light (robot) not working", short: "Robot", icon: "signal", hint: "Robot at the main intersection is out" },
  sign: { label: "Road sign or markings", short: "Road sign", icon: "roadsign", hint: "Stop sign knocked over" },
  other: { label: "Something else", short: "Other", icon: "more", hint: "Describe what is wrong" },
};
export const CATEGORY_IDS = Object.keys(CATEGORIES) as Category[];

export const STATUSES: Record<Status, { label: string; step: number; help: string }> = {
  reported: { label: "Reported", step: 0, help: "Waiting for the municipality to look at it." },
  acknowledged: { label: "Acknowledged", step: 1, help: "The municipality has seen it and logged it." },
  fixed: { label: "Fixed", step: 2, help: "The municipality says this has been fixed." },
};
export const STATUS_IDS = Object.keys(STATUSES) as Status[];

export const LIMITS = { title: 80, titleMin: 5, description: 500, area: 60, note: 200 };

/* South Africa, roughly: a box around the country, so a pin dropped in the sea or in another country is caught */
export const SA_BOUNDS = { south: -35.0, north: -22.0, west: 16.3, east: 33.0 };
export const SA_CENTRE = { lat: -28.5, lng: 24.7, zoom: 5 };

export function inSouthAfrica(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= SA_BOUNDS.south && lat <= SA_BOUNDS.north && lng >= SA_BOUNDS.west && lng <= SA_BOUNDS.east;
}

/** Collapses spaces, trims, and cuts to a length */
export const clean = (s: string, max: number) => s.replace(/\s+/g, " ").trim().slice(0, max);

/** Keeps line breaks in a description, but trims each line and limits blank lines */
export function cleanLong(s: string, max: number) {
  return s
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

/* ── Tickets ─────────────────────────────────────────────────────────────────────────────────── */

// No 0, 1, I, O: they look alike on a phone, and people read tickets out over the phone
const TICKET_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** "FMS-4K7Q". Pass in a random function to test it. */
export function ticketNumber(random: () => number = Math.random) {
  let out = "";
  for (let i = 0; i < 4; i++) out += TICKET_CHARS[Math.floor(random() * TICKET_CHARS.length) % TICKET_CHARS.length];
  return `FMS-${out}`;
}

/* ── Checking a report before it's sent ──────────────────────────────────────────────────────── */

export type DraftProblems = Partial<Record<"category" | "title" | "location", string>>;

export function checkDraft(input: ReportInput): DraftProblems {
  const problems: DraftProblems = {};
  if (!input.category) problems.category = "Choose what kind of problem it is.";
  const title = clean(input.title, LIMITS.title + 1);
  if (title.length < LIMITS.titleMin) problems.title = `Describe it in a few words (at least ${LIMITS.titleMin} letters).`;
  else if (title.length > LIMITS.title) problems.title = `Keep the title under ${LIMITS.title} characters. Put the rest in the details.`;
  if (input.lat === null || input.lng === null) problems.location = "Tap the map, or press Use my location, to show where it is.";
  else if (!inSouthAfrica(input.lat, input.lng)) problems.location = "That pin isn't in South Africa. Move it to the problem.";
  return problems;
}

/* ── Places ──────────────────────────────────────────────────────────────────────────────────── */

type Point = { lat: number; lng: number };

/** Straight-line distance in metres (haversine) */
export function distanceM(a: Point, b: Point) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 850 → "850 m", 2340 → "2.3 km", 15200 → "15 km" */
export function distanceLabel(m: number) {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  const km = m / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/**
 * Reports that look like the one being made: the same kind of problem, still open, close by. The form
 * shows them first, so people vote for the existing report instead of making a duplicate.
 */
export function nearbyDuplicates(draft: { category: Category | ""; lat: number | null; lng: number | null }, reports: Report[], radiusM = 100) {
  if (!draft.category || draft.lat === null || draft.lng === null) return [];
  const here = { lat: draft.lat, lng: draft.lng };
  return reports
    .filter((r) => r.category === draft.category && r.status !== "fixed")
    .map((r) => ({ report: r, metres: distanceM(here, r) }))
    .filter((x) => x.metres <= radiusM)
    .sort((a, b) => a.metres - b.metres)
    .map((x) => x.report);
}

/** A link that opens the spot in Google Maps, for a driver or a council crew */
export const mapsUrl = (r: Point) => `https://www.google.com/maps/search/?api=1&query=${r.lat.toFixed(6)},${r.lng.toFixed(6)}`;

/* ── Time ────────────────────────────────────────────────────────────────────────────────────── */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** "just now", "5 min ago", "3 hours ago", "2 days ago", "3 weeks ago", "4 months ago" */
export function timeAgo(from: number, now: number) {
  const diff = Math.max(0, now - from);
  if (diff < MIN) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MIN)} min ago`;
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  }
  const days = Math.floor(diff / DAY);
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? "month" : "months"} ago`;
}

/** Whole days between two times, counting the first day as day 1 */
export const daysBetween = (from: number, to: number) => Math.max(1, Math.ceil((to - from) / DAY));

/* ── Filtering and sorting ───────────────────────────────────────────────────────────────────── */

export type Filters = { category: Category | "all"; status: Status | "open" | "all"; text: string; mine: boolean };
export const NO_FILTERS: Filters = { category: "all", status: "all", text: "", mine: false };
export type SortBy = "votes" | "newest" | "nearest";

export function filterReports(reports: Report[], f: Filters, uid: string | null) {
  const words = f.text.toLowerCase().split(/\s+/).filter(Boolean);
  return reports.filter((r) => {
    if (f.category !== "all" && r.category !== f.category) return false;
    if (f.status === "open" && r.status === "fixed") return false;
    if (f.status !== "open" && f.status !== "all" && r.status !== f.status) return false;
    if (f.mine && r.ownerId !== uid) return false;
    if (words.length) {
      const hay = `${r.title} ${r.area} ${r.number} ${CATEGORIES[r.category].label}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}

export function sortReports(reports: Report[], by: SortBy, here: Point | null = null) {
  const list = [...reports];
  if (by === "newest") return list.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  if (by === "nearest" && here) return list.sort((a, b) => distanceM(here, a) - distanceM(here, b) || a.id.localeCompare(b.id));
  // Most votes first. Fixed reports go last, because the ones still broken are what people want to see.
  return list.sort((a, b) => Number(a.status === "fixed") - Number(b.status === "fixed") || b.votes - a.votes || b.createdAt - a.createdAt || a.id.localeCompare(b.id));
}

/* ── The council's numbers ───────────────────────────────────────────────────────────────────── */

export type Summary = { total: number; reported: number; acknowledged: number; fixed: number; open: number; avgDaysToFix: number | null; fixedPercent: number };

export function summarise(reports: Report[]): Summary {
  const count = (s: Status) => reports.filter((r) => r.status === s).length;
  const fixed = reports.filter((r) => r.status === "fixed" && r.fixedAt > 0);
  const avg = fixed.length ? Math.round((fixed.reduce((sum, r) => sum + daysBetween(r.createdAt, r.fixedAt), 0) / fixed.length) * 10) / 10 : null;
  return {
    total: reports.length,
    reported: count("reported"),
    acknowledged: count("acknowledged"),
    fixed: count("fixed"),
    open: reports.length - count("fixed"),
    avgDaysToFix: avg,
    fixedPercent: reports.length ? Math.round((count("fixed") / reports.length) * 100) : 0,
  };
}

/** "1 person" / "14 people" */
export const peopleLabel = (n: number) => `${n} ${n === 1 ? "person sees" : "people see"} this`;
