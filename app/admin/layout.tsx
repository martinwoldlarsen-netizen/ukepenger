"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { clearAdminIdentityCache, getAdminSetupStatus, getCurrentAdminContext } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/admin/inbox", label: "Krav" },
  { href: "/admin/payments", label: "Utbetalinger" },
  { href: "/admin/tasks", label: "Oppgaver" },
  { href: "/admin/children", label: "Barn" },
  { href: "/admin/devices", label: "Enheter" },
  { href: "/admin/settings", label: "Innstillinger" },
];

const betaNavItem =
  process.env.NEXT_PUBLIC_BETA_FAMILY === "true"
    ? [{ href: "/admin/beta/family", label: "Familie (beta)" }]
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
    return <div className="p-6 text-slate-300">Laster admin...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-slate-800 bg-slate-900 px-4 py-4 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:px-5 md:py-6">
        <h1 className="mb-4 text-lg font-semibold tracking-tight">Admin</h1>
        <nav className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-visible">
          {fullNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                pathname.startsWith(item.href)
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur md:px-8">
          <h2 className="text-lg font-semibold tracking-tight">{currentPageTitle}</h2>
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              await supabase.auth.signOut();
              clearAdminIdentityCache();
              router.replace("/login");
            }}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? "Logger ut..." : "Logg ut"}
          </button>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
