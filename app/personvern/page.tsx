import type { Metadata } from "next";
import Link from "next/link";
import { DM_Sans, Space_Mono } from "next/font/google";
import { ArrowLeft, Coins } from "lucide-react";
import styles from "../_components/LandingClient.module.css";

const landingSans = DM_Sans({ subsets: ["latin"], variable: "--font-landing-sans" });
const landingMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-landing-mono" });

export const metadata: Metadata = {
  title: "Personvern | Ukepenger",
  description:
    "Hva Ukepenger lagrer om deg og barna dine, hvor det lagres, og hvilke rettigheter du har.",
};

const sistOppdatert = "11. september 2026";

function Avsnitt({ tittel, children }: { tittel: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-[-0.04em]" style={{ fontFamily: "var(--font-mono)" }}>
        {tittel}
      </h2>
      <div className="mt-3 space-y-3 text-[0.9375rem] leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PersonvernPage() {
  return (
    <main className={`${landingSans.variable} ${landingMono.variable} ${styles.landingPage} min-h-screen`}>
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Ukepenger forside">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Coins className="size-5" strokeWidth={2.5} />
          </span>
          <span className="text-[17px] font-bold tracking-[-0.06em] text-foreground" style={{ fontFamily: "var(--font-mono)" }}>
            ukepenger.no
          </span>
        </Link>
        <Link href="/" className={`${styles.navLink} flex items-center gap-2`}>
          <ArrowLeft className="size-4" /> Tilbake
        </Link>
      </nav>

      <article className="mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8 sm:pt-14">
        <p className={styles.eyebrow}>Personvern</p>
        <h1 className="mt-4 text-balance text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.07em]" style={{ fontFamily: "var(--font-mono)" }}>
          Personvernerklæring
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Ukepenger er laget for barn, og da mener vi det er rimelig å si tydelig hva vi faktisk lagrer – og hva vi
          ikke lagrer.
        </p>

        <div className="mt-10 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-primary" style={{ fontFamily: "var(--font-mono)" }}>
            Kort fortalt
          </h2>
          <ul className="mt-4 space-y-2.5 text-[0.9375rem] leading-7 text-muted-foreground">
            <li>Barn har ingen brukerkonto. De logger ikke inn, og har verken e-post eller passord hos oss.</li>
            <li>Det eneste vi lagrer om et barn, er fornavnet du selv skriver inn og en avatar barnet velger.</li>
            <li>Vi bruker ingen sporing, statistikkverktøy eller annonsenettverk.</li>
            <li>Ukepenger flytter ingen penger og er ikke koblet til bank eller betalingsløsning.</li>
            <li>Alle data lagres i EU.</li>
          </ul>
        </div>

        <Avsnitt tittel="Hvem er ansvarlig">
          <p>
            Behandlingsansvarlig for Ukepenger er Martin Wold Larsen. Spørsmål om personvern, innsyn eller sletting
            sendes til{" "}
            <a href="mailto:personvern@ukepenger.no" className="font-semibold text-foreground underline underline-offset-4">
              personvern@ukepenger.no
            </a>
            .
          </p>
        </Avsnitt>

        <Avsnitt tittel="Hva vi lagrer om deg som forelder">
          <p>
            Når du oppretter en konto, lagrer vi e-postadressen din. Du kan registrere deg med e-post og passord, eller
            logge inn med Google. Innlogging og passord håndteres av Supabase Auth – vi oppbevarer ikke passordet ditt
            selv.
          </p>
          <p>I tillegg lagrer vi hvilken familie du tilhører og hvilken rolle du har i den.</p>
        </Avsnitt>

        <Avsnitt tittel="Hva vi lagrer om barna dine">
          <p>
            Om hvert barn lagrer vi fornavnet du skriver inn, avataren barnet velger, og det som hører til bruken av
            appen: oppgaver, krav barnet har sendt, beløp, registrerte utbetalinger og eventuell ønskeliste.
          </p>
          <p>
            Vi ber aldri om fødselsdato, fødselsnummer, e-postadresse, telefonnummer, adresse eller bilde av barnet.
            Barna har ingen innlogging – en enhet kobles til familien ved at en voksen skanner en QR-kode én gang.
          </p>
        </Avsnitt>

        <Avsnitt tittel="Penger">
          <p>
            Ukepenger er et regnskap, ikke en lommebok. Appen er ikke koblet til bank, kort eller betalingsløsning, og
            vi ser verken kontonummer eller kortopplysninger.
          </p>
          <p>
            Når du registrerer en utbetaling, noterer du kun hvordan dere gjorde opp i virkeligheten – for eksempel
            Vipps, kontant eller bank. Det er en merkelapp i regnskapet, ikke en overføring.
          </p>
        </Avsnitt>

        <Avsnitt tittel="Hvem har tilgang">
          <p>
            Databasen bruker radnivåsikkerhet, som betyr at innholdet i familien din bare er tilgjengelig for
            innloggede voksne i din egen familie. Andre familier kan ikke se dataene deres.
          </p>
          <p>
            En enhet som er koblet til som barneenhet, får kun se oppgavene og saldoen til barnet som er valgt på den
            enheten.
          </p>
        </Avsnitt>

        <Avsnitt tittel="Hvor dataene lagres">
          <p>
            Dataene lagres hos Supabase i EU (Irland). Nettsiden driftes av Vercel. Begge behandler data på våre vegne
            som databehandlere.
          </p>
        </Avsnitt>

        <Avsnitt tittel="Informasjonskapsler">
          <p>Ukepenger bruker bare informasjonskapsler som er nødvendige for at tjenesten skal virke:</p>
          <ul className="space-y-2 pl-5" style={{ listStyleType: "disc" }}>
            <li>Innloggingskapsler fra Supabase, slik at du forblir innlogget mellom besøk.</li>
            <li>
              <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">uk_kiosk</code>, som husker at en enhet er
              koblet til som barneenhet.
            </li>
          </ul>
          <p>Vi bruker ingen informasjonskapsler til sporing, statistikk eller annonser.</p>
        </Avsnitt>

        <Avsnitt tittel="Hvor lenge vi lagrer">
          <p>
            Vi lagrer dataene så lenge du har en konto hos oss. Sletter du et barn, slettes barnets oppgaver, krav og
            utbetalinger sammen med det. Ber du om at kontoen slettes, sletter vi familien og alt innholdet i den.
          </p>
        </Avsnitt>

        <Avsnitt tittel="Dine rettigheter">
          <p>
            Du har rett til innsyn i opplysningene vi har om deg og barna dine, til å få rettet det som er feil, og til
            å få alt slettet. Du kan også be om å få dataene utlevert.
          </p>
          <p>
            Kontakt oss på{" "}
            <a href="mailto:personvern@ukepenger.no" className="font-semibold text-foreground underline underline-offset-4">
              personvern@ukepenger.no
            </a>
            , så svarer vi så raskt vi kan. Mener du at vi behandler opplysninger i strid med regelverket, kan du klage
            til Datatilsynet.
          </p>
        </Avsnitt>

        <Avsnitt tittel="Endringer">
          <p>
            Endrer vi hva vi lagrer eller hvordan, oppdaterer vi denne siden. Er endringen vesentlig, gir vi beskjed i
            appen.
          </p>
        </Avsnitt>

        <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          Sist oppdatert {sistOppdatert}.
        </p>
      </article>
    </main>
  );
}
