"use client";

import Link from "next/link";
import { useEffect } from "react";
import useSWR, { preload, unstable_serialize, useSWRConfig } from "swr";
import { ChevronRight, Coins } from "lucide-react";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { kidColor } from "./_lib/palette";
import { asLang } from "@/lib/i18n";
import { kidText } from "./_lib/text";
import { type ChildRow, KIDS_BOOTSTRAP_KEY, fetchKidPage, fetchKidsBootstrap, kidPageKey } from "./_lib/kid-data";

export default function KidsPage() {
  // Profilene huskes mellom besøk (SWR), så listen vises med en gang når
  // barnet går tilbake hit, og oppdateres i bakgrunnen.
  const { cache } = useSWRConfig();
  const boot = useSWR<ChildRow[], Error>(KIDS_BOOTSTRAP_KEY, fetchKidsBootstrap, { revalidateOnFocus: true, shouldRetryOnError: false });
  const children = boot.data ?? [];
  const loading = !boot.data && !boot.error;
  const error = boot.data ? "" : (boot.error?.message ?? "");
  // Velgeren vises på barnas språk når alle har samme; ellers norsk.
  const langs = new Set(children.map((c) => asLang(c.language)));
  const lang = langs.size === 1 ? [...langs][0] : "nb";
  const t = kidText(lang);

  // Hent barnas sider i forkant, så de åpnes uten venting.
  useEffect(() => {
    for (const c of boot.data ?? []) {
      const key = kidPageKey(c.id);
      if (!cache.get(unstable_serialize(key))?.data) void preload(key, () => fetchKidPage(c.id)).catch(() => {});
    }
  }, [boot.data, cache]);

  return (
    <main lang={lang} className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Coins className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-num text-[17px] font-bold tracking-[-0.06em]">ukepenger</span>
      </div>

      <h1 className="mt-10 text-4xl font-extrabold tracking-tight sm:text-5xl">{t.whoAreYou}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{t.tapYourself}</p>

      {loading && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-[1.75rem] bg-secondary" />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
          <p className="text-lg font-bold">{t.notConnectedTitle}</p>
          <p className="mt-1 text-muted-foreground">{t.notConnectedBody}</p>
          <p className="mt-3 text-sm text-muted-foreground">({error})</p>
          <Link href="/kiosk" className="mt-4 inline-flex font-semibold text-primary underline underline-offset-4">
            {t.goToKiosk}
          </Link>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child, index) => {
            const color = kidColor(index);
            return (
              <Link
                key={child.id}
                href={`/kids/${child.id}`}
                className="animate-pop group flex min-h-44 flex-col justify-between rounded-[1.75rem] p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
                style={{ background: color.bg, color: color.ink }}
              >
                <span className="self-start rounded-full bg-white/70 p-1 shadow-sm transition group-hover:-rotate-3 group-hover:scale-105">
                  <KidAvatar avatarKey={child.avatar_key} size={84} />
                </span>
                <span className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-3xl font-extrabold tracking-tight">{child.name}</span>
                  <ChevronRight className="size-7 shrink-0 transition group-hover:translate-x-1" strokeWidth={2.5} />
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !error && children.length === 0 && (
        <div className="mt-8 rounded-[1.75rem] border border-border bg-card p-8 text-center text-muted-foreground">
          {t.noKids}
        </div>
      )}
    </main>
  );
}
