import { NextResponse } from "next/server";
import { userIdFromBearer, verifyGuestCookie } from "@/lib/guest-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

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
  const supabase = getServiceSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Serverfeil." }, { status: 500 });
  const res = await supabase
    .from("family_guests")
    .update({ user_id: userId })
    .eq("id", guest.guestId)
    .is("revoked_at", null)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .select("id")
    .maybeSingle();
  if (res.error || !res.data) return NextResponse.json({ error: "Klarte ikke å koble kontoen." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
