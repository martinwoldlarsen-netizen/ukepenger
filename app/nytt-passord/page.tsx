"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Coins, Eye, EyeOff } from "lucide-react";
import { Button, Field, Input, cx, focusRing } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { pathAfterAuth } from "@/lib/after-auth";
import { supabase } from "@/lib/supabaseClient";
import { useText } from "@/lib/use-lang";

const MIN_PASSWORD = 10;

const TEXT = {
  nb: {
    moment: "Et øyeblikk …",
    title: "Lag nytt passord 🔑",
    lead: "Velg et nytt passord for kontoen din.",
    password: "Nytt passord",
    placeholder: `Minst ${MIN_PASSWORD} tegn`,
    rule: (n: number) => `Minst ${MIN_PASSWORD} tegn (${n}/${MIN_PASSWORD}). Tips: en setning er lett å huske.`,
    ok: "Passordet er langt nok ✓",
    show: "Vis passord",
    hide: "Skjul passord",
    save: "Lagre passord",
    saved: "Passordet er lagret ✓",
    failed: "Klarte ikke å lagre passordet. Prøv igjen.",
    leaked: "Dette passordet har vært med i en kjent datalekkasje. Velg et annet.",
    same: "Det nye passordet må være forskjellig fra det gamle.",
    expiredTitle: "Lenken virker ikke lenger",
    expiredText: "Lenken er brukt eller utløpt, eller den ble åpnet i en annen nettleser enn der du ba om den. Be om en ny lenke.",
    newLink: "Be om ny lenke",
  },
  en: {
    moment: "One moment …",
    title: "Choose a new password 🔑",
    lead: "Choose a new password for your account.",
    password: "New password",
    placeholder: `At least ${MIN_PASSWORD} characters`,
    rule: (n: number) => `At least ${MIN_PASSWORD} characters (${n}/${MIN_PASSWORD}). Tip: a sentence is easy to remember.`,
    ok: "The password is long enough ✓",
    show: "Show password",
    hide: "Hide password",
    save: "Save password",
    saved: "The password has been saved ✓",
    failed: "Couldn't save the password. Please try again.",
    leaked: "This password has appeared in a known data breach. Please choose another one.",
    same: "The new password must be different from the old one.",
    expiredTitle: "The link no longer works",
    expiredText: "The link has been used or has expired, or it was opened in a different browser from the one where you asked for it. Ask for a new link.",
    newLink: "Ask for a new link",
  },
  uk: {
    moment: "Хвилинку …",
    title: "Створіть новий пароль 🔑",
    lead: "Оберіть новий пароль для свого акаунта.",
    password: "Новий пароль",
    placeholder: `Щонайменше ${MIN_PASSWORD} символів`,
    rule: (n: number) => `Щонайменше ${MIN_PASSWORD} символів (${n}/${MIN_PASSWORD}). Порада: речення легко запам’ятати.`,
    ok: "Пароль достатньо довгий ✓",
    show: "Показати пароль",
    hide: "Сховати пароль",
    save: "Зберегти пароль",
    saved: "Пароль збережено ✓",
    failed: "Не вдалося зберегти пароль. Спробуйте ще раз.",
    leaked: "Цей пароль був у відомому витоку даних. Оберіть інший.",
    same: "Новий пароль має відрізнятися від старого.",
    expiredTitle: "Посилання більше не працює",
    expiredText: "Посилання вже використано або термін його дії минув, або його відкрито в іншому браузері, ніж той, де ви його запитували. Запитайте нове посилання.",
    newLink: "Запитати нове посилання",
  },
};

// Hit kommer man fra «Glemt passord»-lenken (via /auth/callback, som har
// logget inn med lenken). Uten innlogging er lenken brukt eller utløpt.
export default function NewPasswordPage() {
  const t = useText(TEXT);
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
  }, []);

  const save = async () => {
    if (password.length < MIN_PASSWORD || !user) return;
    setSaving(true);
    setStatus(null);
    const res = await supabase.auth.updateUser({ password });
    if (res.error) {
      setSaving(false);
      const m = res.error.message;
      setStatus({ text: /pwned|leaked|compromised/i.test(m) ? t.leaked : /different from the old|same_password/i.test(m) ? t.same : t.failed, error: true });
      return;
    }
    setStatus({ text: t.saved });
    router.replace(await pathAfterAuth(res.data.user ?? user));
  };

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
        {user === undefined ? (
          <p role="status" className="text-center text-muted-foreground">
            {t.moment}
          </p>
        ) : user === null ? (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">{t.expiredTitle}</h1>
            <p className="mt-2 text-muted-foreground">{t.expiredText}</p>
            <Link href="/login?glemt=1" className="mt-6 inline-flex font-semibold text-primary underline underline-offset-4">
              {t.newLink}
            </Link>
          </>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
              <p className="mt-1 text-muted-foreground">{t.lead}</p>
            </div>
            <input type="email" autoComplete="username" value={user.email ?? ""} readOnly hidden />
            <div>
              <Field label={t.password}>
                <span className="relative block">
                  <Input
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.placeholder}
                    className="pr-12"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? t.hide : t.show}
                    aria-pressed={show}
                    className={cx("absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary", focusRing)}
                  >
                    {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </span>
              </Field>
              <p className={cx("mt-1.5 text-sm", password.length >= MIN_PASSWORD ? "font-semibold text-primary" : "text-muted-foreground")}>
                {password.length >= MIN_PASSWORD ? t.ok : t.rule(password.length)}
              </p>
            </div>
            {status && (
              <p role={status.error ? "alert" : "status"} className={cx("rounded-2xl px-4 py-3 text-sm font-medium", status.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800")}>
                {status.text}
              </p>
            )}
            <Button type="submit" size="lg" block loading={saving} disabled={password.length < MIN_PASSWORD}>
              {t.save}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
