import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang, asLang } from "@/lib/i18n";

// Språket den voksne har valgt, lest på serveren (sider som lages der).
export async function serverLang(): Promise<Lang> {
  return asLang((await cookies()).get(LANG_COOKIE)?.value);
}
