import { describe, expect, it } from "vitest";
import { readReport } from "@/lib/read";

describe("reading a saved report", () => {
  const saved = {
    ownerId: "u1",
    number: "FMS-4K7Q",
    title: "Deep pothole",
    category: "pothole",
    description: "Left lane",
    area: "Braamfontein",
    lat: -26.1929,
    lng: 28.0326,
    status: "acknowledged",
    statusNote: "Crew booked",
    votes: 12,
    demo: false,
    createdAt: 1000,
    updatedAt: 2000,
    fixedAt: 0,
  };
  it("reads a complete report as it is", () => {
    expect(readReport("abc", saved)).toEqual({ id: "abc", ...saved });
  });
  it("fills in what is missing, so one odd report doesn't stop the map", () => {
    const r = readReport("x", {});
    expect(r.title).toBe("Untitled report");
    expect(r.number).toBe("FMS-????");
    expect(r.category).toBe("other");
    expect(r.status).toBe("reported");
    expect(r.votes).toBe(0);
    expect(r.demo).toBe(false);
    expect(r.fixedAt).toBe(0);
  });
  it("turns an unknown kind or status into a safe one", () => {
    const r = readReport("x", { ...saved, category: "zebra", status: "banana" });
    expect(r.category).toBe("other");
    expect(r.status).toBe("reported");
  });
  it("never shows a negative or fractional vote count", () => {
    expect(readReport("x", { ...saved, votes: -4 }).votes).toBe(0);
    expect(readReport("x", { ...saved, votes: 3.7 }).votes).toBe(4);
  });
  it("ignores numbers that aren't numbers", () => {
    const r = readReport("x", { ...saved, lat: "far", votes: NaN, createdAt: null });
    expect(r.lat).toBe(0);
    expect(r.votes).toBe(0);
    expect(r.createdAt).toBe(0);
  });
  it("uses the created time when there's no updated time", () => {
    expect(readReport("x", { createdAt: 5000 }).updatedAt).toBe(5000);
  });
  it("only calls a report a demo when it says demo: true", () => {
    expect(readReport("x", { demo: "yes" }).demo).toBe(false);
    expect(readReport("x", { demo: true }).demo).toBe(true);
  });
});
