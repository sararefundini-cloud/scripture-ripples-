/* Scripture Ripples service worker: cache the app files for offline use. */
const CACHE_PREFIX = "scripture-ripples-";
const CACHE = CACHE_PREFIX + "v14";
const PRECACHE = [
  "./app.html",
  "./fun.css",
  "./fun.js",
  "./data/kjv.js",
  "./data/year-cross-references.js",
  "./data/henry-concise.js",
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
      return Promise.all(keys.filter(function(key) {
        return key.startsWith(CACHE_PREFIX) && key !== CACHE;
      }).map(function(key) { return caches.delete(key); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event) {
  const req = event.request;
  const scope = self.registration.scope;
  if (req.method !== "GET" || !req.url.startsWith(scope)) return;
  const url = new URL(req.url);
  const app = new URL("./app.html", scope);
  const index = new URL("./index.html", scope);
  const cacheKey = req.mode === "navigate" && url.pathname === app.pathname
    ? app.href
    : req.mode === "navigate" && (url.pathname === index.pathname || url.pathname === new URL(scope).pathname)
      ? index.href
      : req;
  event.respondWith((async function() {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    try {
      const response = await fetch(req);
      if (response.ok) await cache.put(cacheKey, response.clone()).catch(function() {});
      return response;
    } catch (error) {
      if (req.mode === "navigate") return (await cache.match(app.href)) || Response.error();
      return Response.error();
    }
  })());
});
