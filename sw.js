// Service Worker for PWA

const CACHE_NAME = "hair-color-ai-v1";
const urlsToCache = [
  "/hair-color-ai-app/",
  "/hair-color-ai-app/index.html",
  "/hair-color-ai-app/styles.css",
  "/hair-color-ai-app/app.js",
  "/hair-color-ai-app/color-database.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
