"use client";

import Link from "next/link";

export default function AdminBetaFamilyPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Familie (beta)</h2>
        <p className="mt-1 text-sm text-muted-foreground">Under utvikling.</p>
      </div>
      <Link
        href="/admin/beta/members"
        className="inline-flex rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-secondary"
      >
        Gå til medlemmer (beta)
      </Link>
    </section>
  );
}
