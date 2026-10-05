import { NextResponse } from "next/server";
import { verifyAdminApiRequest } from "@/lib/admin-api-auth";

export const runtime = "nodejs";

// Sletter hele familien (barn, oppgaver, krav, utbetalinger, ønsker, enheter,
// gjester – alt henger på familien med on delete cascade) og innlogget brukers
// konto. Andre voksne i familien mister tilgangen og kan starte en ny familie.
export async function DELETE(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return auth.response;
  const { serviceClient, familyId, userId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "SLETT") return NextResponse.json({ error: "Skriv SLETT for å bekrefte." }, { status: 400 });

  const fam = await serviceClient.from("families").delete().eq("id", familyId);
  if (fam.error) {
    console.error("[account delete]", fam.error.message);
    return NextResponse.json({ error: "Klarte ikke å slette familien. Prøv igjen." }, { status: 400 });
  }
  const user = await serviceClient.auth.admin.deleteUser(userId);
  if (user.error) {
    console.error("[account delete user]", user.error.message);
    return NextResponse.json({ error: "Familien er slettet, men kontoen kunne ikke slettes. Skriv til personvern@ukepenger.no." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
