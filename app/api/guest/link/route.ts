import { NextResponse } from "next/server";
import { linkGuestToUser, userIdFromBearer, verifyGuestCookie } from "@/lib/guest-auth";

export const runtime = "nodejs";

// Kobler besteforelder-lenken (cookien) til kontoen som er logget inn, så
// de finner tilbake senere ved å logge inn – også på en annen enhet.
export async function POST(request: Request) {
  const [guest, userId] = await Promise.all([verifyGuestCookie(request), userIdFromBearer(request)]);
  if (!userId) return NextResponse.json({ error: "Du må være logget inn." }, { status: 401 });
  if (!guest) return NextResponse.json({ error: "Åpne lenken fra foreldrene på nytt, så prøver vi igjen." }, { status: 400 });
  if (guest.userId && guest.userId !== userId) {
    return NextResponse.json({ error: "Denne lenken er allerede koblet til en annen konto." }, { status: 409 });
  }
  if (!(await linkGuestToUser(guest.guestId, userId))) {
    return NextResponse.json({ error: "Klarte ikke å koble kontoen." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
