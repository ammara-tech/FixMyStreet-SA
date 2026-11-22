import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATEGORY_IDS, LIMITS, SA_BOUNDS, STATUS_IDS } from "@/lib/reports";

/*
  firestore.rules can only be fully tested with Firebase's emulator, but the numbers and lists in it must
  match the ones in the app. If someone adds a category in lib/reports.ts and forgets the rules, the form would
  accept it and Firestore would refuse it. These tests catch that, and check the rules never open a write to everyone.
*/
const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
const list = (re: RegExp) => [...(rules.match(re)?.[1] ?? "").matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1]);

describe("firestore.rules matches the app", () => {
  it("accepts exactly the app's kinds of problem", () => {
    expect(list(/d\.category in \[([^\]]*)\]/)).toEqual(CATEGORY_IDS);
  });
  it("accepts exactly the app's statuses, when a report is made and when council changes it", () => {
    expect(list(/d\.status in \[([^\]]*)\]/)).toEqual(STATUS_IDS);
    expect(list(/request\.resource\.data\.status in \[([^\]]*)\]/)).toEqual(STATUS_IDS);
  });
  it("uses the app's limits for the title, details, place name and council note", () => {
    expect(rules).toContain(`d.title.size() >= ${LIMITS.titleMin} && d.title.size() <= ${LIMITS.title}`);
    expect(rules).toContain(`d.description.size() <= ${LIMITS.description}`);
    expect(rules).toContain(`d.area.size() <= ${LIMITS.area}`);
    expect(rules).toContain(`d.statusNote.size() <= ${LIMITS.note}`);
  });
  it("uses the app's box around South Africa", () => {
    expect(rules).toContain(`d.lat >= ${SA_BOUNDS.south.toFixed(1)} && d.lat <= ${SA_BOUNDS.north.toFixed(1)}`);
    expect(rules).toContain(`d.lng >= ${SA_BOUNDS.west} && d.lng <= ${SA_BOUNDS.east.toFixed(1)}`);
  });
  it("accepts a ticket of eight characters, like FMS-4K7Q", () => {
    expect(rules).toContain("d.number.size() == 8");
  });
  it("lists the same fields the app saves", () => {
    expect(list(/d\.keys\(\)\.hasOnly\(\[([^\]]*'ownerId'[^\]]*)\]\)/)).toEqual(["ownerId", "number", "title", "category", "description", "area", "lat", "lng", "status", "statusNote", "votes", "demo", "createdAt", "updatedAt", "fixedAt"]);
  });
});

describe("firestore.rules never opens a write to everyone", () => {
  it("has no 'allow create/update/delete/write: if true'", () => {
    expect(rules).not.toMatch(/allow\s+[^:]*\b(create|update|delete|write)\b[^:]*:\s*if\s+true/);
  });
  it("makes every change need a signed-in person", () => {
    const writes = rules.split("\n").filter((l) => /allow\s+(create|update|delete)/.test(l));
    expect(writes.length).toBeGreaterThan(3);
    for (const line of writes) expect(line).toContain("signedIn()");
  });
  it("lets the app only look at its own staff document, never write one", () => {
    const staff = rules.slice(rules.indexOf("match /staff/{uid}"));
    expect(staff).toContain("allow get: if signedIn() && request.auth.uid == uid");
    expect(staff).not.toMatch(/allow\s+(create|update|delete|write)/);
  });
  it("keeps demo reports private to their owner", () => {
    expect(rules).toContain("resource.data.demo == false || (signedIn() && resource.data.ownerId == request.auth.uid)");
  });
  it("only lets a vote's own person read it", () => {
    expect(rules).toContain("allow read: if signedIn() && resource.data.uid == request.auth.uid");
  });
});
