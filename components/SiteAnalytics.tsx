"use client";

import { Analytics } from "@vercel/analytics/next";

// Anonym besøksstatistikk (Vercel Web Analytics): ingen informasjonskapsler,
// ingen sporing på tvers av nettsteder. Barnesiden telles ikke, og vi sender
// aldri med ?-parametere (lenker kan inneholde koder) eller invitasjonskoder.
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        if (url.pathname.startsWith("/kids") || url.pathname.startsWith("/kiosk")) return null;
        const path = url.pathname.replace(/^\/invite\/[^/]+/, "/invite/[kode]").replace(/^\/besteforeldre\/koble.*/, "/besteforeldre/koble");
        return { ...event, url: `${url.origin}${path}` };
      }}
    />
  );
}
