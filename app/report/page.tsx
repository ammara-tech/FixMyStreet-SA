"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import Icon from "@/components/Icon";
import ReportMap from "@/components/ReportMap";
import StatusBadge from "@/components/StatusBadge";
import StatusEditor from "@/components/StatusEditor";
import StatusStepper from "@/components/StatusStepper";
import VoteButton from "@/components/VoteButton";
import { deleteReport, settle } from "@/lib/actions";
import { copyText } from "@/lib/browser";
import { firebase } from "@/lib/firebase";
import { readReport } from "@/lib/read";
import { CATEGORIES, daysBetween, mapsUrl, peopleLabel, STATUSES, timeAgo } from "@/lib/reports";
import { addToast, useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import type { Report } from "@/lib/types";

/*
  One report. Open to everyone, signed in or not, so it can be shared on WhatsApp. Signed-out visitors
  read it; signed-in ones can also say "I see this too". The owner can delete it while it's only "reported",
  and council staff (or someone trying the demo, on their own example reports) can move it along.
*/
export default function ReportPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-ink-soft">Opening the report…</p>}>
      <Inner />
    </Suspense>
  );
}

type Load = { status: "loading" } | { status: "missing" } | { status: "error" } | { status: "ready"; report: Report };

function Inner() {
  const id = useSearchParams().get("id") ?? "";
  const app = useApp();
  const router = useRouter();
  const now = useNow();
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Watches this one report, so a vote or a status change shows up by itself
  useEffect(() => {
    if (!id) {
      setLoad({ status: "missing" });
      return;
    }
    setLoad({ status: "loading" });
    return onSnapshot(
      doc(firebase().db, "reports", id),
      (snap) => setLoad(snap.exists() ? { status: "ready", report: readReport(snap.id, snap.data()) } : { status: "missing" }),
      () => setLoad({ status: "error" }),
    );
  }, [id]);

  if (load.status === "loading") return <p role="status" className="py-10 text-center text-ink-soft">Opening the report…</p>;
  if (load.status !== "ready")
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <Icon name="search" className="mx-auto h-10 w-10 text-ink-soft" />
        <h1 className="mt-3 text-4xl">We couldn&apos;t open that report</h1>
        <p className="mt-2 text-ink-soft">{load.status === "missing" ? "It may have been deleted, or the link may be mistyped." : "It may be private, or your connection dropped. Check it and try again."}</p>
        <Link href="/" className="btn mt-6">
          Back to the map
        </Link>
      </div>
    );

  const report = load.report;
  const signedIn = app.status === "ready" && Boolean(app.uid);
  const mine = signedIn && report.ownerId === app.uid;
  const voted = Boolean(app.voted[report.id]);
  // The demo only votes on its own example reports, so a demo never adds to a real report's count
  const canVote = signedIn && (report.demo ? mine : !app.demo);
  const canChangeStatus = signedIn && (report.demo ? mine && app.demo : app.isStaff);
  const canDelete = signedIn && (mine ? report.status === "reported" || report.demo : app.isStaff && !report.demo);
  const cat = CATEGORIES[report.category];

  async function share() {
    const url = `${window.location.origin}/report?id=${report.id}`;
    const text = `${report.title} (${report.number}) on FixMyStreet SA`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: report.title, text, url });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return; // they closed the share sheet
      }
    }
    addToast((await copyText(url)) ? "Link copied. Paste it into a WhatsApp group." : "Couldn't copy the link.");
  }

  async function remove() {
    setDeleting(true);
    try {
      await settle(deleteReport(report, voted));
      addToast("Report deleted.");
      router.replace("/");
    } catch {
      addToast("Couldn't delete the report. Check your connection and try again.");
      setDeleting(false);
    }
  }

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
        <Icon name="left" className="h-4 w-4" /> {signedIn ? "All reports" : "FixMyStreet SA"}
      </Link>

      <div className="ticket mt-3 p-4 sm:p-6" data-status={report.status}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <StatusBadge status={report.status} />
          <span className="font-mono text-sm font-semibold text-ink-soft">{report.number}</span>
          {report.demo && <span className="badge bg-brand-soft text-brand-text">Example</span>}
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl">{report.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <Icon name={cat.icon} className="h-4 w-4" />
            {cat.label}
          </span>
          {report.area && (
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" className="h-4 w-4" />
              {report.area}
            </span>
          )}
          <span>Reported {timeAgo(report.createdAt, now)}</span>
        </p>

        <div className="stub mt-5 pt-5">
          <StatusStepper status={report.status} />
          <p className="mt-3 text-center text-sm text-ink-soft">
            {STATUSES[report.status].help}
            {report.status === "fixed" && report.fixedAt > 0 && <> Fixed {timeAgo(report.fixedAt, now)}, {daysBetween(report.createdAt, report.fixedAt)} {daysBetween(report.createdAt, report.fixedAt) === 1 ? "day" : "days"} after it was reported.</>}
          </p>
        </div>

        {report.statusNote && (
          <div className="mt-4 rounded-lg border-2 border-asphalt bg-brand-soft p-3 text-ink">
            <p className="font-display text-lg font-bold uppercase tracking-wide">Update from the municipality</p>
            <p>{report.statusNote}</p>
            <p className="mt-1 text-xs text-ink-soft">{timeAgo(report.updatedAt, now)}</p>
          </div>
        )}

        {report.description && <p className="mt-5 whitespace-pre-line text-lg">{report.description}</p>}
      </div>

      <section aria-labelledby="h-vote" className="plain-card mt-5 flex flex-wrap items-center gap-4 p-4">
        <VoteButton id={report.id} votes={report.votes} voted={voted} allowed={canVote} />
        <div className="min-w-0 flex-1">
          <h2 id="h-vote" className="text-2xl">
            {peopleLabel(report.votes)}
          </h2>
          <p className="text-sm text-ink-soft">
            {canVote
              ? voted
                ? "Thanks. Press the button again to take your vote back."
                : "Press I see this if you've seen it too. More votes put it higher on the council's list."
              : !signedIn
                ? "Sign in to add your vote."
                : "Voting is switched off for real reports during the demo."}
          </p>
          {!signedIn && (
            <Link href="/" className="btn mt-2 py-1.5 text-base">
              Sign in or browse as a guest
            </Link>
          )}
        </div>
        <button type="button" onClick={share} className="btn-quiet">
          <Icon name="share" className="h-4 w-4" /> Share
        </button>
      </section>

      <section aria-labelledby="h-where" className="mt-5">
        <h2 id="h-where" className="text-2xl">
          Where it is
        </h2>
        <div className="mt-2">
          <ReportMap mode="single" label={`Map showing where: ${report.title}`} reports={[report]} className="h-64" />
        </div>
        <a href={mapsUrl(report)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-text underline underline-offset-2">
          <Icon name="pin" className="h-4 w-4" /> Open in Google Maps
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </section>

      {canChangeStatus && (
        <section aria-labelledby="h-council" className="plain-card mt-6 border-2 !border-asphalt p-4">
          <h2 id="h-council" className="flex items-center gap-2 text-2xl">
            <Icon name="shield" className="h-6 w-6" /> Council: update this report
          </h2>
          <div className="mt-3">
            <StatusEditor report={report} />
          </div>
        </section>
      )}

      {canDelete && (
        <section aria-label="Delete this report" className="mt-6">
          {!confirming ? (
            <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-rep underline underline-offset-2">
              <Icon name="trash" className="h-4 w-4" /> Delete this report
            </button>
          ) : (
            <div role="alert" className="rounded-lg border-2 border-rep bg-card p-4">
              <p className="font-semibold">Delete this report? It comes off the map and its votes are lost.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={remove} disabled={deleting} className="btn-quiet !border-rep !text-rep">
                  {deleting ? "Deleting…" : "Yes, delete it"}
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="btn-quiet">
                  Keep it
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
