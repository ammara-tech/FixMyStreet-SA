/*
  FixMyStreet SA's logo: a yellow road-works diamond with a black border, and a map pin standing in a
  pothole. Always the same colours, in light and dark.
*/
export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M32 2 62 32 32 62 2 32Z" fill="#ffc20e" stroke="#141416" strokeWidth="4" strokeLinejoin="round" />
      <path d="M32 9.500 54.500 32 32 54.500 9.500 32Z" fill="none" stroke="#141416" strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M32 46s-9-7.500-9-15a9 9 0 0 1 18 0c0 7.500-9 15-9 15Z" fill="#141416" />
      <circle cx="32" cy="31" r="3.600" fill="#ffc20e" />
      <ellipse cx="32" cy="48.500" rx="5.500" ry="1.800" fill="#141416" />
    </svg>
  );
}

/* The name: FIXMYSTREET in white or ink, SA in yellow, set like a road sign */
export function Wordmark({ className = "text-2xl", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={`font-display font-bold uppercase leading-none tracking-[0.03em] ${className}`}>
      FixMyStreet <span className={dark ? "text-brand" : "rounded bg-brand px-1.5 py-0.5 text-on-brand"}>SA</span>
    </span>
  );
}
