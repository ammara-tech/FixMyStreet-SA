"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import StatusBadge from "@/components/StatusBadge";
import VoteButton from "@/components/VoteButton";
import { CATEGORIES, distanceLabel, distanceM, timeAgo } from "@/lib/reports";
import type { Report } from "@/lib/types";

/* One report as a job card: its status, ticket number, title, place, and "I see this too" */
export default function ReportCard({
  report,
  voted,
  now,
  here,
  selected = false,
  voteAllowed = true,
  onShow,
}: {
  report: Report;
  voted: boolean;
  now: number;
  here?: { lat: number; lng: number } | null;
  selected?: boolean;
  voteAllowed?: boolean;
  onShow?: (id: string) => void;
}) {
  const cat = CATEGORIES[report.category];
  return (
    <li id={`card-${report.id}`} className="ticket rise" data-status={report.status} data-selected={selected}>
      <div className="flex gap-3 p-3 sm:p-4">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge status={report.status} />
            <span className="font-mono text-xs font-semibold text-ink-soft">{report.number}</span>
          </p>
          <h3 className="mt-1.5 text-[1.35rem] leading-tight">
            <Link href={`/report?id=${report.id}`} className="underline-offset-2 hover:underline">
              {report.title}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <Icon name={cat.icon} className="h-4 w-4" />
              {cat.short}
            </span>
            {report.area && (
              <span className="inline-flex items-center gap-1">
                <Icon name="pin" className="h-4 w-4" />
                {report.area}
              </span>
            )}
            <span>{timeAgo(report.createdAt, now)}</span>
            {here && <span>{distanceLabel(distanceM(here, report))} away</span>}
          </p>
          {onShow && (
            <button type="button" onClick={() => onShow(report.id)} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-text underline-offset-2 hover:underline">
              <Icon name="map" className="h-4 w-4" />
              Show on the map
              <span className="sr-only">: {report.title}</span>
            </button>
          )}
        </div>
        <VoteButton id={report.id} votes={report.votes} voted={voted} allowed={voteAllowed} className="self-start" />
      </div>
    </li>
  );
}
