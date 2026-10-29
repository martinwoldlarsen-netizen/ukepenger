"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Coins,
  ListChecks,
  PiggyBank,
  QrCode,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import styles from "./LandingClient.module.css";
import { supabase } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Lang } from "@/lib/i18n";
import { formatKr } from "@/lib/money";
import { useLang, useText } from "@/lib/use-lang";

// Skriftene (DM Sans og Space Mono) lastes én gang i app/layout.tsx.

type Faq = { sporsmal: string; svar: string };

const TEXT = {
  nb: {
    nav: { how: "Slik fungerer det", family: "For familien", cost: "Hva koster det", faq: "Ofte stilte spørsmål", questions: "Spørsmål" },
    login: "Logg inn",
    contact: "Kontakt oss",
    privacy: "Personvern",
    terms: "Vilkår",
    home: "Ukepenger hjem",
    openMenu: "Åpne meny",
    closeMenu: "Lukk meny",
    menu: "Meny",
    toApp: "Gå til appen",
    appShort: "Appen",
    getStarted: "Kom i gang",
    free: "Gratis å bruke. Ingen kredittkort nødvendig.",
    eyebrow: "Ukepenger, gjort enkelt",
    h1a: "Mindre mas.",
    h1b: "Mer mestring.",
    lead: "Ukepenger gjør det enkelt for barn å ta ansvar – og for foreldre å ha oversikt.",
    startFamily: "Start med familien",
    seeHow: "Se hvordan det fungerer",
    forFamilies: "For familier som vil ha litt mindre mas i hverdagen",
    done: "Gjort!",
    hi: (name: string) => `Hei, ${name}!`,
    yourTasks: "Dine oppgaver",
    owed: "Til gode",
    left: (n: number) => `${n} igjen`,
    toGoal: (kr: number) => `${kr} kr til neste mål`,
    flowTitle: "Fra oppgave til mestring.",
    flowLead: "En enkel flyt som gjør det tydelig for alle hvem som skal gjøre hva – og hva det blir verdt.",
    step1: "1 · DU LAGER OPPGAVEN",
    newTask: "Ny oppgave",
    saveTask: "Lagre oppgave",
    parentPhone: "Forelderens mobil",
    chooseProfile: "Velg profil",
    step2: "2 · Barnets eller familiens iPad",
    scanOnce: "Skann QR én gang for å koble til",
    step3: "3 · DU GODKJENNER",
    childDid: (name: string) => `${name} har gjort en oppgave`,
    now: "nå",
    owedPlus: (kr: number) => `+ ${kr} kr til gode`,
    approve: "Godkjenn krav",
    oneQr: "Én QR-kode.",
    noPasswords: "Ingen brukernavn eller passord for barna.",
    familyEyebrow: "Bygget for hele familien",
    familyTitle: "Ansvar for barna. Oversikt for foreldrene.",
    familyLead: "Ukepenger gir barna en tydelig vei fra innsats til belønning, samtidig som foreldrene slipper å holde styr på alt i hodet.",
    values: [
      { title: "Tydelig for barnet", description: "Barnet ser hva som skal gjøres, hva hver oppgave er verdt, og hvor mye som er til gode akkurat nå." },
      { title: "Oversikt for deg", description: "Krav, saldo og utbetalinger for alle barna på ett sted – i stedet for å holde regnskapet i hodet." },
      { title: "Noe å spare til", description: "Ønskeliste og sparemål gjør at pengene får et formål, ikke bare en sum som ligger og venter." },
    ],
    costTitle: "Ingenting.",
    costLead: "Ukepenger er gratis, og vi har ingen planer om å ta betalt. Ingen prøveperiode som går ut, ingen funksjoner som plutselig krever oppgradering.",
    costPoints: ["Ingen kredittkort", "Så mange barn du vil", "Ingen reklame eller sporing"],
    faqTitle: "Det foreldre lurer på.",
    faqMore: "Noe annet du lurer på?",
    writeUs: "Skriv til oss",
    ctaEyebrow: "En enklere uke starter her",
    ctaTitle: "La ukepengene ordne seg litt mer selv.",
    ctaLead: "Barnet gjør jobben på sin enhet. Du har kontroll på mobilen. Resten flyter.",
    madeFor: "Laget for familielivet",
    tasks: {
      emma: ["Rydde rommet", "Henge opp klær"],
      oliver: ["Tømme oppvaskmaskin", "Lufte hunden"],
      liam: ["Dekke bordet", "Sortere søppel"],
    },
    faq: [
      {
        sporsmal: "Hva koster det?",
        svar: "Ingenting. Ukepenger er gratis å bruke, og vi har ingen planer om å ta betalt. Du trenger ikke kredittkort, og det finnes ingen prøveperiode som går ut.",
      },
      {
        sporsmal: "Må barna ha egen konto, e-post eller passord?",
        svar: "Nei. Barna logger ikke inn i det hele tatt. Du kobler til en enhet – for eksempel en iPad på kjøkkenet – ved å skanne en QR-kode én gang. Etter det velger barnet bare profilen sin.",
      },
      {
        sporsmal: "Flyttes det ekte penger gjennom appen?",
        svar: "Nei. Ukepenger er et regnskap, ikke en lommebok. Appen er ikke koblet til bank, kort eller betalingsløsning. Når du registrerer en utbetaling, noterer du bare hvordan dere gjorde opp i virkeligheten – Vipps, kontant eller bank.",
      },
      {
        sporsmal: "Hva lagrer dere om barnet mitt?",
        svar: "Fornavnet du skriver inn, avataren barnet velger, og det barnet gjør i appen: oppgaver, krav, beløp, sparing, utbetalinger, ønsker og trofeer. Vi spør aldri om fødselsdato, fødselsnummer, e-post, telefon eller adresse, og vi sporer ikke barnet – barnesiden har ingen statistikk eller analyse. Databasen ligger i Irland (EU). Les mer i personvernerklæringen.",
      },
      {
        sporsmal: "Hvor mange barn kan vi ha?",
        svar: "Så mange dere vil. Hvert barn får sin egen profil, sine egne oppgaver og sin egen saldo.",
      },
      {
        sporsmal: "Trenger vi en iPad?",
        svar: "Nei. Ukepenger kjører i nettleseren, så det virker på nettbrett, mobil eller PC. En gammel iPad eller telefon som ligger fremme hjemme fungerer fint som familiens felles enhet.",
      },
    ] as Faq[],
  },
  en: {
    nav: { how: "How it works", family: "For the family", cost: "What it costs", faq: "Frequently asked questions", questions: "Questions" },
    login: "Log in",
    contact: "Contact us",
    privacy: "Privacy",
    terms: "Terms",
    home: "Ukepenger home",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menu: "Menu",
    toApp: "Go to the app",
    appShort: "App",
    getStarted: "Get started",
    free: "Free to use. No credit card needed.",
    eyebrow: "Pocket money, made simple",
    h1a: "Less nagging.",
    h1b: "More mastery.",
    lead: "Ukepenger makes it easy for children to take responsibility – and for parents to keep track.",
    startFamily: "Start with your family",
    seeHow: "See how it works",
    forFamilies: "For families who want a little less nagging day to day",
    done: "Done!",
    hi: (name: string) => `Hi, ${name}!`,
    yourTasks: "Your tasks",
    owed: "Yours to collect",
    left: (n: number) => `${n} left`,
    toGoal: (kr: number) => `${kr} kr to the next goal`,
    flowTitle: "From task to mastery.",
    flowLead: "A simple flow that makes it clear to everyone who does what – and what it's worth.",
    step1: "1 · YOU CREATE THE TASK",
    newTask: "New task",
    saveTask: "Save task",
    parentPhone: "Parent's phone",
    chooseProfile: "Choose profile",
    step2: "2 · The child's or family's iPad",
    scanOnce: "Scan a QR code once to connect",
    step3: "3 · YOU APPROVE",
    childDid: (name: string) => `${name} has done a task`,
    now: "now",
    owedPlus: (kr: number) => `+ ${kr} kr to collect`,
    approve: "Approve request",
    oneQr: "One QR code.",
    noPasswords: "No usernames or passwords for the kids.",
    familyEyebrow: "Built for the whole family",
    familyTitle: "Responsibility for the kids. Overview for the parents.",
    familyLead: "Ukepenger gives children a clear path from effort to reward, while parents no longer have to keep track of everything in their heads.",
    values: [
      { title: "Clear for your child", description: "Your child sees what needs doing, what each task is worth, and how much they have to collect right now." },
      { title: "An overview for you", description: "Requests, balances and payouts for all your children in one place – instead of keeping the accounts in your head." },
      { title: "Something to save for", description: "A wish list and savings goals give the money a purpose, not just a sum sitting and waiting." },
    ],
    costTitle: "Nothing.",
    costLead: "Ukepenger is free, and we have no plans to charge. No trial period that runs out, no features that suddenly require an upgrade.",
    costPoints: ["No credit card", "As many children as you like", "No ads or tracking"],
    faqTitle: "What parents ask.",
    faqMore: "Anything else you're wondering about?",
    writeUs: "Write to us",
    ctaEyebrow: "A simpler week starts here",
    ctaTitle: "Let pocket money sort itself out a little more.",
    ctaLead: "Your child does the work on their device. You stay in control on your phone. The rest just flows.",
    madeFor: "Made for family life",
    tasks: {
      emma: ["Tidy the room", "Hang up clothes"],
      oliver: ["Empty the dishwasher", "Walk the dog"],
      liam: ["Set the table", "Sort the rubbish"],
    },
    faq: [
      {
        sporsmal: "What does it cost?",
        svar: "Nothing. Ukepenger is free to use, and we have no plans to charge. You don't need a credit card, and there is no trial period that runs out.",
      },
      {
        sporsmal: "Do the children need their own account, email or password?",
        svar: "No. Children don't log in at all. You connect a device – for example an iPad in the kitchen – by scanning a QR code once. After that, your child just picks their profile.",
      },
      {
        sporsmal: "Does real money move through the app?",
        svar: "No. Ukepenger is a ledger, not a wallet. The app isn't connected to any bank, card or payment service. When you record a payout, you simply note how you settled up in real life – Vipps, cash or bank transfer.",
      },
      {
        sporsmal: "What do you store about my child?",
        svar: "The first name you enter, the avatar your child picks, and what your child does in the app: tasks, requests, amounts, savings, payouts, wishes and trophies. We never ask for date of birth, national ID number, email, phone or address, and we don't track your child – the children's page has no statistics or analytics. The database is in Ireland (EU). Read more in the privacy policy.",
      },
      {
        sporsmal: "How many children can we have?",
        svar: "As many as you like. Each child gets their own profile, their own tasks and their own balance.",
      },
      {
        sporsmal: "Do we need an iPad?",
        svar: "No. Ukepenger runs in the browser, so it works on tablets, phones and computers. An old iPad or phone lying around at home works fine as the family's shared device.",
      },
    ] as Faq[],
  },
  uk: {
    nav: { how: "Як це працює", family: "Для родини", cost: "Скільки коштує", faq: "Часті запитання", questions: "Запитання" },
    login: "Увійти",
    contact: "Напишіть нам",
    privacy: "Конфіденційність",
    terms: "Умови",
    home: "Ukepenger – на головну",
    openMenu: "Відкрити меню",
    closeMenu: "Закрити меню",
    menu: "Меню",
    toApp: "Перейти до застосунку",
    appShort: "Застосунок",
    getStarted: "Почати",
    free: "Безкоштовно. Банківська картка не потрібна.",
    eyebrow: "Кишенькові гроші – просто",
    h1a: "Менше нагадувань.",
    h1b: "Більше успіхів.",
    lead: "Ukepenger допомагає дітям брати на себе відповідальність, а батькам – мати все під контролем.",
    startFamily: "Почати з родиною",
    seeHow: "Подивитися, як це працює",
    forFamilies: "Для родин, які хочуть менше нагадувань у буднях",
    done: "Готово!",
    hi: (name: string) => `Привіт, ${name}!`,
    yourTasks: "Твої завдання",
    owed: "Тобі належить",
    left: (n: number) => `Ще ${n}`,
    toGoal: (kr: number) => `${kr} kr до наступної цілі`,
    flowTitle: "Від завдання до успіху.",
    flowLead: "Простий процес, у якому всім зрозуміло, хто що робить – і скільки це коштує.",
    step1: "1 · ВИ СТВОРЮЄТЕ ЗАВДАННЯ",
    newTask: "Нове завдання",
    saveTask: "Зберегти завдання",
    parentPhone: "Телефон батьків",
    chooseProfile: "Оберіть профіль",
    step2: "2 · iPad дитини або родини",
    scanOnce: "Один раз скануйте QR-код, щоб підключити",
    step3: "3 · ВИ СХВАЛЮЄТЕ",
    childDid: (name: string) => `${name}: завдання виконано`,
    now: "щойно",
    owedPlus: (kr: number) => `+ ${kr} kr належить`,
    approve: "Схвалити запит",
    oneQr: "Один QR-код.",
    noPasswords: "Жодних логінів чи паролів для дітей.",
    familyEyebrow: "Створено для всієї родини",
    familyTitle: "Відповідальність для дітей. Огляд для батьків.",
    familyLead: "Ukepenger дає дітям зрозумілий шлях від зусиль до винагороди, а батькам більше не треба тримати все в голові.",
    values: [
      { title: "Зрозуміло для дитини", description: "Дитина бачить, що треба зробити, скільки коштує кожне завдання і скільки їй належить просто зараз." },
      { title: "Огляд для вас", description: "Запити, баланси й виплати всіх дітей в одному місці – замість того, щоб тримати облік у голові." },
      { title: "Є на що заощаджувати", description: "Список бажань і цілі заощаджень дають грошам мету, а не просто суму, що лежить і чекає." },
    ],
    costTitle: "Нічого.",
    costLead: "Ukepenger безкоштовний, і ми не плануємо брати плату. Жодного пробного періоду, що закінчується, жодних функцій, які раптом вимагають платного тарифу.",
    costPoints: ["Без банківської картки", "Скільки завгодно дітей", "Без реклами й відстеження"],
    faqTitle: "Що питають батьки.",
    faqMore: "Маєте інше запитання?",
    writeUs: "Напишіть нам",
    ctaEyebrow: "Простіший тиждень починається тут",
    ctaTitle: "Нехай кишенькові гроші рахуються майже самі.",
    ctaLead: "Дитина виконує завдання на своєму пристрої. Ви все контролюєте з телефона. Решта йде сама собою.",
    madeFor: "Створено для родинного життя",
    tasks: {
      emma: ["Прибрати кімнату", "Повісити одяг"],
      oliver: ["Розвантажити посудомийку", "Вигуляти собаку"],
      liam: ["Накрити на стіл", "Сортувати сміття"],
    },
    faq: [
      {
        sporsmal: "Скільки це коштує?",
        svar: "Нічого. Ukepenger безкоштовний, і ми не плануємо брати плату. Банківська картка не потрібна, і немає пробного періоду, який закінчується.",
      },
      {
        sporsmal: "Чи потрібні дітям власний акаунт, е-пошта або пароль?",
        svar: "Ні. Діти взагалі не входять в акаунт. Ви один раз підключаєте пристрій – наприклад, iPad на кухні – скануванням QR-коду. Після цього дитина просто обирає свій профіль.",
      },
      {
        sporsmal: "Чи проходять через застосунок справжні гроші?",
        svar: "Ні. Ukepenger – це облік, а не гаманець. Застосунок не підключений до банку, картки чи платіжного сервісу. Коли ви записуєте виплату, ви лише позначаєте, як розрахувалися насправді – через Vipps, готівкою чи банківським переказом.",
      },
      {
        sporsmal: "Що ви зберігаєте про мою дитину?",
        svar: "Ім’я, яке ви вводите, аватар, який обирає дитина, і те, що дитина робить у застосунку: завдання, запити, суми, заощадження, виплати, бажання й трофеї. Ми ніколи не запитуємо дату народження, особистий номер, е-пошту, телефон чи адресу і не відстежуємо дитину – дитяча сторінка не має статистики чи аналітики. База даних розташована в Ірландії (ЄС). Докладніше – у політиці конфіденційності.",
      },
      {
        sporsmal: "Скільки дітей можна додати?",
        svar: "Скільки забажаєте. Кожна дитина отримує власний профіль, власні завдання й власний баланс.",
      },
      {
        sporsmal: "Чи потрібен нам iPad?",
        svar: "Ні. Ukepenger працює в браузері, тож підходить планшет, телефон чи комп’ютер. Старий iPad або телефон, що лежить удома, чудово підійде як спільний пристрій родини.",
      },
    ] as Faq[],
  },
};

