"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Bell, Check, ChevronDown, Coins, Heart, Lock, Menu, PiggyBank, ShieldCheck, Wallet, X } from "lucide-react";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { sporsmal } from "@/app/_components/LandingClient";
import { KID_PALETTE } from "@/app/kids/_lib/palette";
import { supabase } from "@/lib/supabaseClient";
import styles from "./v2.module.css";

// Ny forside, versjon 2 (test). Bygget på appens eget uttrykk: de samme
// pastellfargene som oppgavekortene, beløp i Space Mono og barnas figurer.
// Stort kjøkkenbilde øverst, skjermopptak av appen som byttes mens man
// scroller, og en bildestripe med vanlige oppgaver.
// Besteforeldre nevnes bare under spørsmål.

const [KORALL, HIMMEL, SOL, DRUE, MYNTE] = KID_PALETTE;

// Bildestripe: hvert bilde er en vanlig oppgave med et eksempelbeløp.
const STRIPE = [
  { src: "/forside/stripe-soppel.webp", alt: "Gutt bærer søppelposen ut", t: "Ta ut søppel", kr: "+10 kr", farge: KORALL },
  { src: "/forside/stripe-oppvask.webp", alt: "Søsken tømmer oppvaskmaskinen", t: "Tømme oppvasken", kr: "+15 kr", farge: SOL },
  { src: "/forside/topp-tur.webp", alt: "Jente går tur med hunden", t: "Lufte hunden", kr: "+20 kr", farge: DRUE },
  { src: "/forside/stripe-seng.webp", alt: "Barn rer opp sengen", t: "Re opp sengen", kr: "+5 kr", farge: HIMMEL },
  { src: "/forside/stripe-sparegris.webp", alt: "Barn putter en mynt i sparegrisen", t: "Sparing", kr: "10 %", farge: MYNTE },
];

// Stegene i «Slik fungerer det». Telefonen viser skjermen for steget man er på.
const STEG = [
  { src: "/forside/barn-velg.webp", t: "Barnet trykker på navnet sitt", d: "Ingen innlogging for barna. En iPad eller mobil hjemme kobles til familien én gang med en QR-kode." },
  { src: "/forside/barn-oppgaver.webp", t: "Ser hva det kan gjøre", d: "Oppgavene dere har lagt inn, med bilde og beløp." },
  { src: "/forside/app-barn-poster.webp", video: "/forside/app-barn.mp4", t: "Trykker «Jeg har gjort det!»", d: "Og får litt konfetti." },
  { src: "/forside/app-forelder-poster.webp", video: "/forside/app-forelder.mp4", t: "Du godkjenner på mobilen", d: "Du får et varsel. Godkjenn én og én, eller alle på en gang." },
  { src: "/forside/barn-trofeer.webp", t: "Barnet ser hva det har fått til", d: "Trofeer, merker og hvor mange uker på rad." },
  { src: "/forside/barn-onsker.webp", t: "Og hva det sparer til", d: "Barnet legger inn et ønske og ser hvor langt det har kommet." },
];

