import { type Lang, localeOf } from "@/lib/i18n";

// Leser opp tekst for barn som ikke kan lese ennå, på barnets språk. Bruker
// nettleserens innebygde talesyntese (finnes på iPad); gjør ingenting der den
// mangler.
const VOICE: Record<Lang, RegExp> = { nb: /^(nb|no|nn)/i, en: /^en/i, uk: /^uk/i };

export function readAloud(text: string, lang: Lang = "nb") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = localeOf(lang);
  u.rate = 0.95;
  const voice = window.speechSynthesis.getVoices().find((v) => VOICE[lang].test(v.lang));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
