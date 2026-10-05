import type { MetadataRoute } from "next";

// start_url har ?app=1: når appen åpnes fra hjemskjermen sender proxy.ts
// foreldre til Krav, barneenheter til barnesiden og besteforeldre til sin
// side. Nettsiden ukepenger.no viser alltid forsiden.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ukepenger",
    short_name: "Ukepenger",
    description: "Barnet ser oppgavene sine og sender krav. Du godkjenner og betaler.",
    lang: "nb-NO",
    start_url: "/?app=1",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf8f1",
    theme_color: "#005f2e",
    categories: ["lifestyle", "finance", "education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
