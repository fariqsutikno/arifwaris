// Menutup menu/panel mengambang saat pengguna menekan di luarnya (area gelap di sekitar juga dihitung "di luar") atau menekan Escape.
// Elemen dengan data-tirai berada di dalam akar tetapi tidak dianggap bagian panel (latar penutup di belakang lembar).

import { useEffect, type RefObject } from 'react';

export function useTutupDiLuar(akar: RefObject<HTMLElement>, aktif: boolean, tutup: () => void): void {
  useEffect(() => {
    if (!aktif) return;
    const saatTekan = (kejadian: PointerEvent) => {
      const sasaran = kejadian.target as Element;
      if (!akar.current?.contains(sasaran) || sasaran.closest('[data-tirai]')) tutup();
    };
    const saatTombol = (kejadian: KeyboardEvent) => { if (kejadian.key === 'Escape') tutup(); };
    document.addEventListener('pointerdown', saatTekan);
    document.addEventListener('keydown', saatTombol);
    return () => { document.removeEventListener('pointerdown', saatTekan); document.removeEventListener('keydown', saatTombol); };
  });
}
