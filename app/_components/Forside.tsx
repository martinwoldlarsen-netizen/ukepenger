"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Bell, Check, ChevronDown, Coins, Heart, Lock, Menu, PiggyBank, ShieldCheck, Wallet, X } from "lucide-react";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/lib/supabaseClient";
import { useText } from "@/lib/use-lang";
import styles from "./Forside.module.css";

// Forsiden (tidligere testversjon 2): stort kjøkkenbilde øverst, «klistremerker»
// på nøkkelord, rullende bildestripe, fargede blokker, skjermopptak av appen og
// ting som glir inn når man scroller. På norsk, engelsk og ukrainsk.

const LIME = "#D4F56C";
const BLAA = "#9CC8FF";

const STRIPE_SRC = ["/forside/stripe-soppel.webp", "/forside/stripe-oppvask.webp", "/forside/topp-tur.webp", "/forside/stripe-seng.webp", "/forside/stripe-sparegris.webp"];

const SKJERM_SRC: Array<{ src: string; video?: string }> = [
  { src: "/forside/barn-velg.webp" },
  { src: "/forside/barn-oppgaver.webp" },
  { src: "/forside/app-barn-poster.webp", video: "/forside/app-barn.mp4" },
  { src: "/forside/app-forelder-poster.webp", video: "/forside/app-forelder.mp4" },
  { src: "/forside/barn-trofeer.webp" },
  { src: "/forside/barn-onsker.webp" },
];

const GJENG = ["pusi", "raptor", "skyvalp", "robot", "drage", "astronaut", "hubro"];

type Faq = { q: string; a: string };

