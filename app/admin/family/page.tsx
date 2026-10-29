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
import { useLang, useText } from "@/lib/use-lang";

const TEXT = {
  nb: {
    joinText: "Bli med i familien vår på Ukepenger:", linkCopiedSend: "Lenken er kopiert. Send den på SMS eller Messenger.",
    inviteSent: (email: string) => `Invitasjon sendt til ${email}`, inviteFailed: "Klarte ikke å lage invitasjonen.",
    revokeTitle: "Trekke tilbake invitasjonen?", revokeText: (email: string) => `Lenken til ${email} slutter å virke.`, revoke: "Trekk tilbake", revoked: "Invitasjonen er trukket tilbake",
    adults: "Voksne i familien", adultsDesc: "Alle her kan godkjenne oppgaver, betale ut og endre oppsettet.", unknownEmail: "Ukjent e-post", since: (when: string) => `Med siden ${when}`, you: "Deg",
    inviteAdult: "Inviter en voksen", inviteDesc: "Den andre forelderen eller en bonusforelder, med full tilgang. De logger inn med e-posten du skriver her. Besteforeldre legger du til lenger ned.",
    email: "E-post", emailPlaceholder: "navn@epost.no", invite: "Inviter", waitingReply: "Venter på svar", invited: (when: string) => `Invitert ${when}`,
    shareLink: "Del lenke", linkCopied: "Lenken er kopiert", copy: "Kopier", linksValid: "Lenkene virker i 48 timer.",
    vippsNameMissing: "Skriv navnet besteforeldre skal se, f.eks. Pappa.", vippsNumber: "Skriv et norsk mobilnummer med 8 siffer.", saveFailed: "Klarte ikke å lagre.",
    added: (name: string) => `${name} er lagt til`, removeTitle: (name: string) => `Fjerne ${name}?`, removeVippsText: "Besteforeldre kan ikke lenger velge dette nummeret.", remove: "Fjern", removeFailed: "Klarte ikke å fjerne.",
    testCopied: "Nummeret er kopiert. Test på mobilen – der åpnes Vipps.", testMobile: "Test på mobilen – der åpnes Vipps.",
    vippsOpensCopied: (phone: string) => `Vipps åpnes. ${phone} er kopiert – trykk Send og lim inn.`, vippsOpens: "Vipps åpnes.",
    suggestions: ["Mamma", "Pappa"], vippsTitle: "Vipps for gaver",
    vippsDesc: "Når besteforeldre gir en gave, velger de hvem som skal få pengene, og Vipps åpnes med nummeret. Legg inn én eller flere – f.eks. både Mamma og Pappa.",
    test: "Test", name: "Navn", namePlaceholder: "F.eks. Pappa", vippsNumberLabel: "Vipps-nummer", add: "Legg til",
    linkFailed: "Klarte ikke å lage lenken.",
    shareGuest: (who: string) => `Hei ${who}! Her kan du se hva barnebarna sparer til og gi dem en gave. Trykk på lenken og legg siden på hjemskjermen:`,
    linkCopiedSms: "Lenken er kopiert. Send den på SMS.", closeTitle: (name: string) => `Stenge lenken til ${name}?`, closeText: "Siden slutter å virke på telefonen deres.", closeLink: "Steng",
    closed: (name: string) => `Lenken til ${name} er stengt`, grandparents: "Besteforeldre",
    grandparentsDesc: "Gi besteforeldre (eller tante, gudfar …) en egen lenke. De ser hva barna sparer til og kan gi gaver. Vil de, lager de en egen profil så de finner tilbake på alle enheter. De kan ikke godkjenne, betale ut eller endre noe.",
    vippsTip: "Tips: Legg inn Vipps-nummer under «Vipps for gaver», så kan besteforeldre sende pengene rett til dere.",
    linkReady: (name: string) => `Lenken til ${name} er klar 🎉`, sendSms: "Send den på SMS. De trykker én gang, og er inne for godt.", sendTo: (name: string) => `Send lenken til ${name}`,
    onlyNow: "Lenken vises bare nå. Trenger du den igjen, lager du en ny.", hasProfile: "Har profil", lastSeen: (when: string) => `Sist inne ${when}`, notOpened: "Har ikke åpnet lenken ennå",
    newLink: "Ny lenke", guestPlaceholder: "F.eks. Mormor", makeLink: "Lag lenke",
  },
  en: {
    joinText: "Join our family on Ukepenger:", linkCopiedSend: "The link was copied. Send it by text or Messenger.",
    inviteSent: (email: string) => `Invitation sent to ${email}`, inviteFailed: "Couldn't create the invitation.",
    revokeTitle: "Withdraw the invitation?", revokeText: (email: string) => `The link for ${email} will stop working.`, revoke: "Withdraw", revoked: "The invitation was withdrawn",
    adults: "Adults in the family", adultsDesc: "Everyone here can approve tasks, pay out and change the setup.", unknownEmail: "Unknown email", since: (when: string) => `Member since ${when}`, you: "You",
    inviteAdult: "Invite an adult", inviteDesc: "The other parent or a step-parent, with full access. They sign in with the email you enter here. You add grandparents further down.",
    email: "Email", emailPlaceholder: "name@email.com", invite: "Invite", waitingReply: "Waiting for a reply", invited: (when: string) => `Invited ${when}`,
    shareLink: "Share link", linkCopied: "The link was copied", copy: "Copy", linksValid: "The links work for 48 hours.",
    vippsNameMissing: "Write the name the grandparents will see, e.g. Dad.", vippsNumber: "Write a Norwegian mobile number with 8 digits.", saveFailed: "Couldn't save.",
    added: (name: string) => `${name} was added`, removeTitle: (name: string) => `Remove ${name}?`, removeVippsText: "Grandparents can no longer choose this number.", remove: "Remove", removeFailed: "Couldn't remove it.",
    testCopied: "The number was copied. Test on your phone – Vipps opens there.", testMobile: "Test on your phone – Vipps opens there.",
    vippsOpensCopied: (phone: string) => `Vipps is opening. ${phone} was copied – tap Send and paste it.`, vippsOpens: "Vipps is opening.",
    suggestions: ["Mum", "Dad"], vippsTitle: "Vipps for gifts",
    vippsDesc: "When grandparents give a gift, they choose who gets the money, and Vipps opens with the number. Add one or more – e.g. both Mum and Dad.",
    test: "Test", name: "Name", namePlaceholder: "E.g. Dad", vippsNumberLabel: "Vipps number", add: "Add",
    linkFailed: "Couldn't create the link.",
    shareGuest: (who: string) => `Hi ${who}! Here you can see what the grandchildren are saving for and give them a gift. Tap the link and add the page to your home screen:`,
    linkCopiedSms: "The link was copied. Send it by text.", closeTitle: (name: string) => `Close the link for ${name}?`, closeText: "The page will stop working on their phone.", closeLink: "Close",
    closed: (name: string) => `The link for ${name} was closed`, grandparents: "Grandparents",
    grandparentsDesc: "Give grandparents (or an aunt, a godfather …) their own link. They see what the children are saving for and can give gifts. If they like, they create a profile so they can find their way back on any device. They can't approve, pay out or change anything.",
    vippsTip: "Tip: Add a Vipps number under “Vipps for gifts”, so grandparents can send the money straight to you.",
    linkReady: (name: string) => `The link for ${name} is ready 🎉`, sendSms: "Send it by text. They tap it once and they're in for good.", sendTo: (name: string) => `Send the link to ${name}`,
    onlyNow: "The link is only shown now. If you need it again, create a new one.", hasProfile: "Has a profile", lastSeen: (when: string) => `Last visit ${when}`, notOpened: "Hasn't opened the link yet",
    newLink: "New link", guestPlaceholder: "E.g. Grandma", makeLink: "Create link",
  },
  uk: {
    joinText: "Приєднуйтеся до нашої сім’ї в Ukepenger:", linkCopiedSend: "Посилання скопійовано. Надішліть його в SMS або Messenger.",
    inviteSent: (email: string) => `Запрошення надіслано на ${email}`, inviteFailed: "Не вдалося створити запрошення.",
    revokeTitle: "Скасувати запрошення?", revokeText: (email: string) => `Посилання для ${email} перестане працювати.`, revoke: "Скасувати", revoked: "Запрошення скасовано",
    adults: "Дорослі в сім’ї", adultsDesc: "Усі тут можуть схвалювати завдання, виплачувати й змінювати налаштування.", unknownEmail: "Невідома ел. пошта", since: (when: string) => `У сім’ї з ${when}`, you: "Ви",
    inviteAdult: "Запросити дорослого", inviteDesc: "Іншого з батьків або вітчима чи мачуху — з повним доступом. Вони входять з ел. поштою, яку ви тут вкажете. Бабусь і дідусів додають нижче.",
    email: "Ел. пошта", emailPlaceholder: "imya@email.com", invite: "Запросити", waitingReply: "Очікує відповіді", invited: (when: string) => `Запрошено ${when}`,
    shareLink: "Поділитися", linkCopied: "Посилання скопійовано", copy: "Копіювати", linksValid: "Посилання дійсні 48 годин.",
    vippsNameMissing: "Напишіть ім’я, яке бачитимуть бабуся й дідусь, напр. Тато.", vippsNumber: "Вкажіть норвезький мобільний номер із 8 цифр.", saveFailed: "Не вдалося зберегти.",
    added: (name: string) => `${name}: додано`, removeTitle: (name: string) => `Прибрати ${name}?`, removeVippsText: "Бабусі й дідусі більше не зможуть обрати цей номер.", remove: "Прибрати", removeFailed: "Не вдалося прибрати.",
    testCopied: "Номер скопійовано. Перевірте на телефоні — там відкриється Vipps.", testMobile: "Перевірте на телефоні — там відкриється Vipps.",
    vippsOpensCopied: (phone: string) => `Відкривається Vipps. ${phone} скопійовано — натисніть «Надіслати» й вставте номер.`, vippsOpens: "Відкривається Vipps.",
    suggestions: ["Мама", "Тато"], vippsTitle: "Vipps для подарунків",
    vippsDesc: "Коли бабуся чи дідусь дарують гроші, вони обирають, хто їх отримає, і відкривається Vipps із номером. Додайте один чи кілька номерів — напр. маму й тата.",
    test: "Перевірити", name: "Ім’я", namePlaceholder: "Напр. Тато", vippsNumberLabel: "Номер Vipps", add: "Додати",
    linkFailed: "Не вдалося створити посилання.",
    shareGuest: (who: string) => `Привіт, ${who}! Тут можна побачити, на що збирають онуки, і зробити їм подарунок. Натисніть посилання й додайте сторінку на головний екран:`,
    linkCopiedSms: "Посилання скопійовано. Надішліть його в SMS.", closeTitle: (name: string) => `Закрити посилання для ${name}?`, closeText: "Сторінка перестане працювати на їхньому телефоні.", closeLink: "Закрити",
    closed: (name: string) => `Посилання для ${name} закрито`, grandparents: "Бабусі й дідусі",
    grandparentsDesc: "Дайте бабусі й дідусеві (або тітці, хрещеному …) власне посилання. Вони бачать, на що збирають діти, і можуть дарувати подарунки. За бажання вони створюють профіль, щоб знаходити сторінку на будь-якому пристрої. Вони не можуть нічого схвалювати, виплачувати чи змінювати.",
    vippsTip: "Порада: додайте номер Vipps у «Vipps для подарунків», щоб бабусі й дідусі надсилали гроші прямо вам.",
    linkReady: (name: string) => `Посилання для ${name} готове 🎉`, sendSms: "Надішліть його в SMS. Одне натискання — і доступ назавжди.", sendTo: (name: string) => `Надіслати посилання: ${name}`,
    onlyNow: "Посилання показується лише зараз. Якщо знадобиться знову, створіть нове.", hasProfile: "Має профіль", lastSeen: (when: string) => `Останній візит ${when}`, notOpened: "Ще не відкривали посилання",
    newLink: "Нове посилання", guestPlaceholder: "Напр. Бабуся", makeLink: "Створити посилання",
  },
};

