"use client";

import { collection, doc, increment, writeBatch } from "firebase/firestore";
import { addToast } from "@/lib/store";
import { firebase } from "@/lib/firebase";
import { isDemo } from "@/lib/auth";
import { checkDraft, clean, cleanLong, LIMITS, ticketNumber } from "@/lib/reports";
import type { Report, ReportInput, Status } from "@/lib/types";

/*
  Everything that changes data. Each change is one atomic batch, and firestore.rules checks it:
  a report can only start as "reported" with no votes, a vote and the report's count move together,
  and only council staff (or the owner of a demo report) can change a status.
*/

function me() {
  const user = firebase().auth.currentUser;
  if (!user) throw new Error("Sign in first.");
  return user.uid;
}

const round = (n: number) => Math.round(n * 1e5) / 1e5; // about a metre: more digits only look precise

/**
 * Waits up to a few seconds for a change to reach the server. With weak signal Firestore keeps the
 * change on the device and sends it later, so after that the app carries on instead of waiting, and
 * says so only if the server refuses it in the end.
 */
export async function settle(done: Promise<unknown>, ms = 3500) {
  let late = false;
  const timer = new Promise<void>((resolve) =>
    setTimeout(() => {
      late = true;
      resolve();
    }, ms),
  );
  await Promise.race([done, timer]);
  if (late) done.catch(() => addToast("A change couldn't be saved. Check your connection and try again."));
}

/** Sends a new report. Returns its id (so the page can open it) and the promise of it reaching the server. */
export function createReport(input: ReportInput): { id: string; done: Promise<void> } {
  const problems = checkDraft(input);
  if (Object.keys(problems).length || !input.category || input.lat === null || input.lng === null) throw new Error("Check the report: " + Object.values(problems).join(" "));
  const uid = me();
  const { db } = firebase();
  const ref = doc(collection(db, "reports"));
  const now = Date.now();
  const batch = writeBatch(db);
  batch.set(ref, {
    ownerId: uid,
    number: ticketNumber(),
    title: clean(input.title, LIMITS.title),
    category: input.category,
    description: cleanLong(input.description, LIMITS.description),
    area: clean(input.area, LIMITS.area),
    lat: round(input.lat),
    lng: round(input.lng),
    status: "reported",
    statusNote: "",
    votes: 1, // the person who reports it sees it too
    demo: isDemo(),
    createdAt: now,
    updatedAt: now,
    fixedAt: 0,
  });
  // Their own vote, so "I see this too" starts ticked and they can't vote for their own report twice
  batch.set(doc(db, "votes", `${ref.id}_${uid}`), { reportId: ref.id, uid, at: now });
  return { id: ref.id, done: batch.commit() };
}

/** "I see this too": adds or takes back the person's vote, and the report's count, in one step */
export function toggleVote(report: Pick<Report, "id">, voted: boolean) {
  const uid = me();
  const { db } = firebase();
  const batch = writeBatch(db);
  const vote = doc(db, "votes", `${report.id}_${uid}`);
  if (voted) {
    batch.delete(vote);
    batch.update(doc(db, "reports", report.id), { votes: increment(-1) });
  } else {
    batch.set(vote, { reportId: report.id, uid, at: Date.now() });
    batch.update(doc(db, "reports", report.id), { votes: increment(1) });
  }
  return batch.commit();
}

/** Council: move a report along, with a note anyone can read */
export function setStatus(report: Pick<Report, "id">, status: Status, note: string) {
  me();
  const { db } = firebase();
  const now = Date.now();
  const batch = writeBatch(db);
  batch.update(doc(db, "reports", report.id), {
    status,
    statusNote: clean(note, LIMITS.note),
    updatedAt: now,
    fixedAt: status === "fixed" ? now : 0,
  });
  return batch.commit();
}

/** Deletes a report (its owner while it's only "reported", or council staff), and the person's own vote on it */
export function deleteReport(report: Pick<Report, "id">, hasMyVote: boolean) {
  const uid = me();
  const { db } = firebase();
  const batch = writeBatch(db);
  batch.delete(doc(db, "reports", report.id));
  if (hasMyVote) batch.delete(doc(db, "votes", `${report.id}_${uid}`));
  return batch.commit();
}
