import type { Metadata } from "next";
import NyForside from "./NyForside";

// Testversjon av ny forside. Ikke lenket fra noe sted og ikke indeksert, så
// den kan vurderes før den eventuelt erstatter dagens forside.
export const metadata: Metadata = {
  title: "Ukepenger – ny forside (test)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NyForside />;
}
