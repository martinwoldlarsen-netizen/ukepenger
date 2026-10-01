import Link from "next/link";

export default function KioskInfoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
        <div className="text-5xl" aria-hidden="true">📱</div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Koble til iPaden</h1>
        <p className="mt-2 text-muted-foreground">
          En voksen åpner <strong className="text-foreground">Mer → Enheter</strong> i appen og trykker «Vis QR-kode». Skann koden med
          kameraet på denne iPaden.
        </p>
        <Link
          href="/admin/devices"
          className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-primary px-5 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
        >
          Jeg er voksen – gå til Enheter
        </Link>
      </div>
    </main>
  );
}
