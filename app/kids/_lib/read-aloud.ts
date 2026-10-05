// Leser opp tekst på norsk for barn som ikke kan lese ennå. Bruker
// nettleserens innebygde talesyntese (finnes på iPad); gjør ingenting der den
// mangler.
export function readAloud(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "nb-NO";
  u.rate = 0.95;
  const voice = window.speechSynthesis.getVoices().find((v) => /^(nb|no|nn)/i.test(v.lang));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
