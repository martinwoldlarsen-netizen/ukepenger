"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Card, CardHeader, Switch } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { adminFetch, friendlyError } from "@/lib/admin-data";

type State = "loading" | "unsupported" | "ios-home" | "denied" | "off" | "on";

function base64ToBytes(b64: string) {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
}

// Varsel på denne telefonen/PC-en når barna sender krav, vil kjøpe noe,
// eller besteforeldre sender en gave. Barna får aldri varsler.
export function NotificationsCard() {
  const toast = useToast();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      let next: State;
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        next = ios && !standalone ? "ios-home" : "unsupported";
      } else if (Notification.permission === "denied") {
        next = "denied";
      } else {
        const sub = await (await registration()).pushManager.getSubscription();
        next = sub ? "on" : "off";
      }
      if (alive) setState(next);
    })().catch(() => alive && setState("unsupported"));
    return () => {
      alive = false;
    };
  }, []);

  const turnOn = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const { publicKey } = await adminFetch<{ publicKey: string }>("/api/admin/push");
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(publicKey) }));
      await adminFetch("/api/admin/push", { method: "POST", body: JSON.stringify({ subscription: sub.toJSON(), test: true }) });
      setState("on");
      toast({ text: "Varsler er på" });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å slå på varsler.") });
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const sub = await (await registration()).pushManager.getSubscription();
      if (sub) {
        await adminFetch("/api/admin/push", { method: "DELETE", body: JSON.stringify({ subscription: sub.toJSON() }) });
        await sub.unsubscribe();
      }
      setState("off");
      toast({ text: "Varsler er av" });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å slå av varsler.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader icon={<Bell className="size-5" />} title="Varsler" description="Få beskjed på denne enheten når barna sender krav eller vil kjøpe noe." />
      {state === "ios-home" ? (
        <p className="rounded-2xl bg-secondary px-4 py-3.5 text-sm">
          På iPhone må Ukepenger ligge på hjemskjermen først: trykk <strong>Del</strong> → <strong>Legg til på Hjem-skjerm</strong>, åpne appen derfra og kom tilbake hit.
        </p>
      ) : state === "unsupported" ? (
        <p className="rounded-2xl bg-secondary px-4 py-3.5 text-sm text-muted-foreground">Denne nettleseren støtter ikke varsler.</p>
      ) : state === "denied" ? (
        <p className="rounded-2xl bg-secondary px-4 py-3.5 text-sm">Varsler er blokkert for ukepenger.no. Slå dem på i nettleserens innstillinger, og last siden på nytt.</p>
      ) : (
        <div className="rounded-2xl bg-secondary px-4 py-3.5">
          <Switch
            checked={state === "on"}
            disabled={busy || state === "loading"}
            onChange={(next) => void (next ? turnOn() : turnOff())}
            label="Varsler på denne enheten"
            description="Krav, kjøp i ønskebutikken og gaver fra besteforeldre."
          />
        </div>
      )}
    </Card>
  );
}
