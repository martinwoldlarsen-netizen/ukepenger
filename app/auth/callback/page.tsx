"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ensureFamilyForUser, getAdminSetupStatus, primeAdminIdentity } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Fullforer innlogging...");

  useEffect(() => {
    let mounted = true;
    let settled = false;

    const finish = async (user: User) => {
      if (settled || !mounted) return;
      settled = true;

      const ensure = await ensureFamilyForUser({ id: user.id, email: user.email });
      if (ensure.error) {
        if (mounted) setStatus(`Feil: ${ensure.error}`);
        return;
      }

      // Sesjonen er akkurat utstedt av Supabase, saa det er ingen grunn til at
      // getAdminSetupStatus() skal verifisere brukeren med et nytt nettverkskall.
      primeAdminIdentity(user, ensure.familyId);

      const setup = await getAdminSetupStatus();
      if (!mounted) return;

      router.replace(setup.needsOnboarding ? "/onboarding" : "/admin/inbox");
    };

    // getSession() venter internt paa initializePromise, som er der klienten
    // leser tokens ut av URL-en (detectSessionInUrl). URL-en leses bare EN gang,
    // saa hvis dette kallet ikke gir en sesjon, vil ikke gjentatte forsok heller
    // gjore det - da er det riktig aa feile med en gang i stedet for aa vente.
    const run = async () => {
      const sessionRes = await supabase.auth.getSession();
      const user = sessionRes.data.session?.user;

      if (user) {
        await finish(user);
        return;
      }

      if (mounted && !settled) {
        setStatus("Feil: Fant ikke aktiv sesjon etter OAuth. Prov igjen fra login.");
      }
    };

    // Sikkerhetsnett hvis SIGNED_IN kommer et hakk etter getSession(). Arbeidet
    // maa ut av callbacken med setTimeout: supabase holder auth-laasen mens den
    // kjorer, og et supabase-kall inni her kan laase seg selv ute.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !settled) {
        const user = session.user;
        setTimeout(() => void finish(user), 0);
      }
    });

    void run();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">OAuth callback</h1>
        <p className="mt-3 text-sm text-slate-300">{status}</p>
      </div>
    </main>
  );
}
