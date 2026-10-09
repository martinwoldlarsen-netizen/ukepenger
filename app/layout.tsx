import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import RegistrerServiceWorker from "./_components/RegistrerServiceWorker";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import "./globals.css";

// Samme skrifter som forsiden: DM Sans til tekst, Space Mono til beløp.
const uiSans = DM_Sans({ variable: "--font-ui-sans", subsets: ["latin"] });
const uiMono = Space_Mono({ variable: "--font-ui-mono", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Ukepenger - Familie-appen for oppgaver og ukepenger",
  description: "Barn registrerer oppgaver, du godkjenner og betaler. Enkel og oversiktlig app for ukepenger til hele familien.",
  applicationName: "Ukepenger",
  // Gjor at iOS apner den i fullskjerm uten Safari-rammen nar den er lagt
  // til pa hjem-skjermen.
  appleWebApp: {
    capable: true,
    title: "Ukepenger",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f9f6ee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" className="bg-background">
      <body
        className={`${uiSans.variable} ${uiMono.variable} antialiased`}
      >
        {children}
        <RegistrerServiceWorker />
        <SiteAnalytics />
      </body>
    </html>
  );
}
