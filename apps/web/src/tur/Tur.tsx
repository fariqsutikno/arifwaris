// Tur singkat: menyorot satu elemen [data-tur] sekali, sisanya digelapkan. Lubang sorot digambar di level halaman
// (position: fixed) supaya tidak terjebak stacking context kartu sticky. Sasaran yang tidak terlihat dilewati.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { LangkahTur } from '../konten/tur';
import { tandaiTurDilihat } from '../preferensi';
import { Tombol } from '../ui/komponen';
import { t } from '../terjemah';

interface Props { daftar: LangkahTur[]; kunci: string; sedangBerjalan: boolean; saatSelesai: () => void }

const JARAK_SOROT = 6;

export function Tur({ daftar, kunci, sedangBerjalan, saatSelesai }: Props) {
  const tersedia = useTersedia(daftar, sedangBerjalan);
  const [indeks, setIndeks] = useState(0);
  const [kotak, setKotak] = useState<DOMRect | null>(null);
  const popup = useRef<HTMLDivElement>(null);
  const langkahIni = tersedia[indeks];

  const selesai = useCallback(() => { tandaiTurDilihat(kunci); setIndeks(0); saatSelesai(); }, [kunci, saatSelesai]);

  useLayoutEffect(() => {
    if (!sedangBerjalan || !langkahIni) return;
    const elemen = document.querySelector(`[data-tur="${langkahIni.sasaran}"]`);
    elemen?.scrollIntoView?.({ block: 'center' });
    const ukur = () => setKotak(elemen?.getBoundingClientRect() ?? null);
    ukur();
    window.addEventListener('scroll', ukur, { passive: true });
    window.addEventListener('resize', ukur);
    popup.current?.querySelector<HTMLButtonElement>('[data-utama]')?.focus();
    return () => { window.removeEventListener('scroll', ukur); window.removeEventListener('resize', ukur); };
  }, [sedangBerjalan, langkahIni]);

  useEffect(() => {
    if (!sedangBerjalan) return;
    const saatTombol = (event: KeyboardEvent) => { if (event.key === 'Escape') selesai(); };
    document.addEventListener('keydown', saatTombol);
    return () => document.removeEventListener('keydown', saatTombol);
  }, [sedangBerjalan, selesai]);

  if (!sedangBerjalan || !langkahIni) return null;
  const adalahTerakhir = indeks === tersedia.length - 1;
  const posisiPopup = hitungPosisiPopup(kotak);

  return (
    <>
      <div className="tur-tirai" onClick={selesai} />
      {kotak && (
        <div className="tur-lubang" aria-hidden="true" style={{
          top: kotak.top - JARAK_SOROT, left: kotak.left - JARAK_SOROT,
          width: kotak.width + JARAK_SOROT * 2, height: kotak.height + JARAK_SOROT * 2,
        }} />
      )}
      <div ref={popup} className="tur-pop" role="dialog" aria-label="Tur singkat" style={posisiPopup}>
        <small>{indeks + 1} / {tersedia.length}</small>
        <h4>{langkahIni.judul}</h4>
        <p>{langkahIni.isi}</p>
        <div className="tur-aksi">
          <Tombol varian="ghost" kecil onClick={selesai}>{t('Lewati')}</Tombol>
          <span className="pengisi" />
          <Tombol varian="sun" kecil data-utama onClick={() => (adalahTerakhir ? selesai() : setIndeks(indeks + 1))}>
            {adalahTerakhir ? 'Selesai' : 'Lanjut'}
          </Tombol>
        </div>
      </div>
    </>
  );
}

/** Hanya langkah yang elemennya ada dan terlihat di layar saat tur dimulai. */
function useTersedia(daftar: LangkahTur[], sedangBerjalan: boolean): LangkahTur[] {
  const [tersedia, setTersedia] = useState<LangkahTur[]>([]);
  useLayoutEffect(() => {
    if (!sedangBerjalan) return;
    setTersedia(daftar.filter(langkah => {
      const elemen = document.querySelector<HTMLElement>(`[data-tur="${langkah.sasaran}"]`);
      return !!elemen && !elemen.closest('[hidden]');
    }));
  }, [daftar, sedangBerjalan]);
  return tersedia;
}

function hitungPosisiPopup(kotak: DOMRect | null): { top: number; left: number } {
  if (!kotak) return { top: 80, left: 16 };
  const tinggiPopup = 180, lebarPopup = 320, jarak = 14;
  const muatDiBawah = kotak.bottom + jarak + tinggiPopup < window.innerHeight - 80;
  const top = muatDiBawah ? kotak.bottom + jarak : Math.max(16, kotak.top - tinggiPopup - jarak);
  const left = Math.max(16, Math.min(kotak.left, window.innerWidth - lebarPopup - 16));
  return { top, left };
}
