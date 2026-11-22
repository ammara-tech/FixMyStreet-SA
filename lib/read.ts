import { CATEGORIES, STATUSES } from "@/lib/reports";
import type { Category, Report, Status } from "@/lib/types";

/*
  Reads a saved report defensively. Firestore data can be missing fields (an older version of the app,
  a typo in the console), and one odd report shouldn't stop the whole map from drawing.
*/

const text = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

export function readReport(id: string, d: Record<string, unknown>): Report {
  const category = (typeof d.category === "string" && d.category in CATEGORIES ? d.category : "other") as Category;
  const status = (typeof d.status === "string" && d.status in STATUSES ? d.status : "reported") as Status;
  return {
    id,
    ownerId: text(d.ownerId),
    number: text(d.number, "FMS-????"),
    title: text(d.title, "Untitled report"),
    category,
    description: text(d.description),
    area: text(d.area),
    lat: num(d.lat),
    lng: num(d.lng),
    status,
    statusNote: text(d.statusNote),
    votes: Math.max(0, Math.round(num(d.votes))),
    demo: d.demo === true,
    createdAt: num(d.createdAt),
    updatedAt: num(d.updatedAt, num(d.createdAt)),
    fixedAt: num(d.fixedAt),
  };
}
