// datABA service worker — cacheo conservador.
// Estrategia: network-first para todo, fallback a cache y luego a /offline.html.
// No cachea responses HTML del lado autenticado (server components) para
// evitar mostrar datos de otro usuario tras logout.

const CACHE = "databa-v1";
const PRECACHE_URLS = [
  "/offline.html",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Sólo manejar same-origin.
  if (url.origin !== self.location.origin) return;

  // No tocar rutas de auth ni API.
  if (url.pathname.startsWith("/api/")) return;

  // Documento HTML: network-first → offline.html en fallo total.
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cached = await caches.match(req);
        return cached || caches.match("/offline.html");
      }),
    );
    return;
  }

  // Assets estáticos (script, style, image, font): stale-while-revalidate.
  if (["style", "script", "image", "font"].includes(req.destination)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
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
