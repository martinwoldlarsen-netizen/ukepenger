"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { Button, Field, Input, cx, focusRing } from "@/components/ui";
import { hasPendingGuest, pathAfterAuth } from "@/lib/after-auth";
import { OpenOutsideCard } from "@/components/OpenOutsideCard";
import { inAppBrowserName } from "@/lib/in-app-browser";
import { supabase } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Lang } from "@/lib/i18n";
import { useLang, useText } from "@/lib/use-lang";

const MIN_PASSWORD = 10;

const TEXT = {
  nb: {
    resent: "Ny e-post er sendt. Sjekk innboksen – og søppelpost/reklame hvis den ikke dukker opp.",
    tooShort: `Velg et passord på minst ${MIN_PASSWORD} tegn. Tips: bruk en setning, f.eks. «blå sykkel i hagen».`,
    createdButFailed: "Kontoen ble laget, men noe gikk galt. Prøv å logge inn.",
    almostGuest: "Nesten ferdig! Sjekk e-posten din (også søppelpost) og trykk på lenken for å bekrefte. Etterpå logger du inn på ukepenger.no med e-post og passord – da kommer du rett til barnebarna.",
    created: "Kontoen er laget! Sjekk e-posten din (også søppelpost) og trykk på lenken for å bekrefte.",
    somethingWrong: "Noe gikk galt. Prøv igjen.",
    moment: "Et øyeblikk …",
    guestTitle: "Lag din profil 💛",
    guestInApp: "Da finner du alltid tilbake til barnebarna.",
    guestLead: (apple: boolean) => `Bruk Google${apple ? " eller Apple" : ""}, eller skriv e-posten din og velg et passord.`,
    title: "Hei igjen 👋",
    lead: "Logg inn for å se hva barna har gjort.",
    inAppText: "Vil du logge inn med Google? Åpne siden i nettleseren først – det virker ikke her.",
    orHere: "Eller bruk e-post og passord her:",
    google: "Fortsett med Google",
    apple: "Fortsett med Apple",
    orEmail: "eller med e-post",
    email: "E-post",
    emailPh: "navn@epost.no",
    password: "Passord",
    newPasswordPh: `Velg et passord (minst ${MIN_PASSWORD} tegn)`,
    passwordPh: "Passord eller passfrase",
    resend: "Fikk du ikke e-posten? Send på nytt",
    makeProfile: "Lag profil",
    haveProfile: "Har du profil fra før? Logg inn",
    login: "Logg inn",
    signup: "Ny her? Opprett konto",
    err: {
      invalid: "Feil e-post eller passord.",
      confirm: "Bekreft e-posten din først. Sjekk innboksen og søppelpost.",
      exists: "Det finnes allerede en konto med denne e-posten. Prøv å logge inn.",
      weak: `Passordet må ha minst ${MIN_PASSWORD} tegn.`,
      leaked: "Dette passordet har vært med i en kjent datalekkasje. Velg et annet.",
      badEmail: "Sjekk at e-postadressen er riktig.",
      rate: "For mange forsøk. Vent litt og prøv igjen.",
      network: "Fikk ikke kontakt med serveren. Sjekk nettet.",
      other: "Noe gikk galt. Prøv igjen.",
    },
  },
  en: {
    resent: "A new email has been sent. Check your inbox – and your spam folder if it doesn't show up.",
    tooShort: `Choose a password of at least ${MIN_PASSWORD} characters. Tip: use a sentence, e.g. “blue bike in the garden”.`,
    createdButFailed: "The account was created, but something went wrong. Try logging in.",
    almostGuest: "Almost done! Check your email (including spam) and tap the link to confirm. Then log in at ukepenger.no with your email and password – and you'll go straight to your grandchildren.",
    created: "Your account has been created! Check your email (including spam) and tap the link to confirm.",
    somethingWrong: "Something went wrong. Please try again.",
    moment: "One moment …",
    guestTitle: "Create your profile 💛",
    guestInApp: "Then you can always find your way back to your grandchildren.",
    guestLead: (apple: boolean) => `Use Google${apple ? " or Apple" : ""}, or enter your email and choose a password.`,
    title: "Welcome back 👋",
    lead: "Log in to see what the kids have done.",
    inAppText: "Want to sign in with Google? Open the page in your browser first – it doesn't work here.",
    orHere: "Or use email and password here:",
    google: "Continue with Google",
    apple: "Continue with Apple",
    orEmail: "or with email",
    email: "Email",
    emailPh: "name@email.com",
    password: "Password",
    newPasswordPh: `Choose a password (at least ${MIN_PASSWORD} characters)`,
    passwordPh: "Password or passphrase",
    resend: "Didn't get the email? Send again",
    makeProfile: "Create profile",
    haveProfile: "Already have a profile? Log in",
    login: "Log in",
    signup: "New here? Create an account",
    err: {
      invalid: "Wrong email or password.",
      confirm: "Please confirm your email first. Check your inbox and spam folder.",
      exists: "An account with this email already exists. Try logging in.",
      weak: `The password must be at least ${MIN_PASSWORD} characters.`,
      leaked: "This password has appeared in a known data breach. Please choose another one.",
      badEmail: "Check that the email address is correct.",
      rate: "Too many attempts. Wait a little and try again.",
      network: "Couldn't reach the server. Check your connection.",
      other: "Something went wrong. Please try again.",
    },
  },
  uk: {
    resent: "Новий лист надіслано. Перевірте вхідні – і папку «Спам», якщо лист не з’явиться.",
    tooShort: `Оберіть пароль щонайменше з ${MIN_PASSWORD} символів. Порада: використайте речення, наприклад «синій велосипед у саду».`,
    createdButFailed: "Акаунт створено, але щось пішло не так. Спробуйте увійти.",
    almostGuest: "Майже готово! Перевірте пошту (також «Спам») і натисніть посилання для підтвердження. Потім увійдіть на ukepenger.no з е-поштою й паролем – і ви одразу побачите онуків.",
    created: "Акаунт створено! Перевірте пошту (також «Спам») і натисніть посилання для підтвердження.",
    somethingWrong: "Щось пішло не так. Спробуйте ще раз.",
    moment: "Хвилинку …",
    guestTitle: "Створіть свій профіль 💛",
    guestInApp: "Тоді ви завжди зможете повернутися до онуків.",
    guestLead: (apple: boolean) => `Скористайтеся Google${apple ? " або Apple" : ""} чи введіть е-пошту й оберіть пароль.`,
    title: "Вітаємо знову 👋",
    lead: "Увійдіть, щоб побачити, що зробили діти.",
    inAppText: "Хочете увійти через Google? Спершу відкрийте сторінку в браузері – тут це не працює.",
    orHere: "Або використайте е-пошту й пароль тут:",
    google: "Продовжити з Google",
    apple: "Продовжити з Apple",
    orEmail: "або через е-пошту",
    email: "Е-пошта",
    emailPh: "name@email.com",
    password: "Пароль",
    newPasswordPh: `Оберіть пароль (щонайменше ${MIN_PASSWORD} символів)`,
    passwordPh: "Пароль або парольна фраза",
    resend: "Не отримали листа? Надіслати ще раз",
    makeProfile: "Створити профіль",
    haveProfile: "Уже маєте профіль? Увійти",
    login: "Увійти",
    signup: "Тут уперше? Створити акаунт",
    err: {
      invalid: "Неправильна е-пошта або пароль.",
      confirm: "Спершу підтвердьте е-пошту. Перевірте вхідні та «Спам».",
      exists: "Акаунт із цією е-поштою вже існує. Спробуйте увійти.",
      weak: `Пароль має містити щонайменше ${MIN_PASSWORD} символів.`,
      leaked: "Цей пароль був у відомому витоку даних. Оберіть інший.",
      badEmail: "Перевірте, чи правильна адреса е-пошти.",
      rate: "Забагато спроб. Зачекайте трохи й спробуйте ще раз.",
      network: "Не вдалося зв’язатися із сервером. Перевірте інтернет.",
      other: "Щось пішло не так. Спробуйте ще раз.",
    },
  },
};

