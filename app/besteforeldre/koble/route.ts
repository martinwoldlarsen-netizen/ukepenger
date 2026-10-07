import { NextResponse } from "next/server";
import { GUEST_COOKIE_MAX_AGE, GUEST_COOKIE_NAME, verifyGuestCredentials } from "@/lib/guest-auth";

export const runtime = "nodejs";

// Personlig lenke fra foreldrene: /besteforeldre/koble?id=…&s=…
// Setter en langvarig cookie og sender videre til besteforeldre-siden.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim() ?? "";
  const secret = url.searchParams.get("s")?.trim() ?? "";
  const guest = await verifyGuestCredentials(id, secret);
  if (!guest) {
    return NextResponse.redirect(`${url.origin}/besteforeldre?feil=lenke`, { status: 303 });
  }
  // ?profil=1: kommer fra «Hva vil du?» etter innlogging – koble kontoen med en gang.
  const next = url.searchParams.get("profil") === "1" ? "/besteforeldre/bli-med" : "/besteforeldre";
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
