// Gerak halaman gaya Logivo yang dipakai bersama (Beranda, Belajar): sorot ubin mengikuti kursor, cahaya hero mengikuti
// kursor, dan pemisah kata terakhir judul untuk garis tekanan. Murni penyajian.

import { useEffect, type PointerEvent as KejadianReact, type RefObject } from 'react';

/** Titik sorot di ubin yang sedang disentuh kursor (CSS: .ubin::before). */
export function sorotUbin(kejadian: KejadianReact<HTMLElement>) {
  const ubin = (kejadian.target as HTMLElement).closest<HTMLElement>('.ubin');
  if (!ubin) return;
  const kotak = ubin.getBoundingClientRect();
  ubin.style.setProperty('--px', `${kejadian.clientX - kotak.left}px`);
  ubin.style.setProperty('--py', `${kejadian.clientY - kotak.top}px`);
}

/** Cahaya hangat hero mengikuti kursor dengan gerak melambat (easing); tanpa gerak bila pengguna mengurangi animasi. */
export function useCahayaIkutKursor(hero: RefObject<HTMLElement>) {
  useEffect(() => {
    const elemen = hero.current;
    if (!elemen || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const target = { x: 0, y: 0 };
    const kini = { x: 0, y: 0 };
    let bingkai = 0;
    const gerak = () => {
      kini.x += (target.x - kini.x) * 0.08;
      kini.y += (target.y - kini.y) * 0.08;
      elemen.style.setProperty('--mx', `${kini.x}px`);
      elemen.style.setProperty('--my', `${kini.y}px`);
      bingkai = Math.abs(target.x - kini.x) + Math.abs(target.y - kini.y) > 0.5 ? requestAnimationFrame(gerak) : 0;
    };
    const saatGerak = (kejadian: PointerEvent) => {
      const kotak = elemen.getBoundingClientRect();
      target.x = kejadian.clientX - kotak.left;
      target.y = kejadian.clientY - kotak.top;
      if (!bingkai) bingkai = requestAnimationFrame(gerak);
    };
    // Posisi awal = titik bawaan CSS (kanan tengah) supaya tidak melompat saat kursor pertama datang.
    const awal = elemen.getBoundingClientRect();
    target.x = kini.x = awal.width * 0.72;
    target.y = kini.y = awal.height * 0.58;
    elemen.addEventListener('pointermove', saatGerak);
    return () => { elemen.removeEventListener('pointermove', saatGerak); cancelAnimationFrame(bingkai); };
  }, [hero]);
}

/** Kata terakhir judul diberi tekanan (garis tergambar); kalimat satu kata tidak dipisah. */
export function pisahKataAkhir(teks: string): [string, string] {
  const titik = teks.lastIndexOf(' ');
  return titik < 0 ? ['', teks] : [teks.slice(0, titik), teks.slice(titik + 1)];
}
