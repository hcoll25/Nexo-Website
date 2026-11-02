// NEXO Owner app: keeps the dashboard's own files on the phone so it opens fast and still opens offline.
// Only the dashboard (/admin...) is covered; the public site and the Sheet's data are never stored here.
const CACHE = 'nexo-owner-v1';
const SHELL = ['/admin.html', '/app/manifest.webmanifest', '/app/icon-192.png', '/app/icon-512.png', '/app/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  if (req.mode === 'navigate') {
    // the newest dashboard when online, the saved one when not
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('/admin.html', copy)); return r; })
      .catch(() => caches.match('/admin.html')));
    return;
  }
  // styles, fonts and icons: saved copy first, refreshed in the background
  e.respondWith(caches.match(req).then(hit => {
    const fresh = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; });
    return hit || fresh;
  }));
});
