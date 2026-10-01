import { DM_Sans, Space_Mono } from "next/font/google";

const uiSans = DM_Sans({ subsets: ["latin"], variable: "--font-ui-sans" });
const uiMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-ui-mono" });

// Barnesiden (kiosk på delt iPad) bruker det lyse temaet fra forsiden.
export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return <div className={`theme-light ${uiSans.variable} ${uiMono.variable} min-h-screen antialiased`}>{children}</div>;
}
