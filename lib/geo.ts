/* "Use my location": the phone's position, asked for only when someone presses the button */

export type Place = { lat: number; lng: number };

export function locate(): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

/** A plain-language reason for a failed location request */
export function locateMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? Number((error as { code: unknown }).code) : 0;
  if (code === 1) return "Location is switched off for this site. Allow it in your browser's settings, or tap the map instead.";
  if (code === 3) return "Finding your location took too long. Try again, or tap the map instead.";
  if (error instanceof Error && error.message === "unsupported") return "This browser can't share its location. Tap the map instead.";
  return "Couldn't find your location. Tap the map instead.";
}
