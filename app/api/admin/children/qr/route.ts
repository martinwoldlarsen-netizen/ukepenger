import { NextResponse } from "next/server";

// Per-barn-QR er slått av (kunne gjenbrukes). Bruk engangs-QR under Enheter.
export async function POST() {
  return NextResponse.json({ error: "Bruk «Vis QR-kode» under Enheter." }, { status: 410 });
}
