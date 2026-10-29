"use client";

import { useEffect, useState } from "react";
import { QrImage } from "@/components/QrCode";
import useSWR from "swr";
import { Copy, QrCode, Tablet, X } from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState, ListSkeleton } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { adminFetch, friendlyError, swrDefaults, useAdminIdentity } from "@/lib/admin-data";
import { formatWhen } from "@/lib/dates";
import { supabase } from "@/lib/supabaseClient";
import { useLang, useText } from "@/lib/use-lang";

type DeviceRow = {
  id: string;
  name: string;
  device_code: string | null;
  active: boolean;
  revoked_at: string | null;
  created_at: string;
  updated_at?: string;
};

const isActive = (d: DeviceRow) => d.active && !d.revoked_at;

const TEXT = {
  nb: {
    connected: (name: string) => `${name} er koblet til`, qrFailed: "Klarte ikke å lage QR-kode.",
    revokeText: "Enheten mister tilgangen med en gang og må skanne en ny QR-kode for å komme inn igjen.", remove: "Fjern",
    removedOne: "Enheten er fjernet", removedMany: (n: number) => `${n} enheter er fjernet`,
    connectTitle: "Koble til en iPad", connectDesc: "Vis QR-koden her, og skann den med iPaden barna bruker. Koden virker i 10 minutter og kan bare brukes én gang.",
    showQr: "Vis QR-kode", expired: "QR-koden er utløpt", makeNew: "Lag en ny", close: "Lukk", scan: "Skann med kameraet på iPaden",
    validFor: (time: string) => `Virker i ${time} · kan brukes én gang`, linkCopied: "Lenken er kopiert", copyInstead: "Kopier lenke i stedet",
    connectedDevices: "Tilkoblede enheter", removeAllTitle: (n: number) => `Fjerne alle ${n}?`, removeAll: "Fjern alle",
    noneTitle: "Ingen iPader er koblet til", noneBody: "Trykk «Vis QR-kode» over og skann den med iPaden.", active: "Aktiv",
    connectedAt: (when: string) => `Koblet til ${when}`, removeTitle: (name: string) => `Fjerne ${name}?`, hideOld: "Skjul gamle", showOld: (n: number) => `Vis ${n} gamle`,
    removedAt: (when: string) => `Fjernet ${when}`,
  },
  en: {
    connected: (name: string) => `${name} is connected`, qrFailed: "Couldn't create the QR code.",
    revokeText: "The device loses access right away and must scan a new QR code to get back in.", remove: "Remove",
    removedOne: "The device was removed", removedMany: (n: number) => `${n} devices were removed`,
    connectTitle: "Connect an iPad", connectDesc: "Show the QR code here and scan it with the iPad the children use. The code works for 10 minutes and can only be used once.",
    showQr: "Show QR code", expired: "The QR code has expired", makeNew: "Make a new one", close: "Close", scan: "Scan with the iPad's camera",
    validFor: (time: string) => `Valid for ${time} · can be used once`, linkCopied: "The link was copied", copyInstead: "Copy the link instead",
    connectedDevices: "Connected devices", removeAllTitle: (n: number) => `Remove all ${n}?`, removeAll: "Remove all",
    noneTitle: "No iPads are connected", noneBody: "Tap “Show QR code” above and scan it with the iPad.", active: "Active",
    connectedAt: (when: string) => `Connected ${when}`, removeTitle: (name: string) => `Remove ${name}?`, hideOld: "Hide old ones", showOld: (n: number) => `Show ${n} old`,
    removedAt: (when: string) => `Removed ${when}`,
  },
  uk: {
    connected: (name: string) => `${name}: під’єднано`, qrFailed: "Не вдалося створити QR-код.",
    revokeText: "Пристрій одразу втратить доступ, і щоб знову увійти, потрібно буде відсканувати новий QR-код.", remove: "Прибрати",
    removedOne: "Пристрій прибрано", removedMany: (n: number) => `Прибрано пристроїв: ${n}`,
    connectTitle: "Під’єднати iPad", connectDesc: "Покажіть тут QR-код і відскануйте його iPad, яким користуються діти. Код діє 10 хвилин і працює лише один раз.",
    showQr: "Показати QR-код", expired: "Термін дії QR-коду минув", makeNew: "Створити новий", close: "Закрити", scan: "Відскануйте камерою iPad",
    validFor: (time: string) => `Діє ще ${time} · одноразовий`, linkCopied: "Посилання скопійовано", copyInstead: "Скопіювати посилання",
    connectedDevices: "Під’єднані пристрої", removeAllTitle: (n: number) => `Прибрати всі (${n})?`, removeAll: "Прибрати всі",
    noneTitle: "Жоден iPad не під’єднано", noneBody: "Натисніть «Показати QR-код» вище й відскануйте його iPad.", active: "Активний",
    connectedAt: (when: string) => `Під’єднано ${when}`, removeTitle: (name: string) => `Прибрати ${name}?`, hideOld: "Сховати старі", showOld: (n: number) => `Показати старі (${n})`,
    removedAt: (when: string) => `Прибрано ${when}`,
  },
};

