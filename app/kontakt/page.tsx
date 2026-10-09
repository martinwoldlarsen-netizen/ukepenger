"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Coins, Send } from "lucide-react";
import { Button, Field, Input, Select, cx, focusRing } from "@/components/ui";

// Kontaktskjema. Meldingen lagres hos oss, og vi svarer på e-postadressen du oppgir.
export default function ContactPage() {
  return (
    <Suspense>
      <ContactInner />
    </Suspense>
  );
}

function ContactInner() {
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
    const payload = res ? ((await res.json().catch(() => ({}))) as { error?: string }) : { error: "Fikk ikke kontakt med serveren. Sjekk nettet." };
    setSending(false);
    if (!res?.ok) {
      setError(payload.error ?? "Det gikk ikke. Prøv igjen.");
      return;
    }
    setSent(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-10 text-foreground">
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
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Takk for meldingen!</h1>
            <p className="mt-2 text-muted-foreground">Vi svarer på {email} så snart vi kan, vanligvis innen et par dager.</p>
            <Link href="/" className="mt-6 inline-block font-semibold text-primary underline">
              Til forsiden
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">Kontakt oss 👋</h1>
            <p className="mt-1 text-muted-foreground">Spørsmål, ønsker, feil eller personvern – skriv til oss, så svarer vi på e-post.</p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <Field label="Navn (valgfritt)">
                <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
              </Field>
              <Field label="E-post">
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="navn@epost.no" />
              </Field>
              <Field label="Hva gjelder det?">
                <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option value="sporsmal">Spørsmål eller ønske</option>
                  <option value="feil">Noe virker ikke</option>
                  <option value="personvern">Personvern (innsyn/sletting)</option>
                  <option value="annet">Annet</option>
                </Select>
              </Field>
              <Field label="Melding">
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
                Send melding
              </Button>
              <p className="text-xs text-muted-foreground">
                Vi lagrer meldingen og e-postadressen din for å kunne svare, og sletter dem senest 12 måneder etter siste svar. Se{" "}
                <Link href="/personvern" className="underline">
                  personvern
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
