import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl" aria-hidden="true">🧭</div>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Fant ikke siden</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">Lenken kan være gammel, eller siden er flyttet.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-primary px-5 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      >
        Til forsiden
      </Link>
    </main>
  );
}
