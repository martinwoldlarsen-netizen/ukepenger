"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DM_Sans, Space_Mono } from "next/font/google";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Coins,
  ListChecks,
  Menu,
  PiggyBank,
  QrCode,
  Sparkles,
  Star,
  Wallet,
  X,
} from "lucide-react";
import styles from "./LandingClient.module.css";

// Skjermet til forsiden: resten av appen (admin/kids/login) bruker Geist,
// lastet i app/layout.tsx. next/font er trygt å kalle fra en "use client"-fil
// så lenge kallet ligger på modul-nivå, ikke inne i komponentfunksjonen.
const landingSans = DM_Sans({ subsets: ["latin"], variable: "--font-landing-sans" });
const landingMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-landing-mono" });

const verdier = [
  {
    title: "Tydelig for barnet",
    description: "Barnet ser hva som skal gjøres, hva hver oppgave er verdt, og hvor mye som er til gode akkurat nå.",
    icon: ListChecks,
  },
  {
    title: "Oversikt for deg",
    description: "Krav, saldo og utbetalinger for alle barna på ett sted – i stedet for å holde regnskapet i hodet.",
    icon: Wallet,
  },
  {
    title: "Noe å spare til",
    description: "Ønskeliste og sparemål gjør at pengene får et formål, ikke bare en sum som ligger og venter.",
    icon: PiggyBank,
  },
];

const barn = [
  {
    id: "emma",
    navn: "Emma",
    initial: "E",
    avatarClass: "avatarCoral",
    tilGode: "125 kr",
    igjen: "2 igjen",
    maal: "75 kr til neste mål",
    oppgaver: [
      { tittel: "Rydde rommet", belop: "+ 25 kr", ikon: Sparkles, fremhevet: true },
      { tittel: "Henge opp klær", belop: "+ 10 kr", ikon: Star, fremhevet: false },
    ],
  },
  {
    id: "oliver",
    navn: "Oliver",
    initial: "O",
    avatarClass: "avatarBlue",
    tilGode: "80 kr",
    igjen: "3 igjen",
    maal: "120 kr til neste mål",
    oppgaver: [
      { tittel: "Tømme oppvaskmaskin", belop: "+ 20 kr", ikon: Sparkles, fremhevet: true },
      { tittel: "Lufte hunden", belop: "+ 15 kr", ikon: Star, fremhevet: false },
    ],
  },
  {
    id: "liam",
    navn: "Liam",
    initial: "L",
    avatarClass: "avatarYellow",
    tilGode: "45 kr",
    igjen: "1 igjen",
    maal: "55 kr til neste mål",
    oppgaver: [
      { tittel: "Dekke bordet", belop: "+ 10 kr", ikon: Sparkles, fremhevet: true },
      { tittel: "Sortere søppel", belop: "+ 15 kr", ikon: Star, fremhevet: false },
    ],
  },
];

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label="Ukepenger hjem">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Coins className="size-5" strokeWidth={2.5} />
      </span>
      <span className="text-[17px] font-bold tracking-[-0.06em] text-foreground" style={{ fontFamily: "var(--font-mono)" }}>
        ukepenger.no
      </span>
    </a>
  );
}

function Device({ type, children }: { type: "tablet" | "phone"; children: React.ReactNode }) {
  return (
    <div className={type === "tablet" ? styles.deviceTablet : styles.devicePhone}>
      <div className={styles.deviceCamera} />
      <div className={styles.deviceScreen}>{children}</div>
      <div className={styles.deviceHome} />
    </div>
  );
}

function FlowConnector() {
  return (
    <div className={styles.flowConnector} aria-hidden="true">
      <span className={styles.connectorLine} />
      <span className={styles.connectorPill}>
        <ArrowRight className="size-4" />
      </span>
      <span className={styles.connectorLine} />
    </div>
  );
}

