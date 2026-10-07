"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearPendingGuest, rememberPendingGuest } from "@/lib/after-auth";
import { supabase } from "@/lib/supabaseClient";

// Kobler besteforelder-lenken (cookien) til kontoen. Ikke innlogget ennå →
// til innlogging/ny konto først, så tilbake hit.
export default function LinkGuestAccountPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        rememberPendingGuest();
        router.replace("/login");
        return;
      }
      const res = await fetch("/api/guest/link", {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!alive) return;
      clearPendingGuest();
      if (!res.ok) {
        setError(payload.error ?? "Klarte ikke å koble kontoen.");
        return;
      }
      router.replace("/besteforeldre?profil=ok");
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center text-lg">
      {error ? (
        <>
          <div className="text-6xl" aria-hidden="true">🔗</div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Det gikk ikke helt</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Link href="/besteforeldre" className="mt-6 rounded-2xl bg-primary px-6 py-4 font-bold text-primary-foreground">
            Til besteforeldre-siden
          </Link>
        </>
      ) : (
        <p role="status" className="text-muted-foreground">Kobler profilen din …</p>
      )}
    </main>
  );
}
