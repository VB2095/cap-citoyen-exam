const CACHE_NAME = "cap-citoyen-v1.1.2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./official-bank.js",
  "./questions.js",
  "./data/glossaire-notions-civiques.json",
  "./app.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./icons/icon-192-v3.png",
  "./icons/icon-512-v3.png",
  "./icons/icon-maskable-512-v3.png",
  "./icons/apple-touch-icon-v3.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "GET_VERSION") {
    event.source?.postMessage({ type: "APP_VERSION", version: CACHE_NAME });
  }
});

async function networkFirst(request) {
  try {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("network-timeout")), 3500);
    });
    const response = await Promise.race([fetch(request), timeout]);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return (await caches.match(request)) || (await caches.match("./index.html"));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  const frequentlyUpdatedFiles = ["index.html", "official-bank.js", "questions.js", "glossaire-notions-civiques.json", "app.js", "pwa.js"];
  const needsFreshContent = request.mode === "navigate"
    || frequentlyUpdatedFiles.some(file => url.pathname.endsWith(`/${file}`));

  event.respondWith(needsFreshContent ? networkFirst(request) : cacheFirst(request));
});
