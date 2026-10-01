// Jembatan ke perangkat (PWA): izin notifikasi browser, tampilan notifikasi lewat service worker, dan tawaran "pasang aplikasi".
// Push dari server (supabase/functions/kirim-push) memakai langganan yang didaftarkan di sini setelah izin diberikan dan pengguna masuk;
// tanpa kunci VITE_VAPID_PUBLIK atau tanpa login, hanya notifikasi lokal (tampil di perangkat saat aplikasi terbuka di latar).
// Modul ini diimpor dari main.tsx supaya event beforeinstallprompt tidak terlewat.

import type { RepoAkun } from '../akun/sinkron';
import { bacaMentah, hapusMentah, simpanMentah } from '../penyimpanan';
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

const KUNCI_PUSH_AKTIF = 'arif-waris:push-aktif';
/** Perangkat ini sudah terdaftar menerima push server; kabar streak/peringkat tidak perlu ditampilkan dua kali. */
export const pushAktif = (): boolean => bacaMentah(KUNCI_PUSH_AKTIF) === '1';

/** Tampil di perangkat hanya saat izin diberi dan aplikasi sedang tidak dilihat (di layar, lonceng sudah cukup). */
export async function tampilkanDiPerangkat(notifikasi: Notifikasi): Promise<void> {
  if (izinNotifikasi() !== 'granted' || document.visibilityState === 'visible' || !('serviceWorker' in navigator)) return;
  if (pushAktif() && (notifikasi.jenis === 'streak' || notifikasi.jenis === 'peringkat')) return;
  const pendaftaran = await navigator.serviceWorker.getRegistration();
  await pendaftaran?.showNotification(notifikasi.judul, {
    body: notifikasi.isi, icon: './ikon-192.png', badge: './ikon-192.png', tag: notifikasi.id, data: { tautan: notifikasi.tautan ?? './' },
  });
}

/** Service worker hanya di build produksi: di dev ia menyimpan berkas lama dan membingungkan HMR. */
export function daftarkanServiceWorker(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) void navigator.serviceWorker.register('./sw.js').catch(() => undefined);
}

const kunciVapid = (): string | undefined => import.meta.env.VITE_VAPID_PUBLIK as string | undefined;
export const pushDidukung = (): boolean => typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && !!kunciVapid();

function dariBase64Url(teks: string): Uint8Array {
  const murni = atob(teks.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(teks.length / 4) * 4, '='));
  return Uint8Array.from(murni, huruf => huruf.charCodeAt(0));
}

/** Mendaftarkan (atau menyegarkan) langganan perangkat ini ke server; idempoten, aman dipanggil tiap pengguna masuk. */
export async function sinkronkanLangganan(repo: Pick<RepoAkun, 'pengguna'>, bahasa: 'id' | 'ar'): Promise<boolean> {
  const kunci = kunciVapid();
  if (!kunci || !pushDidukung() || izinNotifikasi() !== 'granted') return false;
  try {
    const pendaftaran = await navigator.serviceWorker.getRegistration();
    if (!pendaftaran) return false;
    const langganan = (await pendaftaran.pushManager.getSubscription())
      ?? await pendaftaran.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: dariBase64Url(kunci) as BufferSource });
    const { endpoint, keys } = langganan.toJSON();
    if (!endpoint || !keys?.p256dh || !keys.auth) return false;
    await repo.pengguna.simpanLangganan({ endpoint, p256dh: keys.p256dh, auth: keys.auth, bahasa });
    simpanMentah(KUNCI_PUSH_AKTIF, '1');
    return true;
  } catch (galat) {
    console.warn('langganan push gagal:', galat);
    return false;
  }
}

/** Dipanggil saat keluar akun: perangkat ini berhenti menerima push milik akun tersebut. Gagal jaringan tidak menghalangi keluar. */
export async function cabutLangganan(repo: Pick<RepoAkun, 'pengguna'>): Promise<void> {
  try {
    const langganan = await (await navigator.serviceWorker?.getRegistration())?.pushManager.getSubscription();
    if (langganan) {
      await repo.pengguna.hapusLangganan(langganan.endpoint).catch(() => undefined);
      await langganan.unsubscribe();
    }
  } catch {
    // Tanpa service worker atau dukungan push: tidak ada yang dicabut.
  } finally {
    hapusMentah(KUNCI_PUSH_AKTIF);
  }
}
