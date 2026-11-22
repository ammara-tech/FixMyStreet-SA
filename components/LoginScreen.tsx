"use client";

import { useEffect, useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import Logo, { Wordmark } from "@/components/Logo";
import StatusBadge from "@/components/StatusBadge";
import StatusStepper from "@/components/StatusStepper";
import ThemeToggle from "@/components/ThemeToggle";
import { authErrorMessage, errorCode, finishRedirectSignIn, resetPassword, signInDemo, signInEmail, signInGoogle, signInGuest, signUpEmail } from "@/lib/auth";
import { pinInner } from "@/lib/pin";

/*
  The sign-in screen: a council survey map. On a laptop, the headline and a picture of a map with
  pins, a job card and a road-works sign sit beside the form. On a phone it's the headline, the form
  and a small sign. Residents can also just look: "Browse as a guest" needs no email or password.
*/
export default function LoginScreen() {
  const [mode, setMode] = useState<"signIn" | "create">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; code: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Opened from a "Try the demo" link (…/?demo): the demo box goes to the top
  const [fromDemoLink, setFromDemoLink] = useState(false);
  useEffect(() => {
    setFromDemoLink(new URLSearchParams(window.location.search).has("demo"));
  }, []);

  // If Google sign-in went the full-page way and failed, say why when the page comes back.
  useEffect(() => {
    finishRedirectSignIn().catch((e) => {
      setError({ text: authErrorMessage(e), code: errorCode(e) });
      console.error("Sign-in failed:", errorCode(e) || e);
    });
  }, []);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      setError({ text: authErrorMessage(e), code: errorCode(e) });
      console.error("Sign-in failed:", errorCode(e) || e); // the code, for whoever is fixing it
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    run(() => (mode === "signIn" ? signInEmail(email, password) : signUpEmail(email, password)));
  }

  async function forgot() {
    if (!email.trim()) {
      setError({ text: 'Type your email address first, then press "Forgot your password?" again.', code: "" });
      return;
    }
    await run(async () => {
      await resetPassword(email);
      setNotice("If there's an account for that email, a reset link is on its way. Check your inbox.");
    });
  }

  const demoBox = (
    <div className="rounded-lg border-2 border-dashed border-edge bg-brand-soft p-3.5 text-ink">
      <p className="font-display text-xl font-bold uppercase tracking-wide">Just looking?</p>
      <p className="mt-0.5 text-sm">Browse the map as a guest, or try the council view with example reports. No account needed.</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button type="button" disabled={busy} onClick={() => run(signInGuest)} className="btn-quiet py-2 text-sm">
          Browse as a guest
        </button>
        <button type="button" disabled={busy} onClick={() => run(signInDemo)} className="btn py-2 text-base">
          Try the demo
        </button>
      </div>
    </div>
  );

  return (
    <div className="survey min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-4 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-8">
        <Intro />

        <main className="w-full">
          <div className="mb-3 flex justify-end">
            <ThemeToggle />
          </div>
          <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl border-2 border-asphalt bg-card shadow-[0_6px_0_#141416]">
            <div className="hazard" aria-hidden="true" />
            <div className="p-6 sm:px-8 sm:py-5">
              <p className="eyebrow text-center">{mode === "signIn" ? "Welcome back" : "Join in"}</p>
              <h1 className="mt-1 text-center text-4xl">{mode === "signIn" ? "Sign in" : "Create your account"}</h1>
              {fromDemoLink && <div className="mt-5">{demoBox}</div>}

              <button type="button" disabled={busy} onClick={() => run(signInGoogle)} className="btn-quiet mt-4 w-full py-2.5">
                <Icon name="google" />
                Continue with Google
              </button>

              <p className="my-3 flex items-center gap-3 text-sm text-ink-soft before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">or</p>

              <form onSubmit={submit} className="space-y-3.5">
                <label className="block text-sm font-semibold">
                  Email
                  <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-1 py-2 font-normal" />
                </label>
                <div>
                  <label htmlFor="password" className="text-sm font-semibold">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="password"
                      type={show ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field py-2 pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      aria-pressed={show}
                      className="absolute inset-y-0 right-2 my-auto h-9 rounded-md px-3 text-sm font-bold text-ink underline-offset-2 hover:underline"
                    >
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                {error && (
                  <div role="alert" className="text-sm font-semibold text-rep">
                    <p>{error.text}</p>
                    {error.code && <p className="mt-1 text-xs font-normal opacity-80">Error code: {error.code}</p>}
                  </div>
                )}
                {notice && (
                  <p role="status" className="text-sm font-semibold text-fix">
                    {notice}
                  </p>
                )}
                <button type="submit" disabled={busy} className="btn w-full py-2.5">
                  {mode === "signIn" ? "Sign in" : "Create account"}
                </button>
              </form>

              {mode === "signIn" && (
                <button type="button" onClick={forgot} className="mt-3 text-sm font-semibold text-brand-text underline-offset-2 hover:underline">
                  Forgot your password?
                </button>
              )}

              <p className="mt-3 text-ink-soft">
                {mode === "signIn" ? "New here? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signIn" ? "create" : "signIn");
                    setError(null);
                    setNotice(null);
                  }}
                  className="font-bold text-brand-text underline underline-offset-2"
                >
                  {mode === "signIn" ? "Create an account" : "Sign in"}
                </button>
              </p>
              {!fromDemoLink && <div className="mt-4">{demoBox}</div>}
              <p className="mt-3 text-xs text-ink-soft">Reports are public. Your email address is never shown on one.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/*
  The headline, and on a laptop a picture: a street map with pins, a job card and a road-works sign.
  The picture is decoration (screen readers skip it). The headline isn't the page's heading: "Sign in" is the h1.
*/
function Intro() {
  return (
    <aside className="pt-2">
      <p className="flex items-center gap-2.5">
        <Logo className="h-12 w-12" />
        <Wordmark className="text-3xl" />
      </p>
      <p className="font-display mt-5 text-5xl font-bold uppercase leading-[0.98] tracking-wide sm:text-6xl">
        Spot it.
        <br />
        Pin it.
        <br />
        <span className="rounded-md bg-brand px-2 text-on-brand">Get it fixed.</span>
      </p>
      <p className="mt-4 max-w-lg text-lg text-ink-soft">
        Report a pothole, a broken streetlight or a burst pipe on the map. Neighbours add their vote, the most-voted problems rise to the top, and the municipality&apos;s progress is there for everyone to see.
      </p>

      <div aria-hidden="true" className="relative mt-6 hidden h-[18.5rem] max-w-xl select-none lg:block">
        <div className="absolute inset-0 overflow-hidden rounded-xl border-2 border-asphalt shadow-[0_6px_0_#141416]">
          <svg viewBox="0 0 480 336" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
            <rect width="480" height="336" style={{ fill: "var(--color-card)" }} />
            <rect x="150" y="104" width="150" height="112" rx="8" fill="#6fae5a" opacity=".32" />
            <g style={{ stroke: "var(--color-line)" }} strokeWidth="15" fill="none">
              <path d="M-10 88H490" />
              <path d="M-10 236H490" />
              <path d="M118 -10V346" />
              <path d="M338 -10V346" />
            </g>
            <path d="M-10 312 200 168 490 18" stroke="#5c5b57" strokeWidth="22" fill="none" />
            <path d="M-10 312 200 168 490 18" stroke="#ffc20e" strokeWidth="2.500" strokeDasharray="11 9" fill="none" />
            <g transform="translate(70 28)" dangerouslySetInnerHTML={{ __html: pinInner("reported") }} />
            <g transform="translate(214 108)" dangerouslySetInnerHTML={{ __html: pinInner("reported") }} />
            <g transform="translate(372 174)" dangerouslySetInnerHTML={{ __html: pinInner("acknowledged") }} />
            <g transform="translate(138 232)" dangerouslySetInnerHTML={{ __html: pinInner("fixed") }} />
            <g transform="translate(380 40)" dangerouslySetInnerHTML={{ __html: pinInner("fixed") }} />
          </svg>
        </div>

        <div className="hazard absolute -left-5 top-9 w-64 -rotate-[9deg] border-y-2 border-asphalt" />

        <div className="ticket absolute bottom-5 left-5 w-[17.5rem] rotate-[-2deg] bg-card p-4 shadow-[0_8px_0_rgb(20_20_22/0.9)]" data-status="acknowledged">
          <p className="flex items-center gap-2">
            <StatusBadge status="acknowledged" />
            <span className="font-mono text-xs font-semibold text-ink-soft">FMS-2K7Q</span>
          </p>
          <p className="font-display mt-1.5 text-2xl font-bold leading-tight">Burst pipe on the corner</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <Icon name="pin" className="h-4 w-4" /> Orlando West · 58 people see this
          </p>
          <div className="stub mt-3 pt-3">
            <StatusStepper status="acknowledged" />
          </div>
        </div>

        <Logo className="absolute -right-3 -top-5 h-24 w-24 rotate-[8deg] drop-shadow-[0_8px_8px_rgba(0,0,0,0.35)]" />
      </div>
    </aside>
  );
}
