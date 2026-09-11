import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import RegistrerServiceWorker from "./_components/RegistrerServiceWorker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  themeColor: "#005f2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" className="bg-background">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <RegistrerServiceWorker />
      </body>
    </html>
  );
}
