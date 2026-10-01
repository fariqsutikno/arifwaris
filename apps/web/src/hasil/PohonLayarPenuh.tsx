// Pohon layar penuh: zoom (tombol, roda tetikus, tombol +/-), geser (seret atau tombol panah), pas ke layar.
// Mengetuk orang membuka penjelasannya lewat saatPilih milik <Pohon/> (modal orang yang sudah ada).
// Bagikan: cetak, atau buka dialog Ekspor yang sudah ada. Escape menutup, kecuali ada modal di atasnya.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Ikon } from '../ui/Ikon';
import { t } from '../terjemah';

const ZOOM_MIN = 0.3;
const ZOOM_MAKS = 4;
const LANGKAH_ZOOM = 1.25;
const LANGKAH_GESER = 60;
const AMBANG_SERET = 5;

interface Posisi { z: number; x: number; y: number }

interface Props {
  pohon: ReactNode;
  zoomAwal?: number;
  legenda?: ReactNode;
  sembunyiNominal: boolean;
  saatSembunyi: () => void;
  saatEkspor: () => void;
  saatTutup: () => void;
}

export function PohonLayarPenuh({ pohon, zoomAwal = 1, legenda, sembunyiNominal, saatSembunyi, saatEkspor, saatTutup }: Props) {
  const panggung = useRef<HTMLDivElement>(null);
  const isi = useRef<HTMLDivElement>(null);
  const tombolTutup = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<Posisi>({ z: 1, x: 0, y: 0 });
  const [menuBagikan, setMenuBagikan] = useState(false);
  const [diseret, setDiseret] = useState(false);
  const seret = useRef<{ x: number; y: number; px: number; py: number; geser: boolean } | null>(null);

  const pas = () => {
    const kotak = panggung.current?.getBoundingClientRect();
    const pohonEl = isi.current;
    if (!kotak || !pohonEl) return;
    const z = Math.min(kotak.width / pohonEl.offsetWidth, kotak.height / pohonEl.offsetHeight, 1) * 0.94;
    setPos({ z, x: (kotak.width - pohonEl.offsetWidth * z) / 2, y: (kotak.height - pohonEl.offsetHeight * z) / 2 });
  };
  const zoomDi = (faktor: number, cx?: number, cy?: number) => setPos(lama => {
    const kotak = panggung.current?.getBoundingClientRect();
    const px = cx ?? (kotak?.width ?? 0) / 2;
    const py = cy ?? (kotak?.height ?? 0) / 2;
    const z = Math.min(ZOOM_MAKS, Math.max(ZOOM_MIN, lama.z * faktor));
    return { z, x: px - (px - lama.x) * (z / lama.z), y: py - (py - lama.y) * (z / lama.z) };
  });

  useLayoutEffect(() => {
    pas();
    if (zoomAwal !== 1) zoomDi(zoomAwal);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya saat dibuka
  }, []);

  // Kunci gulir halaman, fokus ke tombol tutup, kembalikan fokus saat ditutup.
  useEffect(() => {
    const sebelumnya = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    tombolTutup.current?.focus();
    return () => { document.body.style.overflow = ''; sebelumnya?.focus?.(); };
  }, []);

  useEffect(() => {
    const saatKunci = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.querySelector('.modal-latar')) return; // modal orang menutup dirinya dulu
        if (menuBagikan) setMenuBagikan(false); else saatTutup();
      } else if (e.key === '+' || e.key === '=') zoomDi(LANGKAH_ZOOM);
      else if (e.key === '-') zoomDi(1 / LANGKAH_ZOOM);
      else if (e.key.startsWith('Arrow') && !(e.target as HTMLElement).closest('button, a, input')) {
        const dx = e.key === 'ArrowLeft' ? LANGKAH_GESER : e.key === 'ArrowRight' ? -LANGKAH_GESER : 0;
        const dy = e.key === 'ArrowUp' ? LANGKAH_GESER : e.key === 'ArrowDown' ? -LANGKAH_GESER : 0;
        setPos(lama => ({ ...lama, x: lama.x + dx, y: lama.y + dy }));
      }
    };
    document.addEventListener('keydown', saatKunci);
    return () => document.removeEventListener('keydown', saatKunci);
  }, [menuBagikan, saatTutup]);

  useEffect(() => { // roda tetikus: pendengar non-pasif supaya halaman tidak ikut tergulir
    const el = panggung.current;
    if (!el) return;
    const saatRoda = (e: WheelEvent) => {
      e.preventDefault();
      const kotak = el.getBoundingClientRect();
      zoomDi(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - kotak.left, e.clientY - kotak.top);
    };
    el.addEventListener('wheel', saatRoda, { passive: false });
    return () => el.removeEventListener('wheel', saatRoda);
  }, []);

  const mulaiSeret = (e: React.PointerEvent) => { seret.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y, geser: false }; };
  const gerakSeret = (e: React.PointerEvent) => {
    const s = seret.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.geser && Math.hypot(dx, dy) > AMBANG_SERET) { s.geser = true; setDiseret(true); panggung.current?.setPointerCapture(e.pointerId); }
    if (s.geser) setPos(lama => ({ ...lama, x: s.px + dx, y: s.py + dy }));
  };
  const selesaiSeret = () => { seret.current = null; setDiseret(false); };

  return (
    <div className="pohon-penuh" role="dialog" aria-modal="true" aria-label={t('hitung.pohon_keluarga')}>
      <div className="pohon-penuh-atas">
        <h2>{t('hitung.pohon_keluarga')}</h2>
        <div className="pohon-penuh-alat">
          <button type="button" className="alat-bulat" aria-label={t('hitung.perkecil')} onClick={() => zoomDi(1 / LANGKAH_ZOOM)}><Ikon nama="zoomKeluar" /></button>
          <button type="button" className="alat-bulat" aria-label={t('hitung.perbesar')} onClick={() => zoomDi(LANGKAH_ZOOM)}><Ikon nama="zoomMasuk" /></button>
          <button type="button" className="alat-bulat" aria-label={t('hitung.pas_ke_layar')} title={t('hitung.pas_ke_layar')} onClick={pas}><Ikon nama="fokus" /></button>
          <button type="button" className="alat-teks" onClick={saatSembunyi}>{sembunyiNominal ? t('hitung.tampilkan_nominal') : t('hitung.sembunyikan_nominal')}</button>
        </div>
        <div className="pohon-penuh-alat">
          <div className="menu-bagikan">
            <button type="button" className="aw-btn aw-btn-primary" aria-haspopup="true" aria-expanded={menuBagikan} onClick={() => setMenuBagikan(!menuBagikan)}>
              <Ikon nama="bagikan" /> {t('hitung.bagikan')}
            </button>
            {menuBagikan && (
              <div className="menu-bagikan-isi" role="menu">
                <button type="button" role="menuitem" onClick={() => { setMenuBagikan(false); saatEkspor(); }}><Ikon nama="unduh" /> {t('hitung.ekspor')}</button>
                <button type="button" role="menuitem" onClick={() => { setMenuBagikan(false); window.print(); }}><Ikon nama="berkas" /> {t('hitung.cetak_pohon')}</button>
              </div>
            )}
          </div>
          <button type="button" className="alat-bulat" ref={tombolTutup} aria-label={t('hitung.tutup_layar_penuh')} onClick={saatTutup}><Ikon nama="salah" /></button>
        </div>
      </div>
      <div className={diseret ? 'pohon-penuh-panggung diseret' : 'pohon-penuh-panggung'} ref={panggung}
        onPointerDown={mulaiSeret} onPointerMove={gerakSeret} onPointerUp={selesaiSeret} onPointerCancel={selesaiSeret}>
        <div className="pohon-penuh-isi" ref={isi} style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.z})` }}>{pohon}</div>
        {legenda && <div className="pohon-penuh-legenda">{legenda}</div>}
        <p className="pohon-penuh-petunjuk">{t('hitung.petunjuk_pohon_layar_penuh')}</p>
      </div>
    </div>
  );
}