const TEXT = {
  nb: {
    how: "Slik virker det",
    questions: "Spørsmål",
    login: "Logg inn",
    toApp: "Gå til appen",
    start: "Kom i gang",
    openMenu: "Åpne meny",
    closeMenu: "Lukk meny",
    heroA: "Oppgavene blir",
    heroDone: "gjort.",
    heroB: "Uten",
    heroNag: "mas.",
    heroLead: "Barna trykker «Jeg har gjort det!». Du godkjenner på mobilen. Pengene holder appen styr på.",
    startFree: "Kom i gang – gratis",
    rotate: ["Barna trenger ingen konto", "Godkjenn med ett trykk", "Ekte kroner – ingen poeng", "Gratis for hele familien"],
    heroAlt: "Jente dekker bordet i kveldssola mens mamma lager middag",
    chip: "Dekke bordet · +10 kr",
    phoneAlt: "Skjermopptak: Emma trykker «Jeg har gjort det!» og får konfetti",
    s2: ["Små oppgaver.", "Ekte kroner.", "Stolte barn."],
    s2Text: "Du velger oppgavene og hva de er verdt. Barna ser alt på en iPad eller mobil hjemme, og trykker når de er ferdige. Du får et varsel og godkjenner med ett trykk. Dere betaler ut som før – med Vipps eller kontant.",
    steps: ["Velg oppgaver og beløp", "Barnet trykker «Ferdig»", "Du godkjenner"],
    stripeLabel: "Bilder fra hverdagen",
    stripeAlt: ["Gutt bærer søppelposen ut", "Søsken tømmer oppvaskmaskinen", "Jente går tur med hunden", "Barn rer opp sengen", "Barn putter en mynt i sparegrisen"],
    who: ["Hvem blir ", "du", "?"],
    whoText: "Hvert barn velger sin egen figur – og samler trofeer, merker og uker på rad. Bygget for mestring, uten straff eller sammenligning med søsken.",
    blueTitle: "Slutt å holde regnskapet i hodet.",
    notifFrom: "Ukepenger · nå",
    notif: "Oliver har tatt ut søppel · 10 kr",
    features: [
      ["Varsel når noe er gjort", "Godkjenn eller avslå med ett trykk, når det passer deg."],
      ["Betal ut når du vil", "Hele beløpet eller en del – appen husker resten."],
      ["Sparing av seg selv", "F.eks. 10 % av alt barnet tjener går rett i sparegrisen."],
      ["Faste ukepenger", "Legges til automatisk hver uke, på dagen dere velger."],
    ],
    seeApp: ["Se ", "appen", ""],
    seeAppSub: "Ekte skjermopptak. Demofamilie med påfunne navn.",
    screens: [
      ["Barnet velger seg selv", "Ingen konto eller passord for barna."],
      ["Oppgaver med bilder", "Barna ser hva de kan gjøre og hva det er verdt."],
      ["«Jeg har gjort det!»", "Et trykk, og en liten feiring."],
      ["Du godkjenner", "Varsel på mobilen. Ett trykk – eller «Godkjenn alle»."],
      ["Trofeer og merker", "Framgang og uker på rad – uten straff."],
      ["Ønskebutikken", "Pengene får et mål."],
    ],
    carousel: "karusell",
    prev: "Forrige",
    next: "Neste",
    peachTitle: "Laget med barn i tankene.",
    peachText: "Barna har ingen konto – bare fornavn og en figur. Appen er et regnskap, ikke en bank: den flytter aldri penger.",
    safe: [
      ["Ingen konto for barna", "Bare fornavn og en figur."],
      ["Ingen reklame", "Og ingen sporing på barnesiden."],
      ["Uten mas og press", "Ingen lootbokser eller rangering."],
      ["Ekte kroner", "Ingen poeng eller spillpenger."],
    ],
    chips: ["Ingen konto for barna", "Ingen reklame", "Ingen sporing av barna", "Ingen lootbokser", "Ingen rangering av søsken", "Data lagres i EU", "Ekte kroner", "Slett alt når du vil"],
    faqTitle: "Det foreldre lurer på",
    faq: [
      { q: "Hva koster det?", a: "Ukepenger er gratis å bruke. Du trenger ikke kredittkort, og det finnes ingen prøveperiode som går ut." },
      { q: "Må barna ha egen konto, e-post eller passord?", a: "Nei. Barna logger ikke inn i det hele tatt. Du kobler til en enhet – for eksempel en iPad på kjøkkenet – ved å skanne en QR-kode én gang. Etter det velger barnet bare profilen sin. Vil et barn ha sin egen telefon, kan du lage en egen QR-kode for barnet, og gi profilen en kode." },
      { q: "Flyttes det ekte penger gjennom appen?", a: "Nei. Ukepenger er et regnskap, ikke en lommebok. Appen er ikke koblet til bank, kort eller betalingsløsning. Når du registrerer en utbetaling, noterer du bare hvordan dere gjorde opp i virkeligheten – Vipps, kontant eller bank." },
      { q: "Hva lagrer dere om barnet mitt?", a: "Fornavnet du skriver inn, figuren barnet velger, og det barnet gjør i appen: oppgaver, krav, beløp, sparing, utbetalinger, ønsker og trofeer. Vi spør aldri om fødselsdato, fødselsnummer, e-post, telefon eller adresse, og vi sporer ikke barnet – barnesiden har ingen statistikk eller analyse. Databasen ligger i Irland (EU). Les mer i personvernerklæringen." },
      { q: "Hvor mange barn kan vi ha?", a: "Så mange dere vil. Hvert barn får sin egen profil, sine egne oppgaver og sin egen saldo – og kan få egen lønn for oppgavene." },
      { q: "Trenger vi en iPad?", a: "Nei. Ukepenger kjører i nettleseren, så det virker på nettbrett, mobil eller PC. En gammel iPad eller telefon som ligger fremme hjemme fungerer fint som familiens felles enhet." },
      { q: "Kan besteforeldre være med?", a: "Ja. Besteforeldre, tanter og gudforeldre kan få en egen lenke. De ser hva barna sparer til, og kan gi en gave på Vipps til ønsket – dere godkjenner før den legges til. De kan ikke endre noe." },
    ] as Faq[],
    faqMore: "Noe annet du lurer på?",
    writeUs: "Skriv til oss",
    finalTitle: ["Klar for en uke med ", "mindre mas", "?"],
    finalSub: "Gratis. Ingen kredittkort. Oppe og går på fem minutter.",
    contact: "Kontakt oss",
    privacy: "Personvern",
    terms: "Vilkår",
    about: "Om oss",
  },
  en: {
    how: "How it works",
    questions: "Questions",
    login: "Log in",
    toApp: "Go to the app",
    start: "Get started",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    heroA: "Chores get",
    heroDone: "done.",
    heroB: "Without",
    heroNag: "nagging.",
    heroLead: "The kids tap “I did it!”. You approve on your phone. The app keeps track of the money.",
    startFree: "Get started – free",
    rotate: ["Kids don't need an account", "Approve with one tap", "Real kroner – no points", "Free for the whole family"],
    heroAlt: "A girl sets the table in the evening sun while her mum makes dinner",
    chip: "Set the table · +10 kr",
    phoneAlt: "Screen recording: Emma taps “I did it!” and gets confetti",
    s2: ["Small tasks.", "Real kroner.", "Proud kids."],
    s2Text: "You choose the tasks and what they're worth. The kids see everything on an iPad or phone at home, and tap when they're done. You get a notification and approve with one tap. You pay out as before – with Vipps or cash.",
    steps: ["Choose tasks and amounts", "Your child taps “Done”", "You approve"],
    stripeLabel: "Pictures from everyday life",
    stripeAlt: ["A boy carries the rubbish bag out", "Siblings empty the dishwasher", "A girl walks the dog", "A child makes the bed", "A child puts a coin in the piggy bank"],
    who: ["Who will ", "you", " be?"],
    whoText: "Each child picks their own character – and collects trophies, badges and weeks in a row. Built for mastery, without punishment or comparing siblings.",
    blueTitle: "Stop keeping the accounts in your head.",
    notifFrom: "Ukepenger · now",
    notif: "Oliver took out the rubbish · 10 kr",
    features: [
      ["A notification when something's done", "Approve or reject with one tap, when it suits you."],
      ["Pay out when you like", "The whole amount or part of it – the app remembers the rest."],
      ["Saving on autopilot", "E.g. 10 % of everything your child earns goes straight into the piggy bank."],
      ["Fixed pocket money", "Added automatically every week, on the day you choose."],
    ],
    seeApp: ["See the ", "app", ""],
    seeAppSub: "Real screen recordings from the Norwegian app. A demo family with made-up names.",
    screens: [
      ["The child picks themselves", "No account or password for the kids."],
      ["Tasks with pictures", "The kids see what they can do and what it's worth."],
      ["“I did it!”", "One tap, and a little celebration."],
      ["You approve", "A notification on your phone. One tap – or “Approve all”."],
      ["Trophies and badges", "Progress and weeks in a row – without punishment."],
      ["The wish shop", "The money gets a goal."],
    ],
    carousel: "carousel",
    prev: "Previous",
    next: "Next",
    peachTitle: "Made with children in mind.",
    peachText: "Children have no account – just a first name and a character. The app is a ledger, not a bank: it never moves money.",
    safe: [
      ["No account for the kids", "Just a first name and a character."],
      ["No ads", "And no tracking on the children's page."],
      ["No nagging or pressure", "No loot boxes or rankings."],
      ["Real kroner", "No points or play money."],
    ],
    chips: ["No account for kids", "No ads", "No tracking of children", "No loot boxes", "No ranking of siblings", "Data stored in the EU", "Real kroner", "Delete everything whenever you like"],
    faqTitle: "What parents ask",
    faq: [
      { q: "What does it cost?", a: "Ukepenger is free to use. You don't need a credit card, and there's no trial period that runs out." },
      { q: "Do the children need their own account, email or password?", a: "No. Children don't log in at all. You connect a device – for example an iPad in the kitchen – by scanning a QR code once. After that, your child just picks their profile. If a child wants their own phone, you can make a QR code just for them, and give the profile a code." },
      { q: "Does real money move through the app?", a: "No. Ukepenger is a ledger, not a wallet. The app isn't connected to any bank, card or payment service. When you record a payout, you simply note how you settled up in real life – Vipps, cash or bank transfer." },
      { q: "What do you store about my child?", a: "The first name you enter, the character your child picks, and what your child does in the app: tasks, requests, amounts, savings, payouts, wishes and trophies. We never ask for date of birth, national ID number, email, phone or address, and we don't track your child – the children's page has no statistics or analytics. The database is in Ireland (EU). Read more in the privacy policy." },
      { q: "How many children can we have?", a: "As many as you like. Each child gets their own profile, their own tasks and their own balance – and can get their own pay for the tasks." },
      { q: "Do we need an iPad?", a: "No. Ukepenger runs in the browser, so it works on tablets, phones and computers. An old iPad or phone lying around at home works fine as the family's shared device." },
      { q: "Can grandparents join in?", a: "Yes. Grandparents, aunts and godparents can get their own link. They see what the kids are saving for and can give a gift towards a wish via Vipps – you approve it before it's added. They can't change anything." },
    ] as Faq[],
    faqMore: "Anything else you're wondering about?",
    writeUs: "Write to us",
    finalTitle: ["Ready for a week with ", "less nagging", "?"],
    finalSub: "Free. No credit card. Up and running in five minutes.",
    contact: "Contact us",
    privacy: "Privacy",
    terms: "Terms",
    about: "About us",
  },
  uk: {
    how: "Як це працює",
    questions: "Запитання",
    login: "Увійти",
    toApp: "Перейти до застосунку",
    start: "Почати",
    openMenu: "Відкрити меню",
    closeMenu: "Закрити меню",
    heroA: "Завдання",
    heroDone: "виконано.",
    heroB: "Без",
    heroNag: "нагадувань.",
    heroLead: "Діти натискають «Готово!». Ви схвалюєте на телефоні. Застосунок веде облік грошей.",
    startFree: "Почати – безкоштовно",
    rotate: ["Дітям не потрібен акаунт", "Схвалення одним дотиком", "Справжні крони – без балів", "Безкоштовно для всієї родини"],
    heroAlt: "Дівчинка накриває на стіл у вечірньому сонці, поки мама готує вечерю",
    chip: "Накрити на стіл · +10 kr",
    phoneAlt: "Запис екрана: Емма натискає «Готово!» і отримує конфеті",
    s2: ["Маленькі завдання.", "Справжні крони.", "Горді діти."],
    s2Text: "Ви обираєте завдання і скільки вони коштують. Діти бачать усе на iPad чи телефоні вдома й натискають, коли закінчать. Ви отримуєте сповіщення і схвалюєте одним дотиком. Виплачуєте як і раніше – через Vipps або готівкою.",
    steps: ["Оберіть завдання й суми", "Дитина натискає «Готово»", "Ви схвалюєте"],
    stripeLabel: "Кадри з буднів",
    stripeAlt: ["Хлопчик виносить пакет зі сміттям", "Брат і сестра розвантажують посудомийку", "Дівчинка вигулює собаку", "Дитина застеляє ліжко", "Дитина кидає монетку в скарбничку"],
    who: ["Ким будеш ", "ти", "?"],
    whoText: "Кожна дитина обирає свого персонажа – і збирає трофеї, значки та тижні поспіль. Створено для успіхів, без покарань і порівнянь між братами й сестрами.",
    blueTitle: "Більше не тримайте облік у голові.",
    notifFrom: "Ukepenger · щойно",
    notif: "Олівер: сміття винесено · 10 kr",
    features: [
      ["Сповіщення, коли щось зроблено", "Схвалюйте чи відхиляйте одним дотиком, коли вам зручно."],
      ["Виплачуйте, коли захочете", "Усю суму або частину – застосунок пам’ятає решту."],
      ["Заощадження самі собою", "Напр. 10 % усього, що заробляє дитина, одразу йде в скарбничку."],
      ["Фіксовані кишенькові", "Додаються автоматично щотижня в обраний день."],
    ],
    seeApp: ["Подивіться ", "застосунок", ""],
    seeAppSub: "Справжні записи екрана з норвезької версії застосунку. Демородина з вигаданими іменами.",
    screens: [
      ["Дитина обирає себе", "Без акаунта й пароля для дітей."],
      ["Завдання з малюнками", "Діти бачать, що можна зробити і скільки це коштує."],
      ["«Готово!»", "Один дотик – і маленьке свято."],
      ["Ви схвалюєте", "Сповіщення на телефоні. Один дотик – або «Схвалити всі»."],
      ["Трофеї та значки", "Прогрес і тижні поспіль – без покарань."],
      ["Крамниця бажань", "Гроші отримують мету."],
    ],
    carousel: "карусель",
    prev: "Назад",
    next: "Далі",
    peachTitle: "Створено з думкою про дітей.",
    peachText: "Діти не мають акаунта – лише ім’я та персонажа. Застосунок – це облік, а не банк: він ніколи не переказує гроші.",
    safe: [
      ["Без акаунта для дітей", "Лише ім’я та персонаж."],
      ["Без реклами", "І без відстеження на дитячій сторінці."],
      ["Без тиску", "Без лутбоксів і рейтингів."],
      ["Справжні крони", "Без балів чи ігрових грошей."],
    ],
    chips: ["Без акаунта для дітей", "Без реклами", "Без відстеження дітей", "Без лутбоксів", "Без рейтингу між дітьми", "Дані зберігаються в ЄС", "Справжні крони", "Видаліть усе будь-коли"],
    faqTitle: "Що питають батьки",
    faq: [
      { q: "Скільки це коштує?", a: "Ukepenger безкоштовний. Банківська картка не потрібна, і немає пробного періоду, який закінчується." },
      { q: "Чи потрібні дітям власний акаунт, е-пошта або пароль?", a: "Ні. Діти взагалі не входять в акаунт. Ви один раз підключаєте пристрій – наприклад, iPad на кухні – скануванням QR-коду. Після цього дитина просто обирає свій профіль. Якщо дитина хоче власний телефон, можна створити QR-код лише для неї і захистити профіль кодом." },
      { q: "Чи проходять через застосунок справжні гроші?", a: "Ні. Ukepenger – це облік, а не гаманець. Застосунок не підключений до банку, картки чи платіжного сервісу. Коли ви записуєте виплату, ви лише позначаєте, як розрахувалися насправді – через Vipps, готівкою чи банківським переказом." },
      { q: "Що ви зберігаєте про мою дитину?", a: "Ім’я, яке ви вводите, персонажа, якого обирає дитина, і те, що дитина робить у застосунку: завдання, запити, суми, заощадження, виплати, бажання й трофеї. Ми ніколи не запитуємо дату народження, особистий номер, е-пошту, телефон чи адресу і не відстежуємо дитину – дитяча сторінка не має статистики чи аналітики. База даних розташована в Ірландії (ЄС). Докладніше – у політиці конфіденційності." },
      { q: "Скільки дітей можна додати?", a: "Скільки забажаєте. Кожна дитина отримує власний профіль, власні завдання й власний баланс – і може мати власну оплату за завдання." },
      { q: "Чи потрібен нам iPad?", a: "Ні. Ukepenger працює в браузері, тож підходить планшет, телефон чи комп’ютер. Старий iPad або телефон, що лежить удома, чудово підійде як спільний пристрій родини." },
      { q: "Чи можуть долучитися бабусі й дідусі?", a: "Так. Бабусі, дідусі, тітки й хрещені можуть отримати власне посилання. Вони бачать, на що діти заощаджують, і можуть подарувати гроші на бажання через Vipps – ви схвалюєте подарунок, перш ніж його буде додано. Змінювати вони нічого не можуть." },
    ] as Faq[],
    faqMore: "Маєте інше запитання?",
    writeUs: "Напишіть нам",
    finalTitle: ["Готові до тижня ", "без нагадувань", "?"],
    finalSub: "Безкоштовно. Без картки. Усе готово за п’ять хвилин.",
    contact: "Напишіть нам",
    privacy: "Конфіденційність",
    terms: "Умови",
    about: "Про нас",
  },
};

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
    // Figurer som spretter står delvis utenfor en boks med overflow skjult, så da følges forelderen.
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
        <span key={i} className="transition-colors duration-300" style={{ color: i / ord.length < andel ? "#17201a" : "rgba(23,32,26,0.2)" }}>
          {o}{" "}
        </span>
      ))}
    </p>
  );
}

