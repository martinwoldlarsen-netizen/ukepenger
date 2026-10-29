"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Coins, Send } from "lucide-react";
import { Button, Field, Input, Select, cx, focusRing } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useText } from "@/lib/use-lang";

const TEXT = {
  nb: {
    network: "Fikk ikke kontakt med serveren. Sjekk nettet.",
    failed: "Det gikk ikke. Prøv igjen.",
    thanks: "Takk for meldingen!",
    reply: (email: string) => `Vi svarer på ${email} så snart vi kan, vanligvis innen et par dager.`,
    toHome: "Til forsiden",
    title: "Kontakt oss 👋",
    lead: "Spørsmål, ønsker, feil eller personvern – skriv til oss, så svarer vi på e-post.",
    name: "Navn (valgfritt)",
    email: "E-post",
    emailPh: "navn@epost.no",
    topic: "Hva gjelder det?",
    topics: { sporsmal: "Spørsmål eller ønske", feil: "Noe virker ikke", personvern: "Personvern (innsyn/sletting)", annet: "Annet" },
    message: "Melding",
    send: "Send melding",
    storeA: "Vi lagrer meldingen og e-postadressen din for å kunne svare, og sletter dem senest 12 måneder etter siste svar. Se",
    privacy: "personvern",
  },
  en: {
    network: "Couldn't reach the server. Check your connection.",
    failed: "That didn't work. Please try again.",
    thanks: "Thanks for your message!",
    reply: (email: string) => `We'll reply to ${email} as soon as we can, usually within a couple of days.`,
    toHome: "Back to the front page",
    title: "Contact us 👋",
    lead: "Questions, wishes, bugs or privacy – write to us and we'll reply by email.",
    name: "Name (optional)",
    email: "Email",
    emailPh: "name@email.com",
    topic: "What is it about?",
    topics: { sporsmal: "A question or a wish", feil: "Something isn't working", personvern: "Privacy (access/deletion)", annet: "Other" },
    message: "Message",
    send: "Send message",
    storeA: "We store your message and email address so we can reply, and delete them no later than 12 months after our last reply. See",
    privacy: "privacy",
  },
  uk: {
    network: "Не вдалося зв’язатися із сервером. Перевірте інтернет.",
    failed: "Не вдалося. Спробуйте ще раз.",
    thanks: "Дякуємо за повідомлення!",
    reply: (email: string) => `Ми відповімо на ${email} якнайшвидше, зазвичай протягом кількох днів.`,
    toHome: "На головну",
    title: "Напишіть нам 👋",
    lead: "Запитання, побажання, помилки чи конфіденційність – напишіть нам, і ми відповімо е-поштою.",
    name: "Ім’я (необов’язково)",
    email: "Е-пошта",
    emailPh: "name@email.com",
    topic: "Чого це стосується?",
    topics: { sporsmal: "Запитання чи побажання", feil: "Щось не працює", personvern: "Конфіденційність (доступ/видалення)", annet: "Інше" },
    message: "Повідомлення",
    send: "Надіслати",
    storeA: "Ми зберігаємо ваше повідомлення та е-пошту, щоб відповісти, і видаляємо їх не пізніше ніж через 12 місяців після останньої відповіді. Див.",
    privacy: "конфіденційність",
  },
};

// Kontaktskjema. Meldingen lagres hos oss, og vi svarer på e-postadressen du oppgir.
export default function ContactPage() {
  return (
    <Suspense>
      <ContactInner />
    </Suspense>
  );
}

function ContactInner() {
  const t = useText(TEXT);
  const initialTopic = useSearchParams().get("emne");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(initialTopic === "personvern" || initialTopic === "feil" ? initialTopic : "sporsmal");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // skjult felt mot spam-roboter
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const send = async () => {
    setSending(true);
    setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, topic, message, website }),
    }).catch(() => null);
    const payload = res ? ((await res.json().catch(() => ({}))) as { error?: string }) : { error: t.network };
    setSending(false);
    if (!res?.ok) {
      setError(payload.error ?? t.failed);
      return;
    }
    setSent(true);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background px-4 py-10 text-foreground">
      <LanguageSwitcher className="absolute right-3 top-3" />
      <Link href="/" className={cx("mb-8 flex items-center gap-2.5 rounded-xl", focusRing)}>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Coins className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-num text-lg font-bold tracking-[-0.06em]">ukepenger</span>
      </Link>

      <section className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
        {sent ? (
          <div className="text-center">
            <div className="text-6xl" aria-hidden="true">💌</div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{t.thanks}</h1>
            <p className="mt-2 text-muted-foreground">{t.reply(email)}</p>
            <Link href="/" className="mt-6 inline-block font-semibold text-primary underline">
              {t.toHome}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
            <p className="mt-1 text-muted-foreground">{t.lead}</p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <Field label={t.name}>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
              </Field>
              <Field label={t.email}>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder={t.emailPh} />
              </Field>
              <Field label={t.topic}>
                <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option value="sporsmal">{t.topics.sporsmal}</option>
                  <option value="feil">{t.topics.feil}</option>
                  <option value="personvern">{t.topics.personvern}</option>
                  <option value="annet">{t.topics.annet}</option>
                </Select>
              </Field>
              <Field label={t.message}>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={3000}
                  rows={5}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </Field>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />

              {error && (
                <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" block loading={sending} disabled={!email.trim() || !message.trim()} icon={<Send className="size-4" />}>
                {t.send}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t.storeA}{" "}
                <Link href="/personvern" className="underline">
                  {t.privacy}
                </Link>
                .
              </p>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
