"use client";

import { useSyncExternalStore } from "react";
import { LANG_COOKIE, type Lang, langFromCookieString } from "@/lib/i18n";

// Språket den voksne har valgt, lest fra cookien. Alle komponenter som bruker
// det, oppdateres med en gang når språket byttes.
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const read = () => langFromCookieString(typeof document === "undefined" ? "" : document.cookie);

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, read, () => "nb");
}

export function setLang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${60 * 60 * 24 * 365 * 2}; samesite=lax`;
  document.documentElement.lang = lang === "nb" ? "no" : lang;
  listeners.forEach((fn) => fn());
}

// Ordlisten på språket den voksne har valgt.
export function useText<T>(dict: Record<Lang, T>): T {
  return dict[useLang()] ?? dict.nb;
}

// Språket akkurat nå, for kode som ikke er en komponent (feilmeldinger o.l.).
export function currentLang(): Lang {
  return read();
}
