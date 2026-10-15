import type { Metadata } from "next";
import NyForsideV3 from "./NyForsideV3";

// Test av ny forside, versjon 3 (appens egne farger). Skal ikke indekseres før den erstatter forsiden.
export const metadata: Metadata = {
  title: "Ukepenger – oppgaver uten mas (test 3)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NyForsideV3 />;
}
