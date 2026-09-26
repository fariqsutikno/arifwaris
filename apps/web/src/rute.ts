// Rute halaman berbasis `location.hash` supaya halaman belajar bisa dibagikan lewat URL (`#/belajar/1-1-apa-itu-faraidh`,
// `#/glosarium/ashabah`, `#/rujukan/R09-4`).
// `#/` (atau hash tak dikenal) = Beranda; `#/hitung` = kalkulator, yang tetap memakai state reducer.

import { useEffect, useState } from 'react';

export type Rute =
  | { halaman: 'beranda' }
  | { halaman: 'kalkulator' }
  | { halaman: 'belajar' }
  | { halaman: 'materi'; slug: string }
  | { halaman: 'latihan'; tab: 'hitung' | 'kuis'; paket?: string }
  | { halaman: 'faq'; id?: string }
  | { halaman: 'tanya-jawab'; id?: string }
  | { halaman: 'riwayat' }
  | { halaman: 'glosarium'; id?: string }
  | { halaman: 'rujukan'; kode?: string; kategori?: string; kitab?: string };

export function bacaRute(hash: string): Rute {
  const [halaman, parameter] = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (halaman === 'hitung') return { halaman: 'kalkulator' };
  if (halaman === 'belajar') return parameter ? { halaman: 'materi', slug: parameter } : { halaman };
  if (halaman === 'latihan') {
    const paket = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent)[2];
    return parameter === 'kuis' ? (paket ? { halaman, tab: 'kuis', paket } : { halaman, tab: 'kuis' }) : { halaman, tab: 'hitung' };
  }
  if (halaman === 'riwayat') return { halaman };
  if (halaman === 'faq') return parameter ? { halaman, id: parameter } : { halaman };
  if (halaman === 'tanya-jawab') return parameter ? { halaman, id: parameter } : { halaman };
  if (halaman === 'glosarium') return parameter ? { halaman, id: parameter } : { halaman };
  if (halaman === 'rujukan') {
    if (!parameter) return { halaman };
    if (/^R\d{2}-\d+$/.test(parameter)) return { halaman, kode: parameter };
    const kitab = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent)[2];
    return kitab ? { halaman, kategori: parameter, kitab } : { halaman, kategori: parameter };
  }
  return { halaman: 'beranda' };
}

export const tautanBelajar = (slug?: string) => `#/belajar${slug ? `/${encodeURIComponent(slug)}` : ''}`;
export const tautanLatihan = (tab: 'hitung' | 'kuis' = 'hitung', paket?: string) =>
  (tab === 'kuis' ? `#/latihan/kuis${paket ? `/${encodeURIComponent(paket)}` : ''}` : '#/latihan');
export const tautanRiwayat = () => '#/riwayat';
export const tautanFaq = (id?: string) => `#/faq${id ? `/${encodeURIComponent(id)}` : ''}`;
export const tautanTanyaJawab = (id?: string) => `#/tanya-jawab${id ? `/${encodeURIComponent(id)}` : ''}`;
export const tautanGlosarium = (id?: string) => `#/glosarium${id ? `/${encodeURIComponent(id)}` : ''}`;
export const tautanRujukan = (kode?: string) => `#/rujukan${kode ? `/${encodeURIComponent(kode)}` : ''}`;
export const TAUTAN_BERANDA = '#/';
export const TAUTAN_KALKULATOR = '#/hitung';

/** Halaman induk untuk tombol Kembali: selalu naik satu tingkat, bukan ke halaman yang terakhir dibuka. */
export function tautanInduk(rute: Rute): string {
  switch (rute.halaman) {
    case 'materi': case 'faq': case 'tanya-jawab': case 'glosarium': return tautanBelajar();
    case 'riwayat': return TAUTAN_KALKULATOR;
    case 'rujukan': return rute.kode || rute.kitab !== undefined ? tautanRujukan(rute.kitab !== undefined ? 'kitab' : undefined) : tautanBelajar();
    case 'latihan': return rute.paket ? tautanLatihan('kuis') : tautanBelajar();
    default: return TAUTAN_BERANDA;
  }
}

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
