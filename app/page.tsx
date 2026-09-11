import type { Metadata } from "next";
import LandingClient from "./_components/LandingClient";

const tittel = "Ukepenger | Mindre mas. Mer mestring.";
const beskrivelse =
  "Barnet ser oppgavene sine og sender krav. Du godkjenner og betaler. En enkel familie-app for ukepenger – gratis å bruke.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ukepenger.no"),
  title: tittel,
  description: beskrivelse,
  openGraph: {
    title: tittel,
    description: beskrivelse,
    url: "/",
    siteName: "Ukepenger.no",
    locale: "nb_NO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: tittel,
    description: beskrivelse,
  },
};

export default function Page() {
  return <LandingClient />;
}

