"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ensureFamilyForUser, getAdminSetupStatus, primeAdminIdentity } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

// Supabase fjerner tokens fra URL-en saa snart den har lest dem (replaceState),
// saa dette maa leses i foerste render - i en useEffect kan det vaere borte.
function readCallbackParams() {
  if (typeof window === "undefined") {
    return { error: null as string | null, errorDescription: null as string | null, hasCredentials: false };
  }

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const pick = (key: string) => hash.get(key) ?? query.get(key);

  return {
    error: pick("error") ?? pick("error_code"),
    errorDescription: pick("error_description"),
    hasCredentials: Boolean(pick("access_token") ?? pick("code")),
  };
}

// getSession() venter paa initializePromise, som igjen venter paa et
// nettverkskall. Uten tidsgrense blir siden staaende paa "Fullforer
// innlogging..." for alltid hvis det kallet aldri svarer.
const SESSION_TIMEOUT_MS = 8000;

export default function AuthCallbackPage() {
  const router = useRouter();
  const [callbackParams] = useState(readCallbackParams);
  const [status, setStatus] = useState("Fullforer innlogging...");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    let handled = false;

    const fail = (message: string) => {
      if (!mounted) return;
      setStatus(`Feil: ${message}`);
      setFailed(true);
    };

    const finish = async (user: User) => {
      if (handled || !mounted) return;
      handled = true;

      const ensure = await ensureFamilyForUser({ id: user.id, email: user.email });
      if (ensure.error) {
        fail(ensure.error);
        return;
      }

      // Sesjonen er akkurat utstedt av Supabase, saa det er ingen grunn til at
      // getAdminSetupStatus() skal verifisere brukeren med et nytt nettverkskall.
      primeAdminIdentity(user, ensure.familyId);

      const setup = await getAdminSetupStatus();
      if (!mounted) return;

      router.replace(setup.needsOnboarding ? "/onboarding" : "/admin/inbox");
    };

    const run = async () => {
      // Kom Google/Supabase tilbake med en eksplisitt feil, er det den vi skal
      // vise - ikke en generisk "fant ikke sesjon" etter en unodvendig venting.
      if (callbackParams.error) {
        fail(callbackParams.errorDescription ?? callbackParams.error);
        return;
      }

      // Ingen tokens i URL-en i det hele tatt betyr at vi aldri fikk noe aa
      // logge inn med. Da er det som regel redirect-URL-en i Supabase som ikke
      // matcher domenet vi faktisk staar paa (typisk www kontra ikke-www).
      if (!callbackParams.hasCredentials) {
        fail(
          `Ingen innloggingstokens i URL-en (${window.location.host}). Sjekk at nettopp dette domenet staar under Redirect URLs i Supabase.`
        );
        return;
      }

      // getSession() venter internt paa initializePromise, som er der klienten
      // leser tokens ut av URL-en. URL-en leses bare EN gang, saa gjentatte
      // forsok gir ingenting - men kallet maa ha en tidsgrense.
      const timeout = new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), SESSION_TIMEOUT_MS)
      );
      const result = await Promise.race([supabase.auth.getSession(), timeout]);

      if (!mounted || handled) return;

      if (result === "timeout") {
        fail("Innlogging tok for lang tid. Prov igjen fra login.");
        return;
      }

      const user = result.data.session?.user;
      if (user) {
        await finish(user);
        return;
      }

      fail("Fant ikke aktiv sesjon etter OAuth. Prov igjen fra login.");
    };

    // Sikkerhetsnett hvis SIGNED_IN kommer et hakk etter getSession(). Arbeidet
    // maa ut av callbacken med setTimeout: supabase holder auth-laasen mens den
    // kjorer, og et supabase-kall inni her kan laase seg selv ute.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !handled) {
        const user = session.user;
        setTimeout(() => void finish(user), 0);
      }
    });

    void run();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, callbackParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Logger inn</h1>
        <p className="mt-3 text-sm text-slate-300">{status}</p>
        {failed && (
          <Link
            href="/login"
            className="mt-4 inline-flex text-sm text-slate-100 underline underline-offset-4"
          >
            Tilbake til innlogging
          </Link>
        )}
      </div>
    </main>
  );
}
