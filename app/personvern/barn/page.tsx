import type { Metadata } from "next";
import { Avsnitt, LegalPage } from "../../_components/LegalPage";

export const metadata: Metadata = {
  title: "Personvern for barn | Ukepenger",
  description: "Hva Ukepenger vet om deg, forklart enkelt for barn.",
};

function Boks({ emoji, tittel, children }: { emoji: string; tittel: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 flex gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
      <span className="text-4xl" aria-hidden="true">
        {emoji}
      </span>
      <div>
        <h2 className="text-lg font-bold text-foreground">{tittel}</h2>
        <div className="mt-1 text-base leading-7 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export default function PersonvernBarnPage() {
  return (
    <LegalPage eyebrow="For barn" title="Hva vet Ukepenger om meg?" updated="5. oktober 2026" intro={<p>Her er det viktigste, forklart enkelt. Spør gjerne en voksen hvis noe er rart.</p>}>
      <Boks emoji="🙂" tittel="Dette vet Ukepenger om deg">
        Fornavnet ditt, figuren du har valgt, oppgavene du har gjort, hvor mye du har tjent og spart, ønskene dine og trofeene dine.
      </Boks>
      <Boks emoji="🚫" tittel="Dette vet Ukepenger ikke">
        Vi vet ikke hvor du bor, hvor gammel du er, telefonnummeret ditt eller hvordan du ser ut. Vi spør aldri om det.
      </Boks>
      <Boks emoji="👨‍👩‍👧" tittel="Hvem kan se det">
        De voksne i familien din. Besteforeldre som familien din har invitert, kan se ønskene dine og hvor mye du har. Andre familier kan aldri se noe om deg.
      </Boks>
      <Boks emoji="🙅" tittel="Ingen reklame og ingen spionering">
        Ukepenger viser ingen reklame, og vi følger ikke med på hva du gjør på andre nettsider.
      </Boks>
      <Boks emoji="🗑️" tittel="Du kan få alt slettet">
        Be en voksen i familien din om å slette deg i appen, eller å sende oss en e-post. Da forsvinner alt om deg.
      </Boks>
      <Avsnitt tittel="For voksne">
        <p>Den fullstendige personvernerklæringen beskriver formål, rettslig grunnlag, leverandører og lagringstid.</p>
      </Avsnitt>
    </LegalPage>
  );
}
