"use client";

import { deleteUser } from "firebase/auth";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { firebase } from "@/lib/firebase";
import { setDemo, signOutUser } from "@/lib/auth";
import { ticketNumber } from "@/lib/reports";
import { EXAMPLES } from "@/lib/examples";

/*
  "Try the demo": look around FixMyStreet SA with example reports, without an account.
  - The guest gets their own private account (Firebase anonymous sign-in, lib/auth.ts), so the
    security rules protect a demo exactly like a real account.
  - A demo guest's reports are marked demo: true. Only they can read them, so made-up reports never
    reach the real map, and they have the council's powers over them, to try changing a status.
  - The first time a demo guest has no reports yet, it's filled with example reports around
    Johannesburg (lib/examples.ts). A note on the device remembers that, so deleting them doesn't bring them back.
  - "End the demo" deletes the reports and the guest's votes, then the guest account itself.
*/

const DAY = 24 * 60 * 60 * 1000;

const seededKey = (uid: string) => `fms:demoSeeded:${uid}`;

/** Fills a new demo guest's account with the example reports, once */
export function seedDemoOnce(uid: string) {
  try {
    if (localStorage.getItem(seededKey(uid))) return;
    localStorage.setItem(seededKey(uid), "1");
  } catch {
    /* storage blocked: still seed */
  }
  seedDemo(uid).catch(() => {}); // if it fails, the usual empty screen is still there
}

async function seedDemo(uid: string) {
  const { db } = firebase();
  const now = Date.now();
  const batch = writeBatch(db);
  EXAMPLES.forEach((e, i) => {
    const createdAt = now - e.daysAgo * DAY - i * 37 * 60_000;
    const fixed = e.status === "fixed";
    batch.set(doc(collection(db, "reports")), {
      ownerId: uid,
      number: ticketNumber(),
      title: e.title,
      category: e.category,
      description: e.description,
      area: e.area,
      lat: e.lat,
      lng: e.lng,
      status: e.status,
      statusNote: e.note ?? "",
      votes: e.votes,
      demo: true,
      createdAt,
      updatedAt: fixed ? createdAt + (e.fixedAfter ?? 1) * DAY : e.status === "acknowledged" ? now - DAY : createdAt,
      fixedAt: fixed ? createdAt + (e.fixedAfter ?? 1) * DAY : 0,
    });
  });
  await batch.commit();
}

/** Deletes the demo reports, the guest's votes and the guest account. Needs a connection. */
export async function endDemo() {
  const { db, auth } = firebase();
  const user = auth.currentUser;
  if (!user) return;
  const [reports, votes] = await Promise.all([
    getDocs(query(collection(db, "reports"), where("ownerId", "==", user.uid), where("demo", "==", true))),
    getDocs(query(collection(db, "votes"), where("uid", "==", user.uid))),
  ]);
  // A batch holds up to 500 changes, far more than a demo has
  const batch = writeBatch(db);
  reports.docs.forEach((d) => batch.delete(d.ref));
  votes.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  try {
    localStorage.removeItem(seededKey(user.uid));
  } catch {
    /* nothing to remove */
  }
  setDemo(false);
  try {
    await deleteUser(user);
  } catch {
    await signOutUser(); // if Firebase won't delete it, at least sign out
  }
}
