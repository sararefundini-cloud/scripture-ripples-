/* Scripture Ripples service worker: cache the app files for offline use. */
const CACHE = "scripture-ripples-v6";
const PRECACHE = [
  "./app.html",
  "./index.html",
  "./pond-static-click-recovery-v23.html",
  "./privacy.html",
  "./support.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./favicon.ico"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(PRECACHE);
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event) {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        const copy = res.clone();
        if (res.ok && (req.url.indexOf(self.registration.scope) === 0)) {
          caches.open(CACHE).then(function(cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function() {
        if (req.mode === "navigate") {
          return caches.match("./app.html");
        }
        return caches.match(req);
      });
    })
  );
});
