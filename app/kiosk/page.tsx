import Link from "next/link";

export default function KioskInfoPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">Kiosk</h1>
        <p className="text-sm text-foreground/80">Skann QR-koden fra Admin - Enheter for å koble denne iPaden til familieprofilene.</p>
        <Link href="/admin/devices" className="mt-4 inline-flex text-sm text-foreground underline underline-offset-4">
          Gaa til enheter
        </Link>
      </div>
    </main>
  );
}
