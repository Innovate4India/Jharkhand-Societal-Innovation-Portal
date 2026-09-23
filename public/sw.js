const CACHE_NAME = "sahayak-public-v3";
const APP_SHELL = ["/", "/manifest.json", "/sw.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

function isPublicStaticAsset(request, url) {
  return request.destination === "script"
    || request.destination === "style"
    || request.destination === "font"
    || request.destination === "image"
    || url.pathname.startsWith("/_next/static/")
    || url.pathname === "/manifest.json"
    || url.pathname === "/sw.js";
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    if (url.pathname !== "/") return;

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  if (!isPublicStaticAsset(request, url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const update = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });

      if (cached) {
        event.waitUntil(update.catch(() => undefined));
        return cached;
      }

      return update;
    }),
  );
});
