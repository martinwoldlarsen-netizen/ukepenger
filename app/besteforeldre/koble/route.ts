import { NextResponse } from "next/server";
import { GUEST_COOKIE_MAX_AGE, GUEST_COOKIE_NAME, readGuestHandoff, verifyGuestCookie, verifyGuestCredentials } from "@/lib/guest-auth";

export const runtime = "nodejs";

// Personlig lenke fra foreldrene: /besteforeldre/koble?id=…&s=…
// eller overlevering fra Messenger o.l. til Safari/Chrome: /besteforeldre/koble?h=…
// Setter en langvarig cookie og sender videre til besteforeldre-siden.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const handoff = readGuestHandoff(url.searchParams.get("h")?.trim() ?? "");
  const id = handoff?.guestId ?? url.searchParams.get("id")?.trim() ?? "";
  const secret = handoff?.secret ?? url.searchParams.get("s")?.trim() ?? "";
  // ?profil=1: koble kontoen med en gang (fra «Hva vil du?» eller fra innlogging i Messenger).
  const next = url.searchParams.get("profil") === "1" ? "/besteforeldre/bli-med" : "/besteforeldre";
  const guest = await verifyGuestCredentials(id, secret);
  if (!guest) {
    // Utløpt overlevering, men denne nettleseren har allerede tilgang: bare gå videre.
    if (await verifyGuestCookie(request)) return NextResponse.redirect(`${url.origin}${next}`, { status: 303 });
    return NextResponse.redirect(`${url.origin}/besteforeldre?feil=lenke`, { status: 303 });
  }
  const response = NextResponse.redirect(`${url.origin}${next}`, { status: 303 });
  response.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: `${guest.guestId}:${secret}`,
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
  return response;
}