const FIGURER = ["skyvalp", "raptor", "pusi", "robot", "drage", "astronaut", "hubro", "kvakk", "ninja", "bobble"];
const VEKSLE = ["Gratis", "Barna trenger ingen konto", "Godkjenn med ett trykk", "Ekte kroner, ikke poeng"];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function liteBevegelse() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Glir inn når elementet kommer til syne. Det som allerede er synlig ved
// lasting, skjules ikke (ingen blinking), og alt vises uten JavaScript.
function Reveal({ children, className, delay = 0, variant = "glid" }: { children: ReactNode; className?: string; delay?: number; variant?: "glid" | "sprett" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || liteBevegelse() || el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.classList.add(variant === "sprett" ? styles.sprett : styles.skjult);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add(styles.inn);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    // Figurer som spretter er flyttet ned med transform, så da følges forelderen.
    io.observe(variant === "sprett" && el.parentElement ? el.parentElement : el);
    return () => io.disconnect();
  }, [variant]);
  return (
    <div ref={ref} className={className} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

// Tekst der ordene «tennes» ett for ett mens man scroller forbi.
function ScrollText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [andel, setAndel] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || liteBevegelse()) return;
    let raf = 0;
    const oppdater = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setAndel(Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.3))));
    };
    const ved = () => {
      if (!raf) raf = requestAnimationFrame(oppdater);
    };
    ved();
    window.addEventListener("scroll", ved, { passive: true });
    window.addEventListener("resize", ved);
    return () => {
      window.removeEventListener("scroll", ved);
      window.removeEventListener("resize", ved);
      cancelAnimationFrame(raf);
    };
  }, []);
  const ord = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {ord.map((o, i) => (
        <span key={i} className={cx("transition-colors duration-300", i / ord.length < andel ? "text-foreground" : "text-foreground/20")}>
          {o}{" "}
        </span>
      ))}
    </p>
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

// Skjermbilde eller skjermopptak (lydløst, i løkke) som fyller en telefonskjerm.
function Skjerm({ src, video, alt, spill, className }: { src: string; video?: string; alt: string; spill: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (spill && !liteBevegelse()) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else v.pause();
  }, [spill]);
  if (video)
    return (
      <video ref={ref} muted loop playsInline preload="metadata" poster={src} aria-label={alt} className={cx("size-full object-cover object-top", className)}>
        <source src={video} type="video/mp4" />
      </video>
    );
  return <Image src={src} alt={alt} fill sizes="300px" className={cx("object-cover object-top", className)} />;
}

function Telefon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-[2.6rem] bg-[#15261c] p-[7px] shadow-[0_30px_60px_-24px_rgba(16,40,28,0.5)]", className)}>
      <div className="relative aspect-[390/844] overflow-hidden rounded-[2.15rem] bg-background">{children}</div>
    </div>
  );
}

