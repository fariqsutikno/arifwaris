// Rute halaman berbasis `location.hash` supaya halaman belajar bisa dibagikan lewat URL (`#/belajar/1-1-apa-itu-faraidh`,
// `#/glosarium/ashabah`, `#/rujukan/R09-4`).
// `#/` (atau hash tak dikenal) = Beranda; `#/hitung` = awal kalkulator. Kasus yang sedang dikerjakan punya id sendiri di URL
// (`#/hitung/<id>` = hasil, `/langkah/3/1` = wizard langkah 3 babak 1, `/cerita`), jadi muat ulang kembali ke halaman itu.

import { useEffect, useState } from 'react';

export type Rute =
  | { halaman: 'beranda' }
  | { halaman: 'kalkulator'; kasus?: PosisiKasus }
  | { halaman: 'belajar' }
  | { halaman: 'materi'; slug: string }
  | { halaman: 'latihan'; tab: 'hitung' | 'kuis'; paket?: string }
  | { halaman: 'faq'; id?: string }
  | { halaman: 'tanya-jawab'; slug?: string }
  | { halaman: 'riwayat' }
  | { halaman: 'peringkat' }
  | { halaman: 'dibagikan'; slug: string }
  | { halaman: 'glosarium'; id?: string }
  | { halaman: 'rujukan'; kode?: string; kategori?: string; kitab?: string };

/** Posisi kasus di Hitung: id entri riwayat + layar (wizard membawa langkah dan babak). */
export interface PosisiKasus { id: string; layar: 'hasil' | 'cerita' | 'wizard'; langkah?: number; babak?: number }

export function bacaRute(hash: string): Rute {
  const [halaman, parameter] = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (halaman === 'hitung') {
    if (!parameter) return { halaman: 'kalkulator' };
    const [, , bagian, langkah, babak] = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    if (bagian === 'cerita') return { halaman: 'kalkulator', kasus: { id: parameter, layar: 'cerita' } };
    if (bagian === 'langkah' && Number.isInteger(Number(langkah))) {
      return { halaman: 'kalkulator', kasus: { id: parameter, layar: 'wizard', langkah: Number(langkah), babak: Number(babak) || 0 } };
    }
    return { halaman: 'kalkulator', kasus: { id: parameter, layar: 'hasil' } };
  }
  if (halaman === 'belajar') return parameter ? { halaman: 'materi', slug: parameter } : { halaman };
  if (halaman === 'latihan') {
    const paket = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent)[2];
    return parameter === 'kuis' ? (paket ? { halaman, tab: 'kuis', paket } : { halaman, tab: 'kuis' }) : { halaman, tab: 'hitung' };
  }
  if (halaman === 'k' && parameter) return { halaman: 'dibagikan', slug: parameter };
  if (halaman === 'riwayat' || halaman === 'peringkat') return { halaman };
  if (halaman === 'faq') return parameter ? { halaman, id: parameter } : { halaman };
  if (halaman === 'tanya-jawab') return parameter ? { halaman, slug: parameter } : { halaman };
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
/** Kasus yang dibagikan: `#/k/<slug>`; slug = huruf kecil, angka, strip (sama dengan check di tabel kasus_dibagikan). */
export const SLUG_BAGIKAN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const tautanBagikan = (slug: string) => `#/k/${encodeURIComponent(slug)}`;
export const alamatBagikan = (slug: string) => `${window.location.origin}${window.location.pathname}${tautanBagikan(slug)}`;
export const tautanRiwayat = () => '#/riwayat';
export const tautanPeringkat = () => '#/peringkat';
export const tautanFaq = (id?: string) => `#/faq${id ? `/${encodeURIComponent(id)}` : ''}`;
export const tautanTanyaJawab = (slug?: string) => `#/tanya-jawab${slug ? `/${encodeURIComponent(slug)}` : ''}`;
export const tautanGlosarium = (id?: string) => `#/glosarium${id ? `/${encodeURIComponent(id)}` : ''}`;
export const tautanRujukan = (kode?: string) => `#/rujukan${kode ? `/${encodeURIComponent(kode)}` : ''}`;
export const TAUTAN_BERANDA = '#/';
export const TAUTAN_KALKULATOR = '#/hitung';

/** Tautan posisi kasus; tanpa kasus atau di layar awal = `#/hitung`. */
export function tautanKasus(id: string, keadaan: { layar: string; langkah: number; babak: number; ada: boolean }): string {
  if (!keadaan.ada || keadaan.layar === 'awal') return TAUTAN_KALKULATOR;
  const dasar = `${TAUTAN_KALKULATOR}/${encodeURIComponent(id)}`;
  if (keadaan.layar === 'wizard') return `${dasar}/langkah/${keadaan.langkah}${keadaan.babak > 0 ? `/${keadaan.babak}` : ''}`;
  return keadaan.layar === 'cerita' ? `${dasar}/cerita` : dasar;
}

/** Halaman induk untuk tombol Kembali: selalu naik satu tingkat, bukan ke halaman yang terakhir dibuka. */
export function tautanInduk(rute: Rute): string {
  switch (rute.halaman) {
    case 'materi': case 'faq': case 'glosarium': return tautanBelajar();
    case 'tanya-jawab': return rute.slug ? tautanTanyaJawab() : tautanBelajar();
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
