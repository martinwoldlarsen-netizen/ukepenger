"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { CheckCheck, Coins, ListChecks, LogOut, Settings, Smartphone, Users, Wallet, Sparkles } from "lucide-react";
import { clearAdminIdentityCache, getAdminSetupStatus, getCurrentAdminContext } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/admin/inbox", label: "Krav", icon: CheckCheck },
  { href: "/admin/payments", label: "Utbetalinger", short: "Penger", icon: Wallet },
  { href: "/admin/tasks", label: "Oppgaver", icon: ListChecks },
  { href: "/admin/children", label: "Barn", icon: Users },
  { href: "/admin/devices", label: "Enheter", icon: Smartphone },
  { href: "/admin/settings", label: "Innstillinger", short: "Oppsett", icon: Settings },
];

const betaNavItem =
  process.env.NEXT_PUBLIC_BETA_FAMILY === "true"
    ? [{ href: "/admin/beta/family", label: "Familie (beta)", short: "Familie", icon: Sparkles }]
    : [];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const fullNav = [...navItems, ...betaNavItem];
  const currentPageTitle = fullNav.find((item) => pathname.startsWith(item.href))?.label ?? "Admin";

  useEffect(() => {
    const run = async () => {
      const ctx = await getCurrentAdminContext();
      if (!ctx.user || !ctx.familyId) {
        router.replace("/login");
        return;
      }

      const setup = await getAdminSetupStatus();
      if (setup.needsOnboarding) {
        router.replace("/onboarding");
        return;
      }

      setLoading(false);
    };

    void run();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Laster…
      </div>
    );
  }

  const signOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    clearAdminIdentityCache();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-border bg-card/60 px-4 py-6 md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <Link href="/admin/inbox" className="flex items-center gap-2.5 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Coins className="size-5" strokeWidth={2.5} />
          </span>
          <span className="font-num text-[17px] font-bold tracking-[-0.06em]">ukepenger</span>
        </Link>
        <nav className="mt-8 space-y-1">
          {fullNav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition ${
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/75 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="size-[18px]" strokeWidth={2.25} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          disabled={signingOut}
          onClick={() => void signOut()}
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-60"
        >
          <LogOut className="size-[18px]" strokeWidth={2.25} />
          {signingOut ? "Logger ut…" : "Logg ut"}
        </button>
      </aside>

      <main className="min-w-0 pb-24 md:pb-0">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3.5 backdrop-blur md:px-8 md:py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground md:hidden">
              <Coins className="size-[18px]" strokeWidth={2.5} />
            </span>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">{currentPageTitle}</h2>
          </div>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void signOut()}
            className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
          >
            {signingOut ? "Logger ut…" : "Logg ut"}
          </button>
        </header>
        <div className="mx-auto max-w-5xl p-4 md:p-8">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 backdrop-blur md:hidden">
        {fullNav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-semibold transition ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className={`flex h-7 w-11 items-center justify-center rounded-full ${active ? "bg-primary/12" : ""}`}>
                <Icon className="size-[19px]" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className="w-full truncate text-center">{"short" in item ? item.short : item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
