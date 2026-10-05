import { createBrowserClient } from "@supabase/ssr";

// Innloggingen lagres i cookies (ikke bare i nettleserens lokale lager), så
// serveren ser at du er logget inn og sender deg rett inn i appen. Cookies
// fornyes ved hvert besøk. Flyten er den samme som før (implicit), så
// e-postlenker og Google-innlogging virker uendret.
export const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: {
    flowType: "implicit",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Engangsflytting: innlogginger fra før dette lå i localStorage. Flytt dem
// over til cookies så ingen blir logget ut. Kjøres med en gang klienten lages,
// så den står først i køen før sidene spør etter innlogging.
if (typeof window !== "undefined") {
  try {
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
    const key = `sb-${ref}-auth-token`;
    const old = window.localStorage.getItem(key);
    if (old) {
      window.localStorage.removeItem(key);
      const parsed = JSON.parse(old) as { access_token?: string; refresh_token?: string };
      if (parsed.access_token && parsed.refresh_token && !document.cookie.includes(key)) {
        void supabase.auth.setSession({ access_token: parsed.access_token, refresh_token: parsed.refresh_token });
      }
    }
  } catch {
    // Ingen tilgang til lagring: da logger man bare inn på nytt.
  }
}