type T = (typeof TEXT)["nb"];

// Brukes også av testforsidene under /ny-forside (de er bare på norsk).
export const sporsmal = TEXT.nb.faq;

const menyLenker = (t: T) => [
  { href: "#slik-fungerer-det", label: t.nav.how, nummer: "01" },
  { href: "#for-familien", label: t.nav.family, nummer: "02" },
  { href: "#hva-koster-det", label: t.nav.cost, nummer: "03" },
  { href: "#sporsmal", label: t.nav.faq, nummer: "04" },
];

const hjelpeLenker = (t: T) => [
  { href: "/login", label: t.login, intern: true },
  { href: "/kontakt", label: t.contact, intern: true },
  { href: "/personvern", label: t.privacy, intern: true },
];

const verdiIkoner = [ListChecks, Wallet, PiggyBank];

const barnData = [
  { id: "emma", navn: "Emma", initial: "E", avatarClass: "avatarCoral", tilGode: 125, igjen: 2, maal: 75, belop: [25, 10] },
  { id: "oliver", navn: "Oliver", initial: "O", avatarClass: "avatarBlue", tilGode: 80, igjen: 3, maal: 120, belop: [20, 15] },
  { id: "liam", navn: "Liam", initial: "L", avatarClass: "avatarYellow", tilGode: 45, igjen: 1, maal: 55, belop: [10, 15] },
] as const;

