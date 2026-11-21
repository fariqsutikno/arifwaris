// Panel pohon di ubin "Pohon keluarga dan tabel faraidh" (acuan mockup-hasil-per-kasus): toolbar − + muat layar-penuh,
// tombol gelap "Putar aliran", lalu pohon yang bisa diperbesar di tempat. Zoom memakai transform seperti PratinjauPohon;
// garis pohon mengukur skala dari kotak node sesungguhnya, jadi tetap lurus. Tanpa zoom manual pohon muat lebar panel.

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Ikon } from '../ui/Ikon';
import { t } from '../terjemah';

const ZOOM_MIN = 0.3;
const ZOOM_MAKS = 2.5;
const LANGKAH_ZOOM = 1.25;

export function PanelPohon({ pohon, legenda, saatLayarPenuh, saatPutar }: { pohon: ReactNode; legenda: ReactNode; saatLayarPenuh: () => void; saatPutar?: (() => void) | undefined }) {
  const wadah = useRef<HTMLDivElement>(null);
  const isi = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [ukuran, setUkuran] = useState({ lebar: 0, tinggi: 0, pas: 1 });

  useLayoutEffect(() => {
    const kotak = wadah.current;
    const badan = isi.current;
    if (!kotak || !badan) return;
    const ukur = () => {
      const lebar = badan.offsetWidth;
      const tinggi = badan.offsetHeight;
      if (!lebar || !tinggi) return;
      const pas = Math.min(1, kotak.clientWidth / lebar);
      setUkuran(lama => (lama.lebar === lebar && lama.tinggi === tinggi && lama.pas === pas ? lama : { lebar, tinggi, pas }));
    };
    ukur();
    const pengamat = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(ukur);
    pengamat?.observe(kotak);
    pengamat?.observe(badan);
    return () => pengamat?.disconnect();
  }, []);

  const skala = zoom ?? ukuran.pas;
  const ubah = (faktor: number) => setZoom(Math.min(ZOOM_MAKS, Math.max(ZOOM_MIN, skala * faktor)));

  return (
    <div className="panel-pohon-hasil" aria-label={t('hitung.pohon_keluarga')}>
      <div className="alat-pohon">
        <button type="button" className="alat-bulat" aria-label={t('hitung.perkecil')} onClick={() => ubah(1 / LANGKAH_ZOOM)}><Ikon nama="zoomKeluar" /></button>
        <button type="button" className="alat-bulat" aria-label={t('hitung.perbesar')} onClick={() => ubah(LANGKAH_ZOOM)}><Ikon nama="zoomMasuk" /></button>
        <button type="button" className="alat-bulat" aria-label={t('hitung.pas_ke_layar')} title={t('hitung.pas_ke_layar')} onClick={() => setZoom(null)}><Ikon nama="fokus" /></button>
        <button type="button" className="alat-bulat" aria-label={t('hitung.layar_penuh')} title={t('hitung.layar_penuh')} onClick={saatLayarPenuh}><Ikon nama="perbesar" /></button>
        {saatPutar && <button type="button" className="tombol-aliran" onClick={saatPutar}><Ikon nama="putar" ukuran={16} />{t('hasil.putar_aliran')}</button>}
      </div>
      <div className="wadah-pohon" ref={wadah}>
        <div style={{ width: ukuran.lebar * skala || undefined, height: ukuran.tinggi * skala || undefined }}>
          <div ref={isi} style={{ width: 'max-content', transform: `scale(${skala})`, transformOrigin: 'top left' }}>{pohon}</div>
        </div>
      </div>
      {legenda}
    </div>
  );
}
