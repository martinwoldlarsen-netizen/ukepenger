// Bevisst minimal. Denne cacher ALDRI app-kode eller data - bare en
// frakoblet-side. Da kan ingen bli sittende fast pa en gammel versjon av
// appen, og vi slipper hele klassen med "hvorfor ser jeg gammelt innhold".
const CACHE = "ukepenger-offline-v2";
const FRAKOBLET = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([FRAKOBLET, "/icon-192.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((navn) => Promise.all(navn.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Bare sidevisninger. Alt annet gar rett til nettverket som vanlig.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(FRAKOBLET))
  );
});

// Varsler til foreldre (krav, kjøp og gaver).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Ukepenger", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Ukepenger", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/admin/inbox" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin/inbox", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.location.origin) && "focus" in c);
      if (!open) return self.clients.openWindow(url);
      // navigate() virker bare på vinduer denne service workeren styrer.
      return open
        .focus()
        .then((c) => (c.url === url ? c : c.navigate(url)))
        .catch(() => self.clients.openWindow(url));
    })
  );
});
