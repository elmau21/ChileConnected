/* ChileConnected PWA
 * Service worker con cache básico + fallback offline.
 * Objetivo: mejorar fiabilidad de instalación y experiencia en redes lentas.
 */

const CACHE_VERSION = "cc-pwa-v1";
const CACHE_NAME = `cc-pwa-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/sw.js",
  "/icon-192",
  "/icon-512",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // En desarrollo (localhost) NO cacheamos para evitar HTML stale + hydration mismatch.
      if (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1") {
        self.skipWaiting();
        return;
      }
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(PRECACHE_URLS);
      } catch {
        // Si algún recurso falla (ej. todavía no existe), no bloqueamos la instalación.
      } finally {
        self.skipWaiting();
      }
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.map((k) => {
            if (k !== CACHE_NAME) return caches.delete(k);
            return Promise.resolve();
          }),
        );
      } finally {
        await self.clients.claim();
      }
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Solo cacheamos nuestro origen.
  if (url.origin !== self.location.origin) return;
  // En desarrollo (localhost) evitamos cache para no servir HTML viejo.
  if (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1") {
    event.respondWith(fetch(req));
    return;
  }

  // Para navegación: network-first con fallback a cache.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match("/");
          return fallback ?? new Response("Offline", { status: 503 });
        }
      })(),
    );
    return;
  }

  // Para assets: cache-first (mejor para recursos estáticos).
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        return cached ?? new Response("", { status: 504 });
      }
    })(),
  );
});
