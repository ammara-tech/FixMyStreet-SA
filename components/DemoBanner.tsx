"use client";

import { useState } from "react";
import { endDemo } from "@/lib/demo";

/*
  The strip at the top while someone is trying the demo (signed in as a guest, lib/demo.ts).
  "End the demo" deletes the example reports and the guest account, which takes them back to the
  sign-in screen, where they can make a real account.
*/
export default function DemoBanner() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function end() {
    setBusy(true);
    setError(false);
    try {
      await endDemo();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="border-b-2 border-asphalt bg-brand text-on-brand">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <p className="flex-1">
          <strong>You&apos;re trying the demo.</strong> These are example reports that only you can see, and you&apos;re the council for them: open the <strong>Council</strong> page to change a status. Ending the demo deletes them all.
          {error && <span className="ml-1 font-bold">Couldn&apos;t end it. Check your connection and try again.</span>}
        </p>
        <button type="button" onClick={end} disabled={busy} className="rounded-md border-2 border-asphalt bg-asphalt px-3 py-1 font-display text-base font-bold uppercase tracking-wide text-white hover:bg-black disabled:opacity-60">
          {busy ? "Ending…" : "End the demo"}
        </button>
      </div>
    </div>
  );
}
