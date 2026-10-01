"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Copy, QrCode, RefreshCw, Tablet } from "lucide-react";
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
  const [showOld, setShowOld] = useState(false);

  const list = devices.data ?? [];
  const active = list.filter(isActive);
  const old = list.filter((d) => !isActive(d));

  const openQr = async (regenerate: boolean) => {
    if (regenerate) {
      const ok = await confirm({
        title: "Lage ny QR-kode?",
        text: "Den nyeste iPaden logges ut og må skanne den nye koden.",
        confirmLabel: "Lag ny",
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const payload = await adminFetch<{ claimUrl?: string }>("/api/admin/devices/qr", { method: "POST", body: JSON.stringify({ regenerate }) });
      if (!payload.claimUrl) throw new Error("Mangler lenke");
      setClaimUrl(payload.claimUrl);
      await devices.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lage QR-kode.") });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (ids: string[], label: string) => {
    const ok = await confirm({
      title: label,
      text: "iPaden logges ut av barnesiden og må skanne en ny QR-kode for å komme inn igjen.",
      confirmLabel: "Deaktiver",
      danger: true,
    });
    if (!ok) return;
    const now = new Date().toISOString();
    const res = await supabase.from("devices").update({ revoked_at: now, active: false, updated_at: now }).in("id", ids);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message) });
      return;
    }
    toast({ text: ids.length === 1 ? "Enheten er deaktivert" : `${ids.length} enheter er deaktivert` });
    setClaimUrl(null);
    await devices.mutate();
  };

  // QR-bildet lages av en ekstern tjeneste fra lenken.
  const qrImageUrl = useMemo(
    () => (claimUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(claimUrl)}` : null),
    [claimUrl]
  );

  if (!familyId || (devices.isLoading && !devices.data)) return <ListSkeleton rows={2} />;

  return (
    <section className="space-y-5">
      <Card className="space-y-4">
        <CardHeader
          icon={<QrCode className="size-5" />}
          title="Koble til en iPad"
          description="Vis QR-koden her, og skann den med iPaden barna bruker. Da åpnes barnesiden rett på den."
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Button size="lg" loading={busy} onClick={() => void openQr(false)} icon={<QrCode className="size-5" />}>
            Vis QR-kode
          </Button>
          <Button size="lg" variant="secondary" disabled={busy} onClick={() => void openQr(true)} icon={<RefreshCw className="size-4" />}>
            Lag ny QR-kode
          </Button>
        </div>

        {claimUrl && qrImageUrl && (
          <div className="animate-pop flex flex-col items-center gap-3 rounded-3xl bg-secondary p-5 text-center">
            <p className="font-semibold">Skann med kameraet på iPaden</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageUrl} alt="QR-kode for å koble til iPaden" className="size-60 rounded-2xl bg-white p-3 shadow-sm" />
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
          <h2 className="text-lg font-bold tracking-tight">Tilkoblede iPader</h2>
          {active.length > 1 && (
            <Button variant="dangerSoft" size="sm" onClick={() => void revoke(active.map((d) => d.id), `Deaktivere alle ${active.length}?`)}>
              Deaktiver alle
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
                <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" onClick={() => void revoke([device.id], "Deaktivere iPaden?")}>
                  Deaktiver
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
                <span>Deaktivert {formatWhen(device.revoked_at ?? device.updated_at ?? device.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
