"use client";

import { useState } from "react";
import useSWR from "swr";
import { Copy, Heart, Mail, Share2, UserPlus, Users } from "lucide-react";
import { QrImage } from "@/components/QrCode";
import { Badge, Button, Card, CardHeader, Field, Input, ListSkeleton } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { adminFetch, friendlyError, swrDefaults, useAdminIdentity } from "@/lib/admin-data";
import { formatWhen } from "@/lib/dates";

type Member = { user_id: string; email: string | null; role: string; created_at: string; isMe: boolean };
type Invite = { id: string; email: string; expires_at: string; created_at: string; link: string };
type MembersPayload = { members: Member[]; invites: Invite[] };

async function shareLink(link: string, toast: ReturnType<typeof useToast>) {
  const text = "Bli med i familien vår på Ukepenger:";
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "Ukepenger", text, url: link });
      return;
    } catch {
      // Avbrutt av brukeren, eller ikke støttet: kopier i stedet.
    }
  }
  await navigator.clipboard.writeText(link);
  toast({ text: "Lenken er kopiert. Send den på SMS eller Messenger." });
}

export default function AdminFamilyPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { familyId } = useAdminIdentity();
  const data = useSWR(familyId ? ["members", familyId] : null, () => adminFetch<MembersPayload>("/api/admin/members/invite"), swrDefaults);

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const invite = async () => {
    if (sending || !email.trim()) return;
    setSending(true);
    try {
      const res = await adminFetch<{ inviteLink: string; emailed: boolean }>("/api/admin/members/invite", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setEmail("");
      await data.mutate();
      if (res.emailed) {
        toast({ text: `Invitasjon sendt til ${email.trim()}` });
      } else {
        await shareLink(res.inviteLink, toast);
      }
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lage invitasjonen.") });
    } finally {
      setSending(false);
    }
  };

  const revoke = async (inv: Invite) => {
    const ok = await confirm({ title: "Trekke tilbake invitasjonen?", text: `Lenken til ${inv.email} slutter å virke.`, confirmLabel: "Trekk tilbake", danger: true });
    if (!ok) return;
    try {
      await adminFetch("/api/admin/members/invite", { method: "DELETE", body: JSON.stringify({ id: inv.id }) });
      toast({ text: "Invitasjonen er trukket tilbake" });
      await data.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error) });
    }
  };

  if (!data.data) return <ListSkeleton rows={2} />;

  return (
    <section className="space-y-5">
      <Card className="space-y-4">
        <CardHeader icon={<Users className="size-5" />} title="Voksne i familien" description="Alle her kan godkjenne oppgaver, betale ut og endre oppsettet." />
        <ul className="space-y-2">
          {data.data.members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-lg font-bold text-primary">
                {(m.email ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.email ?? "Ukjent e-post"}</p>
                <p className="text-sm text-muted-foreground">Med siden {formatWhen(m.created_at)}</p>
              </div>
              {m.isMe && <Badge tone="primary">Deg</Badge>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-4">
        <CardHeader icon={<UserPlus className="size-5" />} title="Inviter en voksen" description="Den andre forelderen eller en bonusforelder, med full tilgang. De logger inn med e-posten du skriver her. Besteforeldre legger du til lenger ned." />
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void invite();
          }}
        >
          <Field label="E-post" className="flex-1">
            <Input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="navn@epost.no" />
          </Field>
          <Button type="submit" size="lg" loading={sending} disabled={!email.trim()} icon={<Mail className="size-4" />}>
            Inviter
          </Button>
        </form>

        {data.data.invites.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground/85">Venter på svar</p>
            <ul className="space-y-2">
              {data.data.invites.map((inv) => {
                return (
                  <li key={inv.id} className="rounded-2xl border border-dashed border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate font-semibold">{inv.email}</p>
                      <Badge tone="warning">Invitert {formatWhen(inv.created_at)}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" icon={<Share2 className="size-4" />} onClick={() => void shareLink(inv.link, toast)}>
                        Del lenke
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Copy className="size-4" />}
                        onClick={async () => {
                          await navigator.clipboard.writeText(inv.link);
                          toast({ text: "Lenken er kopiert" });
                        }}
                      >
                        Kopier
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => void revoke(inv)}>
                        Trekk tilbake
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Lenkene virker i 48 timer.</p>
          </div>
        )}
      </Card>
      <GrandparentsCard />
    </section>
  );
}

type Guest = { id: string; name: string; created_at: string; last_seen_at: string | null };

// Besteforeldre og andre som skal se barna og gi gaver, uten egen konto.
function GrandparentsCard() {
  const toast = useToast();
  const confirm = useConfirm();
  const { familyId } = useAdminIdentity();
  const guests = useSWR(familyId ? ["guests", familyId] : null, () => adminFetch<{ guests: Guest[] }>("/api/admin/guests"), swrDefaults);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [freshLink, setFreshLink] = useState<{ name: string; link: string } | null>(null);

  const makeLink = async (payload: { name?: string; guestId?: string }, label: string) => {
    setBusy(true);
    try {
      const res = await adminFetch<{ link: string }>("/api/admin/guests", { method: "POST", body: JSON.stringify(payload) });
      setFreshLink({ name: label, link: res.link });
      setName("");
      await guests.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lage lenken.") });
    } finally {
      setBusy(false);
    }
  };

  const share = async (link: string, who: string) => {
    const text = `Hei ${who}! Her kan du se hva barnebarna sparer til og gi dem en gave. Trykk på lenken og legg siden på hjemskjermen:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ukepenger", text, url: link });
        return;
      } catch {
        // avbrutt: kopier i stedet
      }
    }
    await navigator.clipboard.writeText(`${text} ${link}`);
    toast({ text: "Lenken er kopiert. Send den på SMS." });
  };

  const revoke = async (g: Guest) => {
    const ok = await confirm({ title: `Stenge lenken til ${g.name}?`, text: "Siden slutter å virke på telefonen deres.", confirmLabel: "Steng", danger: true });
    if (!ok) return;
    try {
      await adminFetch("/api/admin/guests", { method: "DELETE", body: JSON.stringify({ guestId: g.id }) });
      toast({ text: `Lenken til ${g.name} er stengt` });
      await guests.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error) });
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<Heart className="size-5" />}
        title="Besteforeldre"
        description="Gi besteforeldre (eller tante, gudfar …) en egen lenke. De ser hva barna sparer til og kan gi gaver – uten innlogging. De kan ikke godkjenne, betale ut eller endre noe."
      />

      {freshLink && (
        <div className="animate-pop space-y-3 rounded-2xl bg-amber-50 p-4">
          <p className="font-bold">Lenken til {freshLink.name} er klar 🎉</p>
          <p className="text-sm text-muted-foreground">Send den på SMS. De trykker én gang, og er inne for godt.</p>
          <div className="flex justify-center rounded-2xl bg-white p-3">
            <QrImage value={freshLink.link} size={180} />
          </div>
          <Button block icon={<Share2 className="size-4" />} onClick={() => void share(freshLink.link, freshLink.name)}>
            Send lenken til {freshLink.name}
          </Button>
          <p className="text-xs text-muted-foreground">Lenken vises bare nå. Trenger du den igjen, lager du en ny.</p>
        </div>
      )}

      {(guests.data?.guests ?? []).length > 0 && (
        <ul className="space-y-2">
          {(guests.data?.guests ?? []).map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border px-4 py-3">
              <span className="text-2xl" aria-hidden="true">👵</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{g.name}</p>
                <p className="text-sm text-muted-foreground">{g.last_seen_at ? `Sist inne ${formatWhen(g.last_seen_at)}` : "Har ikke åpnet lenken ennå"}</p>
              </div>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void makeLink({ guestId: g.id }, g.name)}>
                Ny lenke
              </Button>
              <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => void revoke(g)}>
                Steng
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) void makeLink({ name: name.trim() }, name.trim());
        }}
      >
        <Field label="Navn" className="flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Mormor" maxLength={40} />
        </Field>
        <Button type="submit" size="lg" loading={busy} disabled={!name.trim()} icon={<UserPlus className="size-4" />}>
          Lag lenke
        </Button>
      </form>
    </Card>
  );
}
