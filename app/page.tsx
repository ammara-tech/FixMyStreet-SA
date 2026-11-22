"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import ReportCard from "@/components/ReportCard";
import ReportMap from "@/components/ReportMap";
import { locate, locateMessage, type Place } from "@/lib/geo";
import { CATEGORIES, CATEGORY_IDS, filterReports, NO_FILTERS, sortReports, STATUSES, STATUS_IDS, summarise, type Filters, type SortBy } from "@/lib/reports";
import { addToast, useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";

/* The first page: the map and, beside it, the same reports as a list you can filter and sort */
export default function Home() {
  const app = useApp();
  const now = useNow();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<SortBy>("votes");
  const [here, setHere] = useState<Place | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const shown = useMemo(() => sortReports(filterReports(app.reports, filters, app.uid), sort, here), [app.reports, app.uid, filters, sort, here]);
  const totals = useMemo(() => summarise(app.reports), [app.reports]);
  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);

  async function changeSort(next: SortBy) {
    if (next === "nearest" && !here) {
      try {
        setHere(await locate());
      } catch (e) {
        addToast(locateMessage(e));
        return;
      }
    }
    setSort(next);
  }

  const update = (change: Partial<Filters>) => setFilters((f) => ({ ...f, ...change }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{app.demo ? "Example reports" : "Reports near you and across South Africa"}</p>
          <h1 className="text-4xl sm:text-5xl">What&apos;s broken?</h1>
        </div>
        <Link href="/new" className="btn">
          <Icon name="plus" className="h-5 w-5" /> Report a problem
        </Link>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 sm:max-w-xl" aria-label="Totals">
        <Total label="Reported" value={totals.reported} status="reported" />
        <Total label="Acknowledged" value={totals.acknowledged} status="acknowledged" />
        <Total label="Fixed" value={totals.fixed} status="fixed" />
      </dl>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
        <div className="order-2 min-w-0 lg:order-1">
          <div className="space-y-3">
            <div>
              <label htmlFor="search" className="sr-only">
                Search reports
              </label>
              <div className="relative">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" />
                <input id="search" type="search" value={filters.text} onChange={(e) => update({ text: e.target.value })} placeholder="Search by street, suburb or ticket" className="field pl-10" />
              </div>
            </div>

            <div role="radiogroup" aria-label="Kind of problem" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
              <button type="button" role="radio" aria-checked={filters.category === "all"} onClick={() => update({ category: "all" })} className="chip">
                All kinds
              </button>
              {CATEGORY_IDS.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={filters.category === c} onClick={() => update({ category: c })} className="chip">
                  <Icon name={CATEGORIES[c].icon} className="h-4 w-4" />
                  {CATEGORIES[c].short}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div role="radiogroup" aria-label="Status" className="flex flex-wrap gap-2">
                <button type="button" role="radio" aria-checked={filters.status === "all"} onClick={() => update({ status: "all" })} className="chip">
                  Any status
                </button>
                {STATUS_IDS.map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={filters.status === s} onClick={() => update({ status: s })} className="chip">
                    {STATUSES[s].label}
                  </button>
                ))}
              </div>
              {!app.demo && (
                <button type="button" aria-pressed={filters.mine} onClick={() => update({ mine: !filters.mine })} className="chip">
                  My reports
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="sort" className="font-semibold">
                Sort by
              </label>
              <select id="sort" value={sort} onChange={(e) => changeSort(e.target.value as SortBy)} className="field w-auto py-1.5 pr-8 text-sm">
                <option value="votes">Most votes</option>
                <option value="newest">Newest</option>
                <option value="nearest">Nearest to me</option>
              </select>
              <p role="status" className="ml-auto text-ink-soft">
                {shown.length} {shown.length === 1 ? "report" : "reports"}
              </p>
            </div>
          </div>

          {shown.length > 0 && (
            <ul className="mt-4 space-y-3">
              {shown.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  voted={Boolean(app.voted[r.id])}
                  now={now}
                  here={sort === "nearest" ? here : null}
                  selected={selected === r.id}
                  onShow={(id) => {
                    setSelected(id);
                    document.getElementById("map")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                  }}
                />
              ))}
            </ul>
          )}

          {shown.length === 0 && (
            <div className="plain-card mt-4 p-6 text-center">
              <Icon name={filtered ? "search" : "pin"} className="mx-auto h-9 w-9 text-ink-soft" />
              <h2 className="mt-2 text-2xl">{filtered ? "No reports match" : "Nothing reported yet"}</h2>
              <p className="mx-auto mt-1 max-w-xs text-ink-soft">{filtered ? "Try a different kind of problem or status, or clear the search." : "Be the first: spot a problem, pin it on the map, and your neighbours can add their votes."}</p>
              {filtered ? (
                <button type="button" onClick={() => setFilters(NO_FILTERS)} className="btn-quiet mt-4">
                  Clear the filters
                </button>
              ) : (
                <Link href="/new" className="btn mt-4">
                  Report a problem
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2" id="map">
          <div className="lg:sticky lg:top-4">
            <ReportMap
              mode="browse"
              label="Map of reported problems. The list has the same reports."
              reports={shown}
              selectedId={selected}
              onSelect={(id) => {
                setSelected(id);
                document.getElementById(`card-${id}`)?.scrollIntoView({ block: "nearest" });
              }}
              onLocate={setHere}
              className="h-[19rem] lg:h-[calc(100vh-9rem)] lg:min-h-[28rem]"
            />
            <p className="mt-2 text-sm text-ink-soft">
              <span className="font-semibold">Pins:</span> red ! reported, blue clock acknowledged, green tick fixed. Tap a pin to select its report.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Total({ label, value, status }: { label: string; value: number; status: "reported" | "acknowledged" | "fixed" }) {
  return (
    <div className="ticket px-3 py-2" data-status={status}>
      <dt className="text-sm font-semibold text-ink-soft">{label}</dt>
      <dd className="font-display text-3xl font-bold leading-none">{value}</dd>
    </div>
  );
}
