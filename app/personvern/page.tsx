import type { Metadata } from "next";
import Link from "next/link";
import { Avsnitt, Code, KortFortalt, LegalPage, Mail, Tabell } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Personvern | Ukepenger",
  description: "Hva Ukepenger behandler om deg og barna dine, hvorfor, på hvilket grunnlag, hvor lenge og hvem som hjelper oss.",
};

export default function PersonvernPage() {
  return (
    <LegalPage
      eyebrow="Personvern"
      title="Personvernerklæring"
      updated="5. oktober 2026"
      intro={
        <p>
          Ukepenger er laget for barn. Derfor vil vi si tydelig hva vi behandler, hvorfor, og hvem som hjelper oss. Det finnes også en{" "}
          <Link href="/personvern/barn" className="font-semibold text-foreground underline underline-offset-4">
            enkel versjon for barn
          </Link>
          .
        </p>
      }
    >
      <KortFortalt>
        <li>Barn har ingen brukerkonto, e-post eller passord hos oss.</li>
        <li>
          Om barnet lagrer vi fornavnet og avataren dere velger, og det barnet gjør i appen: oppgaver, krav, beløp, sparing, utbetalinger, ønsker og trofeer. Vi ber
          aldri om fødselsdato, fødselsnummer, adresse, telefon eller bilde.
        </li>
        <li>Vi bruker ingen sporing, statistikkverktøy eller annonser.</li>
        <li>Ukepenger flytter ingen penger og er ikke koblet til bank eller betalingsløsning.</li>
        <li>Databasen ligger i Irland (EU). Enkelte leverandører kan behandle tekniske data utenfor EØS, med godkjente overføringsmekanismer (se under).</li>
      </KortFortalt>

      <Avsnitt tittel="Hvem er ansvarlig">
        <p>
          Behandlingsansvarlig er Martin Wold Larsen, som driver Ukepenger. Spørsmål om personvern, innsyn, retting eller sletting sendes til{" "}
          <Mail to="personvern@ukepenger.no" />. Andre henvendelser: <Mail to="hei@ukepenger.no" />.
        </p>
      </Avsnitt>

      <Avsnitt tittel="Hva vi behandler, hvorfor og på hvilket grunnlag" id="formal">
        <p>Hver behandling har ett formål og ett rettslig grunnlag etter personvernforordningen (GDPR) artikkel 6.</p>
        <Tabell
          head={["Hva", "Hvorfor", "Grunnlag"]}
          rows={[
            [
              "Forelderens e-post, innloggingsmåte (passord eller Google) og familie/rolle",
              "Opprette og drive kontoen, logge inn, gi tilgang til riktig familie",
              "Avtale med deg (art. 6 nr. 1 b)",
            ],
            [
              "Barnets fornavn, avatar, oppgaver, krav, beløp, sparing, utbetalinger, ønsker, trofeer og faste ukepenger",
              "Levere tjenesten foreldrene har valgt: holde oversikt over hva barnet har gjort og tjent",
              "Avtale med forelderen (art. 6 nr. 1 b). Foreldrene bestemmer selv hva som legges inn.",
            ],
            ["Navn på besteforeldre/gjester som foreldrene legger til", "La dem se barnas ønsker og sende gaver", "Berettiget interesse (art. 6 nr. 1 f): familien ønsker å dele med dem"],
            ["Koblede barneenheter (navn på enheten, tidspunkt)", "Vite hvilke nettbrett som er koblet til, og kunne koble dem fra", "Avtale med forelderen (art. 6 nr. 1 b)"],
            ["Varselabonnement (en adresse fra nettleseren)", "Sende varsler til forelderen når barnet sender krav", "Samtykke (art. 6 nr. 1 a): du slår det på selv og kan slå det av når som helst"],
            [
              "Tekniske data: IP-adresse, nettleser/enhet, tidspunkt og innloggingshendelser i logger",
              "Drift, feilsøking, sikkerhet og å stoppe misbruk",
              "Berettiget interesse (art. 6 nr. 1 f): en trygg og stabil tjeneste",
            ],
            ["Henvendelser til oss på e-post", "Svare deg", "Berettiget interesse (art. 6 nr. 1 f)"],
          ]}
        />
        <p>Vi bruker ikke opplysningene til markedsføring, profilering eller automatiserte avgjørelser, og vi selger dem aldri.</p>
      </Avsnitt>

      <Avsnitt tittel="Hvem kan se hva">
        <p>
          Familiens innhold er bare tilgjengelig for innloggede voksne i samme familie. Dette håndheves i databasen med radnivåsikkerhet (RLS), og vi har testet at én familie
          ikke kan lese en annen families data.
        </p>
        <p>
          En barneenhet (for eksempel et nettbrett) er koblet til familien. Den viser profilvelgeren for familiens barn, og deretter oppgavene og saldoen til barnet som er
          valgt. Besteforeldre/gjester ser bare navn, ønsker og saldo for barna i den familien som har invitert dem.
        </p>
      </Avsnitt>

      <Avsnitt tittel="Leverandører (databehandlere og mottakere)" id="leverandorer">
        <Tabell
          head={["Leverandør", "Hva de gjør", "Hvor"]}
          rows={[
            ["Supabase", "Database, innlogging og e-post ved registrering/glemt passord. Fører innloggingslogger (blant annet IP-adresse og nettleser).", "Databasen i Irland (EU). Supabase og underleverandører kan behandle data utenfor EØS etter EUs standardavtaler."],
            ["Vercel", "Driver nettsiden og serverne. Behandler tekniske data som IP-adresse, omtrentlig sted, nettleser og forespørselslogger.", "Globalt nettverk. Overføring utenfor EØS skjer etter EUs standardavtaler / EU–US Data Privacy Framework."],
            ["Google", "Bare hvis du velger «Fortsett med Google»: Google bekrefter hvem du er og gir oss navn og e-post.", "Google sine vilkår gjelder for Google-kontoen din."],
            ["Nettleserens varseltjeneste (Apple, Google eller Mozilla)", "Bare hvis du slår på varsler: leverer varselet til enheten din. Innholdet er kort tekst om kravet.", "Avhenger av nettleseren din."],
          ]}
        />
        <p>Fonter lastes fra vår egen server, ikke fra Google.</p>
      </Avsnitt>

      <Avsnitt tittel="Informasjonskapsler og lagring i nettleseren" id="cookies">
        <p>Vi bruker bare det som er nødvendig for at tjenesten skal virke. Derfor viser vi ikke et samtykkebanner.</p>
        <Tabell
          head={["Navn", "Hva den gjør", "Satt av", "Varighet"]}
          rows={[
            [<Code key="a">sb-…-auth-token</Code>, "Holder deg innlogget, så du kommer rett inn i appen", "Ukepenger/Supabase", "Til du logger ut (fornyes når du bruker appen)"],
            [<Code key="b">uk_kiosk</Code>, "Husker at enheten er koblet til familien som barneenhet", "Ukepenger", "1 år, eller til den kobles fra"],
            [<Code key="c">uk_guest</Code>, "Husker at enheten tilhører en besteforelder/gjest", "Ukepenger", "Omtrent 13 måneder, eller til lenken stenges"],
            [<Code key="d">uk_sound</Code>, "Om lyd er slått av på barnesiden", "Ukepenger", "Til den slettes i nettleseren"],
            [<Code key="e">uk_badges_…</Code>, "Hvilke merker som allerede er feiret på denne enheten", "Ukepenger", "Til den slettes i nettleseren"],
          ]}
        />
        <p>Vi bruker ingen informasjonskapsler til sporing, statistikk eller annonser. Tar vi slike verktøy i bruk senere, spør vi om samtykke først.</p>
      </Avsnitt>

      <Avsnitt tittel="Hvor lenge vi lagrer" id="lagringstid">
        <Tabell
          head={["Hva", "Hvor lenge"]}
          rows={[
            ["Konto og familiens innhold", "Så lenge kontoen finnes. Sletter du et barn, slettes alt som hører til barnet (oppgavekrav, utbetalinger, ønsker, trofeer)."],
            ["Når kontoen slettes", "Familien og alt innholdet slettes med en gang fra databasen. Det forsvinner fra sikkerhetskopiene når de roteres, normalt innen 30 dager."],
            ["Innloggings- og driftslogger hos Supabase og Vercel", "Kort tid etter leverandørenes standard, fra timer opptil 90 dager, deretter slettes de automatisk."],
            ["Varselabonnement", "Til du slår av varsler, eller nettleseren melder at abonnementet er utløpt."],
            ["E-post til oss", "Så lenge saken pågår, og senest 12 måneder etter siste svar."],
          ]}
        />
      </Avsnitt>

      <Avsnitt tittel="Penger">
        <p>
          Ukepenger er et regnskap, ikke en lommebok. Vi ser verken kontonummer eller kortopplysninger. En registrert utbetaling er bare en merkelapp på hvordan dere gjorde
          opp i virkeligheten, for eksempel Vipps eller kontant.
        </p>
      </Avsnitt>

      <Avsnitt tittel="Sikkerhet">
        <p>
          All trafikk går kryptert (HTTPS). Passord håndteres av Supabase og lagres aldri i klartekst hos oss. Hemmelige nøkler finnes bare på serveren. En barneenhet kan
          kobles fra når som helst under Enheter, og en besteforelder-lenke kan stenges under Familie.
        </p>
        <p>Oppdager vi et sikkerhetsbrudd som kan ramme deg, varsler vi Datatilsynet innen 72 timer når loven krever det, og deg uten ugrunnet opphold.</p>
      </Avsnitt>

      <Avsnitt tittel="Dine rettigheter">
        <p>
          Du har rett til innsyn, retting, sletting, begrensning, dataportabilitet og til å protestere mot behandling som bygger på berettiget interesse. Samtykke (varsler)
          kan trekkes tilbake i Innstillinger. Som forelder utøver du rettighetene på vegne av barna dine.
        </p>
        <p>
          Skriv til <Mail to="personvern@ukepenger.no" />, så svarer vi innen 30 dager. Du kan også klage til{" "}
          <a href="https://www.datatilsynet.no" className="font-semibold text-foreground underline underline-offset-4">
            Datatilsynet
          </a>
          .
        </p>
      </Avsnitt>

      <Avsnitt tittel="Endringer">
        <p>Endrer vi hva vi behandler eller hvordan, oppdaterer vi denne siden. Er endringen vesentlig, gir vi beskjed i appen før den gjelder.</p>
      </Avsnitt>
    </LegalPage>
  );
}
