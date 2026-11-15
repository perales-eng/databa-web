// datABA service worker — Fase 3A: app-shell + stale-while-revalidate para HTML.
//
// Objetivo: que la PWA abra sin conexión mostrando la última versión cacheada
// de las páginas que ya visitaste. Sigue preferido network cuando hay red.
//
// Privacy: las páginas HTML pueden contener datos del usuario. Al hacer logout,
// la app envía un postMessage({type: "purge-user-cache"}) y el SW limpia el
// cache de HTML. Los assets estáticos no contienen datos y quedan.

const ASSETS_CACHE = "databa-assets-v2";
const HTML_CACHE = "databa-html-v2";

const PRECACHE_URLS = [
  "/offline.html",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
];

// Rutas no cacheables como HTML: auth y entrada pública.
// (Si cacheáramos /login con estado "ya logueado", al reabrir offline podrías
// ver una UI confusa.)
const HTML_BLOCKLIST = [/^\/api\//, /^\/auth\//, /\/signup/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purgar caches viejas (v1, etc.).
      const keep = new Set([ASSETS_CACHE, HTML_CACHE]);
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "purge-user-cache") {
    event.waitUntil(caches.delete(HTML_CACHE));
  }
  if (data.type === "skip-waiting") {
    self.skipWaiting();
  }
});

function isNavigationRequest(req) {
  return req.mode === "navigate" || req.destination === "document";
}

function isHtmlBlocked(pathname) {
  return HTML_BLOCKLIST.some((rx) => rx.test(pathname));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navegaciones HTML: stale-while-revalidate contra HTML_CACHE.
  if (isNavigationRequest(req)) {
    if (isHtmlBlocked(url.pathname)) {
      // Rutas sensibles (auth): network only, fallback a offline.html.
      event.respondWith(
        fetch(req).catch(() => caches.match("/offline.html")),
      );
      return;
    }

    event.respondWith(
      (async () => {
        const cache = await caches.open(HTML_CACHE);
        // Normalizar la clave: solo pathname (ignoramos query strings
        // volátiles como ?utm=…).
        const cacheKey = new Request(url.origin + url.pathname);
        const cached = await cache.match(cacheKey);

        const networkPromise = fetch(req)
          .then((res) => {
            // Solo cachear respuestas 200 con HTML.
            const ct = res.headers.get("content-type") || "";
            if (res.ok && ct.includes("text/html")) {
              cache.put(cacheKey, res.clone());
            }
            return res;
          })
          .catch(() => null);

        // Si hay cache: devolver inmediatamente, revalidar en background.
        if (cached) {
          // No esperamos la network para no bloquear la UI.
          event.waitUntil(networkPromise);
          return cached;
        }

        // Sin cache: esperar network. Si falla, servir offline.html.
        const fresh = await networkPromise;
        if (fresh) return fresh;
        const fallback = await caches.match("/offline.html");
        return fallback || new Response("Offline", { status: 503 });
      })(),
    );
    return;
  }

  // Assets estáticos: stale-while-revalidate contra ASSETS_CACHE.
  if (["style", "script", "image", "font"].includes(req.destination)) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
