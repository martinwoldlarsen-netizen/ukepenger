import { NextResponse } from "next/server";
import { guestsForUser, userIdFromBearer } from "@/lib/guest-auth";

export const runtime = "nodejs";

// Er den innloggede kontoen en besteforelder-konto? Brukes etter innlogging
// for å sende dem rett til besteforeldre-siden.
export async function GET(request: Request) {
  const userId = await userIdFromBearer(request);
  if (!userId) return NextResponse.json({ error: "Ikke innlogget." }, { status: 401 });
  const guests = await guestsForUser(userId);
  return NextResponse.json({ isGuest: guests.length > 0 });
}
