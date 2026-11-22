"use client";

import { useSyncExternalStore } from "react";
import { collection, doc, limit, onSnapshot, query, where, type Unsubscribe } from "firebase/firestore";
import { firebase } from "@/lib/firebase";
import { readReport } from "@/lib/read";
import type { Report } from "@/lib/types";

/*
  The app's live copy of the reports, kept up to date by Firestore.
  - A resident watches every public report (not the demo ones), plus which of them they've voted for.
  - Someone trying the demo watches only their own example reports.
  - Council staff are recognised by a document made by hand in the Firebase console (staff/{uid}).
  When someone votes or changes a status, it shows straight away, even with weak signal: Firestore
  saves it on the device first ("pending") and sends it when it can.
*/

export type Toast = { id: number; text: string };

export type AppState = {
  uid: string | null;
  demo: boolean;
  status: "loading" | "ready";
  reports: Report[];
  voted: Record<string, true>;
  isStaff: boolean;
  pending: boolean;
  online: boolean;
  toasts: Toast[];
  problem: string | null;
};

const empty: AppState = { uid: null, demo: false, status: "loading", reports: [], voted: {}, isStaff: false, pending: false, online: true, toasts: [], problem: null };
let state: AppState = empty;

const listeners = new Set<() => void>();
function set(change: Partial<AppState>) {
  state = { ...state, ...change };
  listeners.forEach((l) => l());
}

let stops: Unsubscribe[] = [];
let connectedKey = "";
let toastId = 0;
const pendingParts = new Map<string, boolean>();

function setPending(part: string, value: boolean) {
  pendingParts.set(part, value);
  set({ pending: [...pendingParts.values()].some(Boolean) });
}

export function addToast(text: string) {
  const toast = { id: ++toastId, text };
  set({ toasts: [...state.toasts, toast].slice(-3) });
  setTimeout(() => dismissToast(toast.id), 5000);
}

export function dismissToast(id: number) {
  set({ toasts: state.toasts.filter((t) => t.id !== id) });
}

export function reportProblem(problem: string | null) {
  set({ problem });
}

const onOnline = () => set({ online: navigator.onLine });

export function connect(uid: string, demo: boolean) {
  const key = `${uid}:${demo ? "demo" : "live"}`;
  if (connectedKey === key) return;
  disconnect();
  connectedKey = key;
  set({ uid, demo, status: "loading", online: navigator.onLine });
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOnline);
  const { db } = firebase();

  // The reports. The query's filters match what firestore.rules allows, so Firestore accepts it.
  const reports = demo
    ? query(collection(db, "reports"), where("ownerId", "==", uid), where("demo", "==", true), limit(100))
    : query(collection(db, "reports"), where("demo", "==", false), limit(400));

  stops = [
    onSnapshot(
      reports,
      { includeMetadataChanges: true },
      (snap) => {
        setPending("reports", snap.metadata.hasPendingWrites);
        // Only the server's answer says "none": an empty copy on this device may just be out of date
        if (snap.empty && snap.metadata.fromCache && state.status === "loading") return;
        set({ reports: snap.docs.map((d) => readReport(d.id, d.data())), status: "ready" });
      },
      () => set({ status: "ready", problem: "Couldn't load the reports. Check your connection and refresh the page." }),
    ),
    // Which reports this person has voted for
    onSnapshot(
      query(collection(db, "votes"), where("uid", "==", uid)),
      { includeMetadataChanges: true },
      (snap) => {
        setPending("votes", snap.metadata.hasPendingWrites);
        const voted: Record<string, true> = {};
        snap.docs.forEach((d) => {
          const id = d.data().reportId;
          if (typeof id === "string") voted[id] = true;
        });
        set({ voted });
      },
      () => {},
    ),
    // Council staff: a staff/{uid} document made by hand
    onSnapshot(
      doc(db, "staff", uid),
      (snap) => set({ isStaff: snap.exists() }),
      () => set({ isStaff: false }),
    ),
  ];
}

export function disconnect() {
  stops.forEach((s) => s());
  stops = [];
  connectedKey = "";
  window.removeEventListener("online", onOnline);
  window.removeEventListener("offline", onOnline);
  pendingParts.clear();
  if (state !== empty) set({ ...empty, toasts: state.toasts });
}

export function getApp() {
  return state;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, getApp, getApp);
}

/** Council powers: real staff, or anyone trying the demo (their example reports are theirs alone) */
export const canModerate = (app: Pick<AppState, "demo" | "isStaff">) => app.demo || app.isStaff;
