import type { MetadataRoute } from "next";

// start_url er "/" fordi proxy.ts allerede sender innloggede foreldre
// videre til /admin/inbox derfra.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ukepenger",
    short_name: "Ukepenger",
    description: "Barnet ser oppgavene sine og sender krav. Du godkjenner og betaler.",
    lang: "nb-NO",
    start_url: "/",
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