function barnFor(t: T, lang: Lang) {
  return barnData.map((b) => ({
    ...b,
    tilGode: formatKr(b.tilGode * 100, lang),
    igjen: t.left(b.igjen),
    maal: t.toGoal(b.maal),
    oppgaver: t.tasks[b.id].map((tittel, i) => ({
      tittel,
      belop: `+ ${formatKr(b.belop[i] * 100, lang)}`,
      ikon: i === 0 ? Sparkles : Star,
      fremhevet: i === 0,
    })),
  }));
}

function Logo({ label }: { label: string }) {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label={label}>
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

function FamilyFlow({ t, barn }: { t: T; barn: ReturnType<typeof barnFor> }) {
  const [aktivId, setAktivId] = useState<string>(barn[0].id);
  const aktivt = barn.find((b) => b.id === aktivId) ?? barn[0];

  return (
    <section id="slik-fungerer-det" className="overflow-hidden border-y border-border bg-secondary/45 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className={`${styles.eyebrow} justify-center`}>{t.nav.how}</p>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.07em] text-foreground sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
            {t.flowTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            {t.flowLead}
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center justify-center gap-6 lg:flex-row lg:items-center lg:gap-4">
          <div className={`${styles.flowStep} w-full max-w-[260px]`}>
            <div className={styles.flowCard}>
              <div className="flex items-center justify-between">
                <span className={styles.miniLabel}>{t.step1}</span>
                <span className={styles.statusDot} />
              </div>
              <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
                <p className="text-xs font-semibold text-muted-foreground">{t.newTask}</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{barn[0].oppgaver[0].tittel}</p>
                    <p className="text-xs text-muted-foreground">{barn[0].oppgaver[0].belop}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-primary px-3 py-2 text-center text-xs font-bold text-primary-foreground">{t.saveTask}</div>
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

                <div className="mt-5 flex justify-center gap-2" role="group" aria-label={t.chooseProfile}>
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
                  <p className="text-[10px] font-semibold text-muted-foreground">{t.hi(aktivt.navn)}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>{t.yourTasks}</p>
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
                  <p className="text-[9px] font-medium opacity-80">{t.owed}</p>
                  <p className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>{aktivt.tilGode}</p>
                </div>
              </div>
            </Device>
            <span className={styles.flowCaption}>{t.step2}</span>
            <span className={styles.qrBadge}>
              <span className={styles.qrBadgeIcon}>
                <QrCode className="size-4" />
                <span className={styles.qrBadgeBeam} />
              </span>
              <span className={styles.qrBadgeText}>{t.scanOnce}</span>
            </span>
          </div>

          <FlowConnector />

          <div className={`${styles.flowStep} w-full max-w-[260px]`}>
            <div className={styles.flowCard}>
              <div className="flex items-center justify-between">
                <span className={styles.miniLabel}>{t.step3}</span>
                <span className={styles.statusDot} />
              </div>
              <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
                <div className="flex items-center gap-2">
                  <span className={`${styles.avatar} ${styles.avatarCoral} size-8 text-xs`}>E</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{t.childDid(barn[0].navn)}</p>
                    <p className="text-[10px] text-muted-foreground">{barn[0].oppgaver[0].tittel} · {t.now}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-accent px-3 py-3">
                  <span className="text-xs font-bold text-accent-foreground">{t.owedPlus(25)}</span>
                  <CheckCircle2 className="size-4 shrink-0 text-accent-foreground" />
                </div>
                <div className="mt-3 rounded-xl bg-primary px-3 py-2 text-center text-xs font-bold text-primary-foreground">{t.approve}</div>
              </div>
            </div>
            <span className={styles.flowCaption}>Forelderens mobil</span>
          </div>
        </div>

        <div className="mx-auto mt-14 flex max-w-2xl items-center justify-center gap-3 rounded-2xl bg-card px-4 py-4 text-center shadow-sm ring-1 ring-border sm:gap-4 sm:px-6">
          <QrCode className="size-5 shrink-0 text-primary" />
          <p className="text-sm leading-5 text-muted-foreground">
            <span className="font-bold text-foreground">{t.oneQr}</span> {t.noPasswords}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function LandingClient() {
  const t = useText(TEXT);
  const lang = useLang();
  const barn = barnFor(t, lang);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const knapp = toggleRef.current;
    const forrigeOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Menyflaten er visibility:hidden til overgangen starter, og et skjult
    // element kan ikke fa fokus. Venter derfor en frame.
    const fokusFrame = requestAnimationFrame(() => {
      sheetRef.current?.querySelector("a")?.focus();
    });

    // Menyen er aria-modal, sa tabbing skal ga i ring mellom knappen og
    // innholdet i stedet for a havne pa siden bak, som er dekket til.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (e.key !== "Tab" || !knapp || !sheetRef.current) return;

      const fokuserbare = [knapp, ...sheetRef.current.querySelectorAll<HTMLElement>("a, button")];
      const forste = fokuserbare[0];
      const siste = fokuserbare[fokuserbare.length - 1];

      if (e.shiftKey && document.activeElement === forste) {
        e.preventDefault();
        siste.focus();
      } else if (!e.shiftKey && document.activeElement === siste) {
        e.preventDefault();
        forste.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(fokusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = forrigeOverflow;
      knapp?.focus();
    };
  }, [menuOpen]);

  const heroBarn = barn[0];

  // Innlogget forelder ser «Gå til appen» i stedet for «Logg inn».
  const [loggedIn, setLoggedIn] = useState(false);
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
  const appLabel = loggedIn ? t.toApp : t.login;

  return (
    <main id="top" className={`${styles.landingPage} min-h-screen`}>
      {/* Ligger over menyflaten, sa logo og knapp blir staende i ro nar
          menyen apnes i stedet for a bli dekket til. */}
      <nav className="relative z-[60] mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Logo label={t.home} />
        <div className="hidden items-center gap-7 md:flex">
          <a href="#slik-fungerer-det" className={styles.navLink}>{t.nav.how}</a>
          <a href="#hva-koster-det" className={styles.navLink}>{t.nav.cost}</a>
          <a href="#sporsmal" className={styles.navLink}>{t.nav.questions}</a>
          {!loggedIn && <Link href="/login" className={styles.navLink}>{t.login}</Link>}
          <LanguageSwitcher className="-mx-2" />
          <Link href={appHref} className={styles.buttonPrimary}>
            {loggedIn ? t.toApp : t.getStarted} <ArrowRight className="size-4" />
          </Link>
        </div>
        <LanguageSwitcher className={`md:hidden ${loggedIn ? "ml-auto mr-1" : "ml-auto mr-2"}`} />
        {loggedIn && (
          <Link href="/admin/inbox" aria-label={t.toApp} className={`${styles.buttonPrimary} mr-2 !min-h-11 !gap-1.5 !px-3.5 text-sm md:hidden`}>
            {t.appShort} <ArrowRight className="size-4" />
          </Link>
        )}
        <button
          ref={toggleRef}
          type="button"
          className={`${styles.menuToggle} ${menuOpen ? styles.menuToggleOpen : ""} md:hidden`}
          onClick={() => setMenuOpen((apen) => !apen)}
          aria-label={menuOpen ? t.closeMenu : t.openMenu}
          aria-expanded={menuOpen}
          aria-controls="mobilmeny"
        >
          <span className={`${styles.menuBar} ${styles.menuBarTop}`} />
          <span className={`${styles.menuBar} ${styles.menuBarBottom}`} />
        </button>
      </nav>

      <div
        id="mobilmeny"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.menu}
        className={`${styles.menuSheet} ${menuOpen ? styles.menuSheetOpen : ""} md:hidden`}
      >
        <nav className="flex flex-col gap-1 px-4">
          {menyLenker(t).map((lenke) => (
            <a key={lenke.href} href={lenke.href} className={styles.menuItem} onClick={() => setMenuOpen(false)}>
              <span className={styles.menuItemNumber}>{lenke.nummer}</span>
              {lenke.label}
            </a>
          ))}
        </nav>

        {/* Andre niva: det folk leter etter nar de trenger det, ikke det vi
            vil at de skal gjore. Derfor mindre og gratt, ikke store lenker. */}
        <div className={`${styles.menuFooter} mt-auto flex flex-wrap gap-x-6 gap-y-2 px-5 pb-6`}>
          {hjelpeLenker(t).map((lenke) =>
            lenke.intern ? (
              <Link key={lenke.href} href={lenke.href === "/login" ? appHref : lenke.href} className={styles.menuHelpLink} onClick={() => setMenuOpen(false)}>
                {lenke.href === "/login" ? appLabel : lenke.label}
              </Link>
            ) : (
              <a key={lenke.href} href={lenke.href} className={styles.menuHelpLink} onClick={() => setMenuOpen(false)}>
                {lenke.label}
              </a>
            )
          )}
        </div>

        <div className={`${styles.menuFooter} border-t border-border px-5 pb-10 pt-6`}>
          <Link href={appHref} className={`${styles.buttonPrimary} w-full justify-center`} onClick={() => setMenuOpen(false)}>
            {loggedIn ? t.toApp : t.getStarted} <ArrowRight className="size-4" />
          </Link>
          <p className="mt-3 text-center text-sm text-muted-foreground">{t.free}</p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="max-w-xl">
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} /> {t.eyebrow}
            </div>
            <h1
              className="mt-5 text-balance text-[clamp(2.5rem,5.5vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.08em] text-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t.h1a}
              <br />
              <span className="text-primary">{t.h1b}</span>
            </h1>
            <p className="mt-7 max-w-md text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              {t.lead}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={appHref} className={`${styles.buttonPrimary} justify-center`}>
                {loggedIn ? t.toApp : t.startFamily} <ArrowRight className="size-4" />
              </Link>
              <a href="#slik-fungerer-det" className={`${styles.buttonSecondary} justify-center`}>
                {t.seeHow} <ChevronDown className="size-4" />
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t.free}</p>
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {barn.map((b) => (
                  <span key={b.id} className={`${styles.avatar} ${styles[b.avatarClass]} border-2 border-background`}>
                    {b.initial}
                  </span>
                ))}
              </div>
              <span>{t.forFamilies}</span>
            </div>
          </div>

          <div className={`${styles.heroVisual} relative mx-auto w-full max-w-xl`}>
            <div className={`${styles.heroNote} ${styles.heroNoteTop}`}>
              <Sparkles className="size-4" /> {t.done}
            </div>
            <div className={`${styles.heroNote} ${styles.heroNoteBottom}`}>
              <Coins className="size-4" /> {barn[0].oppgaver[0].belop}
            </div>
            <div className={styles.heroBlob} />
            <Device type="tablet">
              <div className="h-full bg-card px-5 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)" }}>ukepenger</span>
                  <span className="text-[10px] text-muted-foreground">09:41</span>
                </div>
                <div className="mt-7">
                  <p className="text-xs font-semibold text-muted-foreground">{t.hi(heroBarn.navn)}</p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>{t.yourTasks}</h3>
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
                  <p className="text-[10px] font-medium opacity-80">{t.owed}</p>
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

      <FamilyFlow key={lang} t={t} barn={barn} />

      <section id="for-familien" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-end">
          <div>
            <p className={styles.eyebrow}>{t.familyEyebrow}</p>
            <h2 className="mt-4 max-w-lg text-balance text-3xl font-bold tracking-[-0.07em] sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
              {t.familyTitle}
            </h2>
          </div>
          <p className="max-w-md text-pretty text-lg leading-8 text-muted-foreground">
            {t.familyLead}
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {t.values.map((verdi, i) => {
            const Icon = verdiIkoner[i];
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

      <section id="hva-koster-det" className="border-y border-border bg-secondary/45 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <p className={`${styles.eyebrow} justify-center`}>{t.nav.cost}</p>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.07em] sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
            {t.costTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
            {t.costLead}
          </p>
          <ul className="mx-auto mt-10 grid gap-3 text-left sm:grid-cols-3">
            {t.costPoints.map((punkt) => (
              <li key={punkt} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-sm font-semibold shadow-sm ring-1 ring-border">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </span>
                {punkt}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="sporsmal" className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="text-center">
          <p className={`${styles.eyebrow} justify-center`}>{t.nav.faq}</p>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.07em] sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
            {t.faqTitle}
          </h2>
        </div>
        {/* <details> gir apning/lukking og skjermlesersto/tastatur uten JS. */}
        <div className="mt-12 space-y-3">
          {t.faq.map((post) => (
            <details key={post.sporsmal} className={styles.faqItem}>
              <summary className={styles.faqSummary}>
                {post.sporsmal}
                <ChevronDown className={`${styles.faqChevron} size-5 shrink-0`} />
              </summary>
              <p className="px-5 pb-5 text-[0.9375rem] leading-7 text-muted-foreground">{post.svar}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t.faqMore}{" "}
          <Link href="/kontakt" className="font-semibold text-foreground underline underline-offset-4">
            {t.writeUs}
          </Link>
          .
        </p>
      </section>

      <section className="mx-5 mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:mx-8 sm:px-12 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] opacity-80" style={{ fontFamily: "var(--font-mono)" }}>{t.ctaEyebrow}</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-bold tracking-[-0.07em] sm:text-5xl" style={{ fontFamily: "var(--font-mono)" }}>
          {t.ctaTitle}
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-pretty leading-7 opacity-90">
          {t.ctaLead}
        </p>
        <Link href={appHref} className={`${styles.buttonLight} mx-auto mt-8`}>
          {loggedIn ? t.toApp : t.getStarted} <ArrowRight className="size-4" />
        </Link>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo label={t.home} />
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href={appHref} className={styles.navLink}>{appLabel}</Link>
            <Link href="/kontakt" className={styles.navLink}>{t.contact}</Link>
            <Link href="/personvern" className={styles.navLink}>{t.privacy}</Link>
            <Link href="/vilkar" className={styles.navLink}>{t.terms}</Link>
          </div>
          <span>© 2026 Ukepenger.no · {t.madeFor}</span>
        </div>
      </footer>
    </main>
  );
}
