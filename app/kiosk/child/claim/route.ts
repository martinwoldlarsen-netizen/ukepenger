import { NextResponse } from "next/server";

// Den gamle per-barn-QR-en kunne gjenbrukes uten utløp og brukes ikke lenger.
// Enheter kobles nå til med engangs-QR fra Mer → Enheter.
export async function GET(request: Request) {
  return NextResponse.redirect(`${new URL(request.url).origin}/kiosk?claim_error=old_qr`, { status: 303 });
}
