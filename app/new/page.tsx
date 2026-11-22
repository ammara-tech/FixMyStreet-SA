"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import ReportCard from "@/components/ReportCard";
import ReportMap from "@/components/ReportMap";
import { createReport } from "@/lib/actions";
import { CATEGORIES, CATEGORY_IDS, checkDraft, LIMITS, nearbyDuplicates, type DraftProblems } from "@/lib/reports";
import { addToast, useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import type { Category } from "@/lib/types";

/*
  Making a report: what's wrong, where it is (tap the map), and a few words. Before it's sent, any open report
  of the same kind within 100 metres is shown, so people vote for it instead of making a duplicate.
*/
export default function NewReport() {
  const app = useApp();
  const router = useRouter();
  const now = useNow();
  const [category, setCategory] = useState<Category | "">("");
  const [place, setPlace] = useState<{ lat: number; lng: number } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [problems, setProblems] = useState<DraftProblems>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState("");

  const duplicates = useMemo(() => nearbyDuplicates({ category, lat: place?.lat ?? null, lng: place?.lng ?? null }, app.reports), [category, place, app.reports]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const input = { title, category, description, area, lat: place?.lat ?? null, lng: place?.lng ?? null };
    const found = checkDraft(input);
    setProblems(found);
    setFailed("");
    if (Object.keys(found).length) {
      // Take the person to the first thing that needs fixing
      const first = found.category ? "category" : found.location ? "where" : "title";
      document.getElementById(first)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    send(input);
  }

  async function send(input: Parameters<typeof createReport>[0]) {
    setBusy(true);
    try {
      const { id, done } = createReport(input);
      // Up to a few seconds for the server; with weak signal it carries on and sends it later
      let late = false;
      await Promise.race([
        done,
        new Promise<void>((resolve) =>
          setTimeout(() => {
            late = true;
            resolve();
          }, 3500),
        ),
      ]);
      if (late) done.catch(() => addToast("Your report couldn't be saved. Check your connection and send it again."));
      addToast(late ? "Saved on this phone. It will be sent when you're back online." : "Reported. Thank you for putting it on the map.");
      router.push(`/report?id=${id}`);
    } catch {
      setFailed("Your report couldn't be sent. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-3xl">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
        <Icon name="left" className="h-4 w-4" /> All reports
      </Link>
      <p className="eyebrow mt-3">New report</p>
      <h1 className="text-4xl sm:text-5xl">Report a problem</h1>

      <section id="category" aria-labelledby="h-what" className="mt-6">
        <h2 id="h-what" className="text-2xl">
          <span className="mr-2 inline-grid h-8 w-8 place-items-center rounded-full bg-brand font-display text-xl text-on-brand">1</span>
          What&apos;s wrong?
        </h2>
        <div role="radiogroup" aria-labelledby="h-what" aria-describedby={problems.category ? "e-category" : undefined} className="mt-3 flex flex-wrap gap-2">
          {CATEGORY_IDS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={category === c} onClick={() => setCategory(c)} className="chip !py-2 !text-base">
              <Icon name={CATEGORIES[c].icon} className="h-5 w-5" />
              {CATEGORIES[c].label}
            </button>
          ))}
        </div>
        {problems.category && (
          <p id="e-category" role="alert" className="mt-2 text-sm font-semibold text-rep">
            {problems.category}
          </p>
        )}
      </section>

      <section id="where" aria-labelledby="h-where" className="mt-8">
        <h2 id="h-where" className="text-2xl">
          <span className="mr-2 inline-grid h-8 w-8 place-items-center rounded-full bg-brand font-display text-xl text-on-brand">2</span>
          Where is it?
        </h2>
        <p className="mt-1 text-ink-soft">Zoom in and tap the map right on the problem, or press Use my location if you&apos;re standing next to it. Drag the yellow pin to adjust it. With a keyboard, move the map with the arrow keys and press Enter to drop the pin in the middle.</p>
        <div className="mt-3">
          <ReportMap mode="pick" label="Map: tap where the problem is" reports={app.reports} pick={place} onPick={setPlace} onLocate={setPlace} className="h-[20rem] sm:h-[24rem]" />
        </div>
        <p role="status" className="mt-2 text-sm">
          {place ? (
            <span className="inline-flex items-center gap-1 font-semibold">
              <Icon name="check" className="h-4 w-4 text-fix" /> Pin placed. Zoom in and drag it if it isn&apos;t exactly right.
            </span>
          ) : (
            <span className="text-ink-soft">No pin yet.</span>
          )}
        </p>
        {problems.location && (
          <p role="alert" className="mt-1 text-sm font-semibold text-rep">
            {problems.location}
          </p>
        )}
      </section>

      {duplicates.length > 0 && (
        <section aria-labelledby="h-dupes" className="mt-8 rounded-lg border-2 border-asphalt bg-brand-soft p-4">
          <h2 id="h-dupes" className="text-2xl">
            Is it already reported?
          </h2>
          <p className="mt-1 text-sm">
            {duplicates.length === 1 ? "There's an open report" : `There are ${duplicates.length} open reports`} of the same kind within 100 metres. If it&apos;s the same problem, press <strong>I see this</strong> on it. More votes put it higher on the council&apos;s list.
          </p>
          <ul className="mt-3 space-y-3">
            {duplicates.slice(0, 3).map((r) => (
              <ReportCard key={r.id} report={r} voted={Boolean(app.voted[r.id])} now={now} />
            ))}
          </ul>
          <p className="mt-3 text-sm">Not the same problem? Carry on below.</p>
        </section>
      )}

      <section aria-labelledby="h-more" className="mt-8">
        <h2 id="h-more" className="text-2xl">
          <span className="mr-2 inline-grid h-8 w-8 place-items-center rounded-full bg-brand font-display text-xl text-on-brand">3</span>
          Tell us a little more
        </h2>
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor="title" className="font-semibold">
              Describe it in a few words
            </label>
            <input
              id="title"
              value={title}
              maxLength={LIMITS.title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={Boolean(problems.title)}
              aria-describedby={problems.title ? "e-title" : undefined}
              placeholder={category ? CATEGORIES[category].hint : "Deep pothole outside the taxi rank"}
              className="field mt-1"
            />
            {problems.title && (
              <p id="e-title" role="alert" className="mt-1 text-sm font-semibold text-rep">
                {problems.title}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="area" className="font-semibold">
              Street or suburb <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <input id="area" value={area} maxLength={LIMITS.area} onChange={(e) => setArea(e.target.value)} placeholder="Corner of Main Road, Orlando West" className="field mt-1" />
          </div>
          <div>
            <label htmlFor="description" className="font-semibold">
              Details <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <textarea id="description" rows={4} value={description} maxLength={LIMITS.description} onChange={(e) => setDescription(e.target.value)} placeholder="How long has it been like this? Is it dangerous? Who does it affect?" className="field mt-1" />
            <p className="mt-1 text-right text-xs text-ink-soft">
              {description.length} / {LIMITS.description}
            </p>
          </div>
        </div>
      </section>

      <p className="mt-4 text-sm text-ink-soft">Reports are public and show the place, your description and when you sent it. They don&apos;t show your name or email.</p>

      {failed && (
        <p role="alert" className="mt-3 text-sm font-semibold text-rep">
          {failed}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="btn px-8 py-3 text-xl">
          <Icon name="send" className="h-5 w-5" />
          {busy ? "Sending…" : "Send report"}
        </button>
        <Link href="/" className="btn-quiet">
          Cancel
        </Link>
      </div>
    </form>
  );
}
