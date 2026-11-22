"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import StatusBadge from "@/components/StatusBadge";
import StatusEditor from "@/components/StatusEditor";
import { CATEGORIES, sortReports, STATUSES, summarise, timeAgo } from "@/lib/reports";
import { canModerate, useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import type { Report } from "@/lib/types";

/*
  The council's page: the numbers, and the open reports with the most votes first, each with
  controls to move it along. Only for council staff (a staff/{uid} document) or someone trying the
  demo; everyone else sees a short explanation, and firestore.rules refuses their changes anyway.
*/
export default function Council() {
  const app = useApp();
  const now = useNow();
  const [openId, setOpenId] = useState<string | null>(null);
  const totals = useMemo(() => summarise(app.reports), [app.reports]);
  const queue = useMemo(() => sortReports(app.reports.filter((r) => r.status !== "fixed"), "votes"), [app.reports]);
  const fixed = useMemo(() => app.reports.filter((r) => r.status === "fixed").sort((a, b) => b.fixedAt - a.fixedAt), [app.reports]);

  if (!canModerate(app))
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <Icon name="shield" className="mx-auto h-10 w-10 text-ink-soft" />
        <h1 className="mt-3 text-4xl">Council staff only</h1>
        <p className="mt-2 text-ink-soft">This page is for municipal staff who update the status of reports. Residents can follow a report&apos;s progress, and vote, on its own page.</p>
        <Link href="/" className="btn mt-6">
          Back to the map
        </Link>
      </div>
    );

  return (
    <div>
      <p className="eyebrow">{app.demo ? "Demo: you are the council" : "Council view"}</p>
      <h1 className="text-4xl sm:text-5xl">Work queue</h1>
      <p className="mt-1 max-w-2xl text-ink-soft">Open problems, with the ones the most people have seen at the top. Open a report to move it along and leave a note everyone can read.</p>

      <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Numbers">
        <Tile label="Open" value={totals.open} />
        <Tile label="Not yet acknowledged" value={totals.reported} />
        <Tile label="Fixed" value={`${totals.fixedPercent}%`} />
        <Tile label="Average days to fix" value={totals.avgDaysToFix === null ? "–" : totals.avgDaysToFix} />
      </dl>

      <h2 className="mt-8 text-3xl">Open reports ({queue.length})</h2>
      {queue.length === 0 && <p className="plain-card mt-3 p-5 text-ink-soft">Everything reported has been fixed.</p>}
      <ul className="mt-3 space-y-3">
        {queue.map((r) => (
          <Row key={r.id} report={r} now={now} open={openId === r.id} onToggle={() => setOpenId(openId === r.id ? null : r.id)} />
        ))}
      </ul>

      {fixed.length > 0 && (
        <>
          <h2 className="mt-10 text-3xl">Fixed ({fixed.length})</h2>
          <ul className="mt-3 space-y-3">
            {fixed.map((r) => (
              <Row key={r.id} report={r} now={now} open={openId === r.id} onToggle={() => setOpenId(openId === r.id ? null : r.id)} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="plain-card px-3 py-2">
      <dt className="text-sm font-semibold text-ink-soft">{label}</dt>
      <dd className="font-display text-3xl font-bold leading-none">{value}</dd>
    </div>
  );
}

function Row({ report, now, open, onToggle }: { report: Report; now: number; open: boolean; onToggle: () => void }) {
  const cat = CATEGORIES[report.category];
  const panel = `panel-${report.id}`;
  return (
    <li className="ticket" data-status={report.status}>
      <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge status={report.status} />
            <span className="font-mono text-xs font-semibold text-ink-soft">{report.number}</span>
          </p>
          <p className="mt-1 text-xl font-semibold leading-tight">
            <Link href={`/report?id=${report.id}`} className="underline-offset-2 hover:underline">
              {report.title}
            </Link>
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <Icon name={cat.icon} className="h-4 w-4" />
              {cat.short}
            </span>
            {report.area && <span>{report.area}</span>}
            <span>{timeAgo(report.createdAt, now)}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-ink">
              <Icon name="eye" className="h-4 w-4" />
              {report.votes} {report.votes === 1 ? "vote" : "votes"}
            </span>
          </p>
        </div>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panel} className="btn-quiet">
          {open ? "Close" : "Update"}
          <span className="sr-only"> {report.number}</span>
        </button>
      </div>
      {open && (
        <div id={panel} className="stub mx-3 pb-4 pt-4 sm:mx-4">
          <p className="mb-3 text-sm text-ink-soft">Now: {STATUSES[report.status].label}. {STATUSES[report.status].help}</p>
          <StatusEditor report={report} />
        </div>
      )}
    </li>
  );
}
