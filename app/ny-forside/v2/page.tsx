import type { Metadata } from "next";
import NyForsideV2 from "./NyForsideV2";

// Test av ny forside, versjon 2 (fotobasert). Skal ikke indekseres før den erstatter forsiden.
export const metadata: Metadata = {
  title: "Ukepenger – oppgaver uten mas (test 2)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NyForsideV2 />;
}