export default function AdminDevicesPage() {
  const t = useText(TEXT);
  const lang = useLang();
  const when = (d: string) => formatWhen(d, undefined, lang);
  const toast = useToast();
  const confirm = useConfirm();
  const { familyId } = useAdminIdentity();
  const devices = useSWR(
    familyId ? ["devices", familyId] : null,
    async () => {
      const res = await supabase
        .from("devices")
        .select("id, name, device_code, active, revoked_at, created_at, updated_at")
        .eq("family_id", familyId as string)
        .order("created_at", { ascending: false });
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []) as DeviceRow[];
    },
    swrDefaults
  );

  const [busy, setBusy] = useState(false);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [knownIds, setKnownIds] = useState<string[]>([]);
  const [showOld, setShowOld] = useState(false);

  const list = devices.data ?? [];
  const active = list.filter(isActive);
  const old = list.filter((d) => !isActive(d));

  // Mens QR-koden vises: tell ned og se etter nye enheter, så koden lukkes
  // av seg selv når iPaden er koblet til.
  useEffect(() => {
    if (!claimUrl) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(() => void devices.mutate(), 4000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, [claimUrl, devices]);

  const newDevice = claimUrl ? active.find((d) => !knownIds.includes(d.id)) : undefined;
  useEffect(() => {
    if (!newDevice) return;
    const id = window.setTimeout(() => {
      setClaimUrl(null);
      toast({ text: t.connected(newDevice.name) });
    }, 0);
    return () => window.clearTimeout(id);
  }, [newDevice, toast]);

  const secondsLeft = expiresAt ? Math.max(0, Math.round((expiresAt - now) / 1000)) : 0;

  const openQr = async () => {
    setBusy(true);
    try {
      const payload = await adminFetch<{ claimUrl?: string; expiresAt?: string }>("/api/admin/devices/qr", { method: "POST", body: "{}" });
      if (!payload.claimUrl) throw new Error("Mangler lenke");
      setKnownIds(active.map((d) => d.id));
      setClaimUrl(payload.claimUrl);
      setExpiresAt(payload.expiresAt ? new Date(payload.expiresAt).getTime() : Date.now() + 600_000);
      setNow(Date.now());
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.qrFailed) });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (ids: string[], label: string) => {
    const ok = await confirm({
      title: label,
      text: t.revokeText,
      confirmLabel: t.remove,
      danger: true,
    });
    if (!ok) return;
    const now = new Date().toISOString();
    const res = await supabase.from("devices").update({ revoked_at: now, active: false, updated_at: now }).in("id", ids);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message) });
      return;
    }
    toast({ text: ids.length === 1 ? t.removedOne : t.removedMany(ids.length) });
    await devices.mutate();
  };

  if (!familyId || (devices.isLoading && !devices.data)) return <ListSkeleton rows={2} />;

  return (
    <section className="space-y-5">
      <Card className="space-y-4">
        <CardHeader
          icon={<QrCode className="size-5" />}
          title={t.connectTitle}
          description={t.connectDesc}
        />
        {!claimUrl && (
          <Button size="lg" block loading={busy} onClick={() => void openQr()} icon={<QrCode className="size-5" />}>
            {t.showQr}
          </Button>
        )}

        {claimUrl && secondsLeft === 0 && (
          <div className="animate-pop flex flex-col items-center gap-3 rounded-3xl bg-secondary p-5 text-center">
            <p className="font-semibold">{t.expired}</p>
            <Button loading={busy} onClick={() => void openQr()} icon={<QrCode className="size-4" />}>
              {t.makeNew}
            </Button>
          </div>
        )}

        {claimUrl && secondsLeft > 0 && (
          <div className="animate-pop relative flex flex-col items-center gap-3 rounded-3xl bg-secondary p-5 text-center">
            <button type="button" aria-label={t.close} onClick={() => setClaimUrl(null)} className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full hover:bg-white/70">
              <X className="size-5" />
            </button>
            <p className="font-semibold">{t.scan}</p>
            <QrImage value={claimUrl} size={240} className="rounded-2xl bg-white p-3 shadow-sm" />
            <p className="font-num text-sm text-muted-foreground">
              {t.validFor(`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              icon={<Copy className="size-4" />}
              onClick={async () => {
                await navigator.clipboard.writeText(claimUrl);
                toast({ text: t.linkCopied });
              }}
            >
              {t.copyInstead}
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">{t.connectedDevices}</h2>
          {active.length > 1 && (
            <Button variant="dangerSoft" size="sm" onClick={() => void revoke(active.map((d) => d.id), t.removeAllTitle(active.length))}>
              {t.removeAll}
            </Button>
          )}
        </div>
        {active.length === 0 ? (
          <EmptyState emoji="📱" title={t.noneTitle}>
            {t.noneBody}
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {active.map((device) => (
              <li key={device.id} className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Tablet className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {device.name} <Badge tone="success" className="ml-1">{t.active}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">{t.connectedAt(when(device.created_at))}</p>
                </div>
                <Button variant="dangerSoft" size="sm" className="min-h-11" onClick={() => void revoke([device.id], t.removeTitle(device.name))}>
                  {t.remove}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {old.length > 0 && (
          <button type="button" onClick={() => setShowOld((v) => !v)} className="min-h-10 px-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
            {showOld ? t.hideOld : t.showOld(old.length)}
          </button>
        )}
        {showOld && (
          <ul className="space-y-1.5">
            {old.map((device) => (
              <li key={device.id} className="flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground">
                <span>{device.name}</span>
                <span>{t.removedAt(when(device.revoked_at ?? device.updated_at ?? device.created_at))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
