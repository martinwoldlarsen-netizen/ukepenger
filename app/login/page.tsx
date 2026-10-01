"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      setStatus(`Feil: ${result.error.message}`);
      return;
    }

    if (!result.data.user) {
      setAction(null);
      setStatus("Konto opprettet, men fant ikke brukerdata.");
      return;
    }

    if (!result.data.session) {
      setAction(null);
      setStatus("Konto opprettet. Bekreft e-post før du logger inn.");
      return;
    }

    const ensure = await ensureFamilyForUser({
      id: result.data.user.id,
      email: result.data.user.email,
    });

    if (ensure.error) {
      setAction(null);
      setStatus(`Feil: ${ensure.error}`);
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
      setStatus(`Feil: ${result.error.message}`);
      return;
    }

    if (!result.data.user) {
      setAction(null);
      setStatus("Innlogging feilet: fant ikke bruker.");
      return;
    }

    const ensure = await ensureFamilyForUser({
      id: result.data.user.id,
      email: result.data.user.email,
    });

    if (ensure.error) {
      setAction(null);
      setStatus(`Feil: ${ensure.error}`);
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
      setStatus(`Feil: ${result.error.message}`);
      return;
    }
  };

  const isError = status.startsWith("Feil:");
  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5 md:p-7">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Logg inn</h1>
        <p className="mb-6 text-sm text-muted-foreground">E-post/passord eller OAuth for å åpne admin.</p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void handleOAuth("google")}
            disabled={isLoading}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action === "google" ? "Sender til Google..." : "Fortsett med Google"}
          </button>
          <button
            type="button"
            onClick={() => void handleOAuth("apple")}
            disabled={isLoading}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action === "apple" ? "Sender til Apple..." : "Fortsett med Apple"}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
          <div className="h-px flex-1 bg-secondary" />
          <span>Eller</span>
          <div className="h-px flex-1 bg-secondary" />
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground/80">
              E-post
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="navn@epost.no"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground/80">
              Passord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Skriv passord"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={!canSubmit}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action === "login" ? "Logger inn..." : "Logg inn"}
          </button>

          <button
            type="button"
            onClick={() => void handleSignUp()}
            disabled={!canSubmit}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action === "signup" ? "Oppretter konto..." : "Opprett konto"}
          </button>
        </div>

        <div className="mt-4 min-h-5">
          {status && (
            <p
              className={`rounded-xl border px-3 py-2 text-sm ${
                isError
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {status}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
