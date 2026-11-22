# FixMyStreet SA

**Spot it. Pin it. Get it fixed.** Report a pothole, a broken streetlight, a burst pipe or a dead robot (traffic
light) by dropping a pin on a map. Neighbours say **"I see this too"**, the most-voted problems rise to the top, and
the municipality's progress (*Reported → Acknowledged → Fixed*) is there for everyone to see, with a note from the
council on each one.

**Live site:** https://fix-my-street-sa.vercel.app/

Built by Ammara Badat as part of my portfolio. It uses Firebase, like my other apps since PaperTrail.

## Who it's for
Anyone in South Africa who is tired of reporting the same pothole on three different WhatsApp groups. The usual way
is a phone call to a call centre, a reference number nobody can find later, and no way to tell whether anyone else
has already reported it or whether it's ever been fixed. Residents get one public place to report, find and
back a problem; the council gets one queue that shows what the most people are suffering with first.

## What it does

**For residents** (a guest account is enough, no email needed)
- **The map:** every report as a pin. Red with a **!** is *reported*, blue with a clock is *acknowledged*, green with a
  tick is *fixed*, so colour is never the only clue. Tap a pin to find its card in the list.
- **The list beside it:** search by street, suburb or ticket number, filter by kind of problem and by status, sort
  by *most votes*, *newest* or *nearest to me*, or show only *my reports*.
- **Report a problem in three steps:** what's wrong (potholes, streetlights, water leaks, sewage, dumping, robots,
  road signs, other), where (tap the map, **Use my location**, or drag the pin), and a few words. Each report gets a
  ticket number like **FMS-4K7Q**.
- **Duplicate check:** if the same kind of problem was already reported within 100 metres, the form shows it first
  so you can vote for it instead of adding another.
- **"I see this too":** one vote per person per report. You can take it back.
- **Share a report:** every report has its own link that opens for anyone, signed in or not, so it can go on a
  WhatsApp group. **Open in Google Maps** gives a driver or a crew the exact spot.
- **Delete** your own report while nobody has looked at it yet.

**For council staff**
- **A work queue** of open reports, most-voted first, with the numbers at the top: how many are open, acknowledged
  and fixed, the share fixed, and the **average days to fix**.
- **Move a report along** (*Reported*, *Acknowledged*, *Fixed*) with a note anyone can read ("A crew is booked for
  Thursday"). Staff are added by hand (see Setup), so nobody can make themselves council.
- **Try the demo:** twelve example reports around Johannesburg that only you can see, where *you* are the council,
  so you can change a status and watch the map and the numbers change. No account needed. **End the demo** deletes
  them.

**For everyone**
- Works on phones and laptops, light and dark mode, and is **installable** ("Add to Home screen"). The reports
  already loaded stay on the device, so the app opens with weak signal, and votes and reports are sent when the
  connection is back.

## Design
Road signs and council paperwork. Concrete-grey paper with a faint survey grid, **asphalt black** for the header,
and the **yellow of a road-works sign** for buttons and the chosen filter, with hazard tape as the divider. Each
problem is a **job card** with a coloured edge (red, blue, green), a ticket number in a typewriter font and a
progress stepper. The logo is a yellow road-works diamond with a map pin standing in a pothole. Headings are in
Barlow Condensed (the narrow letters of a road sign), ticket numbers in IBM Plex Mono, and everything else in
Barlow. Dark mode is the night shift: asphalt paper and the same yellow, with the map tiles dimmed. Each of my
apps has its own look; this is FixMyStreet SA's.

- **Signing in:** a survey map with pins, a job card and a road-works sign beside the form.
- **The map page:** the list on the left and a sticky map on the right on a laptop, the map above the list on a phone.
- **A report's page:** the card, its three-stop progress, the council's note in a yellow box, the vote and the map.

Text colours pass WCAG AA contrast in both themes, and a status is always shown with a word and an icon as well as a colour.

## Tech stack
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Firebase Authentication (email and password,
Google, and anonymous guest accounts) and Cloud Firestore, Leaflet with OpenStreetMap tiles (free, no key), Vitest,
GitHub Actions, Vercel.

## Project structure
```
app/              The map (/), New report (/new), One report (/report?id=), the council's queue (/council),
                  the layout, the app manifest, icons and the light/dark script
components/       The sign-in screen, header, map, report card, vote button, status badge and stepper, council
                  status editor, demo banner, messages, icons and the logo
lib/              The rules of a report (reports.ts: categories, tickets, places, duplicates, filtering, sorting,
                  the council's numbers), the example reports (examples.ts), map pins (pin.ts), location (geo.ts),
                  reading saved data (read.ts), the live copy (store.ts) and changes (actions.ts), sign-in and the demo
tests/            Unit tests for lib/ and for firestore.rules' lists and limits (npm test)
firestore.rules   Who can read and change what
public/           The offline service worker and the app icons
```

## How the important parts work

**One vote per person, and nobody can type in a number** (`lib/actions.ts` and `firestore.rules`). A vote is a small
document, `votes/{reportId}_{uid}`, so a person can only have one per report. Adding it and raising the report's
count by one happen in a single **batch**, and the rules check that the two match: the count can only go up by one
when that person's vote is created in the same step, and down by one when it's removed. The count uses Firestore's
`increment`, so two people voting at the same moment both count.

**Who can change a status.** Only a council member can move a report along. A council member is a document in the
`staff` collection named after their account id, made by hand in the Firebase console. The rules read it, and the app
can only *look at its own* staff document, never write one. Someone trying the demo is council for their own example
reports only.

**Demo reports never reach the real map.** A demo report is saved with `demo: true` and can only be read by the person
who made it. The map asks for `demo == false`, the demo asks for its owner's reports, and the rules allow exactly those
two questions.

**Finding duplicates** (`nearbyDuplicates()` in `lib/reports.ts`). Reports of the same kind, still open, within 100
metres are found with the haversine distance, nearest first, and shown before the report is sent.

**The council's numbers** (`summarise()`). Open, acknowledged, fixed, the share fixed, and the average number of days
from reported to fixed, counting only reports that have a fixed time.

**The map** (`components/ReportMap.tsx`). Leaflet is loaded only when a map is on screen, so the sign-in screen stays
light. Pins are drawn from the same SVG as the sign-in picture. In the report form the map can also be used with a
keyboard: move it with the arrow keys and press Enter to drop the pin in the middle.

## Tests
`npm test` runs the unit tests in `tests/` with Vitest: the kinds of problem and statuses, ticket numbers (never
using letters and numbers that look alike), whether a pin is in South Africa, checking a report before it's sent,
distances, finding duplicates, time ("3 days ago"), filtering and sorting, the council's numbers, reading saved data
safely, the example reports, the map pins, and that the lists and limits in `firestore.rules` match the app's (and
that no write is open to everyone). GitHub runs them on every push (`.github/workflows/tests.yml`).

