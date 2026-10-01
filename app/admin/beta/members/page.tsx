"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminBetaMembersPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [siteUrl, setSiteUrl] = useState("https://www.ukepenger.no");
  const [members, setMembers] = useState<Array<{ user_id: string; role: string }>>([]);
  const [invites, setInvites] = useState<
    Array<{
      id: string;
      email: string;
      token: string;
      created_at: string;
      expires_at: string;
      accepted_at: string | null;
      revoked_at: string | null;
    }>
  >([]);

  const load = useCallback(async () => {
    setStatus("");

    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;
    if (!accessToken) {
      setLoading(false);
      setStatus("Feil: Mangler innloggingstoken. Logg inn på nytt.");
      return;
    }

    const res = await fetch("/api/admin/members/invite", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      siteUrl?: string;
      members?: Array<{ user_id: string; role: string }>;
      invites?: Array<{
        id: string;
        email: string;
        token: string;
        created_at: string;
        expires_at: string;
        accepted_at: string | null;
        revoked_at: string | null;
      }>;
    };

    if (!res.ok) {
      setStatus(`Feil: ${payload.error ?? "Kunne ikke laste medlemmer."}`);
      setLoading(false);
      return;
    }

    setSiteUrl(payload.siteUrl ?? "https://www.ukepenger.no");
    setMembers(payload.members ?? []);
    setInvites(payload.invites ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sendInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setStatus("Skriv e-post.");
      return;
    }

    setSubmitting(true);
    setStatus("");

    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;
    if (!accessToken) {
      setSubmitting(false);
      setStatus("Feil: Mangler innloggingstoken. Logg inn på nytt.");
      return;
    }

    const res = await fetch("/api/admin/members/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ email: trimmed }),
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setSubmitting(false);

    if (!res.ok) {
      setStatus(`Feil: ${payload.error ?? "Kunne ikke sende invitasjon."}`);
      return;
    }

    setEmail("");
    setStatus("Invitasjon sendt.");
    await load();
  };

  const inviteRows = useMemo(() => {
    return invites.map((invite) => {
      const now = Date.now();
      const expired = new Date(invite.expires_at).getTime() <= now;
      const statusLabel = invite.revoked_at
        ? "revoked"
        : invite.accepted_at
          ? "accepted"
          : expired
            ? "expired"
            : "pending";

      return { ...invite, statusLabel };
    });
  }, [invites]);

  const copyInviteLink = async (token: string) => {
    const link = `${siteUrl}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    setStatus("Invitasjonslenke kopiert.");
  };

  if (loading) return <div className="text-foreground/80">Laster...</div>;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Medlemmer (beta)</h2>
        <p className="mt-1 text-sm text-muted-foreground">Inviter medlemmer via e-post.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="navn@epost.no"
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground"
          />
          <button
            type="button"
            onClick={() => void sendInvite()}
            disabled={submitting}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sender..." : "Send invitasjon"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-base font-semibold">Medlemmer</h3>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen medlemmer funnet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.user_id} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
                <div className="font-medium text-foreground">{member.user_id}</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{member.role}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-base font-semibold">Invitasjoner</h3>
        {inviteRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen invitasjoner.</p>
        ) : (
          <div className="space-y-2">
            {inviteRows.map((invite) => (
              <div key={invite.id} className="rounded-xl border border-border bg-card px-3 py-3 text-sm">
                <div className="font-medium text-foreground">{invite.email}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {invite.statusLabel} · utloper {new Date(invite.expires_at).toLocaleString("nb-NO")}
                </div>
                {invite.statusLabel === "pending" && (
                  <button
                    type="button"
                    onClick={() => void copyInviteLink(invite.token)}
                    className="mt-3 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-primary/40 hover:bg-secondary"
                  >
                    Kopier lenke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {status && <p className="text-sm text-foreground/80">{status}</p>}
    </section>
  );
}