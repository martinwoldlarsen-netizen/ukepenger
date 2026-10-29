"use client";

import { useEffect } from "react";
import { useLang } from "@/lib/use-lang";

// Setter <html lang> etter språket den voksne har valgt (skjermlesere og
// orddeling). Siden lages på norsk på serveren, så dette skjer i nettleseren.
export function HtmlLang() {
  const lang = useLang();
  useEffect(() => {
    document.documentElement.lang = lang === "nb" ? "no" : lang;
  }, [lang]);
  return null;
}
