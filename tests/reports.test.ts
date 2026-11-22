import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  CATEGORY_IDS,
  checkDraft,
  clean,
  cleanLong,
  daysBetween,
  distanceLabel,
  distanceM,
  filterReports,
  inSouthAfrica,
  mapsUrl,
  nearbyDuplicates,
  NO_FILTERS,
  peopleLabel,
  sortReports,
  STATUS_IDS,
  STATUSES,
  summarise,
  ticketNumber,
  timeAgo,
} from "@/lib/reports";
import type { Report } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 20, 10, 0, 0);

function report(over: Partial<Report> = {}): Report {
  return {
    id: "r1",
    ownerId: "u1",
    number: "FMS-AAAA",
    title: "Deep pothole in the left lane",
    category: "pothole",
    description: "",
    area: "Braamfontein",
    lat: -26.1929,
    lng: 28.0326,
    status: "reported",
    statusNote: "",
    votes: 5,
    demo: false,
    createdAt: NOW - 3 * DAY,
    updatedAt: NOW - 3 * DAY,
    fixedAt: 0,
    ...over,
  };
}

describe("categories and statuses", () => {
  it("every category has a label, a short name, an icon and an example", () => {
    for (const id of CATEGORY_IDS) {
      const c = CATEGORIES[id];
      expect(c.label.length).toBeGreaterThan(3);
      expect(c.short.length).toBeGreaterThan(2);
      expect(c.icon.length).toBeGreaterThan(1);
      expect(c.hint.length).toBeGreaterThan(5);
    }
  });
  it("has eight kinds of problem, with 'other' last", () => {
    expect(CATEGORY_IDS).toHaveLength(8);
    expect(CATEGORY_IDS[CATEGORY_IDS.length - 1]).toBe("other");
  });
  it("a report goes reported, then acknowledged, then fixed", () => {
    expect(STATUS_IDS).toEqual(["reported", "acknowledged", "fixed"]);
    expect(STATUS_IDS.map((s) => STATUSES[s].step)).toEqual([0, 1, 2]);
  });
});

describe("tickets", () => {
  it("looks like FMS- and four letters or numbers", () => {
    expect(ticketNumber()).toMatch(/^FMS-[2-9A-HJ-NP-Z]{4}$/);
  });
  it("never uses letters and numbers that look alike (0 O 1 I)", () => {
    for (let i = 0; i < 500; i++) expect(ticketNumber()).not.toMatch(/[01IO]/);
  });
  it("can be tested with a fixed 'random'", () => {
    expect(ticketNumber(() => 0)).toBe("FMS-2222");
    expect(ticketNumber(() => 0.999999)).toBe("FMS-ZZZZ");
  });
  it("is always eight characters, which firestore.rules checks", () => {
    expect(ticketNumber()).toHaveLength(8);
  });
});

describe("places in South Africa", () => {
  it("accepts Johannesburg, Cape Town, Durban and Musina", () => {
    expect(inSouthAfrica(-26.2, 28.05)).toBe(true);
    expect(inSouthAfrica(-33.92, 18.42)).toBe(true);
    expect(inSouthAfrica(-29.86, 31.02)).toBe(true);
    expect(inSouthAfrica(-22.35, 30.04)).toBe(true);
  });
  it("refuses a pin in London, in the sea, or with no number", () => {
    expect(inSouthAfrica(51.5, -0.12)).toBe(false);
    expect(inSouthAfrica(-45, 20)).toBe(false);
    expect(inSouthAfrica(Number.NaN, 20)).toBe(false);
    expect(inSouthAfrica(-26, Infinity)).toBe(false);
  });
});

describe("cleaning what people type", () => {
  it("collapses spaces and cuts to a length", () => {
    expect(clean("  Deep   pothole \n here ", 80)).toBe("Deep pothole here");
    expect(clean("abcdef", 3)).toBe("abc");
  });
  it("keeps line breaks in the details, but not more than one blank line", () => {
    expect(cleanLong("First line  \r\n\r\n\r\n\r\nSecond   line", 500)).toBe("First line\n\nSecond line");
  });
});

describe("checking a report before it is sent", () => {
  const good = { title: "Pothole outside the school", category: "pothole" as const, description: "", area: "", lat: -26.2, lng: 28.05 };
  it("accepts a complete report", () => {
    expect(checkDraft(good)).toEqual({});
  });
  it("asks for a kind of problem", () => {
    expect(checkDraft({ ...good, category: "" }).category).toBeTruthy();
  });
  it("asks for a title of at least five letters, not counting spaces around it", () => {
    expect(checkDraft({ ...good, title: "  hi  " }).title).toBeTruthy();
    expect(checkDraft({ ...good, title: "Hello" }).title).toBeUndefined();
  });
  it("stops a title that is too long", () => {
    expect(checkDraft({ ...good, title: "x".repeat(81) }).title).toBeTruthy();
    expect(checkDraft({ ...good, title: "x".repeat(80) }).title).toBeUndefined();
  });
  it("asks for a pin, and for it to be in South Africa", () => {
    expect(checkDraft({ ...good, lat: null, lng: null }).location).toContain("Tap the map");
    expect(checkDraft({ ...good, lat: 51.5, lng: -0.12 }).location).toContain("South Africa");
  });
  it("lists every problem at once", () => {
    expect(Object.keys(checkDraft({ title: "", category: "", description: "", area: "", lat: null, lng: null })).sort()).toEqual(["category", "location", "title"]);
  });
});

