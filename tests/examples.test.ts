import { describe, expect, it } from "vitest";
import { EXAMPLES } from "@/lib/examples";
import { CATEGORIES, checkDraft, inSouthAfrica, LIMITS, STATUSES } from "@/lib/reports";

describe("the demo's example reports", () => {
  it("has a dozen, with a mix of all three statuses", () => {
    expect(EXAMPLES).toHaveLength(12);
    for (const s of Object.keys(STATUSES)) expect(EXAMPLES.filter((e) => e.status === s).length).toBeGreaterThan(1);
  });
  it("covers several kinds of problem", () => {
    expect(new Set(EXAMPLES.map((e) => e.category)).size).toBeGreaterThanOrEqual(6);
    for (const e of EXAMPLES) expect(e.category in CATEGORIES).toBe(true);
  });
  it("would all pass the same checks as a report from the form", () => {
    for (const e of EXAMPLES) expect(checkDraft({ title: e.title, category: e.category, description: e.description, area: e.area, lat: e.lat, lng: e.lng })).toEqual({});
  });
  it("are all in South Africa, around Johannesburg", () => {
    for (const e of EXAMPLES) {
      expect(inSouthAfrica(e.lat, e.lng)).toBe(true);
      expect(e.lat).toBeGreaterThan(-26.4);
      expect(e.lat).toBeLessThan(-26.0);
      expect(e.lng).toBeGreaterThan(27.7);
      expect(e.lng).toBeLessThan(28.3);
    }
  });
  it("fit the limits firestore.rules sets", () => {
    for (const e of EXAMPLES) {
      expect(e.description.length).toBeLessThanOrEqual(LIMITS.description);
      expect(e.area.length).toBeLessThanOrEqual(LIMITS.area);
      expect((e.note ?? "").length).toBeLessThanOrEqual(LIMITS.note);
      expect(e.votes).toBeGreaterThanOrEqual(0);
      expect(e.votes).toBeLessThanOrEqual(200);
    }
  });
  it("only fixed reports say how long the fix took, and it finished before now", () => {
    for (const e of EXAMPLES) {
      if (e.status === "fixed") {
        expect(e.fixedAfter).toBeGreaterThan(0);
        expect(e.fixedAfter as number).toBeLessThan(e.daysAgo);
        expect((e.note ?? "").length).toBeGreaterThan(0);
      } else expect(e.fixedAfter).toBeUndefined();
    }
  });
  it("gives each acknowledged report a note from the municipality", () => {
    for (const e of EXAMPLES.filter((x) => x.status === "acknowledged")) expect((e.note ?? "").length).toBeGreaterThan(0);
  });
  it("has no two the same", () => {
    expect(new Set(EXAMPLES.map((e) => e.title)).size).toBe(EXAMPLES.length);
    expect(new Set(EXAMPLES.map((e) => `${e.lat},${e.lng}`)).size).toBe(EXAMPLES.length);
  });
});