type FamilyText = (typeof TEXT)["nb"];

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

async function shareLink(link: string, toast: ReturnType<typeof useToast>, t: FamilyText) {
  const text = t.joinText;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "Ukepenger", text, url: link });
      return;
    } catch {
      // Avbrutt av brukeren, eller ikke støttet: kopier i stedet.
    }
  }
  await navigator.clipboard.writeText(link);
  toast({ text: t.linkCopiedSend });
}

export default function AdminFamilyPage() {
  const t = useText(TEXT);
  const lang = useLang();
  const when = (d: string) => formatWhen(d, undefined, lang);
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
        toast({ text: t.inviteSent(email.trim()) });
      } else {
        await shareLink(res.inviteLink, toast, t);
      }
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.inviteFailed) });
    } finally {
      setSending(false);
    }
  };

  const revoke = async (inv: Invite) => {
    const ok = await confirm({ title: t.revokeTitle, text: t.revokeText(inv.email), confirmLabel: t.revoke, danger: true });
    if (!ok) return;
    try {
      await adminFetch("/api/admin/members/invite", { method: "DELETE", body: JSON.stringify({ id: inv.id }) });
      toast({ text: t.revoked });
      await data.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error) });
    }
  };

  if (!data.data) return <ListSkeleton rows={2} />;

  return (
    <section className="space-y-5">
      <Card className="space-y-4">
        <CardHeader icon={<Users className="size-5" />} title={t.adults} description={t.adultsDesc} />
        <ul className="space-y-2">
          {data.data.members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-lg font-bold text-primary">
                {(m.display_name ?? m.email ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.display_name ?? m.email ?? t.unknownEmail}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {m.display_name && m.email ? `${m.email} · ` : ""}
                  {t.since(when(m.created_at))}
                </p>
              </div>
              {m.isMe && <Badge tone="primary">{t.you}</Badge>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-4">
        <CardHeader icon={<UserPlus className="size-5" />} title={t.inviteAdult} description={t.inviteDesc} />
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void invite();
          }}
        >
          <Field label={t.email} className="flex-1">
            <Input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} />
          </Field>
          <Button type="submit" size="lg" loading={sending} disabled={!email.trim()} icon={<Mail className="size-4" />}>
            {t.invite}
          </Button>
        </form>

        {data.data.invites.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground/85">{t.waitingReply}</p>
            <ul className="space-y-2">
              {data.data.invites.map((inv) => {
                return (
                  <li key={inv.id} className="rounded-2xl border border-dashed border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate font-semibold">{inv.email}</p>
                      <Badge tone="warning">{t.invited(when(inv.created_at))}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" icon={<Share2 className="size-4" />} onClick={() => void shareLink(inv.link, toast, t)}>
                        {t.shareLink}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Copy className="size-4" />}
                        onClick={async () => {
                          await navigator.clipboard.writeText(inv.link);
                          toast({ text: t.linkCopied });
                        }}
                      >
                        {t.copy}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => void revoke(inv)}>
                        {t.revoke}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">{t.linksValid}</p>
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
  const t = useText(TEXT);
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
      toast({ kind: "error", text: t.vippsNameMissing });
      return;
    }
    if (!/^\d{8}$/.test(digits)) {
      toast({ kind: "error", text: t.vippsNumber });
      return;
    }
    setSaving(true);
    const res = await supabase.from("family_vipps").insert({ family_id: familyId, name: name.trim().slice(0, 40), phone: digits });
    setSaving(false);
    if (res.error) {
      toast({ kind: "error", text: t.saveFailed });
      return;
    }
    toast({ text: t.added(name.trim()) });
    setName("");
    setPhone("");
    await list.mutate();
  };

  const remove = async (r: VippsRecipient) => {
    const ok = await confirm({ title: t.removeTitle(r.name), text: t.removeVippsText, confirmLabel: t.remove, danger: true });
    if (!ok) return;
    const res = await supabase.from("family_vipps").delete().eq("id", r.id);
    if (res.error) {
      toast({ kind: "error", text: t.removeFailed });
      return;
    }
    await list.mutate();
  };

  // Samme som besteforeldre får: nummeret kopieres og Vipps åpnes.
  const test = async (r: VippsRecipient) => {
    const res = await openVippsApp(r.phone);
    if (!res.opened) {
      toast({ text: res.copied ? t.testCopied : t.testMobile });
      return;
    }
    toast({ text: res.copied ? t.vippsOpensCopied(formatPhone(r.phone)) : t.vippsOpens });
  };

  const suggestions = t.suggestions.filter((n) => !recipients.some((r) => r.name.toLowerCase() === n.toLowerCase()));

  return (
    <div id="vipps" className="scroll-mt-24">
      <Card className="space-y-4">
        <CardHeader
          icon={<Smartphone className="size-5" />}
          title={t.vippsTitle}
          description={t.vippsDesc}
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
                  {t.test}
                </Button>
                <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => void remove(r)}>
                  {t.remove}
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
            <Field label={t.name}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} maxLength={40} />
            </Field>
            <Field label={t.vippsNumberLabel}>
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
            {t.add}
          </Button>
        </form>
      </Card>
    </div>
  );
}