type Status = { text: string; error?: boolean } | null;

type AuthAction = "login" | "signup" | "google" | "apple" | null;

export default function LoginPage() {
  const router = useRouter();
  const t = useText(TEXT);
  const lang = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [action, setAction] = useState<AuthAction>(null);

  const isLoading = action !== null;

  // Kontoen er laget, men e-posten er ikke bekreftet ennå: tilby å sende på nytt.
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resent, setResent] = useState(false);
  const resendConfirmation = async () => {
    if (!email.trim()) return;
    const res = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    if (res.error) {
      setStatus({ text: authErrorText(res.error.message, lang), error: true });
      return;
    }
    setResent(true);
    setStatus({ text: t.resent });
  };

  // Apple-knappen vises bare når Apple er slått på i Supabase, så den aldri
  // gir feil. Den dukker opp av seg selv når oppsettet er gjort.
  const [appleOn, setAppleOn] = useState(false);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((res) => (res.ok ? res.json() : null))
      .then((settings: { external?: { apple?: boolean } } | null) => setAppleOn(Boolean(settings?.external?.apple)))
      .catch(() => {});
  }, []);

  // Besteforeldre som kom fra «Lag profil» får egen tekst.
  const [forGuest] = useState(() => typeof window !== "undefined" && hasPendingGuest());
  // Google blokkerer innlogging inne i Messenger/Facebook o.l.
  const [inApp] = useState(() => inAppBrowserName());

  // Allerede innlogget (også en eldre innlogging som nettopp ble flyttet fra
  // lokal lagring): rett inn i appen i stedet for å vise skjemaet.
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!alive) return;
        if (data.session) {
          router.replace(await pathAfterAuth(data.session.user));
          return;
        }
        setChecking(false);
      })
      .catch(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [router]);

  const handleSignUp = async () => {
    setStatus(null);
    // Lange passord/passfraser er tryggest. Gjelder nye kontoer; eksisterende
    // passord fungerer som før.
    if (password.length < MIN_PASSWORD) {
      setStatus({ text: t.tooShort, error: true });
      return;
    }
    setAction("signup");
    // Besteforeldre: legg en koblings-billett på kontoen, så den kobles til
    // familien selv om e-posten bekreftes i en annen nettleser (f.eks. Safari).
    let guestLink: string | undefined;
    if (forGuest) {
      const res = await fetch("/api/guest/link-token", { method: "POST", credentials: "include" }).catch(() => null);
      const payload = res?.ok ? ((await res.json().catch(() => ({}))) as { token?: string }) : {};
      guestLink = payload.token;
    }
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, ...(guestLink ? { data: { uk_guest_link: guestLink } } : {}) },
    });

    if (result.error) {
      setAction(null);
      setStatus({ text: authErrorText(result.error.message, lang), error: true });
      return;
    }

    if (!result.data.user) {
      setAction(null);
      setStatus({ text: t.createdButFailed, error: true });
      return;
    }

    if (!result.data.session) {
      setAction(null);
      setNeedsConfirm(true);
      setStatus({ text: forGuest ? t.almostGuest : t.created });
      return;
    }

    router.push(await pathAfterAuth(result.data.user));
  };

  const handleLogin = async () => {
    setStatus(null);
    setAction("login");
    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setAction(null);
      setNeedsConfirm(/email not confirmed/i.test(result.error.message));
      setStatus({ text: authErrorText(result.error.message, lang), error: true });
      return;
    }

    if (!result.data.user) {
      setAction(null);
      setStatus({ text: t.somethingWrong, error: true });
      return;
    }

    router.push(await pathAfterAuth(result.data.user));
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setStatus(null);
    setAction(provider);
    const redirectTo = `${window.location.origin}/auth/callback`;

    const result = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (result.error) {
      setAction(null);
      setStatus({ text: authErrorText(result.error.message, lang), error: true });
      return;
    }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" role="status">
        {t.moment}
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <LanguageSwitcher className="absolute right-3 top-3" />
      <Link href="/" className={cx("mb-8 flex items-center gap-2.5 rounded-xl", focusRing)}>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Coins className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-num text-lg font-bold tracking-[-0.06em]">ukepenger</span>
      </Link>

      <section className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
        {forGuest ? (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">{t.guestTitle}</h1>
            <p className="mt-1 text-muted-foreground">
              {inApp ? t.guestInApp : t.guestLead(appleOn)}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
            <p className="mt-1 text-muted-foreground">{t.lead}</p>
          </>
        )}

        {inApp && (
          <>
            <OpenOutsideCard
              className="mt-5"
              guest={forGuest}
              profile={forGuest}
              path={forGuest ? undefined : "/login"}
              text={t.inAppText}
            />
            <p className="mt-5 text-center text-sm font-semibold text-muted-foreground">{t.orHere}</p>
          </>
        )}

        <div className={inApp ? "hidden" : "mt-6 space-y-2.5"}>
          <Button variant="secondary" size="lg" block loading={action === "google"} disabled={isLoading} onClick={() => void handleOAuth("google")}>
            {t.google}
          </Button>
          {appleOn && (
            <Button variant="secondary" size="lg" block loading={action === "apple"} disabled={isLoading} onClick={() => void handleOAuth("apple")}>
              {t.apple}
            </Button>
          )}
        </div>

        <div className={inApp ? "my-5" : "my-6 flex items-center gap-3 text-sm text-muted-foreground"}>
          {!inApp && (
            <>
              <div className="h-px flex-1 bg-border" />
              <span>{t.orEmail}</span>
              <div className="h-px flex-1 bg-border" />
            </>
          )}
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            void (forGuest ? handleSignUp() : handleLogin());
          }}
        >
          <Field label={t.email}>
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPh} />
          </Field>
          <Field label={t.password}>
            <Input
              type="password"
              autoComplete={forGuest ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={forGuest ? t.newPasswordPh : t.passwordPh}
            />
          </Field>

          {status && (
            <p role={status.error ? "alert" : "status"} className={cx("rounded-2xl px-4 py-3 text-sm font-medium", status.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800")}>
              {status.text}
            </p>
          )}
          {needsConfirm && !resent && (
            <Button variant="secondary" block onClick={() => void resendConfirmation()} disabled={!email.trim()}>
              {t.resend}
            </Button>
          )}

          {forGuest ? (
            <>
              <Button type="submit" size="lg" block loading={action === "signup"} disabled={!canSubmit}>
                {t.makeProfile}
              </Button>
              <Button variant="ghost" block loading={action === "login"} disabled={!canSubmit} onClick={() => void handleLogin()}>
                {t.haveProfile}
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" size="lg" block loading={action === "login"} disabled={!canSubmit}>
                {t.login}
              </Button>
              <Button variant="ghost" block loading={action === "signup"} disabled={!canSubmit} onClick={() => void handleSignUp()}>
                {t.signup}
              </Button>
            </>
          )}
        </form>
      </section>
    </main>
  );
}

// Supabase sine feilmeldinger er på engelsk og tekniske.
function authErrorText(message: string, lang: Lang) {
  const e = TEXT[lang].err;
  if (/invalid login credentials/i.test(message)) return e.invalid;
  if (/email not confirmed/i.test(message)) return e.confirm;
  if (/already registered|already exists/i.test(message)) return e.exists;
  if (/password should be at least|weak password/i.test(message)) return e.weak;
  if (/pwned|leaked|compromised/i.test(message)) return e.leaked;
  if (/invalid email|unable to validate email/i.test(message)) return e.badEmail;
  if (/rate limit|too many/i.test(message)) return e.rate;
  if (/fetch|network/i.test(message)) return e.network;
  console.error("[login]", message);
  return e.other;
}
