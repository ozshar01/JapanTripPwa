const CACHE = 'japan-trip-shell-v1';
const DATA_FILE = 'data/trip-data.js';
const ASSETS = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirstData(request) {
  const cache = await caches.open(CACHE);
  try {
    const url = new URL(request.url);
    url.searchParams.set('_refresh', Date.now().toString());
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirstShell(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.pathname.endsWith('/' + DATA_FILE)) {
    event.respondWith(networkFirstData(event.request));
    return;
  }

  event.respondWith(cacheFirstShell(event.request));
});
