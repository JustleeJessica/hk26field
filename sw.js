/* JUSTLEE HK fair field log — offline cache.

   Network-first for the page itself: whenever there is signal the newest
   version wins, so an upload always reaches the phone. Cache-first for
   everything else. With no signal at all, the cached page is served. */
const CACHE = 'jl-fieldlog-v3';
const PAGE = './index.html';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(['./', PAGE]).catch(() => c.add(PAGE));
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
  const req = e.request;
  if (req.method !== 'GET') return;

  const isPage = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isPage) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const c = await caches.open(CACHE);
        c.put(PAGE, fresh.clone()).catch(() => {});
        return fresh;
      } catch (err) {
        return (await caches.match(PAGE)) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      const c = await caches.open(CACHE);
      c.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      return Response.error();
    }
  })());
});
