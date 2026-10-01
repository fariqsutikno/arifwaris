// Ringkasan streak/XP milik pengguna yang masuk, dibaca sekali dan dipakai bersama (header, kartu streak Beranda HP, notifikasi).
// Dimuat saat login dan tiap kegiatan sampai server (PERISTIWA_KEGIATAN_TERKIRIM). Tanpa login atau gagal: null.

import { useEffect, useSyncExternalStore } from 'react';
import type { RingkasanPeringkat, Sesi } from '@waris/data';
import { PERISTIWA_KEGIATAN_TERKIRIM } from './antrean';
import type { RepoAkun } from './sinkron';

let ringkasanKini: RingkasanPeringkat | null = null;
const pendengar = new Set<() => void>();
const atur = (nilai: RingkasanPeringkat | null) => { ringkasanKini = nilai; pendengar.forEach(panggil => panggil()); };

/** Pasang sekali di tempat yang mengenal sesi (Aplikasi); pembaca lain cukup memakai useRingkasanSaya. */
export function useMuatRingkasan(sesi: Sesi | null, repo: RepoAkun | null): void {
  useEffect(() => {
    atur(null);
    if (!sesi || !repo) return;
    let masihDipakai = true;
    const muat = () => repo.peringkat.ringkasanSaya()
      .then(hasil => { if (masihDipakai) atur(hasil); })
      .catch(galat => console.warn('streak gagal dimuat:', galat));
    void muat();
    window.addEventListener(PERISTIWA_KEGIATAN_TERKIRIM, muat);
    return () => { masihDipakai = false; window.removeEventListener(PERISTIWA_KEGIATAN_TERKIRIM, muat); };
  }, [sesi?.userId, repo]);
}

export const useRingkasanSaya = (): RingkasanPeringkat | null => useSyncExternalStore(
  panggil => { pendengar.add(panggil); return () => { pendengar.delete(panggil); }; },
  () => ringkasanKini,
);
