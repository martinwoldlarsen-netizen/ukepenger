"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Bell, Check, ChevronDown, Coins, Gift, Heart, Lock, PiggyBank, ShieldCheck, Smartphone, Sparkles, Wallet } from "lucide-react";
import { TaskIcon } from "@/components/TaskIcon";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { sporsmal } from "@/app/_components/LandingClient";
import { supabase } from "@/lib/supabaseClient";
import styles from "./ny.module.css";

// Ny forside (test). Viser ekte skjermbilder av appen (demofamilie med
// påfunne navn) i stedet for tegnede mockuper, og snakker til barnet,
// forelderen og besteforeldrene hver for seg.

const OPPGAVER = ["Dekke bordet", "Rydde rommet", "Tømme oppvaskmaskinen", "Lufte hunden", "Ta ut søppel", "Støvsuge stua", "Re opp sengen", "Gjøre lekser"];
const FIGURER = ["skyvalp", "raptor", "pusi", "robot", "drage", "astronaut", "hubro", "kvakk"];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Coins className="size-5" strokeWidth={2.5} />
      </span>
      <span className="font-num text-lg font-bold tracking-[-0.06em]">ukepenger</span>
    </span>
  );
}

// Skjermbilde i en enkel telefonramme. «crop» viser bare toppen, med en myk overgang.
function Phone({ src, alt, className, priority, crop }: { src: string; alt: string; className?: string; priority?: boolean; crop?: string }) {
  return (
    <div className={cx("relative rounded-[2.6rem] bg-[#15261c] p-[8px] shadow-[0_30px_60px_-24px_rgba(16,40,28,0.55)]", className)}>
      <div className={cx("relative overflow-hidden rounded-[2.1rem] bg-background", crop)}>
        <Image src={src} alt={alt} width={780} height={1688} sizes="(min-width: 1024px) 340px, 75vw" className="h-auto w-full" priority={priority} />
        {crop && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />}
      </div>
    </div>
  );
}

function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm font-bold shadow-[0_12px_30px_-12px_rgba(16,40,28,0.35)] ring-1 ring-black/5", className)}>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-primary">{children}</p>;
}

