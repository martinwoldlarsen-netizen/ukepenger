// Åpnet inne i Messenger, Facebook, Instagram, Snapchat o.l.? Der lagres
// innloggingen bare i den appens egen nettleser, «Legg til på Hjem-skjerm»
// finnes ikke, og Google-innlogging er blokkert.
export function inAppBrowserName(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  // Messenger og Facebook bruker samme nettleser og kan ikke skilles sikkert.
  if (/Messenger|FBAN|FBAV|FB_IAB/i.test(ua)) return "Messenger/Facebook";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  if (/\bLine\//i.test(ua)) return "Line";
  return null;
}
