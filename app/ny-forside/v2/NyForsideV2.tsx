"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Bell, ChevronDown, Coins, Heart, Lock, Menu, PiggyBank, ShieldCheck, Wallet, X } from "lucide-react";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { sporsmal } from "@/app/_components/LandingClient";
import { supabase } from "@/lib/supabaseClient";
import styles from "../ny.module.css";

// Ny forside, versjon 2 (test). Inspirert av fotobaserte app-sider: stort
// familiebilde øverst, «klistremerker» på nøkkelord, bildestripe, fargede
// blokker og en karusell med skjermbilder. Besteforeldre nevnes bare under spørsmål.

const LIME = "#D4F56C";
const BLAA = "#9CC8FF";

// Bildestripe: ekte hverdagsøyeblikk. Flere bilder legges til her.
const STRIPE = [
  { src: "/forside/stripe-1.webp", alt: "Gutt bærer søppelposen ut" },
  { src: "/forside/topp-mobil.webp", alt: "Jente dekker bordet mens mamma lager middag" },
];

const SKJERMER = [
  { src: "/forside/barn-velg.webp", t: "Barnet velger seg selv", d: "Ingen konto eller passord for barna." },
  { src: "/forside/barn-oppgaver.webp", t: "Oppgaver med bilder", d: "Barna ser hva de kan gjøre og hva det er verdt." },
  { src: "/forside/barn-feiring.webp", t: "«Jeg har gjort det!»", d: "Et trykk, og en liten feiring." },
  { src: "/forside/forelder-krav.webp", t: "Du godkjenner", d: "Varsel på mobilen. Ett trykk – eller «Godkjenn alle»." },
  { src: "/forside/barn-trofeer.webp", t: "Trofeer og merker", d: "Framgang og uker på rad – uten straff." },
  { src: "/forside/barn-onsker.webp", t: "Ønskebutikken", d: "Pengene får et mål." },
];

const GJENG = ["pusi", "raptor", "skyvalp", "robot", "drage", "astronaut", "hubro"];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Ord med et skjevt «klistremerke» bak, som i overskrifter på Hidee.
function Merke({ children, farge = LIME, vri = "-rotate-2" }: { children: ReactNode; farge?: string; vri?: string }) {
  return (
    <span className="relative inline-block px-[0.12em]">
      <span aria-hidden className={cx("absolute inset-x-0 inset-y-[0.1em] rounded-[0.35em] shadow-sm", vri)} style={{ background: farge }} />
      <span className="relative">{children}</span>
    </span>
  );
}

function Logo({ liten }: { liten?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cx("flex items-center justify-center rounded-xl bg-primary text-primary-foreground", liten ? "size-8" : "size-10")}>
        <Coins className={liten ? "size-4" : "size-5"} strokeWidth={2.5} />
      </span>
      <span className="font-num text-lg font-bold tracking-[-0.06em]">ukepenger</span>
    </span>
  );
}

function Phone({ src, alt, className, priority }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={cx("rounded-[2.6rem] bg-[#15261c] p-[7px] shadow-[0_30px_60px_-24px_rgba(16,40,28,0.55)]", className)}>
      <div className="overflow-hidden rounded-[2.15rem] bg-background">
        <Image src={src} alt={alt} width={780} height={1688} sizes="(min-width: 1024px) 300px, 70vw" className="h-auto w-full" priority={priority} />
      </div>
    </div>
  );
}

