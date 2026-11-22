"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import Logo, { Wordmark } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { signOutUser } from "@/lib/auth";
import { canModerate, useApp } from "@/lib/store";

/* The top of every page: asphalt black with the logo, three places to go, the theme and sign-out, and hazard tape underneath */
export default function Header({ demo, guest }: { demo: boolean; guest: boolean }) {
  const app = useApp();
  const path = usePathname();
  const links = [
    { href: "/", label: "Map", icon: "map" as const, here: path === "/" },
    { href: "/new", label: "Report a problem", icon: "plus" as const, here: path.startsWith("/new") },
    ...(canModerate(app) ? [{ href: "/council", label: "Council", icon: "shield" as const, here: path.startsWith("/council") }] : []),
  ];
  return (
    <header className="on-dark bg-asphalt text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="FixMyStreet SA: the map">
          <Logo className="h-10 w-10 shrink-0" />
          <Wordmark className="text-[1.65rem]" dark />
        </Link>
        <nav aria-label="Main" className="order-3 flex w-full gap-1 sm:order-none sm:ml-4 sm:w-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.here ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-lg font-semibold uppercase tracking-wide ${l.here ? "bg-brand text-on-brand" : "text-white hover:bg-white/15"}`}
            >
              <Icon name={l.icon} className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          {app.pending && (
            <span className="mr-2 text-xs text-white/80" role="status">
              Saving…
            </span>
          )}
          <ThemeToggle className="tool" />
          {!demo && (
            <button
              type="button"
              onClick={() => signOutUser()}
              className="tool px-3 text-sm font-semibold"
              aria-label={guest ? "Leave guest mode" : "Sign out"}
            >
              <Icon name="logout" className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{guest ? "Leave" : "Sign out"}</span>
            </button>
          )}
        </div>
      </div>
      <div className="hazard" aria-hidden="true" />
    </header>
  );
}
