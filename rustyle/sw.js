// Service worker: офлайн-оболочка приложения. API всегда идёт в сеть.
const V = 'rustyle-v4';
const SHELL = ['./', 'css/app.css', 'js/app.js', 'js/core.js', 'js/client.js', 'js/tryon.js', 'js/master.js', 'js/owner.js', 'js/nailart.js', 'js/localapi.js', 'icons/icon.svg', 'icons/icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/api/')) return;
  if (/\/(vendor|uploads|models)\//.test(u.pathname)) { // тяжёлые неизменяемые файлы: сначала кэш
    e.respondWith(caches.open(V).then(async (c) => (await c.match(e.request)) || fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; })));
    return;
  }
  // оболочка: сначала сеть (чтобы обновления приходили сразу), при обрыве — кэш
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(V).then((c) => c.put(e.request, cp)); } return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match('./'))));
});
self.addEventListener('notificationclick', (e) => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow('./#/notifications')))); });
