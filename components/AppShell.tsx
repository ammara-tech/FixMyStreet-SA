"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useDemoFlag } from "@/lib/auth";
import { firebaseConfigured } from "@/lib/firebase";
import { connect, disconnect, reportProblem, useApp } from "@/lib/store";
import { seedDemoOnce } from "@/lib/demo";
import DemoBanner from "@/components/DemoBanner";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import LoginScreen from "@/components/LoginScreen";
import Logo, { Wordmark } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import Toasts from "@/components/Toasts";

/*
  Wraps every page.
  - A report's own page (/report?id=…) is open to everyone, signed in or not, so a report can be
    shared on WhatsApp. Someone who isn't signed in sees it read-only, with a way in.
  - Every other page needs an account (a guest account counts), so until someone signs in they see
    the sign-in screen.
  The real protection is in firestore.rules.
*/
const PUBLIC = ["/report"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return <Shell publicPage={PUBLIC.some((p) => path.startsWith(p))}>{children}</Shell>;
}

function Shell({ publicPage, children }: { publicPage: boolean; children: React.ReactNode }) {
  const auth = useAuth();
  const demoFlag = useDemoFlag();
  const app = useApp();
  const user = auth.status === "signedIn" ? auth.user : null;
  const demo = Boolean(user?.isAnonymous && demoFlag);
  const guest = Boolean(user?.isAnonymous && !demoFlag);

  useEffect(() => {
    if (user) connect(user.uid, demo);
    else disconnect();
  }, [user, demo]);

  // "Try the demo": a demo guest with no reports yet gets the example reports, once (lib/demo.ts)
  useEffect(() => {
    if (demo && user && app.status === "ready" && app.uid === user.uid && app.reports.length === 0) seedDemoOnce(user.uid);
  }, [demo, user, app.status, app.uid, app.reports.length]);

  if (!firebaseConfigured) return <SetupNeeded />;

  // Someone who isn't signed in: the sign-in screen, or on a shared report its page without the app around it
  if (!user) {
    if (publicPage) return <PublicFrame>{children}</PublicFrame>;
    if (auth.status !== "loading") return <LoginScreen />;
    return (
      <>
        <div className="gate-splash">
          <Splash text="Opening FixMyStreet SA…" />
        </div>
        <div className="gate-login">
          <LoginScreen />
        </div>
      </>
    );
  }
  if (app.status === "loading" || app.uid !== user.uid) return <Splash text={demo ? "Setting up the example reports…" : "Opening the map…"} />;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded focus:bg-card focus:px-4 focus:py-2">
        Skip to the main content
      </a>
      {demo && <DemoBanner />}
      <Header demo={demo} guest={guest} />
      <main id="main" className="mx-auto max-w-6xl px-4 pb-24 pt-5">
        {!app.online && (
          <p className="mb-4 flex items-start gap-2 rounded-md border border-line bg-card px-4 py-3 text-sm">
            <Icon name="cloudOff" className="mt-0.5 h-4 w-4 shrink-0 text-rep" />
            <span>
              <strong>You&apos;re offline.</strong> You can still see the reports saved on this device. Reports and votes are sent when you&apos;re back online.
            </span>
          </p>
        )}
        {app.problem && (
          <p role="alert" className="mb-4 flex items-start gap-3 rounded-md border border-rep/40 bg-card px-4 py-3 text-sm">
            <span className="flex-1">{app.problem}</span>
            <button type="button" onClick={() => reportProblem(null)} aria-label="Close" className="text-ink-soft hover:text-ink">
              <Icon name="close" className="h-4 w-4" />
            </button>
          </p>
        )}
        {children}
      </main>
      <Toasts />
    </>
  );
}

/* A shared report for someone who isn't signed in: the report, and a way to join in */
function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="on-dark bg-asphalt text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="FixMyStreet SA: sign in and see the map">
            <Logo className="h-10 w-10 shrink-0" />
            <Wordmark className="text-[1.65rem]" dark />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle className="tool" />
            <Link href="/" className="rounded-md bg-brand px-3 py-1.5 font-display text-base font-bold uppercase tracking-wide text-on-brand hover:brightness-105">
              Sign in
            </Link>
          </div>
        </div>
        <div className="hazard" aria-hidden="true" />
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 pb-24 pt-5">
        {children}
      </main>
      <Toasts />
    </>
  );
}

function Splash({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-ink-soft">
      <Logo className="h-16 w-16 motion-safe:animate-pulse" />
      <p role="status">{text}</p>
    </div>
  );
}

/* Shown only to a developer who hasn't added the Firebase settings yet */
function SetupNeeded() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-5xl">FixMyStreet SA needs its Firebase settings</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Add the four <code>NEXT_PUBLIC_FIREBASE_</code> settings (see the README and <code>.env.example</code>), then restart the app or redeploy.
      </p>
    </div>
  );
}
