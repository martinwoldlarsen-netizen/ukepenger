import { NextResponse } from "next/server";
import { guestsForUser, linkGuestToUser, userFromBearer, verifyGuestLinkToken } from "@/lib/guest-auth";

export const runtime = "nodejs";

// Er den innloggede kontoen en besteforelder-konto? Brukes etter innlogging
// for å sende dem rett til besteforeldre-siden. Ble kontoen laget fra en
// besteforelder-lenke (billett på kontoen), kobles den her første gang – også
// når e-posten ble bekreftet i en annen nettleser.
export async function GET(request: Request) {
  const user = await userFromBearer(request);
  if (!user) return NextResponse.json({ error: "Ikke innlogget." }, { status: 401 });
  let guests = await guestsForUser(user.id);
  if (guests.length === 0) {
    const guestId = await verifyGuestLinkToken(user.user_metadata?.uk_guest_link);
    if (guestId && user.email_confirmed_at && (await linkGuestToUser(guestId, user.id))) {
      guests = await guestsForUser(user.id);
    }
  }
  return NextResponse.json({ isGuest: guests.length > 0 });
}