// Ord med et skjevt «klistremerke» bak.
function Merke({ children, farge = LIME, vri = "-rotate-2", pop }: { children: ReactNode; farge?: string; vri?: string; pop?: number }) {
  return (
    <span className="relative inline-block px-[0.12em]">
      <span
        aria-hidden
        className={cx("absolute inset-x-0 inset-y-[0.1em] rounded-[0.35em] shadow-sm", vri, styles.merkeBg, pop !== undefined && styles.popLast)}
        style={{ background: farge, "--d": `${pop ?? 0}ms` } as CSSProperties}
      />
      <span className="relative">{children}</span>
    </span>
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

// Telefonramme med skjermbilde eller skjermopptak (lydløst, i løkke).
function Phone({ src, alt, video, spill = true, className, priority }: { src: string; alt: string; video?: string; spill?: boolean; className?: string; priority?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (spill && !liteBevegelse()) v.play().catch(() => {});
    else v.pause();
  }, [spill]);
  return (
    <div className={cx("rounded-[2.6rem] bg-[#15261c] p-[7px] shadow-[0_30px_60px_-24px_rgba(16,40,28,0.55)]", className)}>
      <div className="overflow-hidden rounded-[2.15rem] bg-background">
        {video ? (
          <video ref={ref} muted loop playsInline preload="metadata" poster={src} aria-label={alt} width={600} height={1298} className="block h-auto w-full">
            <source src={video} type="video/mp4" />
          </video>
        ) : (
          <Image src={src} alt={alt} width={780} height={1688} sizes="(min-width: 1024px) 300px, 70vw" className="h-auto w-full" priority={priority} />
        )}
      </div>
    </div>
  );
}

export default function Forside() {
  const t = useText(TEXT);
  const [loggedIn, setLoggedIn] = useState(false);
  const [meny, setMeny] = useState(false);
  const [aktiv, setAktiv] = useState(3);
  const sveip = useRef<number | null>(null);

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
  // «Kom i gang» åpner innloggingen på «Ny konto».
  const startHref = loggedIn ? "/admin/inbox" : "/login?ny=1";
  const STRIPE = STRIPE_SRC.map((src, i) => ({ src, alt: t.stripeAlt[i] }));
  const SKJERMER = SKJERM_SRC.map((s, i) => ({ ...s, t: t.screens[i][0], d: t.screens[i][1] }));

  const n = SKJERMER.length;
  const forrige = () => setAktiv((i) => (i - 1 + n) % n);
  const neste = () => setAktiv((i) => (i + 1) % n);

  const knapp =
    "inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-lg font-bold text-primary-foreground shadow-[0_14px_30px_-14px_rgba(16,80,40,0.7)] transition hover:bg-primary-dark active:scale-[0.98]";
  const h2 = "text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl";

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FBF7EE] text-[#17201a]">
      {/* Svevende pille-meny */}
      <header className="sticky top-3 z-40 flex justify-center px-4">
        <div className="relative w-full max-w-2xl">
          <nav className="flex items-center justify-between gap-2 rounded-full bg-white/90 py-1.5 pl-3 pr-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] ring-1 ring-black/5 backdrop-blur">
            <Link href="/" aria-label="Ukepenger">
              <Logo liten />
            </Link>
            <div className="hidden items-center gap-5 whitespace-nowrap text-sm font-semibold text-[#17201a]/70 sm:flex">
              <a href="#slik" className="hover:text-[#17201a]">
                {t.how}
              </a>
              <a href="#sporsmal" className="hover:text-[#17201a]">
                {t.questions}
              </a>
              <Link href={appHref} className="hover:text-[#17201a]">
                {appLabel}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <Link href={startHref} className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                {loggedIn ? t.toApp : t.start}
              </Link>
              <button
                type="button"
                onClick={() => setMeny((m) => !m)}
                aria-label={meny ? t.closeMenu : t.openMenu}
                aria-expanded={meny}
                className="flex size-9 items-center justify-center rounded-full hover:bg-black/5 sm:hidden"
              >
                {meny ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </nav>
          {meny && (
            <div className="absolute inset-x-0 top-full mt-2 grid gap-1 rounded-3xl bg-white p-2 text-lg font-semibold shadow-xl ring-1 ring-black/5 sm:hidden">
              {[
                ["#slik", t.how],
                ["#sporsmal", t.questions],
                [appHref, appLabel],
              ].map(([href, label]) => (
                <a key={label} href={href} onClick={() => setMeny(false)} className="rounded-2xl px-4 py-3 hover:bg-black/5">
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 1. Toppen: stort kjøkkenbilde med overskriften oppå. */}
      <section className="relative -mt-[60px]">
        <div className="relative h-[88svh] min-h-[600px] max-h-[920px] overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3.5rem]">
          <picture>
            <source media="(min-width: 768px)" srcSet="/forside/topp-pc.webp" />
            <img
              src="/forside/topp-mobil.webp"
              alt={t.heroAlt}
              className={cx("absolute inset-0 size-full object-cover object-[50%_70%] md:object-[60%_60%]", styles.zoomInn)}
              fetchPriority="high"
            />
          </picture>
          <div className="absolute inset-x-0 top-0 h-[70%] bg-gradient-to-b from-[#FBF7EE]/90 via-[#FBF7EE]/60 to-transparent md:h-full md:w-[62%] md:bg-gradient-to-r md:from-[#FBF7EE]/90 md:via-[#FBF7EE]/55" />

          <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center px-4 pt-28 text-center sm:px-6 md:items-start md:justify-center md:pt-10 md:text-left">
            <h1 className={cx("max-w-[12ch] text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl", styles.innLast)}>
              {t.heroA} <Merke pop={450}>{t.heroDone}</Merke>
              <br />
              {t.heroB}{" "}
              <Merke farge={BLAA} vri="rotate-2" pop={650}>
                {t.heroNag}
              </Merke>
            </h1>
            <p className={cx("mt-5 max-w-md text-lg leading-relaxed text-[#17201a]/80 sm:text-xl", styles.innLast)} style={{ "--d": "120ms" } as CSSProperties}>
              {t.heroLead}
            </p>
            <div className={styles.innLast} style={{ "--d": "220ms" } as CSSProperties}>
              <Link href={startHref} className={cx(knapp, "mt-7")}>
                {loggedIn ? t.toApp : t.startFree} <ArrowRight className="size-5" />
              </Link>
            </div>
            <div className={cx("mt-5 h-7 overflow-hidden text-base font-semibold text-[#17201a]/75", styles.innLast)} style={{ "--d": "320ms" } as CSSProperties}>
              <ul className={styles.veksle}>
                {[...t.rotate, t.rotate[0]].map((x, i) => (
                  <li key={i} className="flex h-7 items-center justify-center gap-1.5 md:justify-start" aria-hidden={i > 0}>
                    <Check className="size-4 text-primary" strokeWidth={3} /> {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={cx("absolute bottom-6 right-4 hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-xl sm:right-8 sm:flex", styles.svev)}>
            <span>✅</span> {t.chip}
          </div>
        </div>
      </section>

      {/* 2. Kort fortalt. Telefonen med skjermopptak stikker opp i toppbildet på mobil. */}
      <section id="slik" className="scroll-mt-24 px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto grid max-w-6xl items-center gap-x-16 lg:grid-cols-[1fr_270px] lg:pt-28">
          <Reveal className="relative z-10 mx-auto -mt-28 w-[190px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:w-full">
            <Phone src="/forside/app-barn-poster.webp" video="/forside/app-barn.mp4" alt={t.phoneAlt} className="rotate-[3deg]" />
          </Reveal>
          <div className="mt-14 text-center lg:col-start-1 lg:row-start-1 lg:mt-0 lg:text-left">
            <Reveal>
              <h2 className={h2}>
                {t.s2[0]} <Merke>{t.s2[1]}</Merke> {t.s2[2]}
              </h2>
            </Reveal>
            <ScrollText
              className="mt-8 text-xl leading-relaxed sm:text-2xl"
              key={t.s2Text}
              text={t.s2Text}
            />
          </div>
          <ol className="mt-12 grid gap-3 sm:grid-cols-3 lg:col-start-1 lg:row-start-2">
            {t.steps.map((step, i) => (
              <li key={step} className="list-none">
                <Reveal delay={i * 120} className="h-full rounded-3xl bg-white p-6 ring-1 ring-black/5">
                  <span className="font-num text-sm font-bold text-primary">0{i + 1}</span>
                  <p className="mt-1 text-lg font-bold">{step}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3. Rullende bildestripe */}
      <section aria-label={t.stripeLabel} className={cx("overflow-hidden pb-20 sm:pb-28", styles.rullPause)}>
        <div className={cx("flex gap-4 py-2", styles.rull)} style={{ "--fart": "70s" } as CSSProperties}>
          {[0, 1].map((kopi) =>
            [...STRIPE, ...STRIPE].map((b, i) => (
              <div
                key={`${kopi}-${i}`}
                aria-hidden={kopi === 1 || i >= STRIPE.length}
                className={cx("relative aspect-[4/5] w-[46vw] max-w-[230px] shrink-0 overflow-hidden rounded-[1.75rem]", i % 2 ? "rotate-[1.5deg]" : "rotate-[-1.5deg]")}
              >
                <Image src={b.src} alt={kopi === 0 && i < STRIPE.length ? b.alt : ""} fill sizes="230px" className="object-cover" />
              </div>
            )),
          )}
        </div>
      </section>

      {/* 4. Gjengen */}
      <section className="px-4 pb-20 text-center sm:px-6 sm:pb-28">
        <div className="flex justify-center -space-x-4">
          {GJENG.map((k, i) => (
            <Reveal key={k} variant="sprett" delay={i * 70} className={cx("rounded-full ring-4 ring-[#FBF7EE]", i % 2 ? "translate-y-2" : "-translate-y-1")}>
              <KidAvatar avatarKey={k} size={64} />
            </Reveal>
          ))}
        </div>
        <Reveal>
          <h2 className={cx(h2, "mt-8")}>
            {t.who[0]}
            <Merke farge={BLAA} vri="rotate-1">
              {t.who[1]}
            </Merke>
            {t.who[2]}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-[#17201a]/70">
            {t.whoText}
          </p>
        </Reveal>
      </section>

      {/* 5. Blå blokk: for deg */}
      <section className="px-3 pb-20 sm:px-6 sm:pb-28">
        <Reveal className="mx-auto max-w-6xl rounded-[2.5rem] bg-[#4F86F7] px-5 py-14 text-white sm:px-10 sm:py-20">
          <h2 className={cx(h2, "mx-auto max-w-2xl text-center")}>{t.blueTitle}</h2>
          <div className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-[340px] overflow-hidden rounded-[2rem]">
              <Image src="/forside/stripe-soppel.webp" alt={t.stripeAlt[0]} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              <Reveal delay={500} className="absolute inset-x-4 bottom-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-4 text-[#17201a] shadow-lg">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Bell className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#17201a]/60">{t.notifFrom}</p>
                    <p className="font-bold">{t.notif}</p>
                  </div>
                </div>
              </Reveal>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[Bell, Wallet, PiggyBank, Coins].map((Icon, i) => ({ icon: Icon, title: t.features[i][0], d: t.features[i][1] })).map(({ icon: Icon, title, d }, i) => (
                <Reveal key={title} delay={150 + i * 100} className="h-full rounded-[1.6rem] bg-white p-6 text-[#17201a]">
                  <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: LIME }}>
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-4 text-lg font-bold">{title}</p>
                  <p className="mt-1 text-[#17201a]/65">{d}</p>
                </Reveal>
              ))}
            </div>
          </div>
          <div className="mt-10 flex justify-center">
            <Link href={startHref} className="inline-flex min-h-13 items-center gap-2 rounded-full px-7 py-3.5 text-lg font-bold text-[#17201a]" style={{ background: LIME }}>
              {loggedIn ? t.toApp : t.startFree} <ArrowRight className="size-5" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 6. Karusell med skjermbilder og skjermopptak */}
      <section className="pb-20 sm:pb-28">
        <Reveal className="px-4 text-center sm:px-6">
          <h2 className={h2}>
            {t.seeApp[0]}<Merke>{t.seeApp[1]}</Merke>{t.seeApp[2]}
          </h2>
          <p className="mt-3 text-lg text-[#17201a]/70">{t.seeAppSub}</p>
        </Reveal>
        <div
          className="relative mx-auto mt-10 flex h-[520px] max-w-5xl touch-pan-y items-center justify-center sm:h-[600px]"
          aria-roledescription={t.carousel}
          onTouchStart={(e) => {
            sveip.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (sveip.current === null) return;
            const dx = e.changedTouches[0].clientX - sveip.current;
            sveip.current = null;
            if (dx > 40) forrige();
            else if (dx < -40) neste();
          }}
        >
          {SKJERMER.map((s, i) => {
            const pos = ((i - aktiv + n + Math.floor(n / 2)) % n) - Math.floor(n / 2);
            const synlig = Math.abs(pos) <= 2;
            return (
              <button
                key={s.src}
                type="button"
                onClick={() => setAktiv(i)}
                aria-label={s.t}
                aria-current={pos === 0}
                tabIndex={pos === 0 ? -1 : 0}
                className="absolute w-[230px] transition-all duration-500 ease-out sm:w-[260px]"
                style={{
                  transform: `translateX(${pos * 78}%) scale(${pos === 0 ? 1 : 0.84})`,
                  opacity: !synlig ? 0 : pos === 0 ? 1 : Math.abs(pos) === 1 ? 0.45 : 0.15,
                  zIndex: 10 - Math.abs(pos),
                  pointerEvents: synlig ? "auto" : "none",
                }}
              >
                <Phone src={s.src} video={s.video} spill={pos === 0} alt={s.t} />
              </button>
            );
          })}
        </div>
        <div className="mt-6 px-4 text-center" aria-live="polite">
          <p className="text-xl font-bold">{SKJERMER[aktiv].t}</p>
          <p className="text-[#17201a]/65">{SKJERMER[aktiv].d}</p>
        </div>
        <div className="mt-5 flex justify-center gap-3">
          <button type="button" onClick={forrige} aria-label={t.prev} className="flex size-11 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 hover:bg-black/5">
            <ArrowLeft className="size-5" />
          </button>
          <button type="button" onClick={neste} aria-label={t.next} className="flex size-11 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 hover:bg-black/5">
            <ArrowRight className="size-5" />
          </button>
        </div>
      </section>

      {/* 7. Fersken-blokk: trygt, rullende merkelapper og gjengen som spretter opp */}
      <section className="px-3 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#FFB38A] pt-14 sm:pt-20">
          <div className="grid gap-10 px-5 sm:px-10 lg:grid-cols-2">
            <Reveal>
              <h2 className={h2}>{t.peachTitle}</h2>
              <p className="mt-4 max-w-md text-lg text-[#17201a]/75">
                {t.peachText}
              </p>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              {[Lock, ShieldCheck, Heart, Coins].map((Icon, i) => ({ icon: Icon, title: t.safe[i][0], d: t.safe[i][1] })).map(({ icon: Icon, title, d }, i) => (
                <Reveal key={title} delay={i * 100} className="flex gap-3">
                  <Icon className="mt-0.5 size-6 shrink-0" />
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-[#17201a]/70">{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className={cx("mt-12 overflow-hidden", styles.rullPause)}>
            <div className={cx("flex gap-3", styles.rullMotsatt)} style={{ "--fart": "45s" } as CSSProperties}>
              {[0, 1].map((kopi) =>
                t.chips.map((chip) => (
                  <span key={`${kopi}-${chip}`} aria-hidden={kopi === 1} className="shrink-0 rounded-full bg-white/60 px-4 py-2 text-sm font-bold">
                    {chip}
                  </span>
                )),
              )}
            </div>
          </div>

          <div className="mt-10 flex items-end justify-center -space-x-6 sm:-space-x-8">
            {GJENG.map((k, i) => (
              <Reveal key={k} variant="sprett" delay={Math.abs(i - 3) * 110} className={cx("rounded-full ring-[6px] ring-[#FFB38A]", i === 3 ? "translate-y-[18%]" : "translate-y-[35%]")}>
                <KidAvatar avatarKey={k} size={i === 3 ? 150 : 110} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Spørsmål */}
      <section id="sporsmal" className="scroll-mt-24 px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className={cx(h2, "text-center")}>{t.faqTitle}</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {t.faq.map((s, i) => (
              <Reveal key={s.q} delay={i * 50}>
                <details className="group rounded-3xl bg-white px-6 py-5 ring-1 ring-black/5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                    {s.q}
                    <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-[#17201a]/70">{s.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-[#17201a]/70">
            {t.faqMore}{" "}
            <Link href="/kontakt" className="font-semibold text-[#17201a] underline underline-offset-4">
              {t.writeUs}
            </Link>
          </p>
        </div>
      </section>

      {/* 9. Avslutning */}
      <section className="px-4 pb-20 text-center sm:px-6">
        <Reveal>
          <h2 className="text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">
            {t.finalTitle[0]}<Merke farge={BLAA}>{t.finalTitle[1]}</Merke>{t.finalTitle[2]}
          </h2>
          <p className="mt-4 text-lg text-[#17201a]/70">{t.finalSub}</p>
          <Link href={startHref} className={cx(knapp, "mt-8")}>
            {loggedIn ? t.toApp : t.startFree} <ArrowRight className="size-5" />
          </Link>
        </Reveal>
      </section>

      <footer className="overflow-hidden border-t border-black/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-[#17201a]/65 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href={appHref}>{appLabel}</Link>
            <Link href="/om-oss">{t.about}</Link>
            <Link href="/kontakt">{t.contact}</Link>
            <Link href="/personvern">{t.privacy}</Link>
            <Link href="/vilkar">{t.terms}</Link>
          </nav>
          <p>© {new Date().getFullYear()} Ukepenger.no</p>
        </div>
        {/* Stort ordmerke nederst, delvis skjult */}
        <p aria-hidden className="font-num -mb-[0.28em] select-none text-center text-[19vw] font-bold leading-none tracking-[-0.07em] text-[#17201a] xl:text-[15rem]">
          ukepenger
        </p>
      </footer>
    </div>
  );
}
