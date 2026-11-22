import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import AppShell from "@/components/AppShell";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import "./globals.css";

// Everything you read: Barlow, a clear sans that was designed from road and highway signs
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-barlow", display: "swap" });
// Headings and buttons: Barlow Condensed, the narrow letters of a road sign
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow-condensed", display: "swap" });
// Ticket numbers: a typewriter-style face, so FMS-4K7Q is easy to read out over the phone
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: "FixMyStreet SA — report it, vote on it, track it",
  description:
    "Pin a pothole, a broken streetlight or a burst pipe on the map. Neighbours add their vote, the most-voted problems rise to the top, and you can follow the municipality's progress until it's fixed.",
  appleWebApp: { capable: true, title: "FixMyStreet SA", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#141416",
};

// Applies the saved (or the phone's) light/dark theme before the page is drawn, so there's no flash
const themeScript = `try{var t=localStorage.getItem("fms:theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;if(localStorage.getItem("fms:signedIn"))document.documentElement.dataset.signedIn="1"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={`${barlow.variable} ${barlowCondensed.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <AppShell>{children}</AppShell>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
