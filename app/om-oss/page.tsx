import type { Metadata } from "next";
import Link from "next/link";
import { Avsnitt, LegalPage } from "../_components/LegalPage";
import { pick } from "@/lib/i18n";
import { serverLang } from "@/lib/server-lang";

export const metadata: Metadata = {
  title: "Om oss | Ukepenger",
  description: "Hvem som står bak Ukepenger, og hva appen bygger på.",
};

const TEXT = {
  nb: {
    eyebrow: "Om oss",
    title: "Om Ukepenger",
    intro: "Ukepenger er en norsk app som gjør oppgaver og ukepenger hjemme enklere – for barna og for de voksne.",
    whoTitle: "Hvem står bak",
    who: "Ukepenger drives av Martin Wold Larsen. Appen er laget for norske familier, og bygges videre ut fra det foreldre og barn faktisk bruker.",
    beliefTitle: "Hva vi bygger på",
    beliefs: [
      "Barn lærer om penger ved å tjene ekte kroner – ingen poeng eller spillpenger.",
      "Framgang og mestring, ikke straff, rangering mellom søsken eller lootbokser.",
      "Appen er et regnskap, ikke en bank. Den flytter aldri penger.",
      "Ingen reklame, og vi sporer ikke barna.",
    ],
    privacyTitle: "Personvern",
    privacy: "Barna har ingen konto. Vi lagrer bare fornavn, figur og det som skjer i appen, og databasen ligger i EU.",
    privacyLink: "Les personvernerklæringen",
    contactTitle: "Kontakt",
    contact: "Spørsmål, ønsker eller noe som ikke virker?",
    contactLink: "Skriv til oss",
  },
  en: {
    eyebrow: "About us",
    title: "About Ukepenger",
    intro: "Ukepenger is a Norwegian app that makes chores and pocket money at home easier – for the children and for the grown-ups.",
    whoTitle: "Who is behind it",
    who: "Ukepenger is run by Martin Wold Larsen. The app is made for Norwegian families, and is developed further based on what parents and children actually use.",
    beliefTitle: "What we build on",
    beliefs: [
      "Children learn about money by earning real kroner – no points or play money.",
      "Progress and mastery, not punishment, ranking siblings or loot boxes.",
      "The app is a ledger, not a bank. It never moves money.",
      "No ads, and we don't track the children.",
    ],
    privacyTitle: "Privacy",
    privacy: "Children have no account. We only store a first name, a character and what happens in the app, and the database is in the EU.",
    privacyLink: "Read the privacy policy (in Norwegian)",
    contactTitle: "Contact",
    contact: "Questions, wishes or something that isn't working?",
    contactLink: "Write to us",
  },
  uk: {
    eyebrow: "Про нас",
    title: "Про Ukepenger",
    intro: "Ukepenger – норвезький застосунок, який спрощує домашні завдання й кишенькові гроші – для дітей і для дорослих.",
    whoTitle: "Хто за цим стоїть",
    who: "Ukepenger веде Мартін Волд Ларсен. Застосунок створено для норвезьких родин, і він розвивається відповідно до того, чим справді користуються батьки й діти.",
    beliefTitle: "На чому ми будуємо",
    beliefs: [
      "Діти вчаться поводитися з грошима, заробляючи справжні крони – без балів чи ігрових грошей.",
      "Прогрес і успіхи, а не покарання, рейтинги між дітьми чи лутбокси.",
      "Застосунок – це облік, а не банк. Він ніколи не переказує гроші.",
      "Без реклами, і ми не відстежуємо дітей.",
    ],
    privacyTitle: "Конфіденційність",
    privacy: "Діти не мають акаунта. Ми зберігаємо лише ім’я, персонажа й те, що відбувається в застосунку, а база даних розташована в ЄС.",
    privacyLink: "Читати політику конфіденційності (норвезькою)",
    contactTitle: "Контакти",
    contact: "Запитання, побажання чи щось не працює?",
    contactLink: "Напишіть нам",
  },
};

const link = "font-semibold text-foreground underline underline-offset-4";

export default async function OmOssPage() {
  const t = pick(TEXT, await serverLang());
  return (
    <LegalPage eyebrow={t.eyebrow} title={t.title} updated="2026-11-10" translated intro={<p>{t.intro}</p>}>
      <Avsnitt tittel={t.whoTitle}>
        <p>{t.who}</p>
      </Avsnitt>
      <Avsnitt tittel={t.beliefTitle}>
        <ul className="list-disc space-y-1.5 pl-5">
          {t.beliefs.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </Avsnitt>
      <Avsnitt tittel={t.privacyTitle}>
        <p>
          {t.privacy}{" "}
          <Link href="/personvern" className={link}>
            {t.privacyLink}
          </Link>
          .
        </p>
      </Avsnitt>
      <Avsnitt tittel={t.contactTitle}>
        <p>
          {t.contact}{" "}
          <Link href="/kontakt" className={link}>
            {t.contactLink}
          </Link>
          .
        </p>
      </Avsnitt>
    </LegalPage>
  );
}
