"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { Button, Field, Input, cx, focusRing } from "@/components/ui";
import { hasPendingGuest, pathAfterAuth } from "@/lib/after-auth";
import { supabase } from "@/lib/supabaseClient";

const MIN_PASSWORD = 10;

type AuthAction = "login" | "signup" | "google" | "apple" | null;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [action, setAction] = useState<AuthAction>(null);

  const isLoading = action !== null;

  // Apple-knappen vises bare når Apple er slått på i Supabase, så den aldri
  // gir feil. Den dukker opp av seg selv når oppsettet er gjort.
  const [appleOn, setAppleOn] = useState(false);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((res) => (res.ok ? res.json() : null))
      .then((settings: { external?: { apple?: boolean } } | null) => setAppleOn(Boolean(settings?.external?.apple)))
      .catch(() => {});
  }, []);

  // Besteforeldre som kom fra «Lag profil» får egen tekst.
  const [forGuest] = useState(() => typeof window !== "undefined" && hasPendingGuest());

  // Allerede innlogget (også en eldre innlogging som nettopp ble flyttet fra
  // lokal lagring): rett inn i appen i stedet for å vise skjemaet.
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!alive) return;
        if (data.session) {
          router.replace(await pathAfterAuth(data.session.user));
          return;
        }
        setChecking(false);
      })
      .catch(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [router]);

  const handleSignUp = async () => {
    setStatus("");
    // Lange passord/passfraser er tryggest. Gjelder nye kontoer; eksisterende
    // passord fungerer som før.
    if (password.length < MIN_PASSWORD) {
      setStatus(`Feil: Velg et passord på minst ${MIN_PASSWORD} tegn. Tips: bruk en setning, f.eks. «blå sykkel i hagen».`);
      return;
    }
    setAction("signup");
    const result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });

    if (result.error) {
      setAction(null);
      setStatus(`Feil: ${authErrorText(result.error.message)}`);
      return;
    }

    if (!result.data.user) {
      setAction(null);
      setStatus("Feil: Kontoen ble laget, men noe gikk galt. Prøv å logge inn.");
      return;
    }

    if (!result.data.session) {
      setAction(null);
      setStatus("Kontoen er laget! Sjekk e-posten din og trykk på lenken for å bekrefte.");
      return;
    }

    router.push(await pathAfterAuth(result.data.user));
  };

  const handleLogin = async () => {
    setStatus("");
    setAction("login");
    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setAction(null);
      setStatus(`Feil: ${authErrorText(result.error.message)}`);
      return;
    }

    if (!result.data.user) {
      setAction(null);
      setStatus("Feil: Noe gikk galt. Prøv igjen.");
      return;
    }

    router.push(await pathAfterAuth(result.data.user));
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setStatus("");
    setAction(provider);
    const redirectTo = `${window.location.origin}/auth/callback`;

    const result = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (result.error) {
      setAction(null);
      setStatus(`Feil: ${authErrorText(result.error.message)}`);
      return;
    }
  };

  const isError = status.startsWith("Feil:");
  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" role="status">
        Et øyeblikk …
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <Link href="/" className={cx("mb-8 flex items-center gap-2.5 rounded-xl", focusRing)}>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Coins className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-num text-lg font-bold tracking-[-0.06em]">ukepenger</span>
      </Link>

      <section className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
        {forGuest ? (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">Lag din profil 💛</h1>
            <p className="mt-1 text-muted-foreground">
              Bruk Google, Apple eller e-post. Har du ikke konto, skriv e-post og et passord og trykk «Opprett konto».
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">Hei igjen 👋</h1>
            <p className="mt-1 text-muted-foreground">Logg inn for å se hva barna har gjort.</p>
          </>
        )}

        <div className="mt-6 space-y-2.5">
          <Button variant="secondary" size="lg" block loading={action === "google"} disabled={isLoading} onClick={() => void handleOAuth("google")}>
            Fortsett med Google
          </Button>
          {appleOn && (
            <Button variant="secondary" size="lg" block loading={action === "apple"} disabled={isLoading} onClick={() => void handleOAuth("apple")}>
              Fortsett med Apple
            </Button>
          )}
        </div>

        <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>eller med e-post</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) void handleLogin();
          }}
        >
          <Field label="E-post">
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="navn@epost.no" />
          </Field>
          <Field label="Passord">
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passord eller passfrase" />
          </Field>

          {status && (
            <p role={isError ? "alert" : "status"} className={cx("rounded-2xl px-4 py-3 text-sm font-medium", isError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800")}>
              {status.replace(/^Feil: /, "")}
            </p>
          )}

          <Button type="submit" size="lg" block loading={action === "login"} disabled={!canSubmit}>
            Logg inn
          </Button>
          <Button variant="ghost" block loading={action === "signup"} disabled={!canSubmit} onClick={() => void handleSignUp()}>
            Ny her? Opprett konto
          </Button>
        </form>
      </section>
    </main>
  );
}

// Supabase sine feilmeldinger er på engelsk og tekniske.
function authErrorText(message: string) {
  if (/invalid login credentials/i.test(message)) return "Feil e-post eller passord.";
  if (/email not confirmed/i.test(message)) return "Bekreft e-posten din først. Sjekk innboksen.";
  if (/already registered|already exists/i.test(message)) return "Det finnes allerede en konto med denne e-posten. Prøv å logge inn.";
  if (/password should be at least|weak password/i.test(message)) return `Passordet må ha minst ${MIN_PASSWORD} tegn.`;
  if (/pwned|leaked|compromised/i.test(message)) return "Dette passordet har vært med i en kjent datalekkasje. Velg et annet.";
  if (/invalid email|unable to validate email/i.test(message)) return "Sjekk at e-postadressen er riktig.";
  if (/rate limit|too many/i.test(message)) return "For mange forsøk. Vent litt og prøv igjen.";
  if (/fetch|network/i.test(message)) return "Fikk ikke kontakt med serveren. Sjekk nettet.";
  console.error("[login]", message);
  return "Noe gikk galt. Prøv igjen.";
}