export default function NyForside() {
  // Innlogget forelder ser «Gå til appen» i stedet for «Logg inn».
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => alive && setLoggedIn(Boolean(data.session)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const appHref = loggedIn ? "/admin/inbox" : "/login";
  const appLabel = loggedIn ? "Gå til appen" : "Logg inn";

  const knapp =
    "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-lg font-extrabold text-primary-foreground shadow-[0_14px_30px_-14px_rgba(16,80,40,0.7)] transition hover:bg-primary-dark active:scale-[0.98]";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Merkelapp så det er tydelig at dette er en test */}
      <div className="bg-amber-200 px-4 py-2 text-center text-sm font-bold text-amber-950">Testversjon av ny forside – ikke publisert ennå</div>

      <header className="sticky top-0 z-30 border-b border-black/5 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Ukepenger">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <a href="#slik" className="hidden font-semibold text-muted-foreground hover:text-foreground md:inline">
              Slik virker det
            </a>
            <a href="#besteforeldre" className="hidden font-semibold text-muted-foreground hover:text-foreground md:inline">
              Besteforeldre
            </a>
            <a href="#sporsmal" className="hidden font-semibold text-muted-foreground hover:text-foreground md:inline">
              Spørsmål
            </a>
            <Link href={appHref} className="rounded-xl px-3 py-2 font-semibold hover:bg-secondary">
              {appLabel}
            </Link>
            <Link href="/login" className="hidden rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground sm:inline-flex">
              Kom i gang
            </Link>
          </nav>
        </div>
      </header>

      {/* 1. Toppen */}
      <section className="relative">
        <div className="pointer-events-none absolute -right-40 -top-20 size-[520px] rounded-full bg-[#FFE7A3]/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-80 size-[420px] rounded-full bg-[#CDE8FB]/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-black/5">
              <Sparkles className="size-4 text-primary" /> Gratis familie-app for ukepenger
            </p>
            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Oppgavene blir gjort.
              <br />
              <span className="text-primary">Uten mas.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Barna ser hva de kan gjøre og hva det er verdt, trykker <strong className="text-foreground">«Jeg har gjort det!»</strong> og får en liten feiring. Du
              godkjenner med ett trykk på mobilen.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={knapp}>
                Kom i gang – gratis <ArrowRight className="size-5" />
              </Link>
              <a href="#slik" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-lg font-bold ring-1 ring-black/10 hover:bg-secondary">
                Se hvordan det virker
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted-foreground">
              {["Ingen kredittkort", "Barna trenger ingen konto", "Så mange barn dere vil"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" strokeWidth={3} /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[420px]">
            <Phone
              src="/forside/barn-feiring.webp"
              alt="Barnesiden: Emma trykker på «Dekke bordet» og får «Bra jobba! +10 kr» med konfetti"
              priority
              className="mx-auto w-[70%] max-w-[290px] rotate-[-2deg]"
              crop="max-h-[460px] sm:max-h-[540px]"
            />
            <Phone
              src="/forside/forelder-krav.webp"
              alt="Forelderens mobil: krav som venter på godkjenning"
              className="absolute -right-2 -bottom-6 hidden w-[44%] rotate-[4deg] sm:block"
              crop="max-h-[300px]"
            />
            <Chip className={cx("absolute -left-1 top-10 sm:-left-6", styles.svev)}>
              <span className="text-xl">🔥</span> 3 uker på rad!
            </Chip>
            <Chip className={cx("absolute -left-1 bottom-10 sm:-left-8", styles.svevSen)}>
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-4" strokeWidth={3} />
              </span>
              Godkjent av pappa · +10 kr
            </Chip>
          </div>
        </div>
      </section>

      {/* 2. Slik virker det */}
      <section id="slik" className="scroll-mt-20 bg-card py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>Slik virker det</Eyebrow>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Tre steg. Ferdig på fem minutter.</h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col rounded-[2rem] bg-[#FFF1E8] p-6 sm:p-8">
              <span className="font-num text-sm font-bold text-primary">01</span>
              <h3 className="mt-2 text-2xl font-extrabold tracking-tight">Velg oppgaver og beløp</h3>
              <p className="mt-2 text-muted-foreground">Over 100 ferdige oppgaver med egne bilder – eller lag deres egne. Du bestemmer hva hver oppgave er verdt.</p>
              <div className="mt-6 grid grid-cols-4 gap-3">
                {OPPGAVER.map((t) => (
                  <div key={t} className="flex flex-col items-center gap-1.5 text-center">
                    <TaskIcon title={t} size={56} />
                    <span className="text-[11px] font-semibold leading-tight text-muted-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col rounded-[2rem] bg-[#EAF5FD] p-6 sm:p-8">
              <span className="font-num text-sm font-bold text-primary">02</span>
              <h3 className="mt-2 text-2xl font-extrabold tracking-tight">Barnet trykker «Ferdig»</h3>
              <p className="mt-2 text-muted-foreground">
                På en iPad eller mobil hjemme. Barnet velger seg selv – ingen konto, e-post eller passord. Koblingen gjøres med én QR-kode.
              </p>
              <Phone src="/forside/barn-velg.webp" alt="Barnesiden: «Hvem er du?» med Emma, Oliver og Lea" className="mx-auto mt-6 w-[72%] max-w-[260px]" crop="max-h-[300px]" />
            </div>

            <div className="flex flex-col rounded-[2rem] bg-[#EAF6EE] p-6 sm:p-8">
              <span className="font-num text-sm font-bold text-primary">03</span>
              <h3 className="mt-2 text-2xl font-extrabold tracking-tight">Du godkjenner på mobilen</h3>
              <p className="mt-2 text-muted-foreground">Du får et varsel. Ett trykk – eller «Godkjenn alle». Betal ut som før, med Vipps eller kontant.</p>
              <Phone src="/forside/forelder-krav.webp" alt="Forelderens Krav-side med Godkjenn alle" className="mx-auto mt-6 w-[72%] max-w-[260px]" crop="max-h-[300px]" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. For barnet */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <Eyebrow>For barnet</Eyebrow>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Barna gleder seg til å trykke «Ferdig».</h2>
            <p className="mt-4 text-lg text-muted-foreground">Bygget for at barn skal se framgang og kjenne mestring – uten straff, tap eller sammenligning med søsken.</p>

            <div className="mt-8 space-y-5">
              <div>
                <p className="font-extrabold">🎨 Sin egen figur</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FIGURER.map((k) => (
                    <span key={k} className="rounded-full bg-card p-1 shadow-sm ring-1 ring-black/5">
                      <KidAvatar avatarKey={k} size={44} />
                    </span>
                  ))}
                </div>
              </div>
              <p>
                <strong>🏆 Trofeer, merker og uker på rad.</strong> <span className="text-muted-foreground">Hver oppgave går opp i nivåer, og dere kan gi bonus ved nye nivåer.</span>
              </p>
              <p>
                <strong>🐷 Sparegris og ønskebutikk.</strong> <span className="text-muted-foreground">Barnet ser hvor nær de er Lego-settet – pengene får et mål.</span>
              </p>
              <p>
                <strong>🔊 Leser opp for de minste.</strong> <span className="text-muted-foreground">Trykk på høyttaleren, så leses oppgaven høyt.</span>
              </p>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[460px] items-start justify-center gap-4">
            <Phone src="/forside/barn-trofeer.webp" alt="Trofeskapet og merkene til Emma" className="w-[48%] rotate-[-3deg]" />
            <Phone src="/forside/barn-onsker.webp" alt="Ønskebutikken med Lego-sett og fotball" className="mt-16 w-[48%] rotate-[3deg]" />
          </div>
        </div>
      </section>

      {/* 4. For deg */}
      <section className="bg-[#0f5132] py-16 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#FFE7A3]">For deg som forelder</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Slutt å holde regnskapet i hodet.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Bell, t: "Varsel når noe er gjort", d: "Godkjenn eller avslå med ett trykk, når det passer deg." },
              { icon: Wallet, t: "Betal ut når du vil", d: "Hele beløpet eller en del – appen holder styr på resten." },
              { icon: PiggyBank, t: "Sparing av seg selv", d: "Velg at f.eks. 10 % av alt barnet tjener går til sparing." },
              { icon: Coins, t: "Faste ukepenger", d: "Legges til automatisk hver uke, på dagen dere velger." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-[1.6rem] bg-white/8 p-6 ring-1 ring-white/10">
                <Icon className="size-7 text-[#FFE7A3]" />
                <p className="mt-4 text-lg font-extrabold">{t}</p>
                <p className="mt-1 text-white/75">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-white/75">Appen flytter aldri penger. Den er et enkelt regnskap – dere gjør opp med Vipps eller kontant, som før.</p>
        </div>
      </section>

      {/* 5. Besteforeldre */}
      <section id="besteforeldre" className="scroll-mt-20 bg-[#EAF5FD] py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="order-2 lg:order-1">
            <Phone src="/forside/besteforeldre.webp" alt="Besteforeldresiden: Farmor ser at Emma sparer til et Lego-sett" className="mx-auto w-[70%] max-w-[300px] rotate-[-2deg]" />
          </div>
          <div className="order-1 lg:order-2">
            <Eyebrow>For besteforeldre</Eyebrow>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Farmor kan heie – og gi en gave.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Besteforeldre, tanter og gudforeldre får sin egen lenke. De ser hva barna sparer til, og kan gi en gave rett til dere på Vipps – den havner på ønsket
              barnet sparer til.
            </p>
            <ul className="mt-6 space-y-3">
              {["Egen side, uten å kunne endre noe", "Vipps-gave til mamma eller pappa", "Dere godkjenner før gaven legges til"].map((t) => (
                <li key={t} className="flex items-center gap-3 font-semibold">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Gift className="size-4" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Trygt + hvorfor */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[2rem] bg-card p-6 ring-1 ring-black/5 sm:p-10">
            <Eyebrow>Trygt for barna</Eyebrow>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Laget med barn i tankene.</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                { icon: Lock, t: "Ingen konto for barna", d: "Bare fornavn og en figur. Ingen e-post, passord eller fødselsdato." },
                { icon: ShieldCheck, t: "Ingen reklame", d: "Og ingen sporing av barna. Barnesiden har ingen statistikk." },
                { icon: Smartphone, t: "Data i EU", d: "Databasen ligger i Irland. Du kan slette alt selv, når som helst." },
                { icon: Heart, t: "Uten mas og press", d: "Ingen lootbokser, rangering mellom søsken eller falsk hast." },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-3">
                  <Icon className="mt-0.5 size-6 shrink-0 text-primary" />
                  <div>
                    <p className="font-extrabold">{t}</p>
                    <p className="text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[2rem] bg-[#FFE7A3] p-6 sm:p-10">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-amber-900">Hvorfor Ukepenger?</p>
              <p className="mt-4 text-2xl font-extrabold leading-snug tracking-tight text-amber-950">
                «Jeg lagde Ukepenger fordi vi selv trengte det: en enkel måte å avtale oppgaver med barna på – uten mas, og uten å holde regnskapet i hodet.»
              </p>
            </div>
            <p className="mt-6 font-bold text-amber-950">Martin, pappa og grunnlegger</p>
          </div>
        </div>
      </section>

      {/* 7. Spørsmål */}
      <section id="sporsmal" className="scroll-mt-20 pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <Eyebrow>Spørsmål</Eyebrow>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight">Det foreldre lurer på</h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Kort fortalt: <strong className="text-foreground">det er gratis</strong>, for så mange barn dere vil.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            {sporsmal.map((s) => (
              <details key={s.sporsmal} className="group rounded-2xl bg-card px-5 py-4 ring-1 ring-black/5 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                  {s.sporsmal}
                  <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-muted-foreground">{s.svar}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-muted-foreground">
            Noe annet du lurer på?{" "}
            <Link href="/kontakt" className="font-semibold text-foreground underline underline-offset-4">
              Skriv til oss
            </Link>
          </p>
        </div>
      </section>

      {/* 8. Avslutning */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-primary px-6 py-14 text-center text-primary-foreground sm:py-20">
          <div className="pointer-events-none absolute -left-10 -top-10 flex gap-3 opacity-25">
            {FIGURER.slice(0, 3).map((k) => (
              <KidAvatar key={k} avatarKey={k} size={90} />
            ))}
          </div>
          <h2 className="relative text-4xl font-extrabold tracking-tight sm:text-5xl">Klar for en uke med mindre mas?</h2>
          <p className="relative mt-3 text-lg text-primary-foreground/80">Gratis. Ingen kredittkort. Oppe og går på fem minutter.</p>
          <Link href="/login" className="relative mt-8 inline-flex min-h-14 items-center gap-2 rounded-2xl bg-white px-7 text-lg font-extrabold text-primary hover:bg-[#FFF8E6]">
            Kom i gang – gratis <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href={appHref}>{appLabel}</Link>
            <Link href="/kontakt">Kontakt oss</Link>
            <Link href="/personvern">Personvern</Link>
            <Link href="/vilkar">Vilkår</Link>
          </nav>
          <p>© {new Date().getFullYear()} Ukepenger.no</p>
        </div>
      </footer>
    </div>
  );
}
