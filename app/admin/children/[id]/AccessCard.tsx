"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button, Card, CardHeader, Input, Switch } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { type AdminChild, adminFetch, friendlyError } from "@/lib/admin-data";
import { supabase } from "@/lib/supabaseClient";
import { useText } from "@/lib/use-lang";

const TEXT = {
  nb: {
    title: "Tilgang på barnesiden",
    desc: (name: string) => `Hvor ${name} vises, og om ${name} må taste en kode.`,
    shared: "Vis på felles iPad",
    sharedOn: (name: string) => `${name} vises på felles iPad og egen enhet.`,
    sharedOff: (name: string) => `${name} vises bare på egen enhet (Enheter → «Bare ${name}»).`,
    sharedSaved: (on: boolean, name: string) => (on ? `${name} vises på felles iPad` : `${name} er skjult på felles iPad`),
    pin: "Kode (4 tall)",
    pinHas: (name: string) => `${name} må taste koden for å åpne siden sin, både på felles iPad og egen enhet.`,
    pinNone: (name: string) => `Uten kode trykker ${name} seg rett inn. Gi ${name} en kode så søsken ikke kan åpne siden.`,
    pinPlaceholder: "F.eks. 2580",
    savePin: "Lagre kode",
    changePin: "Ny kode",
    removePin: "Fjern kode",
    pinSaved: (name: string) => `Koden til ${name} er lagret. Fortell ${name} hva den er.`,
    pinRemoved: (name: string) => `${name} har ikke kode lenger`,
    removeTitle: (name: string) => `Fjerne koden til ${name}?`,
    removeText: "Da kan alle som bruker enheten, åpne siden.",
    fourDigits: "Koden må være fire tall.",
    failed: "Klarte ikke å lagre.",
    cancel: "Avbryt",
  },
  en: {
    title: "Access on the children's page",
    desc: (name: string) => `Where ${name} is shown, and whether ${name} needs to type a code.`,
    shared: "Show on the shared iPad",
    sharedOn: (name: string) => `${name} is shown on the shared iPad and on their own device.`,
    sharedOff: (name: string) => `${name} is only shown on their own device (Devices → “Only ${name}”).`,
    sharedSaved: (on: boolean, name: string) => (on ? `${name} is shown on the shared iPad` : `${name} is hidden on the shared iPad`),
    pin: "Code (4 digits)",
    pinHas: (name: string) => `${name} must type the code to open their page, on both the shared iPad and their own device.`,
    pinNone: (name: string) => `Without a code, ${name} taps straight in. Give ${name} a code so siblings can't open the page.`,
    pinPlaceholder: "E.g. 2580",
    savePin: "Save code",
    changePin: "New code",
    removePin: "Remove code",
    pinSaved: (name: string) => `${name}'s code is saved. Tell ${name} what it is.`,
    pinRemoved: (name: string) => `${name} no longer has a code`,
    removeTitle: (name: string) => `Remove ${name}'s code?`,
    removeText: "Then anyone using the device can open the page.",
    fourDigits: "The code must be four digits.",
    failed: "Couldn't save.",
    cancel: "Cancel",
  },
  uk: {
    title: "Доступ на дитячій сторінці",
    desc: (name: string) => `Де показується ${name} і чи потрібно вводити код.`,
    shared: "Показувати на спільному iPad",
    sharedOn: (name: string) => `${name}: показується на спільному iPad і на власному пристрої.`,
    sharedOff: (name: string) => `${name}: показується лише на власному пристрої (Пристрої → «Лише ${name}»).`,
    sharedSaved: (on: boolean, name: string) => (on ? `${name}: показується на спільному iPad` : `${name}: приховано на спільному iPad`),
    pin: "Код (4 цифри)",
    pinHas: (name: string) => `${name}: щоб відкрити свою сторінку, потрібно ввести код – і на спільному iPad, і на власному пристрої.`,
    pinNone: (name: string) => `Без коду сторінка відкривається одразу. Задайте код (${name}), щоб брати й сестри не могли її відкрити.`,
    pinPlaceholder: "Напр. 2580",
    savePin: "Зберегти код",
    changePin: "Новий код",
    removePin: "Прибрати код",
    pinSaved: (name: string) => `Код збережено (${name}). Не забудьте його повідомити.`,
    pinRemoved: (name: string) => `${name}: коду більше немає`,
    removeTitle: (name: string) => `Прибрати код (${name})?`,
    removeText: "Тоді будь-хто на цьому пристрої зможе відкрити сторінку.",
    fourDigits: "Код має складатися з чотирьох цифр.",
    failed: "Не вдалося зберегти.",
    cancel: "Скасувати",
  },
};

// Vis på felles iPad (av/på) og valgfri kode. Koden hashes på serveren
// (/api/admin/children/pin) og vises aldri igjen etter at den er lagret.
export function AccessCard({ child, onSaved }: { child: AdminChild; onSaved: () => void }) {
  const t = useText(TEXT);
  const toast = useToast();
  const confirm = useConfirm();
  const [pin, setPin] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const shared = child.shared_visible !== false;

  const toggleShared = async (on: boolean) => {
    const res = await supabase.from("children").update({ shared_visible: on }).eq("id", child.id);
    if (res.error) return toast({ kind: "error", text: friendlyError(res.error.message, t.failed) });
    toast({ text: t.sharedSaved(on, child.name) });
    onSaved();
  };

  const savePin = async (value: string | null) => {
    if (value !== null && !/^\d{4}$/.test(value)) return toast({ kind: "error", text: t.fourDigits });
    setBusy(true);
    try {
      await adminFetch("/api/admin/children/pin", { method: "POST", body: JSON.stringify({ childId: child.id, pin: value }) });
      toast({ text: value === null ? t.pinRemoved(child.name) : t.pinSaved(child.name) });
      setPin("");
      setEditing(false);
      onSaved();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.failed) });
    } finally {
      setBusy(false);
    }
  };

  const removePin = async () => {
    const ok = await confirm({ title: t.removeTitle(child.name), text: t.removeText, confirmLabel: t.removePin, danger: true });
    if (ok) await savePin(null);
  };

  return (
    <Card className="space-y-4">
      <CardHeader icon={<Lock className="size-5" />} title={t.title} description={t.desc(child.name)} />
      <div className="rounded-2xl bg-secondary px-4 py-3.5">
        <Switch checked={shared} onChange={(on) => void toggleShared(on)} label={t.shared} description={shared ? t.sharedOn(child.name) : t.sharedOff(child.name)} />
      </div>
      <div>
        <p className="text-sm font-semibold">
          {t.pin} {child.has_pin && <span aria-hidden="true">🔒</span>}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{child.has_pin ? t.pinHas(child.name) : t.pinNone(child.name)}</p>
        {child.has_pin && !editing ? (
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              {t.changePin}
            </Button>
            <Button variant="dangerSoft" loading={busy} onClick={() => void removePin()}>
              {t.removePin}
            </Button>
          </div>
        ) : (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void savePin(pin);
            }}
          >
            <Input
              aria-label={t.pin}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              autoComplete="off"
              placeholder={t.pinPlaceholder}
              className="font-num max-w-36 tracking-[0.3em]"
            />
            <Button type="submit" loading={busy} disabled={pin.length !== 4}>
              {t.savePin}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                {t.cancel}
              </Button>
            )}
          </form>
        )}
      </div>
    </Card>
  );
}
