import { NextResponse } from "next/server";
import { makeGuestHandoff, readGuestCookie, verifyGuestCredentials } from "@/lib/guest-auth";

export const runtime = "nodejs";

// Lenke for å ta med besteforelder-tilgangen fra Messenger o.l. over til
// Safari/Chrome. Gyldig i 30 minutter.
export async function POST(request: Request) {
  const raw = readGuestCookie(request);
  const guest = raw ? await verifyGuestCredentials(raw.guestId, raw.secret) : null;
  if (!raw || !guest) return NextResponse.json({ error: "Lenken er ikke aktiv." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { profile?: boolean };
  const token = makeGuestHandoff(guest.guestId, raw.secret);
  if (!token) return NextResponse.json({ error: "Serverfeil." }, { status: 500 });
  return NextResponse.json({ path: `/besteforeldre/koble?h=${token}${body.profile ? "&profil=1" : ""}` });
}
