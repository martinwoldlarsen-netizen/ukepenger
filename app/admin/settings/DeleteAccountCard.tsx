"use client";

import { useText } from "@/lib/use-lang";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button, Card, CardHeader, Field, Input } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { adminFetch, friendlyError } from "@/lib/admin-data";
import { supabase } from "@/lib/supabaseClient";

const TEXT = {
  nb: {
    failed: "Klarte ikke å slette.", title: "Slett familie og konto", desc: "Sletter alle barn, oppgaver, krav, utbetalinger, ønsker, trofeer og enheter for godt.",
    keepHistory: "Vil du ta vare på historikken først? Last den ned under Historikk.", open: "Slett familie og konto …",
    warning: "Dette kan ikke angres. Andre voksne i familien mister også tilgangen.", typeWord: "Skriv SLETT for å bekrefte", cancel: "Avbryt", deleteAll: "Slett alt",
  },
  en: {
    failed: "Couldn't delete.", title: "Delete family and account", desc: "Deletes all children, tasks, requests, payouts, wishes, trophies and devices for good.",
    keepHistory: "Want to keep the history first? Download it under History.", open: "Delete family and account …",
    warning: "This can't be undone. Other adults in the family also lose access.", typeWord: "Type SLETT (Norwegian for “delete”) to confirm", cancel: "Cancel", deleteAll: "Delete everything",
  },
  uk: {
    failed: "Не вдалося видалити.", title: "Видалити сім’ю та обліковий запис", desc: "Назавжди видаляє всіх дітей, завдання, запити, виплати, бажання, трофеї та пристрої.",
    keepHistory: "Хочете спершу зберегти історію? Завантажте її в розділі «Історія».", open: "Видалити сім’ю та обліковий запис …",
    warning: "Цю дію не можна скасувати. Інші дорослі в сім’ї також утратять доступ.", typeWord: "Введіть SLETT (норвезькою «видалити»), щоб підтвердити", cancel: "Скасувати", deleteAll: "Видалити все",
  },
};

// Slett hele familien og kontoen, direkte i appen (GDPR: ikke avhengig av e-post).
export function DeleteAccountCard() {
  const t = useText(TEXT);
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
      toast({ kind: "error", text: friendlyError(error, t.failed) });
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader icon={<Trash2 className="size-5" />} title={t.title} description={t.desc} />
      <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Download className="size-4 shrink-0" /> {t.keepHistory}
      </p>
      {!open ? (
        <Button variant="dangerSoft" block onClick={() => setOpen(true)}>
          {t.open}
        </Button>
      ) : (
        <form
          className="animate-pop space-y-3 rounded-2xl bg-red-50 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void remove();
          }}
        >
          <p className="text-sm font-semibold text-red-900">{t.warning}</p>
          <Field label={t.typeWord}>
            <Input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" autoCapitalize="characters" />
          </Field>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" variant="danger" className="flex-1" loading={busy} disabled={text.trim().toUpperCase() !== "SLETT"}>
              {t.deleteAll}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
