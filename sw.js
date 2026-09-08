/* Offline cache for the JUSTLEE HK fair field log.
   Cache-first. Only index.html is required, so a missing or renamed
   icon can never break offline mode. */
const CACHE = 'jl-fieldlog-v2';
const REQUIRED = ['./', './index.html'];
const OPTIONAL = ['./icon.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(REQUIRED);
    await Promise.all(OPTIONAL.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request);
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      const c = await caches.open(CACHE);
      c.put(e.request, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      return (await caches.match('./index.html')) || Response.error();
    }
  })());
});