## Lighthouse
Checked with Google PageSpeed Insights on the live sign-in page (22 Nov 2026):

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile | 100 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

## Setup (run it yourself)
1. **Firebase:** create a project at [console.firebase.google.com](https://console.firebase.google.com).
   - Authentication → Get started → turn on **Email/Password**, **Google** and **Anonymous** (guest accounts and
     Try the demo both need it).
   - Firestore Database → Create database (production mode).
   - Firestore Database → **Rules**: paste in `firestore.rules` and press **Publish**.
   - Project settings → General → Your apps → add a **Web app** to get its settings.
2. **Settings:** copy `.env.example` to `.env.local` and fill in the four values from step 1.
3. **Run it:** `npm install`, then `npm run dev`, and open http://localhost:3000.
4. **Deploy on Vercel:** import the GitHub repo, add the same four settings under
   Settings → Environment Variables, and deploy. Then, in Firebase, add the Vercel address under
   Authentication → Settings → **Authorized domains**, so Google sign-in works there.
5. **Make someone council staff:** sign in once with the account, copy its **User UID** from Firebase →
   Authentication → Users, then in Firestore create the collection **`staff`** with a document whose **ID is that UID**
   and any field (for example `name`: "Ward 5 office"). The **Council** page appears for them straight away.

## Environment variables
Names only; the values are in `.env.local` (never committed) and in Vercel.

| Name | What it is |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | The web app's API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | The Firebase project's ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | The web app's ID |

These are public by design: they say which Firebase project to use, they don't unlock anything. What protects the
data is `firestore.rules`.

## Known gaps
- **The security rules aren't in the automatic tests.** They'd need the Firebase emulator. The tests check that their
  lists and limits match the app, and I check the rest by hand.
- **No photos.** Firebase Storage can need a paid plan, so a report is a pin and words.
- **Not connected to a real municipality.** Status changes are made by staff in this app; nothing is sent to a council's
  own system, and nobody is told when their report changes (no emails or push messages yet).
- **No limit on how fast someone can report**, and no App Check, so a determined person could flood it with reports.
  Council staff can delete any report.
- **A report's place is a point, not an address.** There's no street-name search, so people zoom in and tap.
- **Votes can't be seen as a list of names**, by design, so nobody can be asked who voted.
- **A guest account lives on one device.** If someone signs out of it, they can no longer delete their own reports.
- **A visitor who closes the tab** without ending the demo leaves their example reports in the database.
- **English only.**

## Use of AI
I built FixMyStreet SA with Claude (by Anthropic) as my AI pair programmer:

1. **I chose what to build** from ideas we discussed, as one of my new apps for my portfolio.
2. **Claude wrote the code**, starting from my other Firebase apps, explained how it works, designed its look and
   made the app icons.
3. **I set up Firebase and Vercel, added the code to my project**, ran it, tested it on my laptop and phone,
   committed it and deployed it, and reported anything that broke or looked wrong so we could fix it.
