import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="font-display text-8xl font-bold text-brand-text">404</p>
      <h1 className="mt-2 text-4xl">This road doesn&apos;t go anywhere</h1>
      <p className="mt-3 text-ink-soft">The address may be mistyped, or the page has moved.</p>
      <Link href="/" className="btn mt-8">
        Back to the map
      </Link>
    </div>
  );
}
