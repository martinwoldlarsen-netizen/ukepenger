"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { Button, Field, Input, cx, focusRing } from "@/components/ui";
import { peekPendingInvitePath } from "@/lib/pending-invite";
import { ensureFamilyForUser, getAdminSetupStatus, primeAdminIdentity } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

type AuthAction = "login" | "signup" | "google" | "apple" | null;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [action, setAction] = useState<AuthAction>(null);

  const isLoading = action !== null;

  const goAfterAuth = async () => {
    const setup = await getAdminSetupStatus();
    if (setup.needsOnboarding) {
      router.push("/onboarding");
      return;
    }
    router.push("/admin/inbox");
  };

  const handleSignUp = async () => {
    setStatus("");
    setAction("signup");
    const result = await supabase.auth.signUp({ email, password });

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

    // Kom brukeren fra en invitasjon, skal de inn i den familien, ikke få en ny.
    const invitePath = peekPendingInvitePath();
    if (invitePath) {
      router.push(invitePath);
      return;
    }

    const ensure = await ensureFamilyForUser({
      id: result.data.user.id,
      email: result.data.user.email,
    });

    if (ensure.error) {
      setAction(null);
      setStatus(`Feil: ${authErrorText(ensure.error)}`);
      return;
    }

    primeAdminIdentity(result.data.user, ensure.familyId);

    await goAfterAuth();
    setAction(null);
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

    const invitePath = peekPendingInvitePath();
    if (invitePath) {
      router.push(invitePath);
      return;
    }

    const ensure = await ensureFamilyForUser({
      id: result.data.user.id,
      email: result.data.user.email,
    });

    if (ensure.error) {
      setAction(null);
      setStatus(`Feil: ${authErrorText(ensure.error)}`);
      return;
    }

    primeAdminIdentity(result.data.user, ensure.familyId);

    await goAfterAuth();
    setAction(null);
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <Link href="/" className={cx("mb-8 flex items-center gap-2.5 rounded-xl", focusRing)}>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Coins className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-num text-lg font-bold tracking-[-0.06em]">ukepenger</span>
      </Link>

      <section className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Hei igjen 👋</h1>
        <p className="mt-1 text-muted-foreground">Logg inn for å se hva barna har gjort.</p>

        <div className="mt-6 space-y-2.5">
          <Button variant="secondary" size="lg" block loading={action === "google"} disabled={isLoading} onClick={() => void handleOAuth("google")}>
            Fortsett med Google
          </Button>
          <Button variant="secondary" size="lg" block loading={action === "apple"} disabled={isLoading} onClick={() => void handleOAuth("apple")}>
            Fortsett med Apple
          </Button>
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
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minst 6 tegn" />
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
  if (/password should be at least|weak password/i.test(message)) return "Passordet må ha minst 6 tegn.";
  if (/invalid email|unable to validate email/i.test(message)) return "Sjekk at e-postadressen er riktig.";
  if (/rate limit|too many/i.test(message)) return "For mange forsøk. Vent litt og prøv igjen.";
  if (/fetch|network/i.test(message)) return "Fikk ikke kontakt med serveren. Sjekk nettet.";
  console.error("[login]", message);
  return "Noe gikk galt. Prøv igjen.";
}
