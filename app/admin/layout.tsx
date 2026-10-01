"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { CheckCheck, Coins, ListChecks, LogOut, MoreHorizontal, Heart, History, Settings, Smartphone, Users, Wallet, X } from "lucide-react";
import { cx, focusRing, Skeleton } from "@/components/ui";
import { FeedbackProvider } from "@/components/ui/feedback";
import { useAdminIdentity, usePendingClaims, usePendingWishes } from "@/lib/admin-data";
import { clearAdminIdentityCache, getAdminSetupStatus, getCurrentAdminContext } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

type NavItem = { href: string; label: string; short?: string; icon: typeof CheckCheck };

// Fire hovedvalg i bunnmenyen på mobil; resten ligger under "Mer".
const primaryNav: NavItem[] = [
  { href: "/admin/inbox", label: "Krav", icon: CheckCheck },
  { href: "/admin/payments", label: "Utbetalinger", short: "Penger", icon: Wallet },
  { href: "/admin/tasks", label: "Oppgaver", icon: ListChecks },
  { href: "/admin/children", label: "Barn", icon: Users },
];

const secondaryNav: NavItem[] = [
  { href: "/admin/history", label: "Historikk", icon: History },
  { href: "/admin/family", label: "Familie", icon: Heart },
  { href: "/admin/devices", label: "Enheter", icon: Smartphone },
  { href: "/admin/settings", label: "Innstillinger", icon: Settings },
];

const allNav = [...primaryNav, ...secondaryNav];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <FeedbackProvider>
      <AdminShell>{children}</AdminShell>
    </FeedbackProvider>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { mutate } = useSWRConfig();
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const { familyId } = useAdminIdentity();
  const claims = usePendingClaims(ready ? familyId : null);
  const wishes = usePendingWishes(ready ? familyId : null);
  const pendingCount = (claims.data?.length ?? 0) + (wishes.data?.length ?? 0);

  const currentPageTitle = allNav.find((item) => pathname.startsWith(item.href))?.label ?? "Admin";

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
      setReady(true);
    };
    void run();
  }, [router]);

  const signOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    clearAdminIdentityCache();
    // Tøm cachen så neste bruker i samme fane ikke ser forrige familie.
    await mutate(() => true, undefined, { revalidate: false });
    router.replace("/login");
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[248px_1fr]">
      {/* Sidemeny på PC */}
      <aside className="hidden border-r border-border bg-card/60 px-4 py-6 md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <Link href="/admin/inbox" className={cx("flex items-center gap-2.5 rounded-xl px-2", focusRing)}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Coins className="size-5" strokeWidth={2.5} />
          </span>
          <span className="font-num text-[17px] font-bold tracking-[-0.06em]">ukepenger</span>
        </Link>
        <nav className="mt-8 space-y-1" aria-label="Hovedmeny">
          {allNav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const showBadge = item.href === "/admin/inbox" && pendingCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition",
                  focusRing,
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/75 hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="size-[18px]" strokeWidth={2.25} />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className={cx("font-num min-w-6 rounded-full px-1.5 text-center text-xs font-bold leading-6", active ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground")}>
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          disabled={signingOut}
          onClick={() => void signOut()}
          className={cx("mt-auto flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-60", focusRing)}
        >
          <LogOut className="size-[18px]" strokeWidth={2.25} />
          {signingOut ? "Logger ut…" : "Logg ut"}
        </button>
      </aside>

      <main className="min-w-0 pb-28 md:pb-0">
        {/* Ingen fast topplinje: bare en stor sidetittel som ruller med innholdet. */}
        <header className="mx-auto max-w-3xl px-4 pb-1 pt-6 md:px-8 md:pt-10">
          <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight md:text-4xl">{currentPageTitle}</h1>
        </header>
        <div className="mx-auto max-w-3xl px-4 pb-6 pt-4 md:px-8 md:pb-12 md:pt-6">
          {ready ? (
            children
          ) : (
            <div className="space-y-3" role="status" aria-label="Laster">
              <Skeleton className="h-32" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          )}
        </div>
      </main>

      {/* Bunnmeny på mobil: fire valg + Mer */}
      <nav
        aria-label="Hovedmeny"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 backdrop-blur md:hidden"
      >
        {primaryNav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const showBadge = item.href === "/admin/inbox" && pendingCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx("flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold transition", focusRing, active ? "text-primary" : "text-muted-foreground")}
            >
              <span className={cx("relative flex h-8 w-14 items-center justify-center rounded-full transition", active && "bg-primary/12")}>
                <Icon className="size-[22px]" strokeWidth={active ? 2.5 : 2} />
                {showBadge && (
                  <span className="font-num absolute -right-0.5 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[11px] font-bold leading-5 text-white ring-2 ring-card">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </span>
              <span className="truncate">{item.short ?? item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          className={cx(
            "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold transition",
            focusRing,
            secondaryNav.some((i) => isActive(i.href)) ? "text-primary" : "text-muted-foreground"
          )}
        >
          <span className={cx("flex h-8 w-14 items-center justify-center rounded-full", secondaryNav.some((i) => isActive(i.href)) && "bg-primary/12")}>
            <MoreHorizontal className="size-[22px]" />
          </span>
          Mer
        </button>
      </nav>

      {/* "Mer"-ark fra bunnen */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-foreground/30 backdrop-blur-[2px] md:hidden" onClick={() => setMoreOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mer"
            className="animate-pop w-full rounded-t-[2rem] bg-card px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
            <div className="flex items-center justify-between px-2 pb-2">
              <p className="text-lg font-bold">Mer</p>
              <button type="button" aria-label="Lukk" onClick={() => setMoreOpen(false)} className={cx("flex size-10 items-center justify-center rounded-full hover:bg-secondary", focusRing)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-1">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cx("flex min-h-14 items-center gap-3 rounded-2xl px-3 text-base font-semibold transition hover:bg-secondary", focusRing, isActive(item.href) && "bg-secondary")}
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon className="size-5" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                disabled={signingOut}
                onClick={() => void signOut()}
                className={cx("flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-base font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60", focusRing)}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-red-50">
                  <LogOut className="size-5" />
                </span>
                {signingOut ? "Logger ut…" : "Logg ut"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
