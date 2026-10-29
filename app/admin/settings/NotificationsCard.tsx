"use client";

import { useText } from "@/lib/use-lang";
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

const TEXT = {
  nb: {
    on: "Varsler er på", onFailed: "Klarte ikke å slå på varsler.", off: "Varsler er av", offFailed: "Klarte ikke å slå av varsler.",
    title: "Varsler", desc: "Få beskjed på denne enheten når barna sender krav eller vil kjøpe noe.",
    ios: <>På iPhone må Ukepenger ligge på hjemskjermen først: trykk <strong>Del</strong> → <strong>Legg til på Hjem-skjerm</strong>, åpne appen derfra og kom tilbake hit.</>,
    unsupported: "Denne nettleseren støtter ikke varsler.", denied: "Varsler er blokkert for ukepenger.no. Slå dem på i nettleserens innstillinger, og last siden på nytt.",
    label: "Varsler på denne enheten", labelDesc: "Krav, kjøp i ønskebutikken og gaver fra besteforeldre.",
  },
  en: {
    on: "Notifications are on", onFailed: "Couldn't turn on notifications.", off: "Notifications are off", offFailed: "Couldn't turn off notifications.",
    title: "Notifications", desc: "Get notified on this device when the children send requests or want to buy something.",
    ios: <>On iPhone, Ukepenger needs to be on your home screen first: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>, open the app from there and come back here.</>,
    unsupported: "This browser doesn't support notifications.", denied: "Notifications are blocked for ukepenger.no. Turn them on in your browser settings and reload the page.",
    label: "Notifications on this device", labelDesc: "Requests, purchases in the wish shop and gifts from grandparents.",
  },
  uk: {
    on: "Сповіщення увімкнено", onFailed: "Не вдалося увімкнути сповіщення.", off: "Сповіщення вимкнено", offFailed: "Не вдалося вимкнути сповіщення.",
    title: "Сповіщення", desc: "Отримуйте сповіщення на цьому пристрої, коли діти надсилають запити або хочуть щось купити.",
    ios: <>На iPhone спершу додайте Ukepenger на головний екран: натисніть <strong>Поділитися</strong> → <strong>На початковий екран</strong>, відкрийте застосунок звідти й поверніться сюди.</>,
    unsupported: "Цей браузер не підтримує сповіщення.", denied: "Сповіщення для ukepenger.no заблоковано. Увімкніть їх у налаштуваннях браузера й перезавантажте сторінку.",
    label: "Сповіщення на цьому пристрої", labelDesc: "Запити, покупки в крамниці бажань і подарунки від бабусь і дідусів.",
  },
};

// Varsel på denne telefonen/PC-en når barna sender krav, vil kjøpe noe,
// eller besteforeldre sender en gave. Barna får aldri varsler.
export function NotificationsCard() {
  const t = useText(TEXT);
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
      toast({ text: t.on });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.onFailed) });
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
      toast({ text: t.off });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.offFailed) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader icon={<Bell className="size-5" />} title={t.title} description={t.desc} />
      {state === "ios-home" ? (
        <p className="rounded-2xl bg-secondary px-4 py-3.5 text-sm">
          {t.ios}
        </p>
      ) : state === "unsupported" ? (
        <p className="rounded-2xl bg-secondary px-4 py-3.5 text-sm text-muted-foreground">{t.unsupported}</p>
      ) : state === "denied" ? (
        <p className="rounded-2xl bg-secondary px-4 py-3.5 text-sm">{t.denied}</p>
      ) : (
        <div className="rounded-2xl bg-secondary px-4 py-3.5">
          <Switch
            checked={state === "on"}
            disabled={busy || state === "loading"}
            onChange={(next) => void (next ? turnOn() : turnOff())}
            label={t.label}
            description={t.labelDesc}
          />
        </div>
      )}
    </Card>
  );
}
