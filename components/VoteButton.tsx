"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { settle, toggleVote } from "@/lib/actions";
import { addToast } from "@/lib/store";

/*
  "I see this too": adds the person's vote, or takes it back. The number is the report's count, and it
  changes straight away. Someone who isn't signed in, or is in the demo looking at a real report,
  can't vote, so the button says why instead of failing.
*/
export default function VoteButton({ id, votes, voted, allowed = true, className = "" }: { id: string; votes: number; voted: boolean; allowed?: boolean; className?: string }) {
  const [busy, setBusy] = useState(false);

  async function press() {
    if (busy) return;
    setBusy(true);
    try {
      await settle(toggleVote({ id }, voted));
    } catch {
      addToast("Couldn't save your vote. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={press}
      disabled={!allowed || busy}
      aria-pressed={voted}
      aria-label={`I see this too. ${votes} ${votes === 1 ? "person has" : "people have"} said so.${voted ? " You have." : ""}`}
      className={`vote disabled:opacity-60 ${className}`}
    >
      <Icon name="eye" className="h-5 w-5" />
      <span className="font-display text-2xl">{votes}</span>
      <span className="text-xs font-semibold">{voted ? "You see it" : "I see this"}</span>
    </button>
  );
}
