// datABA service worker — Fase 3A v3: cachea HTML full y RSC payloads.
//
// Next.js app router hace dos tipos de fetches para la misma ruta:
//  1. Hard load (reload / typed URL): navigation request, devuelve HTML completo.
//  2. Soft load (<Link> click): fetch con header "rsc: 1", devuelve RSC payload.
//
// Ambos son necesarios para navegar offline. Antes solo cachéabamos (1), por
// eso al clickear links offline fallaba y veías "sin conexión".
//
// Privacy: ante logout, la app manda postMessage({type: "purge-user-cache"}).

const ASSETS_CACHE = "databa-assets-v3";
const HTML_CACHE = "databa-html-v3";

const PRECACHE_URLS = [
  "/offline.html",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
];

// Rutas no cacheables: auth y registro público (su contenido depende del
// estado de login).
const HTML_BLOCKLIST = [/^\/api\//, /^\/auth\//, /\/signup/, /^\/login/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
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

function isHtmlBlocked(pathname) {
  return HTML_BLOCKLIST.some((rx) => rx.test(pathname));
}

/** Detecta si la request es un fetch RSC de Next.js (soft navigation). */
function isRscRequest(req) {
  // Next 16 marca RSC fetches con el header `rsc: 1` (o `next-router-prefetch`).
  const rscHeader = req.headers.get("rsc") || req.headers.get("Next-Router-Prefetch");
  return !!rscHeader;
}

/** Detecta navegaciones full-page (reload, URL directa). */
function isFullNavigation(req) {
  return req.mode === "navigate" || req.destination === "document";
}

/**
 * Clave de cache: separamos HTML full y RSC payloads para el mismo pathname.
 * Si no, un RSC payload cacheado se devolvería ante una navegación full y
 * el browser mostraría basura.
 */
function cacheKey(url, isRsc) {
  return new Request(url.origin + url.pathname + (isRsc ? "#rsc" : ""));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const fullNav = isFullNavigation(req);
  const rsc = isRscRequest(req);

  // Páginas protegidas (navegación o RSC): stale-while-revalidate contra HTML_CACHE.
  if (fullNav || rsc) {
    if (isHtmlBlocked(url.pathname)) {
      event.respondWith(
        fetch(req).catch(() => (fullNav ? caches.match("/offline.html") : Response.error())),
      );
      return;
    }

    event.respondWith(
      (async () => {
        const cache = await caches.open(HTML_CACHE);
        const key = cacheKey(url, rsc);
        const cached = await cache.match(key);

        const networkPromise = fetch(req)
          .then((res) => {
            // Solo cachear 2xx. No validamos content-type porque los RSC
            // payloads usan "text/x-component" y los HTML usan "text/html".
            if (res.ok) {
              cache.put(key, res.clone()).catch(() => {});
            }
            return res;
          })
          .catch(() => null);

        if (cached) {
          event.waitUntil(networkPromise);
          return cached;
        }

        const fresh = await networkPromise;
        if (fresh) return fresh;

        // Último recurso: si es navigation full, servir offline.html.
        // Si es RSC, devolver error — Next va a mostrar su propia pantalla.
        if (fullNav) {
          const fallback = await caches.match("/offline.html");
          return fallback || new Response("Offline", { status: 503 });
        }
        return Response.error();
      })(),
    );
    return;
  }

  // Assets estáticos (script, style, image, font): stale-while-revalidate.
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
