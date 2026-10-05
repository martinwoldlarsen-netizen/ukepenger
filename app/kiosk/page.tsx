import Link from "next/link";

const ERRORS: Record<string, string> = {
  expired_qr: "QR-koden er brukt eller utløpt. Be en voksen vise en ny.",
  old_qr: "Denne QR-koden er av den gamle typen og virker ikke lenger. Be en voksen vise en ny.",
};

export default async function KioskInfoPage({ searchParams }: { searchParams: Promise<{ claim_error?: string }> }) {
  const { claim_error } = await searchParams;
  const error = claim_error ? (ERRORS[claim_error] ?? "Noe gikk galt med QR-koden. Be en voksen vise en ny.") : null;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
        <div className="text-5xl" aria-hidden="true">📱</div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Koble til iPaden</h1>
        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</p>}
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
