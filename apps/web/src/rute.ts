// Rute halaman berbasis `location.hash` supaya halaman belajar bisa dibagikan lewat URL (`#/belajar/1-1-apa-itu-faraidh`,
// `#/glosarium/ashabah`, `#/rujukan/R09-4`).
// Kalkulator tetap memakai state reducer; hash kosong atau `#/` = kalkulator.

import { useEffect, useState } from 'react';

export type Rute =
  | { halaman: 'kalkulator' }
  | { halaman: 'belajar' }
  | { halaman: 'materi'; slug: string }
  | { halaman: 'latihan'; tab: 'hitung' | 'kuis' }
  | { halaman: 'faq'; id?: string }
  | { halaman: 'riwayat' }
  | { halaman: 'glosarium'; id?: string }
  | { halaman: 'rujukan'; kode?: string };

export function bacaRute(hash: string): Rute {
  const [halaman, parameter] = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (halaman === 'belajar') return parameter ? { halaman: 'materi', slug: parameter } : { halaman };
  if (halaman === 'latihan') return { halaman, tab: parameter === 'kuis' ? 'kuis' : 'hitung' };
  if (halaman === 'riwayat') return { halaman };
  if (halaman === 'faq') return parameter ? { halaman, id: parameter } : { halaman };
  if (halaman === 'glosarium') return parameter ? { halaman, id: parameter } : { halaman };
  if (halaman === 'rujukan') return parameter ? { halaman, kode: parameter } : { halaman };
  return { halaman: 'kalkulator' };
}

export const tautanBelajar = (slug?: string) => `#/belajar${slug ? `/${encodeURIComponent(slug)}` : ''}`;
export const tautanLatihan = (tab: 'hitung' | 'kuis' = 'hitung') => (tab === 'kuis' ? '#/latihan/kuis' : '#/latihan');
export const tautanRiwayat = () => '#/riwayat';
export const tautanFaq = (id?: string) => `#/faq${id ? `/${encodeURIComponent(id)}` : ''}`;
export const tautanGlosarium = (id?: string) => `#/glosarium${id ? `/${encodeURIComponent(id)}` : ''}`;
export const tautanRujukan = (kode?: string) => `#/rujukan${kode ? `/${encodeURIComponent(kode)}` : ''}`;
export const TAUTAN_KALKULATOR = '#/';

export function useRute(): Rute {
  const [rute, setRute] = useState(() => bacaRute(window.location.hash));
  useEffect(() => {
    // Pindah halaman mulai dari atas, seperti tautan biasa; Glosarium menggulir sendiri ke istilah yang dituju.
    const saatBerubah = () => { window.scrollTo(0, 0); setRute(bacaRute(window.location.hash)); };
    window.addEventListener('hashchange', saatBerubah);
    return () => window.removeEventListener('hashchange', saatBerubah);
  }, []);
  return rute;
}
