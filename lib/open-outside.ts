"use client";

// Åpne siden i den vanlige nettleseren (Safari, Chrome, Samsung Internett)
// når den er åpnet inne i Messenger, Facebook o.l. Der virker ikke Google-
// innlogging, og «Legg til på Hjem-skjerm» finnes ikke.

export type Platform = "ios" | "android" | "other";

export function platform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

// iOS 17+: x-safari-https:// åpner Safari, googlechromes:// åpner Chrome.
// Android: intent:// åpner standard-nettleseren (eller Chrome med package).
export function externalUrl(url: string, target: "default" | "chrome"): string {
  const p = platform();
  const rest = url.replace(/^https?:\/\//, "");
  if (p === "ios") return target === "chrome" ? `googlechromes://${rest}` : `x-safari-https://${rest}`;
  if (p === "android") {
    const pkg = target === "chrome" ? "package=com.android.chrome;" : "";
    return `intent://${rest}#Intent;scheme=https;${pkg}S.browser_fallback_url=${encodeURIComponent(url)};end`;
  }
  return url;
}

// Lenken som skal åpnes utenfor. Har siden en besteforelder-lenke (cookie),
// tar vi den med via en kortlivet overlevering, ellers samme side.
export async function outsideLink(opts: { guest?: boolean; profile?: boolean; path?: string }): Promise<string> {
  let path = opts.path ?? `${window.location.pathname}${window.location.search}`;
  if (opts.guest) {
    const res = await fetch("/api/guest/handoff", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: Boolean(opts.profile) }),
    }).catch(() => null);
    const payload = res?.ok ? ((await res.json().catch(() => ({}))) as { path?: string }) : {};
    if (payload.path) path = payload.path;
  }
  return `${window.location.origin}${path}`;
}
