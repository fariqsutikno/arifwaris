// Rute halaman berbasis `location.hash` supaya halaman belajar bisa dibagikan lewat URL (`#/glosarium/ashabah`).
// Kalkulator tetap memakai state reducer; hash kosong atau `#/` = kalkulator.

import { useEffect, useState } from 'react';

export type Rute =
  | { halaman: 'kalkulator' }
  | { halaman: 'glosarium'; id?: string }
  | { halaman: 'rujukan'; kode?: string };

export function bacaRute(hash: string): Rute {
  const [halaman, parameter] = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (halaman === 'glosarium') return parameter ? { halaman, id: parameter } : { halaman };
  if (halaman === 'rujukan') return parameter ? { halaman, kode: parameter } : { halaman };
  return { halaman: 'kalkulator' };
}

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
