// Jembatan ke perangkat (PWA): izin notifikasi browser, tampilan notifikasi lewat service worker, dan tawaran "pasang aplikasi".
// Notifikasi dari server (push) belum ada pengirimnya; di sini notifikasi lokal hanya tampil di perangkat saat aplikasi
// terbuka di latar. Modul ini diimpor dari main.tsx supaya event beforeinstallprompt tidak terlewat.

import type { Notifikasi } from './gudang';

interface PeristiwaPasang extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
export const PERISTIWA_PASANG = 'arif-waris:bisa-dipasang';

let tawaranPasang: PeristiwaPasang | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', kejadian => {
    kejadian.preventDefault();
    tawaranPasang = kejadian as PeristiwaPasang;
    window.dispatchEvent(new Event(PERISTIWA_PASANG));
  });
  window.addEventListener('appinstalled', () => { tawaranPasang = null; window.dispatchEvent(new Event(PERISTIWA_PASANG)); });
}

export const bisaDipasang = (): boolean => tawaranPasang !== null;
export async function pasangAplikasi(): Promise<void> {
  const tawaran = tawaranPasang;
  if (!tawaran) return;
  await tawaran.prompt();
  await tawaran.userChoice;
  tawaranPasang = null;
  window.dispatchEvent(new Event(PERISTIWA_PASANG));
}

export const izinNotifikasi = (): NotificationPermission | 'tidakDidukung' =>
  typeof Notification === 'undefined' ? 'tidakDidukung' : Notification.permission;

export async function mintaIzinNotifikasi(): Promise<NotificationPermission | 'tidakDidukung'> {
  if (typeof Notification === 'undefined') return 'tidakDidukung';
  return Notification.requestPermission();
}

/** Tampil di perangkat hanya saat izin diberi dan aplikasi sedang tidak dilihat (di layar, lonceng sudah cukup). */
export async function tampilkanDiPerangkat(notifikasi: Notifikasi): Promise<void> {
  if (izinNotifikasi() !== 'granted' || document.visibilityState === 'visible' || !('serviceWorker' in navigator)) return;
  const pendaftaran = await navigator.serviceWorker.getRegistration();
  await pendaftaran?.showNotification(notifikasi.judul, {
    body: notifikasi.isi, icon: './ikon-192.png', badge: './ikon-192.png', tag: notifikasi.id, data: { tautan: notifikasi.tautan ?? './' },
  });
}

/** Service worker hanya di build produksi: di dev ia menyimpan berkas lama dan membingungkan HMR. */
export function daftarkanServiceWorker(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) void navigator.serviceWorker.register('./sw.js').catch(() => undefined);
}