// «Slik fungerer det»: på PC står telefonen fast mens stegene scrolles forbi,
// og skjermen bytter til steget man er på. På mobil har hvert steg sin egen telefon.
function Steg() {
  const [aktiv, setAktiv] = useState(0);
  const refs = useRef<Array<HTMLLIElement | null>>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setAktiv(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div className="mx-auto mt-12 grid max-w-5xl gap-x-16 lg:mt-4 lg:grid-cols-[1fr_300px]">
      <ol>
        {STEG.map((s, i) => {
          const farge = KID_PALETTE[i % KID_PALETTE.length];
          return (
            <li
              key={s.t}
              data-i={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="flex flex-col justify-center py-10 lg:min-h-[62vh] lg:py-0"
            >
              <span className="font-num flex size-10 items-center justify-center rounded-xl text-sm font-bold" style={{ background: farge.bg, color: farge.ink }}>
                {i + 1}
              </span>
              <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">{s.t}</h3>
              <p className="mt-3 max-w-md text-lg leading-relaxed text-muted-foreground">{s.d}</p>
              <div className="relative mt-8 lg:hidden">
                <div className="absolute inset-x-6 inset-y-10 rounded-[3rem]" style={{ background: farge.bg }} />
                <Telefon className="relative mx-auto w-[230px]">
                  <Skjerm src={s.src} video={s.video} alt={s.t} spill={aktiv === i} />
                </Telefon>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="hidden lg:block">
        <div className="sticky top-[calc(50vh-290px)] py-6">
          <div
            className="absolute -inset-x-10 inset-y-0 rounded-[3.5rem] transition-colors duration-700"
            style={{ background: KID_PALETTE[aktiv % KID_PALETTE.length].bg }}
          />
          <Telefon className="relative">
            {STEG.map((s, i) => (
              <div key={s.src} className={cx("absolute inset-0 transition-opacity duration-500", i === aktiv ? "opacity-100" : "opacity-0")} aria-hidden={i !== aktiv}>
                <Skjerm src={s.src} video={s.video} alt={s.t} spill={aktiv === i} />
              </div>
            ))}
          </Telefon>
        </div>
      </div>
    </div>
  );
}

export default function NyForsideV2() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [meny, setMeny] = useState(false);

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

  const knapp = "inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-8 text-lg font-bold text-primary-foreground transition hover:bg-primary-dark active:scale-[0.98]";
  const h2 = "text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl";

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="bg-amber-200 px-4 py-2 text-center text-sm font-bold text-amber-950">Testversjon 2 av ny forside – ikke publisert ennå</div>

      {/* Meny som følger med nedover */}
      <header className="sticky top-3 z-40 flex justify-center px-4">
        <div className="relative w-full max-w-xl">
          <nav className="flex items-center justify-between gap-2 rounded-2xl bg-card/90 py-1.5 pl-3 pr-1.5 shadow-[0_10px_30px_-14px_rgba(16,40,28,0.35)] ring-1 ring-black/5 backdrop-blur">
            <Link href="/" aria-label="Ukepenger">
              <Logo liten />
            </Link>
            <div className="hidden items-center gap-5 text-sm font-semibold text-muted-foreground sm:flex">
              <a href="#slik" className="hover:text-foreground">
                Slik fungerer det
              </a>
              <a href="#sporsmal" className="hover:text-foreground">
                Spørsmål
              </a>
              <Link href={appHref} className="hover:text-foreground">
                {appLabel}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/login" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-dark">
                Kom i gang
              </Link>
              <button
                type="button"
                onClick={() => setMeny((m) => !m)}
                aria-label={meny ? "Lukk meny" : "Åpne meny"}
                aria-expanded={meny}
                className="flex size-9 items-center justify-center rounded-xl hover:bg-black/5 sm:hidden"
              >
                {meny ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </nav>
          {meny && (
            <div className="absolute inset-x-0 top-full mt-2 grid gap-1 rounded-2xl bg-card p-2 text-lg font-semibold shadow-xl ring-1 ring-black/5 sm:hidden">
              {[
                ["#slik", "Slik fungerer det"],
                ["#sporsmal", "Spørsmål"],
                [appHref, appLabel],
              ].map(([href, label]) => (
                <a key={label} href={href} onClick={() => setMeny(false)} className="rounded-xl px-4 py-3 hover:bg-black/5">
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 1. Toppen: stort kjøkkenbilde med overskriften oppå */}
      <section className="relative -mt-[60px]">
        <div className="relative h-[88svh] min-h-[600px] max-h-[920px] overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3.5rem]">
          <picture>
            <source media="(min-width: 768px)" srcSet="/forside/topp-pc.webp" />
            <img
              src="/forside/topp-mobil.webp"
              alt="Jente dekker bordet i kveldssola mens mamma lager middag"
              className={cx("absolute inset-0 size-full object-cover object-[50%_70%] md:object-[60%_60%]", styles.zoomInn)}
              fetchPriority="high"
            />
          </picture>
          <div className="absolute inset-x-0 top-0 h-[70%] bg-gradient-to-b from-background/90 via-background/60 to-transparent md:h-full md:w-[62%] md:bg-gradient-to-r md:from-background/90 md:via-background/55" />

          <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center px-4 pt-28 text-center sm:px-6 md:items-start md:justify-center md:pt-10 md:text-left">
            <h1 className={cx("max-w-[12ch] text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl", styles.innLast)}>
              Oppgavene blir gjort.
              <br />
              <span className="text-primary">Uten mas.</span>
            </h1>
            <p className={cx("mt-5 max-w-md text-lg leading-relaxed text-foreground/80 sm:text-xl", styles.innLast)} style={{ "--d": "120ms" } as CSSProperties}>
              Barna trykker «Jeg har gjort det!». Du godkjenner på mobilen. Appen holder styr på hvem som har tjent hva.
            </p>
            <div className={cx("mt-7 flex flex-col items-center gap-4 sm:flex-row md:items-center", styles.innLast)} style={{ "--d": "220ms" } as CSSProperties}>
              <Link href="/login" className={knapp}>
                Kom i gang
              </Link>
              <a href="#slik" className="hidden font-semibold underline decoration-2 underline-offset-4 hover:text-primary sm:inline">
                Se hvordan det fungerer
              </a>
            </div>
            <div className={cx("mt-6 hidden h-7 overflow-hidden text-base font-semibold text-foreground/75 sm:block", styles.innLast)} style={{ "--d": "320ms" } as CSSProperties}>
              <ul className={styles.veksle}>
                {[...VEKSLE, VEKSLE[0]].map((t, i) => (
                  <li key={i} className="flex h-7 items-center justify-center gap-1.5 md:justify-start" aria-hidden={i > 0}>
                    <Check className="size-4 text-primary" strokeWidth={3} /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Slik fungerer det */}
      <section id="slik" className="scroll-mt-24 px-4 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className={h2}>Slik fungerer det</h2>
          </Reveal>
          <ScrollText
            className="mt-8 text-xl leading-relaxed sm:text-2xl"
            text="Du legger inn oppgavene og hva hver av dem er verdt. Barna ser listen på en iPad eller mobil hjemme og trykker når de er ferdige. Du får et varsel og godkjenner. Pengene betaler du ut som før, med Vipps eller kontant."
          />
        </div>
        <Steg />
      </section>

      {/* 3. Rullende bildestripe: eksempler på oppgaver og hva de kan være verdt */}
      <section aria-label="Eksempler på oppgaver" className={cx("overflow-hidden py-20 sm:py-28", styles.rullPause)}>
        <div className={cx("flex gap-4 py-2", styles.rull)} style={{ "--fart": "70s" } as CSSProperties}>
          {[0, 1].map((kopi) =>
            [...STRIPE, ...STRIPE].map((b, i) => (
              <div key={`${kopi}-${i}`} aria-hidden={kopi === 1 || i >= STRIPE.length} className="relative aspect-[4/5] w-[46vw] max-w-[230px] shrink-0 overflow-hidden rounded-[1.75rem]">
                <Image src={b.src} alt={kopi === 0 && i < STRIPE.length ? b.alt : ""} fill sizes="230px" className="object-cover" />
                {/* Merkelapp i samme stil som oppgavekortene i appen */}
                <span className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm font-bold" style={{ background: b.farge.bg, color: b.farge.ink }}>
                  <span className="truncate">{b.t}</span>
                  <span className="font-num shrink-0 rounded-lg bg-white/80 px-1.5 py-0.5">{b.kr}</span>
                </span>
              </div>
            )),
          )}
        </div>
        <p className="mt-6 px-4 text-center text-muted-foreground">Eksempler. Dere bestemmer selv hva hver oppgave er verdt.</p>
      </section>

      {/* 4. Figurene */}
      <section className="px-4 pb-20 text-center sm:px-6 sm:pb-28">
        <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-3">
          {FIGURER.map((k, i) => (
            <Reveal key={k} variant="sprett" delay={i * 60} className="rounded-full bg-card p-1 shadow-sm ring-1 ring-black/5">
              <KidAvatar avatarKey={k} size={60} />
            </Reveal>
          ))}
        </div>
        <Reveal>
          <h2 className={cx(h2, "mt-10")}>Hvert barn har sin egen figur</h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Barna velger en figur og ser sine egne oppgaver, trofeer og merker. Det er ingen poengtavle mellom søsken.
          </p>
        </Reveal>
      </section>

      {/* 5. Grønn blokk: for deg som forelder */}
      <section className="px-3 pb-20 sm:px-6 sm:pb-28">
        <Reveal className="mx-auto max-w-6xl rounded-[2.5rem] bg-primary-dark px-5 py-14 text-primary-foreground sm:px-10 sm:py-20">
          <h2 className={cx(h2, "max-w-2xl")}>Du slipper å huske hvem som skal ha hva.</h2>
          <div className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-[340px] overflow-hidden rounded-[2rem]">
              <Image src="/forside/forelder-plan.webp" alt="Pappa og to barn ser på oppgavelisten ved kjøkkenbordet" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              <Reveal delay={500} className="absolute inset-x-4 bottom-4">
                <div className="flex items-center gap-3 rounded-2xl bg-card/95 p-4 text-foreground shadow-lg">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Bell className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Ukepenger · nå</p>
                    <p className="font-bold">
                      Oliver har tatt ut søppel · <span className="font-num">10 kr</span>
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Bell, t: "Varsel når noe er gjort", d: "Godkjenn eller avslå når det passer deg.", farge: KORALL },
                { icon: Wallet, t: "Betal ut når du vil", d: "Hele beløpet eller deler av det. Appen husker resten.", farge: HIMMEL },
                { icon: PiggyBank, t: "Sparing", d: "Velg en andel, f.eks. 10 %, som settes av hver gang barnet tjener noe.", farge: MYNTE },
                { icon: Coins, t: "Faste ukepenger", d: "Legges til automatisk hver uke, på dagen dere velger.", farge: SOL },
              ].map(({ icon: Icon, t, d, farge }, i) => (
                <Reveal key={t} delay={150 + i * 100} className="h-full rounded-[1.6rem] bg-card p-6 text-foreground">
                  <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: farge.bg, color: farge.ink }}>
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-4 text-lg font-bold">{t}</p>
                  <p className="mt-1 text-muted-foreground">{d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 6. Trygt for barna */}
      <section className="px-3 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto grid max-w-6xl gap-10 rounded-[2.5rem] px-5 py-14 sm:px-10 sm:py-20 lg:grid-cols-2" style={{ background: SOL.bg }}>
          <Reveal>
            <h2 className={h2}>Trygt for barna</h2>
            <p className="mt-4 max-w-md text-lg text-foreground/75">Barna har ingen konto, bare et fornavn og en figur. Appen flytter aldri penger. Den holder bare oversikt.</p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, t: "Ingen reklame", d: "Og ingen sporing på barnesiden." },
              { icon: Heart, t: "Ingen lootbokser", d: "Ingen tilfeldige premier og ingen poengtavle." },
              { icon: Coins, t: "Ekte kroner", d: "Ingen poeng eller spillpenger." },
              { icon: Lock, t: "Data i EU", d: "Du kan slette alt selv, når som helst." },
            ].map(({ icon: Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 100} className="flex gap-3">
                <Icon className="mt-0.5 size-6 shrink-0" style={{ color: SOL.ink }} />
                <div>
                  <p className="font-bold">{t}</p>
                  <p className="text-foreground/70">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Spørsmål */}
      <section id="sporsmal" className="scroll-mt-24 px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className={cx(h2, "text-center")}>Spørsmål</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {[
              ...sporsmal,
              {
                sporsmal: "Kan besteforeldre være med?",
                svar: "Ja. Besteforeldre, tanter og gudforeldre kan få en egen lenke. Der ser de hva barna sparer til, og kan gi en gave på Vipps. Gaven dukker opp hos dere som et krav dere godkjenner. De kan ikke endre noe.",
              },
            ].map((s, i) => (
              <Reveal key={s.sporsmal} delay={i * 50}>
                <details className="group rounded-2xl bg-card px-6 py-5 ring-1 ring-black/5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                    {s.sporsmal}
                    <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-muted-foreground">{s.svar}</p>
                </details>
              </Reveal>
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
      <section className="px-4 pb-24 text-center sm:px-6">
        <Reveal>
          <h2 className={h2}>Prøv det en uke</h2>
          <p className="mt-4 text-lg text-muted-foreground">Det er gratis. Du trenger bare e-post eller en Google-konto.</p>
          <Link href="/login" className={cx(knapp, "mt-8")}>
            Kom i gang
          </Link>
        </Reveal>
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
