"use client";

import { useState } from "react";
import useSWR from "swr";
import { Copy, Heart, Mail, Share2, Smartphone, UserPlus, Users } from "lucide-react";
import { QrImage } from "@/components/QrCode";
import { Badge, Button, Card, CardHeader, Field, Input, ListSkeleton } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { adminFetch, friendlyError, swrDefaults, useAdminIdentity } from "@/lib/admin-data";
import { formatWhen } from "@/lib/dates";
import { supabase } from "@/lib/supabaseClient";
import { openVippsApp } from "@/lib/vipps";

type Member = {
  user_id: string;
  email: string | null;
  role: string;
  created_at: string;
  isMe: boolean;
  display_name: string | null;
  vipps_phone: string | null;
};
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
                {(m.display_name ?? m.email ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.display_name ?? m.email ?? "Ukjent e-post"}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {m.display_name && m.email ? `${m.email} · ` : ""}
                  Med siden {formatWhen(m.created_at)}
                </p>
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
      <VippsCard />

      <GrandparentsCard />
    </section>
  );
}

function formatPhone(phone: string) {
  return phone.replace(/(\d{3})(\d{2})(\d{3})/, "$1 $2 $3");
}

type VippsRecipient = { id: string; name: string; phone: string };

function useFamilyVipps(familyId: string | null) {
  return useSWR(
    familyId ? ["family-vipps", familyId] : null,
    async () => {
      const res = await supabase.from("family_vipps").select("id, name, phone").eq("family_id", familyId!).order("created_at", { ascending: true });
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []) as VippsRecipient[];
    },
    swrDefaults
  );
}

// Hvem besteforeldre kan sende gavepenger til på Vipps. Gjelder hele
// familien: legg inn både Mamma og Pappa, også om bare én har konto.
function VippsCard() {
  const toast = useToast();
  const confirm = useConfirm();
  const { familyId } = useAdminIdentity();
  const list = useFamilyVipps(familyId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const recipients = list.data ?? [];

  const add = async () => {
    if (!familyId) return;
    const digits = phone.replace(/\D/g, "").replace(/^(47|0047)(?=\d{8}$)/, "");
    if (!name.trim()) {
      toast({ kind: "error", text: "Skriv navnet besteforeldre skal se, f.eks. Pappa." });
      return;
    }
    if (!/^\d{8}$/.test(digits)) {
      toast({ kind: "error", text: "Skriv et norsk mobilnummer med 8 siffer." });
      return;
    }
    setSaving(true);
    const res = await supabase.from("family_vipps").insert({ family_id: familyId, name: name.trim().slice(0, 40), phone: digits });
    setSaving(false);
    if (res.error) {
      toast({ kind: "error", text: "Klarte ikke å lagre." });
      return;
    }
    toast({ text: `${name.trim()} er lagt til` });
    setName("");
    setPhone("");
    await list.mutate();
  };

  const remove = async (r: VippsRecipient) => {
    const ok = await confirm({ title: `Fjerne ${r.name}?`, text: "Besteforeldre kan ikke lenger velge dette nummeret.", confirmLabel: "Fjern", danger: true });
    if (!ok) return;
    const res = await supabase.from("family_vipps").delete().eq("id", r.id);
    if (res.error) {
      toast({ kind: "error", text: "Klarte ikke å fjerne." });
      return;
    }
    await list.mutate();
  };

  // Samme som besteforeldre får: nummeret kopieres og Vipps åpnes.
  const test = async (r: VippsRecipient) => {
    const res = await openVippsApp(r.phone);
    if (!res.opened) {
      toast({ text: res.copied ? "Nummeret er kopiert. Test på mobilen – der åpnes Vipps." : "Test på mobilen – der åpnes Vipps." });
      return;
    }
    toast({ text: res.copied ? `Vipps åpnes. ${formatPhone(r.phone)} er kopiert – trykk Send og lim inn.` : "Vipps åpnes." });
  };

  const suggestions = ["Mamma", "Pappa"].filter((n) => !recipients.some((r) => r.name.toLowerCase() === n.toLowerCase()));

  return (
    <div id="vipps" className="scroll-mt-24">
      <Card className="space-y-4">
        <CardHeader
          icon={<Smartphone className="size-5" />}
          title="Vipps for gaver"
          description="Når besteforeldre gir en gave, velger de hvem som skal få pengene, og Vipps åpnes med nummeret. Legg inn én eller flere – f.eks. både Mamma og Pappa."
        />

        {recipients.length > 0 && (
          <ul className="space-y-2">
            {recipients.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#ff5b24]/10 text-lg font-bold text-[#ff5b24]">
                  {r.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.name}</p>
                  <p className="font-num text-sm text-muted-foreground">{formatPhone(r.phone)}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => void test(r)}>
                  Test
                </Button>
                <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => void remove(r)}>
                  Fjern
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Navn">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Pappa" maxLength={40} />
            </Field>
            <Field label="Vipps-nummer">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="123 45 678" inputMode="tel" autoComplete="off" />
            </Field>
          </div>
          {suggestions.length > 0 && !name && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((n) => (
                <button key={n} type="button" onClick={() => setName(n)} className="min-h-10 rounded-full bg-secondary px-4 text-sm font-semibold hover:bg-accent">
                  {n}
                </button>
              ))}
            </div>
          )}
          <Button type="submit" size="lg" block loading={saving} disabled={!name.trim() || !phone.trim()}>
            Legg til
          </Button>
        </form>
      </Card>
    </div>
  );
}

type Guest = { id: string; name: string; created_at: string; last_seen_at: string | null; has_account: boolean };

// Besteforeldre og andre som skal se barna og gi gaver, uten egen konto.
function GrandparentsCard() {
  const toast = useToast();
  const confirm = useConfirm();
  const { familyId } = useAdminIdentity();
  const guests = useSWR(familyId ? ["guests", familyId] : null, () => adminFetch<{ guests: Guest[] }>("/api/admin/guests"), swrDefaults);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [freshLink, setFreshLink] = useState<{ name: string; link: string } | null>(null);
  const vipps = useFamilyVipps(familyId);

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
        description="Gi besteforeldre (eller tante, gudfar …) en egen lenke. De ser hva barna sparer til og kan gi gaver. Vil de, lager de en egen profil så de finner tilbake på alle enheter. De kan ikke godkjenne, betale ut eller endre noe."
      />

      {vipps.data && vipps.data.length === 0 && (
        <a href="#vipps" className="block rounded-2xl bg-[#ff5b24]/10 px-4 py-3 text-sm font-semibold">
          Tips: Legg inn Vipps-nummer under «Vipps for gaver», så kan besteforeldre sende pengene rett til dere.
        </a>
      )}

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
                <p className="truncate font-semibold">
                  {g.name} {g.has_account && <Badge tone="primary">Har profil</Badge>}
                </p>
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