export default function NyForsideV2() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [meny, setMeny] = useState(false);
  const [aktiv, setAktiv] = useState(2);

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

  const n = SKJERMER.length;
  const forrige = () => setAktiv((i) => (i - 1 + n) % n);
  const neste = () => setAktiv((i) => (i + 1) % n);

  const knapp =
    "inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-lg font-bold text-primary-foreground shadow-[0_14px_30px_-14px_rgba(16,80,40,0.7)] transition hover:bg-primary-dark active:scale-[0.98]";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBF7EE] text-[#17201a]">
      <div className="bg-amber-200 px-4 py-2 text-center text-sm font-bold text-amber-950">Testversjon 2 av ny forside – ikke publisert ennå</div>

      {/* Svevende pille-meny */}
      <header className="sticky top-3 z-40 flex justify-center px-4">
        <div className="relative w-full max-w-xl">
          <nav className="flex items-center justify-between gap-2 rounded-full bg-white/90 py-1.5 pl-3 pr-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] ring-1 ring-black/5 backdrop-blur">
            <Link href="/" aria-label="Ukepenger">
              <Logo liten />
            </Link>
            <div className="hidden items-center gap-5 text-sm font-semibold text-[#17201a]/70 sm:flex">
              <a href="#slik" className="hover:text-[#17201a]">
                Slik virker det
              </a>
              <a href="#sporsmal" className="hover:text-[#17201a]">
                Spørsmål
              </a>
              <Link href={appHref} className="hover:text-[#17201a]">
                {appLabel}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/login" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                Kom i gang
              </Link>
              <button
                type="button"
                onClick={() => setMeny((m) => !m)}
                aria-label={meny ? "Lukk meny" : "Åpne meny"}
                aria-expanded={meny}
                className="flex size-9 items-center justify-center rounded-full hover:bg-black/5 sm:hidden"
              >
                {meny ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </nav>
          {meny && (
            <div className="absolute inset-x-0 top-full mt-2 grid gap-1 rounded-3xl bg-white p-2 text-lg font-semibold shadow-xl ring-1 ring-black/5 sm:hidden">
              {[
                ["#slik", "Slik virker det"],
                ["#sporsmal", "Spørsmål"],
                [appHref, appLabel],
              ].map(([href, label]) => (
                <a key={label} href={href} onClick={() => setMeny(false)} className="rounded-2xl px-4 py-3 hover:bg-black/5">
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 1. Toppbilde med overskrift */}
      <section className="relative -mt-[60px]">
        <div className="relative h-[88svh] min-h-[560px] max-h-[900px] overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3.5rem]">
          <picture>
            <source media="(min-width: 768px)" srcSet="/forside/topp-pc.webp" />
            <img
              src="/forside/topp-mobil.webp"
              alt="Jente dekker bordet i kveldssola mens mamma lager middag"
              className="absolute inset-0 size-full object-cover object-[50%_70%] md:object-[60%_60%]"
              fetchPriority="high"
            />
          </picture>
          <div className="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-[#FBF7EE]/90 via-[#FBF7EE]/50 to-transparent md:h-full md:w-[62%] md:bg-gradient-to-r md:from-[#FBF7EE]/90 md:via-[#FBF7EE]/55" />

          <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center px-4 pt-28 text-center sm:px-6 md:items-start md:justify-center md:pt-10 md:text-left">
            <h1 className="max-w-[12ch] text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
              Oppgavene blir <Merke>gjort.</Merke>
              <br />
              Uten{" "}
              <Merke farge={BLAA} vri="rotate-2">
                mas.
              </Merke>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#17201a]/80 sm:text-xl">
              Barna trykker «Jeg har gjort det!». Du godkjenner på mobilen. Pengene holder appen styr på.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row md:items-start">
              <Link href="/login" className={knapp}>
                Kom i gang – gratis <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>

          <div className={cx("absolute bottom-6 right-4 hidden rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-xl sm:right-8 sm:block", styles.svev)}>
            <span className="mr-1.5">✅</span> Dekke bordet · +10 kr
          </div>
        </div>
      </section>

      {/* 2. Kort fortalt */}
      <section id="slik" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1fr_300px]">
          <div>
            <h2 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              Små oppgaver. <Merke>Ekte kroner.</Merke> Stolte barn.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#17201a]/70">
              Du velger oppgavene og hva de er verdt. Barna ser alt på en iPad eller mobil hjemme, og trykker når de er ferdige. Du får et varsel og godkjenner
              med ett trykk. Dere betaler ut som før – med Vipps eller kontant.
            </p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Velg oppgaver og beløp", "Barnet trykker «Ferdig»", "Du godkjenner"].map((t, i) => (
                <li key={t} className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
                  <span className="font-num text-sm font-bold text-primary">0{i + 1}</span>
                  <p className="mt-1 font-bold">{t}</p>
                </li>
              ))}
            </ol>
          </div>
          <Phone src="/forside/barn-feiring.webp" alt="Barnesiden: «Bra jobba! +10 kr» med konfetti" className="mx-auto w-[70%] max-w-[280px] rotate-[2deg] lg:w-full" />
        </div>
      </section>

      {/* 3. Bildestripe */}
      <section aria-label="Bilder fra hverdagen" className="pb-20 sm:pb-28">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:justify-center sm:px-6 [scrollbar-width:none]">
          {STRIPE.map((b, i) => (
            <div
              key={b.src}
              className={cx(
                "relative aspect-[4/5] w-[62vw] max-w-[300px] shrink-0 snap-center overflow-hidden rounded-[2rem] shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)]",
                i % 2 ? "rotate-[1.5deg]" : "rotate-[-1.5deg]",
              )}
            >
              <Image src={b.src} alt={b.alt} fill sizes="300px" className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* 4. Gjengen */}
      <section className="px-4 pb-20 text-center sm:px-6 sm:pb-28">
        <div className="relative mx-auto inline-block">
          <div className="flex justify-center -space-x-4">
            {GJENG.map((k, i) => (
              <span key={k} className={cx("rounded-full ring-4 ring-[#FBF7EE]", i % 2 ? "translate-y-2" : "-translate-y-1")}>
                <KidAvatar avatarKey={k} size={64} />
              </span>
            ))}
          </div>
        </div>
        <h2 className="mt-8 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          Hvem blir <Merke farge={BLAA} vri="rotate-1">du</Merke>?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-[#17201a]/70">
          Hvert barn velger sin egen figur – og samler trofeer, merker og uker på rad. Bygget for mestring, uten straff eller sammenligning med søsken.
        </p>
      </section>

      {/* 5. Blå blokk: for deg */}
      <section className="px-3 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-[#4F86F7] px-5 py-14 text-white sm:px-10 sm:py-20">
          <h2 className="mx-auto max-w-2xl text-center text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            Slutt å holde regnskapet i hodet.
          </h2>
          <div className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-[320px] overflow-hidden rounded-[2rem]">
              <Image src="/forside/stripe-1.webp" alt="Gutt bærer søppelposen ut" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-4 text-[#17201a] shadow-lg">
                <p className="text-sm font-semibold text-[#17201a]/60">Varsel</p>
                <p className="font-bold">Oliver har tatt ut søppel · 15 kr</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Bell, t: "Varsel når noe er gjort", d: "Godkjenn eller avslå med ett trykk, når det passer deg." },
                { icon: Wallet, t: "Betal ut når du vil", d: "Hele beløpet eller en del – appen husker resten." },
                { icon: PiggyBank, t: "Sparing av seg selv", d: "F.eks. 10 % av alt barnet tjener går rett i sparegrisen." },
                { icon: Coins, t: "Faste ukepenger", d: "Legges til automatisk hver uke, på dagen dere velger." },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="rounded-[1.6rem] bg-white p-6 text-[#17201a]">
                  <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: LIME }}>
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-4 text-lg font-bold">{t}</p>
                  <p className="mt-1 text-[#17201a]/65">{d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/login" className="inline-flex min-h-13 items-center gap-2 rounded-full px-7 py-3.5 text-lg font-bold text-[#17201a]" style={{ background: LIME }}>
              Kom i gang – gratis <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Karusell med skjermbilder */}
      <section className="pb-20 sm:pb-28">
        <div className="px-4 text-center sm:px-6">
          <h2 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Se <Merke>appen</Merke>
          </h2>
          <p className="mt-3 text-lg text-[#17201a]/70">Ekte skjermbilder. Demofamilie med påfunne navn.</p>
        </div>
        <div className="relative mx-auto mt-10 flex h-[520px] max-w-5xl items-center justify-center sm:h-[600px]" aria-roledescription="karusell">
          {SKJERMER.map((s, i) => {
            const pos = ((i - aktiv + n + Math.floor(n / 2)) % n) - Math.floor(n / 2);
            const synlig = Math.abs(pos) <= 2;
            return (
              <button
                key={s.src}
                type="button"
                onClick={() => setAktiv(i)}
                aria-label={s.t}
                aria-current={pos === 0}
                tabIndex={pos === 0 ? -1 : 0}
                className="absolute w-[230px] transition-all duration-500 ease-out sm:w-[260px]"
                style={{
                  transform: `translateX(${pos * 78}%) scale(${pos === 0 ? 1 : 0.84})`,
                  opacity: !synlig ? 0 : pos === 0 ? 1 : Math.abs(pos) === 1 ? 0.45 : 0.15,
                  zIndex: 10 - Math.abs(pos),
                  pointerEvents: synlig ? "auto" : "none",
                }}
              >
                <Phone src={s.src} alt={s.t} />
              </button>
            );
          })}
        </div>
        <div className="mt-6 text-center" aria-live="polite">
          <p className="text-xl font-bold">{SKJERMER[aktiv].t}</p>
          <p className="text-[#17201a]/65">{SKJERMER[aktiv].d}</p>
        </div>
        <div className="mt-5 flex justify-center gap-3">
          <button type="button" onClick={forrige} aria-label="Forrige" className="flex size-11 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 hover:bg-black/5">
            <ArrowLeft className="size-5" />
          </button>
          <button type="button" onClick={neste} aria-label="Neste" className="flex size-11 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 hover:bg-black/5">
            <ArrowRight className="size-5" />
          </button>
        </div>
      </section>

      {/* 7. Fersken-blokk: trygt + gjengen nederst */}
      <section className="px-3 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#FFB38A] px-5 pt-14 sm:px-10 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <h2 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">Laget med barn i tankene.</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { icon: Lock, t: "Ingen konto for barna", d: "Bare fornavn og en figur." },
                { icon: ShieldCheck, t: "Ingen reklame", d: "Og ingen sporing på barnesiden." },
                { icon: Heart, t: "Uten mas og press", d: "Ingen lootbokser eller rangering." },
                { icon: Coins, t: "Ekte kroner", d: "Ingen poeng eller spillpenger." },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-3">
                  <Icon className="mt-0.5 size-6 shrink-0" />
                  <div>
                    <p className="font-bold">{t}</p>
                    <p className="text-[#17201a]/70">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-14 flex items-end justify-center -space-x-6 sm:-space-x-8">
            {GJENG.map((k, i) => (
              <span key={k} className={cx("rounded-full ring-[6px] ring-[#FFB38A]", i === 3 ? "translate-y-[18%]" : "translate-y-[35%]")}>
                <KidAvatar avatarKey={k} size={i === 3 ? 150 : 110} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Spørsmål */}
      <section id="sporsmal" className="scroll-mt-24 px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Det foreldre lurer på</h2>
          <div className="mt-10 space-y-3">
            {[
              ...sporsmal,
              {
                sporsmal: "Kan besteforeldre være med?",
                svar: "Ja. Besteforeldre, tanter og gudforeldre kan få en egen lenke. De ser hva barna sparer til, og kan gi en gave på Vipps til ønsket – dere godkjenner før den legges til. De kan ikke endre noe.",
              },
            ].map((s) => (
              <details key={s.sporsmal} className="group rounded-3xl bg-white px-6 py-5 ring-1 ring-black/5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                  {s.sporsmal}
                  <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[#17201a]/70">{s.svar}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-[#17201a]/70">
            Noe annet du lurer på?{" "}
            <Link href="/kontakt" className="font-semibold text-[#17201a] underline underline-offset-4">
              Skriv til oss
            </Link>
          </p>
        </div>
      </section>

      {/* 9. Avslutning */}
      <section className="px-4 pb-20 text-center sm:px-6">
        <h2 className="text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">
          Klar for en uke med <Merke farge={BLAA}>mindre mas</Merke>?
        </h2>
        <p className="mt-4 text-lg text-[#17201a]/70">Gratis. Ingen kredittkort. Oppe og går på fem minutter.</p>
        <Link href="/login" className={cx(knapp, "mt-8")}>
          Kom i gang – gratis <ArrowRight className="size-5" />
        </Link>
      </section>

      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-[#17201a]/65 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