function FamilyFlow() {
  const [aktivId, setAktivId] = useState(barn[0].id);
  const aktivt = barn.find((b) => b.id === aktivId) ?? barn[0];

  return (
    <section id="slik-fungerer-det" className="overflow-hidden border-y border-border bg-secondary/45 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className={`${styles.eyebrow} justify-center`}>Slik fungerer det</p>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.07em] text-foreground sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
            Fra oppgave til mestring.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            En enkel flyt som gjør det tydelig for alle hvem som skal gjøre hva – og hva det blir verdt.
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center justify-center gap-6 lg:flex-row lg:items-center lg:gap-4">
          <div className={`${styles.flowStep} w-full max-w-[260px]`}>
            <div className={styles.flowCard}>
              <div className="flex items-center justify-between">
                <span className={styles.miniLabel}>1 · DU LAGER OPPGAVEN</span>
                <span className={styles.statusDot} />
              </div>
              <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
                <p className="text-xs font-semibold text-muted-foreground">Ny oppgave</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">Rydde rommet</p>
                    <p className="text-xs text-muted-foreground">+ 25 kr</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-primary px-3 py-2 text-center text-xs font-bold text-primary-foreground">Lagre oppgave</div>
              </div>
            </div>
            <span className={styles.flowCaption}>Forelderens mobil</span>
          </div>

          <FlowConnector />

          <div className={`${styles.flowStep} flex flex-col items-center gap-4`}>
            <Device type="tablet">
              <div className="flex h-full flex-col bg-card px-4 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)" }}>ukepenger</span>
                  <span className="text-[9px] text-muted-foreground">09:41</span>
                </div>

                <div className="mt-5 flex justify-center gap-2" role="group" aria-label="Velg profil">
                  {barn.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setAktivId(b.id)}
                      aria-pressed={b.id === aktivId}
                      className={`${styles.profile} ${b.id === aktivId ? styles.profileActive : ""}`}
                    >
                      <span className={`${styles.avatar} ${styles[b.avatarClass]} size-8 text-xs`}>{b.initial}</span>
                      <span>{b.navn}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-5">
                  <p className="text-[10px] font-semibold text-muted-foreground">Hei, {aktivt.navn}!</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>Dine oppgaver</p>
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">{aktivt.igjen}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {aktivt.oppgaver.map((o) => (
                    <div key={o.tittel} className="flex items-center gap-2 rounded-xl bg-secondary p-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Check className="size-3" />
                      </span>
                      <span className="truncate text-[10px] font-semibold">{o.tittel}</span>
                      <span className="ml-auto shrink-0 text-[10px] font-bold">{o.belop}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto rounded-2xl bg-primary p-3 text-primary-foreground">
                  <p className="text-[9px] font-medium opacity-80">Til gode</p>
                  <p className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>{aktivt.tilGode}</p>
                </div>
              </div>
            </Device>
            <span className={styles.flowCaption}>2 · Barnets eller familiens iPad</span>
            <span className={styles.qrBadge}>
              <span className={styles.qrBadgeIcon}>
                <QrCode className="size-4" />
                <span className={styles.qrBadgeBeam} />
              </span>
              <span className={styles.qrBadgeText}>Skann QR én gang for å koble til</span>
            </span>
          </div>

          <FlowConnector />

          <div className={`${styles.flowStep} w-full max-w-[260px]`}>
            <div className={styles.flowCard}>
              <div className="flex items-center justify-between">
                <span className={styles.miniLabel}>3 · DU GODKJENNER</span>
                <span className={styles.statusDot} />
              </div>
              <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
                <div className="flex items-center gap-2">
                  <span className={`${styles.avatar} ${styles.avatarCoral} size-8 text-xs`}>E</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold">Emma har gjort en oppgave</p>
                    <p className="text-[10px] text-muted-foreground">Rydde rommet · nå</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-accent px-3 py-3">
                  <span className="text-xs font-bold text-accent-foreground">+ 25 kr til gode</span>
                  <CheckCircle2 className="size-4 shrink-0 text-accent-foreground" />
                </div>
                <div className="mt-3 rounded-xl bg-primary px-3 py-2 text-center text-xs font-bold text-primary-foreground">Godkjenn krav</div>
              </div>
            </div>
            <span className={styles.flowCaption}>Forelderens mobil</span>
          </div>
        </div>

        <div className="mx-auto mt-14 flex max-w-2xl items-center justify-center gap-3 rounded-2xl bg-card px-4 py-4 text-center shadow-sm ring-1 ring-border sm:gap-4 sm:px-6">
          <QrCode className="size-5 shrink-0 text-primary" />
          <p className="text-sm leading-5 text-muted-foreground">
            <span className="font-bold text-foreground">Én QR-kode.</span> Ingen brukernavn eller passord for barna.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function LandingClient() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape lukker menyen, og siden bak skal ikke kunne scrolles mens den er åpen.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const forrigeOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = forrigeOverflow;
    };
  }, [menuOpen]);

  const heroBarn = barn[0];

  return (
    <main id="top" className={`${landingSans.variable} ${landingMono.variable} ${styles.landingPage} min-h-screen`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Logo />
        <div className="hidden items-center gap-8 md:flex">
          <a href="#slik-fungerer-det" className={styles.navLink}>Slik fungerer det</a>
          <a href="#for-familien" className={styles.navLink}>For familien</a>
          <a href="mailto:hei@ukepenger.no" className={styles.navLink}>Kontakt</a>
          <Link href="/login" className={styles.buttonPrimary}>
            Kom i gang <ArrowRight className="size-4" />
          </Link>
        </div>
        <button
          className="flex size-11 items-center justify-center rounded-xl border border-border md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Lukk meny" : "Åpne meny"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Bakgrunnen lukker ved klikk, men holdes utenfor skjermleser og
              tabrekkefolge - X-knappen og Escape dekker tastaturbruk. */}
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-x-4 top-4 flex flex-col gap-1 rounded-2xl border border-border bg-card p-3 shadow-xl">
            <div className="flex items-center justify-between px-1 pb-2 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                Utforsk Ukepenger
              </p>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-lg border border-border"
                aria-label="Lukk meny"
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            <a href="#slik-fungerer-det" className="rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-secondary" onClick={() => setMenuOpen(false)}>
              Slik fungerer det
            </a>
            <a href="#for-familien" className="rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-secondary" onClick={() => setMenuOpen(false)}>
              For familien
            </a>
            <div className="my-2 h-px bg-border" />
            <a
              href="mailto:hei@ukepenger.no"
              className="rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Kontakt oss
            </a>
            <Link href="/login" className={`${styles.buttonPrimary} mt-2 justify-center`} onClick={() => setMenuOpen(false)}>
              Kom i gang <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="max-w-xl">
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} /> Ukepenger, gjort enkelt
            </div>
            <h1
              className="mt-5 text-balance text-[clamp(2.5rem,5.5vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.08em] text-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Mindre mas.
              <br />
              <span className="text-primary">Mer mestring.</span>
            </h1>
            <p className="mt-7 max-w-md text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              Ukepenger gjør det enkelt for barn å ta ansvar – og for foreldre å ha oversikt.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/login" className={`${styles.buttonPrimary} justify-center`}>
                Start med familien <ArrowRight className="size-4" />
              </Link>
              <a href="#slik-fungerer-det" className={`${styles.buttonSecondary} justify-center`}>
                Se hvordan det fungerer <ChevronDown className="size-4" />
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Gratis å bruke. Ingen kredittkort nødvendig.</p>
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {barn.map((b) => (
                  <span key={b.id} className={`${styles.avatar} ${styles[b.avatarClass]} border-2 border-background`}>
                    {b.initial}
                  </span>
                ))}
              </div>
              <span>For familier som vil ha litt mindre mas i hverdagen</span>
            </div>
          </div>

          <div className={`${styles.heroVisual} relative mx-auto w-full max-w-xl`}>
            <div className={`${styles.heroNote} ${styles.heroNoteTop}`}>
              <Sparkles className="size-4" /> Gjort!
            </div>
            <div className={`${styles.heroNote} ${styles.heroNoteBottom}`}>
              <Coins className="size-4" /> + 25 kr
            </div>
            <div className={styles.heroBlob} />
            <Device type="tablet">
              <div className="h-full bg-card px-5 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)" }}>ukepenger</span>
                  <span className="text-[10px] text-muted-foreground">09:41</span>
                </div>
                <div className="mt-7">
                  <p className="text-xs font-semibold text-muted-foreground">Hei, {heroBarn.navn}!</p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>Dine oppgaver</h3>
                </div>
                <div className="mt-5 space-y-3">
                  {heroBarn.oppgaver.map((o) => {
                    const Ikon = o.ikon;
                    return (
                      <div key={o.tittel} className={styles.taskRow}>
                        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${o.fremhevet ? "bg-accent text-accent-foreground" : "bg-secondary text-primary"}`}>
                          <Ikon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold">{o.tittel}</p>
                          <p className="text-[10px] text-muted-foreground">{o.belop}</p>
                        </div>
                        <span className={styles.taskCheck}>
                          <Check className="size-3" />
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 rounded-2xl bg-primary p-4 text-primary-foreground">
                  <p className="text-[10px] font-medium opacity-80">Til gode</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>{heroBarn.tilGode}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-primary-foreground/25">
                    <div className="h-full w-3/4 rounded-full bg-primary-foreground" />
                  </div>
                  <p className="mt-2 text-[10px] opacity-80">{heroBarn.maal}</p>
                </div>
              </div>
            </Device>
          </div>
        </div>
      </section>

      <FamilyFlow />

      <section id="for-familien" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-end">
          <div>
            <p className={styles.eyebrow}>Bygget for hele familien</p>
            <h2 className="mt-4 max-w-lg text-balance text-3xl font-bold tracking-[-0.07em] sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
              Ansvar for barna. Oversikt for foreldrene.
            </h2>
          </div>
          <p className="max-w-md text-pretty text-lg leading-8 text-muted-foreground">
            Ukepenger gir barna en tydelig vei fra innsats til belønning, samtidig som foreldrene slipper å holde styr på alt i hodet.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {verdier.map((verdi) => {
            const Icon = verdi.icon;
            return (
              <div key={verdi.title} className={styles.infoCard}>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>{verdi.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{verdi.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-5 mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:mx-8 sm:px-12 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] opacity-80" style={{ fontFamily: "var(--font-mono)" }}>En enklere uke starter her</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-bold tracking-[-0.07em] sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
          La ukepengene ordne seg litt mer selv.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-pretty leading-7 opacity-90">
          Barnet gjør jobben på sin enhet. Du har kontroll på mobilen. Resten flyter.
        </p>
        <Link href="/login" className={`${styles.buttonLight} mx-auto mt-8`}>
          Kom i gang <ArrowRight className="size-4" />
        </Link>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <a href="mailto:hei@ukepenger.no" className={styles.navLink}>Kontakt oss</a>
          <span>© 2026 Ukepenger.no · Laget for familielivet</span>
        </div>
      </footer>
    </main>
  );
}
