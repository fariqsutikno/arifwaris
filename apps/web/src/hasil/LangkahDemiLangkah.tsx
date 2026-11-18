// Mode "Langkah demi langkah" (lapisan penuh): kepala (tahap, judul, Lainnya, tutup), badan (tampilan Teks), bar bawah (ruas tahap,
// Kembali, Lanjut). Posisi = satu indeks datar atas linimasa dari packages/explain. Menggantikan modal lama FokusLangkah
// (docs/design/rencana-integrasi-langkah-demi-langkah.md bagian 4). Sinema menyusul.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Linimasa } from '@waris/explain';
import type { HasilOk } from '../jalankan';
import { Ikon } from '../ui/Ikon';
import { TampilanTeks } from './TampilanTeks';
import type { RingkasanHasil } from './ringkasan';
import { useSorot } from './sorot';
import { urutanLinimasa, visualTerakhir } from './urutanLinimasa';
import { angka, t } from '../terjemah';

interface Props {
  linimasa: Linimasa;
  hasil: HasilOk;
  ringkasan: RingkasanHasil;
  sembunyiNominal: boolean;
  pohon: ReactNode;
  saatTutup: () => void;
}

export function LangkahDemiLangkah({ linimasa, hasil, ringkasan, sembunyiNominal, pohon, saatTutup }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const urutan = useMemo(() => urutanLinimasa(linimasa), [linimasa]);
  const [indeks, setIndeks] = useState(0);
  const [semua, setSemua] = useState(false);
  const [lainnyaTerbuka, setLainnyaTerbuka] = useState(false);
  const { setLangkah } = useSorot();
  const posisi = urutan[indeks]!;
  const tahap = linimasa.tahap[posisi.tahap]!;
  const terakhir = indeks === urutan.length - 1;

  useEffect(() => {
    const semula = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    wadah.current?.querySelector<HTMLButtonElement>('[data-tutup]')?.focus();
    return () => { document.body.style.overflow = semula; };
  }, []);

  // Pohon menyorot orang menurut visual pohon terakhir; PeranPohon memakai nama yang sama dengan PeranSorot.
  useEffect(() => {
    const pohonTerakhir = visualTerakhir(linimasa, urutan, semua ? urutan.length - 1 : indeks, 'pohon');
    setLangkah(pohonTerakhir ? { peran: new Map(Object.entries(pohonTerakhir.sorot)), kolom: undefined, panah: [], ketukan: indeks } : null);
  }, [linimasa, urutan, indeks, semua, setLangkah]);
  useEffect(() => () => setLangkah(null), [setLangkah]);

  const maju = () => { if (terakhir) saatTutup(); else setIndeks(indeks + 1); };
  const mundur = () => setIndeks(Math.max(0, indeks - 1));
  const keTahap = (nomorTahap: number) => {
    setIndeks(urutan.findIndex(satu => satu.tahap === nomorTahap));
    setSemua(false);
    setLainnyaTerbuka(false);
  };
  const saatKunci = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { if (lainnyaTerbuka) setLainnyaTerbuka(false); else saatTutup(); }
    else if (event.key === 'ArrowRight' && !semua) maju();
    else if (event.key === 'ArrowLeft' && !semua) mundur();
  };

  return createPortal(
    <div className="langkah-demi-langkah" role="dialog" aria-modal="true" aria-label={t('hasil.langkah_demi_langkah')} ref={wadah} onKeyDown={saatKunci}>
      <header className="kepala-ldl">
        <div className="judul-ldl">
          <p>{semua ? t('langkah.semua_tahap')
            : `${t('langkah.tahap_dari', { nomor: angka(String(posisi.tahap + 1)), total: angka(String(linimasa.tahap.length)) })} · ${t('langkah.langkah_dari', { nomor: angka(String(posisi.langkah + 1)), total: angka(String(tahap.langkah.length)) })}`}</p>
          <h1>{semua ? t('langkah.judul_semua') : tahap.judul}</h1>
        </div>
        <button type="button" className="tombol-ikon" onClick={() => setLainnyaTerbuka(true)} aria-label={t('langkah.lainnya')} aria-haspopup="dialog"><Ikon nama="lainnya" /></button>
        <button type="button" className="tombol-ikon" data-tutup onClick={saatTutup} aria-label={t('umum.tutup')}><Ikon nama="salah" /></button>
      </header>
      <div className="badan-ldl">
        <TampilanTeks linimasa={linimasa} urutan={urutan} indeks={indeks} semua={semua} hasil={hasil} ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} pohon={pohon} />
      </div>
      <footer className="bawah-ldl">
        <div className="kemajuan-ldl">
          {linimasa.tahap.map((satu, nomor) => (
            <button key={satu.id} type="button" className="ruas" style={{ flex: satu.langkah.length }} onClick={() => keTahap(nomor)}
              aria-label={`${t('langkah.tahap_dari', { nomor: angka(String(nomor + 1)), total: angka(String(linimasa.tahap.length)) })}: ${satu.judul}`}>
              {satu.langkah.map((_, langkah) => {
                const nomorDatar = urutan.findIndex(p => p.tahap === nomor && p.langkah === langkah);
                return <i key={langkah} className={nomorDatar < indeks ? 'lewat' : nomorDatar === indeks ? 'kini' : undefined} />;
              })}
            </button>
          ))}
        </div>
        {semua ? (
          <div className="kontrol-ldl"><button type="button" className="tautan-ldl" onClick={() => setSemua(false)}>{t('langkah.satu_per_satu')}</button></div>
        ) : (
          <div className="kontrol-ldl">
            <button type="button" className="tautan-ldl" disabled={indeks === 0} onClick={mundur}>{t('umum.kembali')}</button>
            <button type="button" className="aw-btn aw-btn-primary" onClick={maju}>{terakhir ? t('langkah.selesai') : t('umum.lanjut')}</button>
          </div>
        )}
      </footer>
      {lainnyaTerbuka && (
        <div className="lainnya-ldl" role="dialog" aria-label={t('langkah.lainnya')}>
          <div className="atas-lainnya"><b>{t('langkah.lainnya')}</b><button type="button" className="tautan-ldl" onClick={() => setLainnyaTerbuka(false)}>{t('umum.tutup')}</button></div>
          <p className="sub-lainnya">{t('langkah.lompat_ke_tahap')}</p>
          <div className="tahapan-lainnya">
            {linimasa.tahap.map((satu, nomor) => (
              <button key={satu.id} type="button" aria-current={!semua && nomor === posisi.tahap} onClick={() => keTahap(nomor)}>{angka(String(nomor + 1))}. {satu.judul}</button>
            ))}
          </div>
          <button type="button" className="baris-lainnya" onClick={() => { setSemua(true); setLainnyaTerbuka(false); }}>{t('langkah.tampilkan_semua')}</button>
        </div>
      )}
    </div>,
    document.body,
  );
}
