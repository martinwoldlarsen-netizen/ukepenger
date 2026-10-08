import { NextResponse } from "next/server";
import { guestLinkToken, verifyGuestCookie } from "@/lib/guest-auth";

export const runtime = "nodejs";

// Gir en signert koblings-billett for lenken (cookien) som er åpnet her.
// Legges på kontoen ved registrering, se verifyGuestLinkToken.
export async function POST(request: Request) {
  const guest = await verifyGuestCookie(request);
  if (!guest) return NextResponse.json({ error: "Lenken er ikke aktiv." }, { status: 401 });
  const token = await guestLinkToken(guest.guestId);
  if (!token) return NextResponse.json({ error: "Serverfeil." }, { status: 500 });
  return NextResponse.json({ token });
}
