"use client";

import { useEffect } from "react";

export default function RegistrerServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Feiler den, er det ingen krise: appen virker som vanlig, bare uten
    // frakoblet-siden. Derfor svelges feilen bevisst.
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
