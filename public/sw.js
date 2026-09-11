// Bevisst minimal. Denne cacher ALDRI app-kode eller data - bare en
// frakoblet-side. Da kan ingen bli sittende fast pa en gammel versjon av
// appen, og vi slipper hele klassen med "hvorfor ser jeg gammelt innhold".
const CACHE = "ukepenger-offline-v1";
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
