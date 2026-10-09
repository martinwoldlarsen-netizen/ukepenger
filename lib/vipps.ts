"use client";

import { platform } from "@/lib/open-outside";

// Vipps lar ikke andre fylle inn mottaker og beløp for vanlige personer, så vi
// kopierer nummeret og åpner Vipps-appen. Brukes både av besteforeldre (gave)
// og av foreldre («Test» på Familie-siden).
export async function copyVippsNumber(phone: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(phone);
    return true;
  } catch {
    return false;
  }
}

// Åpner Vipps på mobil. På PC finnes ikke appen – da returnerer vi false.
export async function openVippsApp(phone: string): Promise<{ copied: boolean; opened: boolean }> {
  const copied = await copyVippsNumber(phone);
  if (platform() === "other") return { copied, opened: false };
  window.location.assign("vipps://");
  return { copied, opened: true };
}
