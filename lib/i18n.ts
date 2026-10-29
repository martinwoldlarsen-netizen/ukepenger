// Språk i Ukepenger: norsk bokmål (standard), engelsk og ukrainsk.

export type Lang = "nb" | "en" | "uk";

export const LANGS: Array<{ code: Lang; label: string; flag: string; locale: string }> = [
  { code: "nb", label: "Norsk", flag: "🇳🇴", locale: "nb-NO" },
  { code: "en", label: "English", flag: "🇬🇧", locale: "en-GB" },
  { code: "uk", label: "Українська", flag: "🇺🇦", locale: "uk-UA" },
];

export function asLang(value: unknown): Lang {
  return value === "en" || value === "uk" ? value : "nb";
}

export function localeOf(lang: Lang) {
  return LANGS.find((l) => l.code === lang)?.locale ?? "nb-NO";
}

// Riktig flertallsform. Ukrainsk har tre former: 1 (одне), 2–4 (кілька), 5+ (багато).
export function plural(lang: Lang, n: number, forms: { one: string; few?: string; many?: string; other: string }) {
  const rule = new Intl.PluralRules(localeOf(lang)).select(n);
  if (rule === "one") return forms.one;
  if (rule === "few") return forms.few ?? forms.other;
  if (rule === "many") return forms.many ?? forms.other;
  return forms.other;
}

// Språket den voksne har valgt (forside, innlogging og foreldredelen) huskes i
// en vanlig cookie, så det også kan leses av serveren.
export const LANG_COOKIE = "uk_lang";

export function langFromCookieString(cookie: string | undefined | null): Lang {
  const m = (cookie ?? "").match(/(?:^|;\s*)uk_lang=(nb|en|uk)\b/);
  return asLang(m?.[1]);
}

// Velg riktig språkversjon av en ordliste ({ nb, en, uk }).
export function pick<T>(dict: Record<Lang, T>, lang: Lang): T {
  return dict[lang] ?? dict.nb;
}
