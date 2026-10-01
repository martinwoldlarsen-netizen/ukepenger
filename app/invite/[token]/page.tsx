"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui";
import { clearAdminIdentityCache } from "@/lib/family-client";
import { clearPendingInvite, rememberPendingInvite } from "@/lib/pending-invite";
import { supabase } from "@/lib/supabaseClient";

type InviteInfo = { status: "pending" | "accepted" | "revoked" | "expired" | "not_found"; email?: string; familyName?: string | null };

// Kjører i nettleseren fordi innloggingen ligger i nettleseren (localStorage),
// ikke i cookies som en serverside kunne lest.
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [userEmail, setUserEmail] = useState<string | null | undefined>(undefined);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [infoRes, sessionRes] = await Promise.all([
        fetch(`/api/invites/info?token=${encodeURIComponent(token)}`).then((r) => r.json()).catch(() => ({ status: "not_found" })),
        supabase.auth.getSession(),
      ]);
      if (!alive) return;
      setInfo(infoRes as InviteInfo);
      setUserEmail(sessionRes.data.session?.user.email ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const accept = async () => {
    setError("");
    setAccepting(true);
    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;
    if (!accessToken) {
      setAccepting(false);
      setUserEmail(null);
      return;
    }
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ token }),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setAccepting(false);
    if (!res.ok) {
      setError(payload.error ?? "Klarte ikke å bli med. Prøv igjen.");
      return;
    }
    clearPendingInvite();
    clearAdminIdentityCache();
    router.replace("/admin/inbox");
  };

  const familyLabel = info?.familyName ? `familien ${info.familyName.replace(/^familien\s+/i, "")}` : "en familie";

  let body: React.ReactNode;
  if (!info || userEmail === undefined) {
    body = <div className="mx-auto size-10 animate-spin rounded-full border-4 border-secondary border-t-primary" role="status" aria-label="Laster" />;
  } else if (info.status !== "pending") {
    const text = {
      accepted: "Denne invitasjonen er allerede brukt.",
      revoked: "Invitasjonen er trukket tilbake.",
      expired: "Invitasjonen er utløpt. Be den som inviterte deg om en ny lenke.",
      not_found: "Fant ikke invitasjonen. Sjekk at du har hele lenken.",
    }[info.status];
    body = (
      <>
        <div className="text-5xl" aria-hidden="true">✉️</div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{text}</h1>
        <Link href="/login" className="mt-6 inline-flex font-semibold text-primary underline underline-offset-4">
          Til innlogging
        </Link>
      </>
    );
  } else {
    body = (
      <>
        <div className="text-5xl" aria-hidden="true">👨‍👩‍👧</div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Du er invitert!</h1>
        <p className="mt-2 text-muted-foreground">
          Bli med i {familyLabel} på Ukepenger, så kan dere begge godkjenne oppgaver og betale ut.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Invitasjonen er sendt til {info.email}.</p>

        {userEmail ? (
          <div className="mt-6 space-y-3">
            <Button size="lg" block loading={accepting} onClick={() => void accept()}>
              Bli med i familien
            </Button>
            <p className="text-sm text-muted-foreground">Logget inn som {userEmail}</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <Button
              size="lg"
              block
              onClick={() => {
                rememberPendingInvite(token);
                router.push("/login");
              }}
            >
              Logg inn eller lag konto
            </Button>
            <p className="text-sm text-muted-foreground">Bruk e-posten invitasjonen ble sendt til.</p>
          </div>
        )}
        {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
      </>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Coins className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-num text-lg font-bold tracking-[-0.06em]">ukepenger</span>
      </Link>
      <section className="w-full max-w-md rounded-[2rem] border border-border bg-card p-8 text-center shadow-xl shadow-black/5">{body}</section>
    </main>
  );
}
