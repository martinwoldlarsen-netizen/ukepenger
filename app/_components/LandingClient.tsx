"use client";

import { useState } from "react";
import Link from "next/link";
import { DM_Sans, Space_Mono } from "next/font/google";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Coins,
  ScanLine,
  Menu,
  QrCode,
  Sparkles,
  Star,
  X,
  Wallet,
} from "lucide-react";
import styles from "./LandingClient.module.css";

// Skjermet til forsiden: resten av appen (admin/kids/login) bruker Geist,
// lastet i app/layout.tsx. next/font er trygt å kalle fra en "use client"-fil
// sa lenge kallet ligger pa modul-niva, ikke inne i komponentfunksjonen.
const landingSans = DM_Sans({ subsets: ["latin"], variable: "--font-landing-sans" });
const landingMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-landing-mono" });

const steps = [
  { number: "01", title: "Lag en oppgave", description: "Forelderen velger oppgave og belop.", icon: Wallet },
  { number: "02", title: "Barnet gjor jobben", description: "Barnet velger profil og ser hva som skal gjores.", icon: CheckCircle2 },
  { number: "03", title: "Godkjenn og tjen", description: "Forelderen godkjenner. Til gode oker.", icon: Coins },
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

function FamilyFlow() {
  const [active, setActive] = useState(2);
  return (
    <section id="slik-fungerer-det" className="overflow-hidden border-y border-border bg-secondary/45 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className={styles.eyebrow}>Slik fungerer det</p>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.07em] text-foreground sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
            Fra oppgave til mestring.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            En enkel flyt som gjor det tydelig for alle hvem som skal gjore hva - og hva det blir verdt.
          </p>
        </div>

        <div className="relative mt-14 flex flex-col items-center justify-center gap-8 lg:flex-row lg:gap-12">
          <div className={`${styles.flowCard} order-2 w-full max-w-[250px] lg:order-1`}>
            <div className="flex items-center justify-between">
              <span className={styles.miniLabel}>FORELDERENS MOBIL</span>
              <span className={styles.statusDot} />
            </div>
            <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
              <p className="text-xs font-semibold text-muted-foreground">Ny oppgave</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
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

          <div className={`${styles.qrFlow} order-1 lg:order-2`} aria-label="iPaden skanner QR-koden pa forelderens telefon">
            <div className={styles.qrDevices}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.qrScanIllustration} src="/qr-scan-reference.jpeg" alt="En mobil skanner QR-koden for a aktivere Ukepenger" />
              <div className={styles.qrScanBeam} />
              <div className={styles.qrLoginCard}>
                <ScanLine className="size-3" />
                <span>Skanner QR</span>
                <span className={styles.qrLoginLabel}>Apner login</span>
              </div>
            </div>
            <span className={styles.qrFlowLabel}>Skann for a aktivere</span>
          </div>

          <div className="order-3 flex flex-col items-center gap-4">
            <Device type="tablet">
              <div className="h-full bg-card px-4 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)" }}>ukepenger</span>
                  <span className="text-[9px] text-muted-foreground">09:41</span>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-xs font-semibold text-muted-foreground">Hvem er du?</p>
                  <p className="mt-1 text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>Velg din profil</p>
                </div>
                <div className="mt-5 flex justify-center gap-3">
                  <button onClick={() => setActive(2)} className={`${styles.profile} ${active === 2 ? styles.profileActive : ""}`} aria-label="Velg Emmas profil">
                    <span className={`${styles.avatar} ${styles.avatarCoral}`}>E</span>
                    <span>Emma</span>
                  </button>
                  <button onClick={() => setActive(3)} className={`${styles.profile} ${active === 3 ? styles.profileActive : ""}`} aria-label="Velg Olivers profil">
                    <span className={`${styles.avatar} ${styles.avatarBlue}`}>O</span>
                    <span>Oliver</span>
                  </button>
                </div>
                <div className="mt-7 rounded-2xl bg-secondary p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold">Dine oppgaver</span>
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">{active === 2 ? "2 igjen" : "3 igjen"}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-card p-2.5">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-accent">
                      <Check className="size-3" />
                    </span>
                    <span className="text-[10px] font-semibold">Rydde rommet</span>
                    <span className="ml-auto text-[10px] font-bold text-accent-foreground">25 kr</span>
                  </div>
                </div>
              </div>
            </Device>
            <span className={`${styles.miniLabel} text-center`}>BARNETS / DELT IPAD</span>
          </div>

          <div className={`${styles.flowConnector} order-4`}>
            <span className={styles.connectorLine} />
            <span className={styles.connectorPill}>
              <ArrowRight className="size-4" />
            </span>
          </div>

          <div className={`${styles.flowCard} order-5 w-full max-w-[250px]`}>
            <div className="flex items-center justify-between">
              <span className={styles.miniLabel}>FORELDERENS MOBIL</span>
              <span className={styles.statusDot} />
            </div>
            <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
              <div className="flex items-center gap-2">
                <span className={`${styles.avatar} ${styles.avatarCoral} size-8 text-xs`}>E</span>
                <div>
                  <p className="text-xs font-bold">Emma har gjort en oppgave</p>
                  <p className="text-[10px] text-muted-foreground">Rydde rommet · Na</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-accent px-3 py-3">
                <span className="text-xs font-bold text-accent-foreground">+ 25 kr til gode</span>
                <CheckCircle2 className="size-4 text-primary" />
              </div>
              <div className="mt-3 rounded-xl bg-primary px-3 py-2 text-center text-xs font-bold text-primary-foreground">Godkjenn krav</div>
            </div>
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

  return (
    <main id="top" className={`${landingSans.variable} ${landingMono.variable} ${styles.landingPage} min-h-screen`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Logo />
        <div className="hidden items-center gap-8 md:flex">
          <a href="#slik-fungerer-det" className={styles.navLink}>Slik fungerer det</a>
          <a href="#for-familien" className={styles.navLink}>For familien</a>
          <Link href="/login" className={styles.buttonPrimary}>
            Kom i gang <ArrowRight className="size-4" />
          </Link>
        </div>
        <button
          className="flex size-11 items-center justify-center rounded-xl border border-border md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Apne meny"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="mx-5 flex flex-col gap-1 rounded-2xl border border-border bg-card p-3 shadow-lg ring-1 ring-border/50 md:hidden">
          <p className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
            Utforsk Ukepenger
          </p>
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
      )}

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="max-w-xl">
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} /> Ukepenger, gjort enkelt
            </div>
            <h1
              className="mt-5 text-balance text-[clamp(2.65rem,8vw,5.75rem)] font-bold leading-[0.96] tracking-[-0.09em] text-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Mindre mas.
              <br />
              <span className="text-primary">Mer mestring.</span>
            </h1>
            <p className="mt-7 max-w-md text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              Ukepenger gjor det enkelt for barn a ta ansvar - og for foreldre a ha oversikt.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={`${styles.buttonPrimary} justify-center`}>
                Start med familien <ArrowRight className="size-4" />
              </Link>
              <a href="#slik-fungerer-det" className={`${styles.buttonSecondary} justify-center`}>
                Se hvordan det fungerer <ChevronDown className="size-4" />
              </a>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                <span className={`${styles.avatar} ${styles.avatarCoral} border-2 border-background`}>E</span>
                <span className={`${styles.avatar} ${styles.avatarBlue} border-2 border-background`}>O</span>
                <span className={`${styles.avatar} ${styles.avatarYellow} border-2 border-background`}>L</span>
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
              <div className="h-full bg-card px-5 py-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)" }}>ukepenger</span>
                  <span className="text-[10px] text-muted-foreground">09:41</span>
                </div>
                <div className="mt-10">
                  <p className="text-xs font-semibold text-muted-foreground">Hei, Emma!</p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>Dine oppgaver</h3>
                </div>
                <div className="mt-6 space-y-3">
                  <div className={styles.taskRow}>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-accent">
                      <Sparkles className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold">Rydde rommet</p>
                      <p className="text-[10px] text-muted-foreground">+ 25 kr</p>
                    </div>
                    <span className={styles.taskCheck}>
                      <Check className="size-3" />
                    </span>
                  </div>
                  <div className={styles.taskRow}>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-secondary">
                      <Star className="size-4 text-primary" />
                    </span>
                    <div>
                      <p className="text-xs font-bold">Henge opp klaer</p>
                      <p className="text-[10px] text-muted-foreground">+ 10 kr</p>
                    </div>
                    <span className={styles.taskCheck}>
                      <Check className="size-3" />
                    </span>
                  </div>
                </div>
                <div className="mt-8 rounded-2xl bg-primary p-4 text-primary-foreground">
                  <p className="text-[10px] font-medium opacity-75">Til gode</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>125 kr</p>
                  <div className="mt-3 h-1.5 rounded-full bg-primary-foreground/25">
                    <div className="h-full w-3/4 rounded-full bg-primary-foreground" />
                  </div>
                  <p className="mt-2 text-[10px] opacity-75">75 kr til neste mal</p>
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
            <p className={styles.eyebrow}>Én app. To perspektiver.</p>
            <h2 className="mt-4 max-w-lg text-balance text-3xl font-bold tracking-[-0.07em] sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
              Ansvar for barna. Oversikt for foreldrene.
            </h2>
          </div>
          <p className="max-w-md text-pretty text-lg leading-8 text-muted-foreground">
            Ukepenger gir barna en tydelig vei fra innsats til belonning, samtidig som foreldrene slipper a holde styr pa alt i hodet.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className={styles.infoCard}>
                <span className={styles.stepNumber}>{step.number}</span>
                <span className="mt-10 flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="kom-i-gang" className="mx-5 mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:mx-8 sm:px-12 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] opacity-70" style={{ fontFamily: "var(--font-mono)" }}>En enklere uke starter her</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-bold tracking-[-0.07em] sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
          La ukepengene ordne seg litt mer selv.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-pretty leading-7 opacity-80">
          Barnet gjor jobben pa sin enhet. Du har kontroll pa mobilen. Resten flyter.
        </p>
        <Link href="/login" className={`${styles.buttonLight} mx-auto mt-8`}>
          Kom i gang <ArrowRight className="size-4" />
        </Link>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo />
        <span>© 2026 Ukepenger.no · Laget for familielivet</span>
      </footer>
    </main>
  );
}
