import type { Status } from "@/lib/types";

/*
  The map pins, drawn as SVG text so the map (Leaflet) and the sign-in picture can use the same ones.
  A status is never shown by colour alone: red has an exclamation mark, blue has a clock, green has a tick.
*/

export const PIN_COLOURS: Record<Status, string> = { reported: "#c0321f", acknowledged: "#1f66c2", fixed: "#1d7f40" };

const GLYPHS: Record<Status, string> = {
  reported: '<path d="M17 9.5v6.5M17 19.6v.01"/>',
  acknowledged: '<path d="M17 10v5.3l3.2 2"/>',
  fixed: '<path d="m12.6 15.4 3.2 3.2 5.6-6.6"/>',
};

const BODY = "M17 40S3 26.5 3 15a14 14 0 0 1 28 0c0 11.5-14 25-14 25Z";

/** The inside of a 34 × 42 pin (no <svg> around it) */
export function pinInner(status: Status) {
  const c = PIN_COLOURS[status];
  return `<path d="${BODY}" fill="${c}" stroke="#141416" stroke-width="2.5" stroke-linejoin="round"/><circle cx="17" cy="15" r="9" fill="#fff"/><g fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[status]}</g>`;
}

export function pinSvg(status: Status, width = 34) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round((width * 42) / 34)}" viewBox="0 0 34 42" aria-hidden="true">${pinInner(status)}</svg>`;
}

/** The yellow pin someone drags to the problem when they're making a report */
export function pickPinSvg(width = 38) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round((width * 42) / 34)}" viewBox="0 0 34 42" aria-hidden="true"><path d="${BODY}" fill="#ffc20e" stroke="#141416" stroke-width="2.5" stroke-linejoin="round"/><circle cx="17" cy="15" r="5" fill="#141416"/></svg>`;
}
