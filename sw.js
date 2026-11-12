const CACHE = 'prompter-v3';
const BIG = 'prompter-speech-v1';   // speech model and library: big, so kept across app updates and never re-downloaded
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const isBig = u => /\/(model|vendor)\//.test(u.pathname) || /vosk-model|vosk-browser/.test(u.href);
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== BIG).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (isBig(u)) {
    // Cache first: after the first download the speech model comes from the phone, not the internet.
    e.respondWith(caches.open(BIG).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) c.put(e.request, res.clone()).catch(() => {});
      return res;
    }))));
    return;
  }
  // Network first so new versions show up as soon as you are online; cache is the offline fallback.
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
