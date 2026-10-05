import Link from "next/link";
import { ArrowLeft, Coins } from "lucide-react";
import styles from "./LandingClient.module.css";

// Felles oppsett for personvern, vilkår og barneversjonen.

export function LegalPage({ eyebrow, title, intro, updated, children }: { eyebrow: string; title: string; intro: React.ReactNode; updated: string; children: React.ReactNode }) {
  return (
    <main className={`${styles.landingPage} min-h-screen`}>
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Ukepenger forside">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Coins className="size-5" strokeWidth={2.5} />
          </span>
          <span className="text-[17px] font-bold tracking-[-0.06em] text-foreground" style={{ fontFamily: "var(--font-mono)" }}>
            ukepenger.no
          </span>
        </Link>
        <Link href="/" className={`${styles.navLink} flex items-center gap-2`}>
          <ArrowLeft className="size-4" /> Tilbake
        </Link>
      </nav>
      <article className="mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8 sm:pt-14">
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className="mt-4 text-balance text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.07em]" style={{ fontFamily: "var(--font-mono)" }}>
          {title}
        </h1>
        <div className="mt-5 text-lg leading-8 text-muted-foreground">{intro}</div>
        {children}
        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
          <span>Sist oppdatert {updated}.</span>
          <Link href="/personvern" className="underline underline-offset-4">Personvern</Link>
          <Link href="/personvern/barn" className="underline underline-offset-4">Personvern for barn</Link>
          <Link href="/vilkar" className="underline underline-offset-4">Brukervilkår</Link>
        </div>
      </article>
    </main>
  );
}

export function Avsnitt({ tittel, id, children }: { tittel: string; id?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10" id={id}>
      <h2 className="text-xl font-bold tracking-[-0.04em]" style={{ fontFamily: "var(--font-mono)" }}>
        {tittel}
      </h2>
      <div className="mt-3 space-y-3 text-[0.9375rem] leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

export function KortFortalt({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
      <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-primary" style={{ fontFamily: "var(--font-mono)" }}>
        Kort fortalt
      </h2>
      <ul className="mt-4 space-y-2.5 text-[0.9375rem] leading-7 text-muted-foreground">{children}</ul>
    </div>
  );
}

export function Tabell({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <>
      {/* Mobil: ett kort per rad */}
      <ul className="space-y-2 sm:hidden">
        {rows.map((r, i) => (
          <li key={i} className="rounded-2xl bg-card p-4 text-sm leading-6 ring-1 ring-border">
            {r.map((c, j) => (
              <div key={j} className={j ? "mt-1.5" : "font-semibold text-foreground"}>
                {j > 0 && <span className="block text-xs font-bold uppercase tracking-wide text-foreground/60">{head[j]}</span>}
                {c}
              </div>
            ))}
          </li>
        ))}
      </ul>
      <table className="hidden w-full border-collapse text-left text-sm sm:table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="border-b border-border px-2 py-2 font-semibold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => (
                <td key={j} className="border-b border-border px-2 py-2.5 leading-6">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export const Mail = ({ to }: { to: string }) => (
  <a href={`mailto:${to}`} className="font-semibold text-foreground underline underline-offset-4">
    {to}
  </a>
);

export const Code = ({ children }: { children: React.ReactNode }) => <code className="rounded bg-secondary px-1.5 py-0.5 text-[0.8125rem]">{children}</code>;
