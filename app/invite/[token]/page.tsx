import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getServiceSupabaseClient } from "@/lib/server-supabase";
import { AcceptInviteButton } from "./accept-invite-button";

type InviteRow = {
  email: string;
  accepted_at: string | null;
  expires_at: string;
  revoked_at: string | null;
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const siteUrl = process.env.SITE_URL?.trim() || "https://www.ukepenger.no";
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-foreground">
        <p>Feil: Supabase env mangler.</p>
      </main>
    );
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });

  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-foreground">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">Invitasjon</h1>
          <p>Logg inn for å akseptere invitasjonen.</p>
          <Link
            href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="inline-flex rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-secondary"
          >
            Gå til login
          </Link>
        </section>
      </main>
    );
  }

  const serviceClient = getServiceSupabaseClient();
  if (!serviceClient) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-foreground">
        <p>Feil: Server mangler service role key.</p>
      </main>
    );
  }

  const inviteRes = await serviceClient
    .from("family_invites")
    .select("email, accepted_at, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteRes.error || !inviteRes.data) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-foreground">
        <p>Invitasjonen finnes ikke.</p>
      </main>
    );
  }

  const invite = inviteRes.data as InviteRow;
  const inviteEmail = invite.email.toLowerCase();
  const userEmail = (user.email ?? "").toLowerCase();

  let message: string | null = null;
  if (invite.revoked_at) {
    message = "Invitasjonen er trukket tilbake.";
  } else if (invite.accepted_at) {
    message = "Invitasjonen er allerede akseptert.";
  } else if (new Date(invite.expires_at).getTime() <= Date.now()) {
    message = "Invitasjonen er utløpt.";
  } else if (!userEmail || userEmail !== inviteEmail) {
    message = `Du er logget inn som ${user.email ?? "ukjent"}, men invitasjonen er for ${invite.email}.`;
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 text-foreground">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Invitasjon til Ukepenger</h1>
        <p className="text-sm text-foreground/80">Link: {`${siteUrl}/invite/${token}`}</p>
        {message ? (
          <p>{message}</p>
        ) : (
          <AcceptInviteButton token={token} />
        )}
      </section>
    </main>
  );
}