describe("distances", () => {
  it("is zero for the same place", () => {
    expect(distanceM({ lat: -26.2, lng: 28 }, { lat: -26.2, lng: 28 })).toBe(0);
  });
  it("Johannesburg to Pretoria is about 54 km", () => {
    const km = distanceM({ lat: -26.2041, lng: 28.0473 }, { lat: -25.7479, lng: 28.2293 }) / 1000;
    expect(km).toBeGreaterThan(50);
    expect(km).toBeLessThan(58);
  });
  it("one thousandth of a degree of latitude is about 111 metres", () => {
    const m = distanceM({ lat: -26.2, lng: 28 }, { lat: -26.201, lng: 28 });
    expect(m).toBeGreaterThan(105);
    expect(m).toBeLessThan(117);
  });
  it("is written in metres, then kilometres", () => {
    expect(distanceLabel(4)).toBe("10 m");
    expect(distanceLabel(850)).toBe("850 m");
    expect(distanceLabel(2340)).toBe("2.3 km");
    expect(distanceLabel(15200)).toBe("15 km");
  });
  it("makes a Google Maps link with the six-figure position", () => {
    expect(mapsUrl({ lat: -26.1929, lng: 28.0326 })).toBe("https://www.google.com/maps/search/?api=1&query=-26.192900,28.032600");
  });
});

describe("duplicates", () => {
  const near = report({ id: "near" }); // the same place as the draft
  const sameSpotOtherKind = report({ id: "other", category: "water" });
  const fixed = report({ id: "fixed", status: "fixed" });
  const far = report({ id: "far", lat: -26.2, lng: 28.1 });
  const closeButNotTooClose = report({ id: "ok", lat: -26.1929 + 0.0006, lng: 28.0326 }); // about 67 m
  const all = [far, fixed, sameSpotOtherKind, closeButNotTooClose, near];
  const draft = { category: "pothole" as const, lat: -26.1929, lng: 28.0326 };

  it("finds open reports of the same kind within 100 metres, nearest first", () => {
    expect(nearbyDuplicates(draft, all).map((r) => r.id)).toEqual(["near", "ok"]);
  });
  it("ignores fixed reports, other kinds of problem and far-away ones", () => {
    const ids = nearbyDuplicates(draft, all).map((r) => r.id);
    expect(ids).not.toContain("fixed");
    expect(ids).not.toContain("other");
    expect(ids).not.toContain("far");
  });
  it("finds nothing until there is a kind and a pin", () => {
    expect(nearbyDuplicates({ category: "", lat: -26.1929, lng: 28.0326 }, all)).toEqual([]);
    expect(nearbyDuplicates({ category: "pothole", lat: null, lng: null }, all)).toEqual([]);
  });
  it("can look further away", () => {
    expect(nearbyDuplicates(draft, all, 20).map((r) => r.id)).toEqual(["near"]);
  });
});

describe("time", () => {
  it("says how long ago", () => {
    expect(timeAgo(NOW - 20_000, NOW)).toBe("just now");
    expect(timeAgo(NOW - 5 * 60_000, NOW)).toBe("5 min ago");
    expect(timeAgo(NOW - 60 * 60_000, NOW)).toBe("1 hour ago");
    expect(timeAgo(NOW - 3 * 3600_000, NOW)).toBe("3 hours ago");
    expect(timeAgo(NOW - DAY, NOW)).toBe("1 day ago");
    expect(timeAgo(NOW - 6 * DAY, NOW)).toBe("6 days ago");
    expect(timeAgo(NOW - 21 * DAY, NOW)).toBe("3 weeks ago");
    expect(timeAgo(NOW - 95 * DAY, NOW)).toBe("3 months ago");
  });
  it("never says the future", () => {
    expect(timeAgo(NOW + 5000, NOW)).toBe("just now");
  });
  it("counts days between, with a minimum of one", () => {
    expect(daysBetween(NOW, NOW + 5 * 3600_000)).toBe(1);
    expect(daysBetween(NOW, NOW + 3 * DAY)).toBe(3);
    expect(daysBetween(NOW, NOW + 3 * DAY + 1)).toBe(4);
  });
});

