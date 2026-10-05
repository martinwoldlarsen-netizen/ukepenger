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

export default function AdminDevicesPage() {
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
      toast({ text: `${newDevice.name} er koblet til` });
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
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lage QR-kode.") });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (ids: string[], label: string) => {
    const ok = await confirm({
      title: label,
      text: "Enheten mister tilgangen med en gang og må skanne en ny QR-kode for å komme inn igjen.",
      confirmLabel: "Fjern",
      danger: true,
    });
    if (!ok) return;
    const now = new Date().toISOString();
    const res = await supabase.from("devices").update({ revoked_at: now, active: false, updated_at: now }).in("id", ids);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message) });
      return;
    }
    toast({ text: ids.length === 1 ? "Enheten er fjernet" : `${ids.length} enheter er fjernet` });
    await devices.mutate();
  };

  if (!familyId || (devices.isLoading && !devices.data)) return <ListSkeleton rows={2} />;

  return (
    <section className="space-y-5">
      <Card className="space-y-4">
        <CardHeader
          icon={<QrCode className="size-5" />}
          title="Koble til en iPad"
          description="Vis QR-koden her, og skann den med iPaden barna bruker. Koden virker i 10 minutter og kan bare brukes én gang."
        />
        {!claimUrl && (
          <Button size="lg" block loading={busy} onClick={() => void openQr()} icon={<QrCode className="size-5" />}>
            Vis QR-kode
          </Button>
        )}

        {claimUrl && secondsLeft === 0 && (
          <div className="animate-pop flex flex-col items-center gap-3 rounded-3xl bg-secondary p-5 text-center">
            <p className="font-semibold">QR-koden er utløpt</p>
            <Button loading={busy} onClick={() => void openQr()} icon={<QrCode className="size-4" />}>
              Lag en ny
            </Button>
          </div>
        )}

        {claimUrl && secondsLeft > 0 && (
          <div className="animate-pop relative flex flex-col items-center gap-3 rounded-3xl bg-secondary p-5 text-center">
            <button type="button" aria-label="Lukk" onClick={() => setClaimUrl(null)} className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full hover:bg-white/70">
              <X className="size-5" />
            </button>
            <p className="font-semibold">Skann med kameraet på iPaden</p>
            <QrImage value={claimUrl} size={240} className="rounded-2xl bg-white p-3 shadow-sm" />
            <p className="font-num text-sm text-muted-foreground">
              Virker i {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")} · kan brukes én gang
            </p>
            <Button
              variant="ghost"
              size="sm"
              icon={<Copy className="size-4" />}
              onClick={async () => {
                await navigator.clipboard.writeText(claimUrl);
                toast({ text: "Lenken er kopiert" });
              }}
            >
              Kopier lenke i stedet
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">Tilkoblede enheter</h2>
          {active.length > 1 && (
            <Button variant="dangerSoft" size="sm" onClick={() => void revoke(active.map((d) => d.id), `Fjerne alle ${active.length}?`)}>
              Fjern alle
            </Button>
          )}
        </div>
        {active.length === 0 ? (
          <EmptyState emoji="📱" title="Ingen iPader er koblet til">
            Trykk «Vis QR-kode» over og skann den med iPaden.
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
                    {device.name} <Badge tone="success" className="ml-1">Aktiv</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">Koblet til {formatWhen(device.created_at)}</p>
                </div>
                <Button variant="dangerSoft" size="sm" className="min-h-11" onClick={() => void revoke([device.id], `Fjerne ${device.name}?`)}>
                  Fjern
                </Button>
              </li>
            ))}
          </ul>
        )}
        {old.length > 0 && (
          <button type="button" onClick={() => setShowOld((v) => !v)} className="min-h-10 px-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
            {showOld ? "Skjul gamle" : `Vis ${old.length} gamle`}
          </button>
        )}
        {showOld && (
          <ul className="space-y-1.5">
            {old.map((device) => (
              <li key={device.id} className="flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground">
                <span>{device.name}</span>
                <span>Fjernet {formatWhen(device.revoked_at ?? device.updated_at ?? device.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
