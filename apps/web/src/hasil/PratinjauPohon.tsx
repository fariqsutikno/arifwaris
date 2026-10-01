// Pratinjau pohon di hero hasil: seluruh pohon (apa adanya, dari <Pohon/>) diperkecil sampai muat lebar dan tinggi kotak.
// Hanya pratinjau: tidak bisa diklik per orang dan tidak ikut urutan tab (inert); mengetuk di mana saja membuka layar penuh,
// tempat zoom, geser, dan penjelasan per orang.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { t } from '../terjemah';

const TINGGI_MAKS = 360;

export function PratinjauPohon({ children, saatBuka, label }: { children: ReactNode; saatBuka: () => void; label?: string }) {
  const wadah = useRef<HTMLDivElement>(null);
  const isi = useRef<HTMLDivElement>(null);
  const [ukuran, setUkuran] = useState({ skala: 1, lebar: 0, tinggi: 0 });

  useLayoutEffect(() => {
    const kotak = wadah.current;
    const pohon = isi.current;
    if (!kotak || !pohon) return;
    const ukur = () => {
      const lebar = pohon.offsetWidth;
      const tinggi = pohon.offsetHeight;
      if (!lebar || !tinggi) return;
      const skala = Math.min(1, kotak.clientWidth / lebar, TINGGI_MAKS / tinggi);
      setUkuran(lama => (lama.skala === skala && lama.lebar === lebar && lama.tinggi === tinggi ? lama : { skala, lebar, tinggi }));
    };
    ukur();
    const pengamat = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(ukur);
    pengamat?.observe(kotak);
    pengamat?.observe(pohon);
    return () => pengamat?.disconnect();
  }, []);

  // Isi pratinjau tidak interaktif; React 18 belum mengenal atribut inert, jadi dipasang langsung.
  useEffect(() => { isi.current?.setAttribute('inert', ''); }, []);

  return (
    <div className="pratinjau-pohon" ref={wadah} role="button" tabIndex={0} aria-label={label ?? t('hitung.buka_pohon_layar_penuh')}
      style={{ height: ukuran.tinggi * ukuran.skala || undefined }}
      onClick={saatBuka} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); saatBuka(); } }}>
      <div className="pratinjau-isi" ref={isi}
        style={{ transform: `scale(${ukuran.skala})`, insetInlineStart: `calc(50% - ${(ukuran.lebar * ukuran.skala) / 2}px)` }}>
        {children}
      </div>
    </div>
  );
}