type Guest = { id: string; name: string; created_at: string; last_seen_at: string | null; has_account: boolean };

// Besteforeldre og andre som skal se barna og gi gaver, uten egen konto.
function GrandparentsCard() {
  const t = useText(TEXT);
  const lang = useLang();
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
      toast({ kind: "error", text: friendlyError(error, t.linkFailed) });
    } finally {
      setBusy(false);
    }
  };

  const share = async (link: string, who: string) => {
    const text = t.shareGuest(who);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ukepenger", text, url: link });
        return;
      } catch {
        // avbrutt: kopier i stedet
      }
    }
    await navigator.clipboard.writeText(`${text} ${link}`);
    toast({ text: t.linkCopiedSms });
  };

  const revoke = async (g: Guest) => {
    const ok = await confirm({ title: t.closeTitle(g.name), text: t.closeText, confirmLabel: t.closeLink, danger: true });
    if (!ok) return;
    try {
      await adminFetch("/api/admin/guests", { method: "DELETE", body: JSON.stringify({ guestId: g.id }) });
      toast({ text: t.closed(g.name) });
      await guests.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error) });
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<Heart className="size-5" />}
        title={t.grandparents}
        description={t.grandparentsDesc}
      />

      {vipps.data && vipps.data.length === 0 && (
        <a href="#vipps" className="block rounded-2xl bg-[#ff5b24]/10 px-4 py-3 text-sm font-semibold">
          {t.vippsTip}
        </a>
      )}

      {freshLink && (
        <div className="animate-pop space-y-3 rounded-2xl bg-amber-50 p-4">
          <p className="font-bold">{t.linkReady(freshLink.name)}</p>
          <p className="text-sm text-muted-foreground">{t.sendSms}</p>
          <div className="flex justify-center rounded-2xl bg-white p-3">
            <QrImage value={freshLink.link} size={180} />
          </div>
          <Button block icon={<Share2 className="size-4" />} onClick={() => void share(freshLink.link, freshLink.name)}>
            {t.sendTo(freshLink.name)}
          </Button>
          <p className="text-xs text-muted-foreground">{t.onlyNow}</p>
        </div>
      )}

      {(guests.data?.guests ?? []).length > 0 && (
        <ul className="space-y-2">
          {(guests.data?.guests ?? []).map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border px-4 py-3">
              <span className="text-2xl" aria-hidden="true">👵</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {g.name} {g.has_account && <Badge tone="primary">{t.hasProfile}</Badge>}
                </p>
                <p className="text-sm text-muted-foreground">{g.last_seen_at ? t.lastSeen(formatWhen(g.last_seen_at, undefined, lang)) : t.notOpened}</p>
              </div>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void makeLink({ guestId: g.id }, g.name)}>
                {t.newLink}
              </Button>
              <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => void revoke(g)}>
                {t.closeLink}
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
        <Field label={t.name} className="flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.guestPlaceholder} maxLength={40} />
        </Field>
        <Button type="submit" size="lg" loading={busy} disabled={!name.trim()} icon={<UserPlus className="size-4" />}>
          {t.makeLink}
        </Button>
      </form>
    </Card>
  );
}
