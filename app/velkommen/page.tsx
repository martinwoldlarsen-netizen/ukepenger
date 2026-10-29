"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Coins, Heart, Home, Mail } from "lucide-react";
import { Button, Input, cx, focusRing } from "@/components/ui";
import { ensureFamilyForUser, getCurrentSessionUser } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useText } from "@/lib/use-lang";

const TEXT = {
  nb: {
    createFailed: "Klarte ikke å lage familien. Prøv igjen.",
    badLink: "Det ser ikke ut som en lenke fra Ukepenger. Kopier hele lenken du fikk.",
    moment: "Et øyeblikk …",
    title: "Velkommen! 👋",
    lead: "Hva vil du gjøre?",
    newTitle: "Start en ny familie",
    newText: "Du er forelder og vil sette opp Ukepenger for barna.",
    invitedTitle: "Jeg er invitert som forelder",
    invitedText: "Den andre forelderen har sendt deg en invitasjon.",
    guestTitle: "Jeg er besteforelder (eller tante, gudfar …)",
    guestText: "Se hva barna sparer til og gi gaver.",
    invitedHelp: "Åpne invitasjonen du fikk på e-post eller SMS. Har du lenken her, kan du lime den inn:",
    guestHelp: "Be foreldrene sende deg en besteforelder-lenke (Familie-siden i appen). Åpne den på denne telefonen, eller lim den inn her:",
    openLink: "Åpne lenken",
    logout: "Logg ut",
    creating: "Lager familien …",
  },
  en: {
    createFailed: "Couldn't create the family. Please try again.",
    badLink: "That doesn't look like a link from Ukepenger. Copy the whole link you received.",
    moment: "One moment …",
    title: "Welcome! 👋",
    lead: "What would you like to do?",
    newTitle: "Start a new family",
    newText: "You're a parent and want to set up Ukepenger for your children.",
    invitedTitle: "I've been invited as a parent",
    invitedText: "The other parent has sent you an invitation.",
    guestTitle: "I'm a grandparent (or aunt, godfather …)",
    guestText: "See what the kids are saving for and give gifts.",
    invitedHelp: "Open the invitation you got by email or text message. If you have the link here, you can paste it:",
    guestHelp: "Ask the parents to send you a grandparent link (the Family page in the app). Open it on this phone, or paste it here:",
    openLink: "Open the link",
    logout: "Log out",
    creating: "Creating the family …",
  },
  uk: {
    createFailed: "Не вдалося створити родину. Спробуйте ще раз.",
    badLink: "Це не схоже на посилання від Ukepenger. Скопіюйте посилання повністю.",
    moment: "Хвилинку …",
    title: "Ласкаво просимо! 👋",
    lead: "Що ви хочете зробити?",
    newTitle: "Створити нову родину",
    newText: "Ви – один із батьків і хочете налаштувати Ukepenger для дітей.",
    invitedTitle: "Мене запросили як одного з батьків",
    invitedText: "Інший із батьків надіслав вам запрошення.",
    guestTitle: "Я бабуся чи дідусь (або тітка, хрещений …)",
    guestText: "Дивіться, на що діти заощаджують, і даруйте подарунки.",
    invitedHelp: "Відкрийте запрошення, яке ви отримали е-поштою або в SMS. Якщо посилання у вас тут, вставте його:",
    guestHelp: "Попросіть батьків надіслати вам посилання для бабусь і дідусів (сторінка «Родина» в застосунку). Відкрийте його на цьому телефоні або вставте сюди:",
    openLink: "Відкрити посилання",
    logout: "Вийти",
    creating: "Створюємо родину …",
  },
};

type Choice = "invited" | "grandparent" | null;

// Første gang en ny konto logger inn: start en ny familie, eller bli med i
// en familie du er invitert til (som forelder eller besteforelder).
export default function WelcomePage() {
  const router = useRouter();
  const t = useText(TEXT);
  const [ready, setReady] = useState(false);
  const [choice, setChoice] = useState<Choice>(null);
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void getCurrentSessionUser().then(({ user }) => {
      if (!user) router.replace("/login");
      else setReady(true);
    });
  }, [router]);

  const startFamily = async () => {
    setCreating(true);
    setError("");
    const { user } = await getCurrentSessionUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const res = await ensureFamilyForUser({ id: user.id, email: user.email });
    if (res.error) {
      setCreating(false);
      setError(t.createFailed);
      return;
    }
    router.replace("/onboarding");
  };

  // Lim inn lenken du fikk (invitasjon eller besteforelder-lenke).
  const openLink = () => {
    setError("");
    try {
      const url = new URL(link.trim());
      const ok = url.pathname.startsWith("/invite/") || url.pathname === "/besteforeldre/koble";
      if (!ok) throw new Error();
      if (url.pathname === "/besteforeldre/koble") {
        // Kontoen kobles til lenken når siden åpnes.
        window.location.href = `${url.pathname}${url.search}&profil=1`;
      } else {
        router.push(url.pathname);
      }
    } catch {
      setError(t.badLink);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" role="status">
        {t.moment}
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background px-4 py-10 text-foreground">
      <LanguageSwitcher className="absolute right-3 top-3" />
      <Link href="/" className={cx("mb-8 flex items-center gap-2.5 rounded-xl", focusRing)}>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Coins className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-num text-lg font-bold tracking-[-0.06em]">ukepenger</span>
      </Link>

      <section className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{t.lead}</p>

        <div className="mt-6 space-y-3">
          <ChoiceCard
            icon={<Home className="size-6" />}
            title={t.newTitle}
            text={t.newText}
            busyTitle={t.creating}
            onClick={() => void startFamily()}
            busy={creating}
          />
          <ChoiceCard
            icon={<Mail className="size-6" />}
            title={t.invitedTitle}
            text={t.invitedText}
            active={choice === "invited"}
            onClick={() => setChoice(choice === "invited" ? null : "invited")}
          />
          <ChoiceCard
            icon={<Heart className="size-6" />}
            title={t.guestTitle}
            text={t.guestText}
            active={choice === "grandparent"}
            onClick={() => setChoice(choice === "grandparent" ? null : "grandparent")}
          />
        </div>

        {choice && (
          <div className="mt-4 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
            <p className="font-semibold">
              {choice === "invited"
                ? t.invitedHelp
                : t.guestHelp}
            </p>
            <Input className="mt-3" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.ukepenger.no/…" inputMode="url" />
            <Button className="mt-3" block size="lg" disabled={!link.trim()} onClick={openLink}>
              {t.openLink}
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </p>
        )}

        <button type="button" onClick={() => void signOut()} className={cx("mt-8 w-full rounded-xl py-3 text-sm text-muted-foreground underline", focusRing)}>
          {t.logout}
        </button>
      </section>
    </main>
  );
}

function ChoiceCard({
  icon,
  title,
  text,
  onClick,
  active,
  busy,
  busyTitle,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  active?: boolean;
  busy?: boolean;
  busyTitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-expanded={active}
      className={cx(
        "flex w-full items-center gap-4 rounded-[1.5rem] border bg-card p-5 text-left shadow-sm transition active:scale-[0.99] disabled:opacity-60",
        active ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/40",
        focusRing
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-lg font-extrabold">{busy ? busyTitle : title}</span>
        <span className="block text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}
