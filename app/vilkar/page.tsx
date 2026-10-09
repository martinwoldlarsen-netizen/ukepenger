import type { Metadata } from "next";
import Link from "next/link";
import { Avsnitt, LegalPage, Mail } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Brukervilkår | Ukepenger",
  description: "Vilkårene for å bruke Ukepenger: hvem kan bruke tjenesten, hva den gjør og ikke gjør, og ansvar.",
};

export default function VilkarPage() {
  return (
    <LegalPage
      eyebrow="Vilkår"
      title="Brukervilkår"
      updated="5. oktober 2026"
      intro={
        <p>
          Disse vilkårene gjelder når du bruker Ukepenger. Hvordan vi behandler personopplysninger står i{" "}
          <Link href="/personvern" className="font-semibold text-foreground underline underline-offset-4">
            personvernerklæringen
          </Link>
          .
        </p>
      }
    >
      <Avsnitt tittel="1. Tjenesten">
        <p>
          Ukepenger er en app der familier holder oversikt over oppgaver barna gjør og hva de har tjent. Tjenesten leveres av Martin Wold Larsen («vi»). Tjenesten er i dag
          gratis.
        </p>
        <p>
          <strong className="text-foreground">Ukepenger er et regnskap, ikke en bank.</strong> Vi oppbevarer, flytter eller garanterer ingen penger. Beløpene i appen er
          familiens egne notater. Selve oppgjøret (for eksempel Vipps eller kontant) skjer utenfor appen og er familiens eget ansvar.
        </p>
      </Avsnitt>

      <Avsnitt tittel="2. Hvem kan opprette konto">
        <p>
          Bare voksne (18 år eller eldre) kan opprette en konto og en familie. Barn bruker appen gjennom en enhet som en voksen har koblet til, og har ingen egen konto.
          Den som oppretter familien, er ansvarlig for hvem som inviteres (andre foresatte og besteforeldre) og for hvilke enheter som er koblet til.
        </p>
      </Avsnitt>

      <Avsnitt tittel="3. Ditt ansvar">
        <ul className="space-y-2 pl-5" style={{ listStyleType: "disc" }}>
          <li>Hold innloggingen din for deg selv, og fjern enheter og lenker som ikke lenger skal ha tilgang (Mer → Enheter og Familie).</li>
          <li>Legg bare inn opplysninger om barn du har foreldreansvar for eller lov til å registrere, og ikke mer enn tjenesten trenger.</li>
          <li>Ikke bruk tjenesten til noe ulovlig, til å trakassere andre, eller til å forsøke å få tilgang til andre familiers data eller til systemene våre.</li>
        </ul>
      </Avsnitt>

      <Avsnitt tittel="4. Tilgjengelighet og endringer i tjenesten">
        <p>
          Vi prøver å holde Ukepenger stabilt og tilgjengelig, men kan ikke love at tjenesten alltid er feilfri eller oppe. Vi kan endre, legge til eller fjerne funksjoner.
          Vesentlige endringer varsler vi om i appen.
        </p>
      </Avsnitt>

      <Avsnitt tittel="5. Ansvar">
        <p>
          Tjenesten leveres som den er. Beregninger i appen (for eksempel saldo, sparing, ukepenger og bonuser) er et hjelpemiddel, og familien bør selv sjekke at tallene
          stemmer før penger betales ut. Vi er ikke ansvarlige for indirekte tap, eller for tap som skyldes feil i opplysninger familien selv har lagt inn. Dette begrenser
          ikke rettigheter du har etter ufravikelig lov.
        </p>
      </Avsnitt>

      <Avsnitt tittel="6. Dine data, eksport og sletting">
        <p>
          Familiens data tilhører familien. Du kan når som helst be om en kopi eller om at alt slettes ved å skrive til <Mail to="personvern@ukepenger.no" /> eller bruke{" "}
          <a href="/kontakt?emne=personvern" className="font-semibold text-foreground underline underline-offset-4">
            kontaktskjemaet
          </a>
          .
        </p>
        <p>
          Hvis vi legger ned Ukepenger, varsler vi alle kontoer på e-post og i appen minst 60 dager i forveien, slik at dere kan hente ut historikken før dataene slettes.
        </p>
      </Avsnitt>

      <Avsnitt tittel="7. Stenging av konto">
        <p>
          Du kan avslutte når du vil. Vi kan stenge eller begrense en konto som bryter disse vilkårene eller truer sikkerheten til tjenesten eller andre brukere. Hvis det
          er mulig, gir vi beskjed først og forklarer hvorfor.
        </p>
      </Avsnitt>

      <Avsnitt tittel="8. Endringer i vilkårene">
        <p>
          Vi kan oppdatere vilkårene. Vesentlige endringer varsler vi om i appen minst 30 dager før de gjelder. Bruker du tjenesten etter det, gjelder de nye vilkårene.
        </p>
      </Avsnitt>

      <Avsnitt tittel="9. Lovvalg og kontakt">
        <p>
          Norsk lov gjelder. Spørsmål eller uenighet tar vi helst direkte: <Mail to="hei@ukepenger.no" /> eller{" "}
          <a href="/kontakt" className="font-semibold text-foreground underline underline-offset-4">
            kontaktskjemaet
          </a>
          . Som forbruker kan du også klage til Forbrukerrådet.
        </p>
      </Avsnitt>
    </LegalPage>
  );
}
