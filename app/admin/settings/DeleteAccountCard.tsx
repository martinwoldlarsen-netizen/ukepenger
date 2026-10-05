"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button, Card, CardHeader, Field, Input } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { adminFetch, friendlyError } from "@/lib/admin-data";
import { supabase } from "@/lib/supabaseClient";

// Slett hele familien og kontoen, direkte i appen (GDPR: ikke avhengig av e-post).
export function DeleteAccountCard() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await adminFetch("/api/admin/account", { method: "DELETE", body: JSON.stringify({ confirm: text.trim().toUpperCase() }) });
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å slette.") });
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader icon={<Trash2 className="size-5" />} title="Slett familie og konto" description="Sletter alle barn, oppgaver, krav, utbetalinger, ønsker, trofeer og enheter for godt." />
      <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Download className="size-4 shrink-0" /> Vil du ta vare på historikken først? Last den ned under Historikk.
      </p>
      {!open ? (
        <Button variant="dangerSoft" block onClick={() => setOpen(true)}>
          Slett familie og konto …
        </Button>
      ) : (
        <form
          className="animate-pop space-y-3 rounded-2xl bg-red-50 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void remove();
          }}
        >
          <p className="text-sm font-semibold text-red-900">Dette kan ikke angres. Andre voksne i familien mister også tilgangen.</p>
          <Field label="Skriv SLETT for å bekrefte">
            <Input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" autoCapitalize="characters" />
          </Field>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" variant="danger" className="flex-1" loading={busy} disabled={text.trim().toUpperCase() !== "SLETT"}>
              Slett alt
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
