// sw.js — cache stale-while-revalidate
const CACHE = 'roadmap-v5';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './src/css/tokens.css',
  './src/css/base.css',
  './src/css/components.css',
  './src/js/app.js',
  './src/js/store.js',
  './src/js/schedule.js',
  './src/js/data.js',
  './src/js/progress.js',
  './src/js/pomodoro.js',
  './src/js/notifications.js',
  './src/views/home.js',
  './src/views/track.js',
  './src/views/lists.js',
  './src/views/week.js',
  './src/data/tracks.json',
  './src/data/schedule.json',
  './src/data/certs.json',
  './src/data/tracks/linux.json',
  './src/data/tracks/docker.json',
  './src/data/tracks/kubernetes.json',
  './src/data/tracks/redes.json',
  './src/data/tracks/aws.json',
  './src/data/tracks/gcp.json',
  './src/data/tracks/system-design.json',
  './src/data/tracks/sql.json',
  './src/data/tracks/nosql.json',
  './src/data/tracks/algoritmos.json',
  './src/data/tracks/eda.json',
  './src/data/tracks/c.json',
  './src/data/tracks/python.json',
  './src/data/tracks/java.json',
  './src/data/tracks/go.json',
  './src/data/tracks/pos-fiap.json',
  './src/data/tracks/alemao.json',
  './src/data/tracks/ingles.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
