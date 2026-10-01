// Service worker Arif Waris: aplikasi tetap terbuka tanpa internet (berkas /assets bernama hash disimpan, halaman
// diambil dari jaringan dulu lalu cadangan), dan menampilkan notifikasi (push dari server kelak, atau lokal dari halaman).
const CACHE = 'arif-waris-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', kejadian => {
  kejadian.waitUntil(caches.keys()
    .then(nama => Promise.all(nama.filter(isi => isi !== CACHE).map(isi => caches.delete(isi))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', kejadian => {
  const { request } = kejadian;
  const alamat = new URL(request.url);
  if (request.method !== 'GET' || alamat.origin !== self.location.origin) return;
  const berkasHash = alamat.pathname.includes('/assets/');
  kejadian.respondWith(berkasHash ? cacheDulu(request) : jaringanDulu(request));
});

async function cacheDulu(request) {
  const cache = await caches.open(CACHE);
  return (await cache.match(request)) ?? simpanDari(await fetch(request), request, cache);
}

async function jaringanDulu(request) {
  const cache = await caches.open(CACHE);
  try {
    return simpanDari(await fetch(request), request, cache);
  } catch (galat) {
    const cadangan = (await cache.match(request)) ?? (request.mode === 'navigate' ? await cache.match('./') : undefined);
    if (cadangan) return cadangan;
    throw galat;
  }
}

function simpanDari(respons, request, cache) {
  if (respons.ok) void cache.put(request, respons.clone());
  return respons;
}

self.addEventListener('push', kejadian => {
  const data = kejadian.data ? kejadian.data.json() : {};
  kejadian.waitUntil(self.registration.showNotification(data.judul ?? 'Arif Waris', {
    body: data.isi ?? '', icon: './ikon-192.png', badge: './ikon-192.png', data: { tautan: data.tautan ?? './' },
  }));
});

self.addEventListener('notificationclick', kejadian => {
  kejadian.notification.close();
  const tujuan = new URL(kejadian.notification.data?.tautan ?? './', self.location.href).href;
  kejadian.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(daftar => {
    const terbuka = daftar.find(klien => 'focus' in klien);
    return terbuka ? terbuka.focus().then(klien => klien.navigate(tujuan)) : self.clients.openWindow(tujuan);
  }));
});