describe("filtering", () => {
  const list = [
    report({ id: "a", title: "Deep pothole", category: "pothole", area: "Braamfontein", number: "FMS-AB23", ownerId: "me" }),
    report({ id: "b", title: "Burst pipe", category: "water", area: "Orlando West", status: "acknowledged" }),
    report({ id: "c", title: "Streetlight out", category: "streetlight", area: "Newtown", status: "fixed" }),
  ];
  const ids = (l: Report[]) => l.map((r) => r.id);
  it("shows everything with no filters", () => {
    expect(ids(filterReports(list, NO_FILTERS, "me"))).toEqual(["a", "b", "c"]);
  });
  it("filters by kind and by status", () => {
    expect(ids(filterReports(list, { ...NO_FILTERS, category: "water" }, null))).toEqual(["b"]);
    expect(ids(filterReports(list, { ...NO_FILTERS, status: "fixed" }, null))).toEqual(["c"]);
    expect(ids(filterReports(list, { ...NO_FILTERS, status: "open" }, null))).toEqual(["a", "b"]);
  });
  it("shows only my reports", () => {
    expect(ids(filterReports(list, { ...NO_FILTERS, mine: true }, "me"))).toEqual(["a"]);
    expect(ids(filterReports(list, { ...NO_FILTERS, mine: true }, null))).toEqual([]);
  });
  it("searches the title, the area, the ticket and the kind, ignoring capitals", () => {
    expect(ids(filterReports(list, { ...NO_FILTERS, text: "ORLANDO" }, null))).toEqual(["b"]);
    expect(ids(filterReports(list, { ...NO_FILTERS, text: "fms-ab23" }, null))).toEqual(["a"]);
    expect(ids(filterReports(list, { ...NO_FILTERS, text: "pipe" }, null))).toEqual(["b"]);
    expect(ids(filterReports(list, { ...NO_FILTERS, text: "streetlight" }, null))).toEqual(["c"]);
  });
  it("needs every word to match", () => {
    expect(ids(filterReports(list, { ...NO_FILTERS, text: "deep braam" }, null))).toEqual(["a"]);
    expect(ids(filterReports(list, { ...NO_FILTERS, text: "deep newtown" }, null))).toEqual([]);
  });
});

describe("sorting", () => {
  const a = report({ id: "a", votes: 10, createdAt: NOW - 5 * DAY, lat: -26.2, lng: 28.1 });
  const b = report({ id: "b", votes: 30, createdAt: NOW - 9 * DAY, lat: -26.1929, lng: 28.0326 });
  const c = report({ id: "c", votes: 99, createdAt: NOW - 1 * DAY, status: "fixed", lat: -26.19, lng: 28.03 });
  const d = report({ id: "d", votes: 30, createdAt: NOW - 2 * DAY, lat: -26.3, lng: 28.2 });
  const ids = (l: Report[]) => l.map((r) => r.id);
  it("puts the most votes first, with fixed reports last", () => {
    expect(ids(sortReports([a, b, c, d], "votes"))).toEqual(["d", "b", "a", "c"]);
  });
  it("breaks a tie in votes with the newest first", () => {
    expect(ids(sortReports([b, d], "votes"))).toEqual(["d", "b"]);
  });
  it("puts the newest first", () => {
    expect(ids(sortReports([a, b, c, d], "newest"))).toEqual(["c", "d", "a", "b"]);
  });
  it("puts the nearest first once it knows where you are", () => {
    expect(ids(sortReports([a, b, c, d], "nearest", { lat: -26.1929, lng: 28.0326 }))).toEqual(["b", "c", "a", "d"]);
  });
  it("falls back to votes when it doesn't know where you are", () => {
    expect(ids(sortReports([a, b, c, d], "nearest", null))).toEqual(["d", "b", "a", "c"]);
  });
  it("does not change the list it was given", () => {
    const list = [a, b];
    sortReports(list, "newest");
    expect(ids(list)).toEqual(["a", "b"]);
  });
});

describe("the council's numbers", () => {
  it("is all zeros when there are no reports", () => {
    expect(summarise([])).toEqual({ total: 0, reported: 0, acknowledged: 0, fixed: 0, open: 0, avgDaysToFix: null, fixedPercent: 0 });
  });
  it("counts each status, what is still open, the share fixed and the average days to fix", () => {
    const s = summarise([
      report({ id: "1" }),
      report({ id: "2", status: "acknowledged" }),
      report({ id: "3", status: "fixed", createdAt: NOW - 10 * DAY, fixedAt: NOW - 8 * DAY }), // 2 days
      report({ id: "4", status: "fixed", createdAt: NOW - 10 * DAY, fixedAt: NOW - 5 * DAY }), // 5 days
    ]);
    expect(s).toEqual({ total: 4, reported: 1, acknowledged: 1, fixed: 2, open: 2, avgDaysToFix: 3.5, fixedPercent: 50 });
  });
  it("leaves out the average for a fixed report with no fixed time", () => {
    expect(summarise([report({ status: "fixed", fixedAt: 0 })]).avgDaysToFix).toBeNull();
  });
});

describe("words", () => {
  it("says 1 person sees this, and 14 people see this", () => {
    expect(peopleLabel(1)).toBe("1 person sees this");
    expect(peopleLabel(14)).toBe("14 people see this");
    expect(peopleLabel(0)).toBe("0 people see this");
  });
});
