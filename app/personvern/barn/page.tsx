import type { Metadata } from "next";
import Link from "next/link";
import { Avsnitt, LegalPage } from "../../_components/LegalPage";
import { pick } from "@/lib/i18n";
import { serverLang } from "@/lib/server-lang";

export const metadata: Metadata = {
  title: "Personvern for barn | Ukepenger",
  description: "Hva Ukepenger vet om deg, forklart enkelt for barn.",
};

const TEXT = {
  nb: {
    eyebrow: "For barn",
    title: "Hva vet Ukepenger om meg?",
    intro: "Her er det viktigste, forklart enkelt. Spør gjerne en voksen hvis noe er rart.",
    boxes: [
      { emoji: "🙂", title: "Dette vet Ukepenger om deg", text: "Fornavnet ditt, figuren du har valgt, oppgavene du har gjort, hvor mye du har tjent og spart, ønskene dine og trofeene dine." },
      { emoji: "🚫", title: "Dette vet Ukepenger ikke", text: "Vi vet ikke hvor du bor, hvor gammel du er, telefonnummeret ditt eller hvordan du ser ut. Vi spør aldri om det." },
      { emoji: "👨‍👩‍👧", title: "Hvem kan se det", text: "De voksne i familien din. Besteforeldre som familien din har invitert, kan se ønskene dine og hvor mye du har. Andre familier kan aldri se noe om deg." },
      { emoji: "🙅", title: "Ingen reklame og ingen spionering", text: "Ukepenger viser ingen reklame, og vi følger ikke med på hva du gjør på andre nettsider." },
      { emoji: "🗑️", title: "Du kan få alt slettet", text: "Be en voksen i familien din om å slette deg i appen, eller å sende oss en e-post. Da forsvinner alt om deg." },
    ],
    adults: "For voksne",
    adultsText: "Den fullstendige personvernerklæringen beskriver formål, rettslig grunnlag, leverandører og lagringstid.",
    adultsLink: "Les personvernerklæringen",
  },
  en: {
    eyebrow: "For children",
    title: "What does Ukepenger know about me?",
    intro: "Here are the most important things, explained simply. Ask a grown-up if anything seems strange.",
    boxes: [
      { emoji: "🙂", title: "What Ukepenger knows about you", text: "Your first name, the character you chose, the tasks you have done, how much you have earned and saved, your wishes and your trophies." },
      { emoji: "🚫", title: "What Ukepenger doesn't know", text: "We don't know where you live, how old you are, your phone number or what you look like. We never ask about it." },
      { emoji: "👨‍👩‍👧", title: "Who can see it", text: "The grown-ups in your family. Grandparents your family has invited can see your wishes and how much you have. Other families can never see anything about you." },
      { emoji: "🙅", title: "No ads and no spying", text: "Ukepenger shows no ads, and we don't keep an eye on what you do on other websites." },
      { emoji: "🗑️", title: "You can have everything deleted", text: "Ask a grown-up in your family to delete you in the app, or to send us an email. Then everything about you disappears." },
    ],
    adults: "For grown-ups",
    adultsText: "The full privacy policy (in Norwegian) describes purposes, legal basis, suppliers and how long data is kept.",
    adultsLink: "Read the privacy policy",
  },
  uk: {
    eyebrow: "Для дітей",
    title: "Що Ukepenger знає про мене?",
    intro: "Тут найважливіше, пояснене просто. Якщо щось незрозуміло, запитай дорослого.",
    boxes: [
      { emoji: "🙂", title: "Що Ukepenger знає про тебе", text: "Твоє ім’я, обраний тобою персонаж, виконані завдання, скільки грошей зароблено й заощаджено, твої бажання й трофеї." },
      { emoji: "🚫", title: "Чого Ukepenger не знає", text: "Ми не знаємо, де ти живеш, скільки тобі років, твого номера телефону чи як ти виглядаєш. Ми ніколи про це не питаємо." },
      { emoji: "👨‍👩‍👧", title: "Хто це бачить", text: "Дорослі у твоїй родині. Бабусі й дідусі, яких запросила твоя родина, бачать твої бажання і скільки в тебе грошей. Інші родини ніколи нічого про тебе не бачать." },
      { emoji: "🙅", title: "Без реклами й без стеження", text: "Ukepenger не показує реклами, і ми не стежимо, що ти робиш на інших сайтах." },
      { emoji: "🗑️", title: "Усе можна видалити", text: "Попроси дорослого в родині видалити тебе в застосунку або написати нам листа. Тоді все про тебе зникне." },
    ],
    adults: "Для дорослих",
    adultsText: "Повна політика конфіденційності (норвезькою) описує цілі, правові підстави, постачальників і строки зберігання.",
    adultsLink: "Читати політику конфіденційності",
  },
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

export default async function PersonvernBarnPage() {
  const t = pick(TEXT, await serverLang());
  return (
    <LegalPage eyebrow={t.eyebrow} title={t.title} updated="2026-10-05" translated intro={<p>{t.intro}</p>}>
      {t.boxes.map((b) => (
        <Boks key={b.emoji} emoji={b.emoji} tittel={b.title}>
          {b.text}
        </Boks>
      ))}
      <Avsnitt tittel={t.adults}>
        <p>
          {t.adultsText}{" "}
          <Link href="/personvern" className="font-semibold text-foreground underline underline-offset-4">
            {t.adultsLink}
          </Link>
          .
        </p>
      </Avsnitt>
    </LegalPage>
  );
}
