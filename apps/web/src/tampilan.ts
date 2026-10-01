// Preferensi tampilan per perangkat: gerak dikurangi dan suara. Satu pengaturan untuk seluruh aplikasi.
// Tidak ikut akun (HP dan laptop wajar berbeda). Gerak: pilihan pengguna atau permintaan sistem
// (prefers-reduced-motion) → <html data-gerak="kurang">, yang dibaca satu aturan CSS global.
// Suara: "ikut" = nyala di Belajar dan Latihan, mati di Hitung kasus (sering dibuka saat rapat keluarga).

import { useSyncExternalStore } from 'react';
import { bacaMentah, simpanMentah } from './penyimpanan';

const KUNCI_GERAK = 'arif-waris:gerak-kurang';
const KUNCI_SUARA = 'arif-waris:suara';
const MEDIA_KURANGI_GERAK = '(prefers-reduced-motion: reduce)';

export type PilihanSuara = 'ikut' | 'nyala' | 'mati';
export type KonteksSuara = 'belajar' | 'hitung';

const pendengar = new Set<() => void>();
const kabari = () => pendengar.forEach(dengar => dengar());
const langgan = (dengar: () => void) => { pendengar.add(dengar); return () => { pendengar.delete(dengar); }; };

export const sistemMengurangiGerak = (): boolean => typeof window !== 'undefined' && !!window.matchMedia?.(MEDIA_KURANGI_GERAK).matches;
export const penggunaMengurangiGerak = (): boolean => bacaMentah(KUNCI_GERAK) === '1';
export const geraknyaDikurangi = (): boolean => sistemMengurangiGerak() || penggunaMengurangiGerak();

/** Pasang atau lepas data-gerak di <html> menurut keadaan sekarang. */
export function pasangGerak(): void {
  if (geraknyaDikurangi()) document.documentElement.setAttribute('data-gerak', 'kurang');
  else document.documentElement.removeAttribute('data-gerak');
}

export function simpanGerakKurang(kurang: boolean): void {
  simpanMentah(KUNCI_GERAK, kurang ? '1' : '0');
  pasangGerak();
  kabari();
}

/** Dipanggil sekali saat aplikasi mulai: pasang atribut dan ikuti perubahan pengaturan sistem. */
export function mulaiTampilan(): void {
  pasangGerak();
  window.matchMedia?.(MEDIA_KURANGI_GERAK).addEventListener?.('change', () => { pasangGerak(); kabari(); });
}

export const useGerakDikurangi = (): boolean => useSyncExternalStore(langgan, geraknyaDikurangi);

export function bacaSuara(): PilihanSuara {
  const nilai = bacaMentah(KUNCI_SUARA);
  return nilai === 'nyala' || nilai === 'mati' ? nilai : 'ikut';
}

export function simpanSuara(pilihan: PilihanSuara): void {
  simpanMentah(KUNCI_SUARA, pilihan);
  kabari();
}

export const suaraAktif = (konteks: KonteksSuara): boolean => {
  const pilihan = bacaSuara();
  return pilihan === 'nyala' || (pilihan === 'ikut' && konteks === 'belajar');
};

export const useSuara = (): PilihanSuara => useSyncExternalStore(langgan, bacaSuara);
