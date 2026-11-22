"use client";

import { useEffect, useState } from "react";
import { settle, setStatus } from "@/lib/actions";
import { LIMITS, STATUS_IDS, STATUSES } from "@/lib/reports";
import { addToast } from "@/lib/store";
import type { Report, Status } from "@/lib/types";

/*
  The council's controls for one report: where it has got to, and a note anyone can read ("A crew is
  booked for Thursday"). Only shown to council staff, or to someone trying the demo on their own example
  reports; firestore.rules refuses everyone else even if they found a way to press it.
*/
export default function StatusEditor({ report }: { report: Report }) {
  const [status, setStatusValue] = useState<Status>(report.status);
  const [note, setNote] = useState(report.statusNote);
  const [busy, setBusy] = useState(false);

  // If the report changes underneath (another staff member), show what it is now
  useEffect(() => {
    setStatusValue(report.status);
    setNote(report.statusNote);
  }, [report.status, report.statusNote]);

  const changed = status !== report.status || note.trim() !== report.statusNote;

  async function save() {
    setBusy(true);
    try {
      await settle(setStatus(report, status, note));
      addToast(`${report.number} is now ${STATUSES[status].label.toLowerCase()}.`);
    } catch {
      addToast("Couldn't update the report. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const noteId = `note-${report.id}`;
  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={`Status of ${report.number}`} className="flex flex-wrap gap-2">
        {STATUS_IDS.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={status === s} onClick={() => setStatusValue(s)} className="chip">
            {STATUSES[s].label}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor={noteId} className="text-sm font-semibold">
          Note for the public <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input id={noteId} value={note} maxLength={LIMITS.note} onChange={(e) => setNote(e.target.value)} placeholder="A crew is booked for Thursday" className="field mt-1 py-2" />
      </div>
      <button type="button" onClick={save} disabled={!changed || busy} className="btn py-2 text-base">
        {busy ? "Saving…" : "Save update"}
      </button>
    </div>
  );
}
