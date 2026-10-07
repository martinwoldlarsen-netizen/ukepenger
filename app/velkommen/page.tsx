"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Coins, Heart, Home, Mail } from "lucide-react";
import { Button, Input, cx, focusRing } from "@/components/ui";
import { ensureFamilyForUser, getCurrentSessionUser } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

type Choice = "invited" | "grandparent" | null;

// Første gang en ny konto logger inn: start en ny familie, eller bli med i
// en familie du er invitert til (som forelder eller besteforelder).
export default function WelcomePage() {
  const router = useRouter();
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
      setError("Klarte ikke å lage familien. Prøv igjen.");
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
      setError("Det ser ikke ut som en lenke fra Ukepenger. Kopier hele lenken du fikk.");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" role="status">
        Et øyeblikk …
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-10 text-foreground">
      <Link href="/" className={cx("mb-8 flex items-center gap-2.5 rounded-xl", focusRing)}>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Coins className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-num text-lg font-bold tracking-[-0.06em]">ukepenger</span>
      </Link>

      <section className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold tracking-tight">Velkommen! 👋</h1>
        <p className="mt-1 text-lg text-muted-foreground">Hva vil du gjøre?</p>

        <div className="mt-6 space-y-3">
          <ChoiceCard
            icon={<Home className="size-6" />}
            title="Start en ny familie"
            text="Du er forelder og vil sette opp Ukepenger for barna."
            onClick={() => void startFamily()}
            busy={creating}
          />
          <ChoiceCard
            icon={<Mail className="size-6" />}
            title="Jeg er invitert som forelder"
            text="Den andre forelderen har sendt deg en invitasjon."
            active={choice === "invited"}
            onClick={() => setChoice(choice === "invited" ? null : "invited")}
          />
          <ChoiceCard
            icon={<Heart className="size-6" />}
            title="Jeg er besteforelder (eller tante, gudfar …)"
            text="Se hva barna sparer til og gi gaver."
            active={choice === "grandparent"}
            onClick={() => setChoice(choice === "grandparent" ? null : "grandparent")}
          />
        </div>

        {choice && (
          <div className="mt-4 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
            <p className="font-semibold">
              {choice === "invited"
                ? "Åpne invitasjonen du fikk på e-post eller SMS. Har du lenken her, kan du lime den inn:"
                : "Be foreldrene sende deg en besteforelder-lenke (Familie-siden i appen). Åpne den på denne telefonen, eller lim den inn her:"}
            </p>
            <Input className="mt-3" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.ukepenger.no/…" inputMode="url" />
            <Button className="mt-3" block size="lg" disabled={!link.trim()} onClick={openLink}>
              Åpne lenken
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </p>
        )}

        <button type="button" onClick={() => void signOut()} className={cx("mt-8 w-full rounded-xl py-3 text-sm text-muted-foreground underline", focusRing)}>
          Logg ut
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
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  active?: boolean;
  busy?: boolean;
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
        <span className="block text-lg font-extrabold">{busy ? "Lager familien …" : title}</span>
        <span className="block text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}
