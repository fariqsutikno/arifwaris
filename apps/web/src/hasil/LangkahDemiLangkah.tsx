// Mode "Langkah demi langkah" (lapisan penuh): kepala (tahap, judul, Teks | Sinema, Lainnya, tutup), badan (satu dari dua
// tampilan), bar bawah (ruas tahap, Kembali, Lanjut). Posisi = satu indeks datar atas linimasa dari packages/explain, jadi pindah
// tampilan tidak menggeser posisi. Sinema memutar otomatis dengan suara (narasiSuara.ts); bar bawah memudar saat diputar dan diam.
// Menggantikan modal lama FokusLangkah (docs/design/rencana-integrasi-langkah-demi-langkah.md bagian 4).

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { keTeksBiasa, type Linimasa } from '@waris/explain';
import { Ikon } from '../ui/Ikon';
import { lamaBacaMs, ucapkan, useAdaSuaraIndonesia } from './narasiSuara';
import { TabelLangkah } from './TabelLangkah';
import { TampilanSinema } from './TampilanSinema';
import { TampilanTeks } from './TampilanTeks';
import type { RingkasanHasil } from './ringkasan';
import { useSorot } from './sorot';
import { babakDi, selSampai, urutanLinimasa, visualTerakhir, type PeragaBabak } from './urutanLinimasa';
import { bacaMentah, simpanMentah } from '../penyimpanan';
import { angka, t } from '../terjemah';

interface Props {
  linimasa: Linimasa;
  babak: PeragaBabak[];
  ringkasanAkhir: RingkasanHasil;
  sembunyiNominal: boolean;
  pohon: ReactNode;
  saatTutup: () => void;
}

type Tampilan = 'teks' | 'sinema';
const KUNCI_TAMPILAN = 'arif-waris:langkah-tampilan';
const KUNCI_SUARA_SINEMA = 'arif-waris:langkah-suara';
const KECEPATAN = [1, 1.25, 1.5, 0.75] as const;
/** Setelah satu langkah selesai dibacakan, jeda sebentar sebelum langkah berikutnya. */
const JEDA_ANTAR_LANGKAH_MS = 700;
const DIAM_SEBELUM_MEMUDAR_MS = 3000;

export function LangkahDemiLangkah({ linimasa, babak, ringkasanAkhir, sembunyiNominal, pohon, saatTutup }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const urutan = useMemo(() => urutanLinimasa(linimasa), [linimasa]);
  const [indeks, setIndeks] = useState(0);
  const [semua, setSemua] = useState(false);
  const [lainnyaTerbuka, setLainnyaTerbuka] = useState(false);
  const [tampilan, setTampilan] = useState<Tampilan>(() => (bacaMentah(KUNCI_TAMPILAN) === 'sinema' ? 'sinema' : 'teks'));
  const [bermain, setBermain] = useState(false);
  const [kecepatan, setKecepatan] = useState<(typeof KECEPATAN)[number]>(1);
  const [suaraNyala, setSuaraNyala] = useState(() => bacaMentah(KUNCI_SUARA_SINEMA) !== 'mati');
  const [diam, setDiam] = useState(false);
  const [lapisan, setLapisan] = useState<'pohon' | 'tabel' | null>(null);
  const adaSuara = useAdaSuaraIndonesia();
  const { setLangkah } = useSorot();
  const sinema = tampilan === 'sinema';
  const posisi = urutan[indeks]!;
  const tahap = linimasa.tahap[posisi.tahap]!;
  const terakhir = indeks === urutan.length - 1;
  const nomorBabak = babakDi(linimasa, urutan, indeks);

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

  // Putar otomatis: bacakan narasi (atau tunggu lama baca bila tak ada suara Indonesia), jeda, lanjut ke langkah berikut.
  useEffect(() => {
    if (!sinema || !bermain) return;
    const teks = keTeksBiasa(linimasa.tahap[posisi.tahap]!.langkah[posisi.langkah]!.narasi);
    let jedaBerikut = 0;
    const lanjutkan = () => {
      jedaBerikut = window.setTimeout(() => (terakhir ? setBermain(false) : setIndeks(nilai => nilai + 1)), JEDA_ANTAR_LANGKAH_MS / kecepatan);
    };
    let batalUcap: (() => void) | undefined;
    let tungguBaca = 0;
    if (suaraNyala && adaSuara) batalUcap = ucapkan(teks, kecepatan, lanjutkan);
    else tungguBaca = window.setTimeout(lanjutkan, lamaBacaMs(teks, kecepatan));
    return () => { batalUcap?.(); window.clearTimeout(tungguBaca); window.clearTimeout(jedaBerikut); };
  }, [sinema, bermain, indeks, kecepatan, suaraNyala, adaSuara, linimasa, posisi.tahap, posisi.langkah, terakhir]);

  // Bar bawah memudar setelah diam, hanya saat diputar; gerak atau ketukan memunculkannya lagi.
  useEffect(() => {
    if (!sinema || !bermain || lainnyaTerbuka) { setDiam(false); return; }
    const mulai = () => window.setTimeout(() => setDiam(true), DIAM_SEBELUM_MEMUDAR_MS);
    let waktu = mulai();
    const bangun = () => { setDiam(false); window.clearTimeout(waktu); waktu = mulai(); };
    const akar = wadah.current;
    akar?.addEventListener('pointermove', bangun);
    akar?.addEventListener('pointerdown', bangun);
    akar?.addEventListener('keydown', bangun);
    return () => { window.clearTimeout(waktu); akar?.removeEventListener('pointermove', bangun); akar?.removeEventListener('pointerdown', bangun); akar?.removeEventListener('keydown', bangun); };
  }, [sinema, bermain, lainnyaTerbuka]);

  const pilihTampilan = (baru: Tampilan) => {
    setTampilan(baru); setSemua(false); setBermain(false);
    simpanMentah(KUNCI_TAMPILAN, baru);
  };
  const gantiSuara = () => { simpanMentah(KUNCI_SUARA_SINEMA, suaraNyala ? 'mati' : 'nyala'); setSuaraNyala(!suaraNyala); };
  const gantiKecepatan = () => setKecepatan(KECEPATAN[(KECEPATAN.indexOf(kecepatan) + 1) % KECEPATAN.length]!);
  const maju = () => { if (terakhir) saatTutup(); else setIndeks(indeks + 1); };
  const mundur = () => setIndeks(Math.max(0, indeks - 1));
  const keTahap = (nomorTahap: number) => {
    setIndeks(urutan.findIndex(satu => satu.tahap === nomorTahap));
    setSemua(false);
    setLainnyaTerbuka(false);
  };
  const saatKunci = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { if (lapisan) setLapisan(null); else if (lainnyaTerbuka) setLainnyaTerbuka(false); else saatTutup(); }
    else if (event.key === 'ArrowRight' && !semua) maju();
    else if (event.key === 'ArrowLeft' && !semua) mundur();
  };

  return createPortal(
    <div className={['langkah-demi-langkah', sinema && 'sinema', diam && 'diam'].filter(Boolean).join(' ')} role="dialog" aria-modal="true" aria-label={t('hasil.langkah_demi_langkah')} ref={wadah} onKeyDown={saatKunci}>
      <header className="kepala-ldl">
        <div className="judul-ldl">
          <p>{semua ? t('langkah.semua_tahap')
            : `${t('langkah.tahap_dari', { nomor: angka(String(posisi.tahap + 1)), total: angka(String(linimasa.tahap.length)) })} · ${t('langkah.langkah_dari', { nomor: angka(String(posisi.langkah + 1)), total: angka(String(tahap.langkah.length)) })}`}</p>
          <h1>{semua ? t('langkah.judul_semua') : tahap.judul}</h1>
        </div>
        <div className="pilih-tampilan" role="group" aria-label={t('langkah.tampilan')}>
          <button type="button" aria-pressed={!sinema} onClick={() => pilihTampilan('teks')}>{t('langkah.teks')}</button>
          <button type="button" aria-pressed={sinema} onClick={() => pilihTampilan('sinema')}>{t('langkah.sinema')}</button>
        </div>
        <button type="button" className="tombol-ikon" onClick={() => setLainnyaTerbuka(true)} aria-label={t('langkah.lainnya')} aria-haspopup="dialog"><Ikon nama="lainnya" /></button>
        <button type="button" className="tombol-ikon" data-tutup onClick={saatTutup} aria-label={t('umum.tutup')}><Ikon nama="salah" /></button>
      </header>
      <div className="badan-ldl">
        {sinema
          ? <TampilanSinema linimasa={linimasa} urutan={urutan} indeks={indeks} babak={babak} ringkasanAkhir={ringkasanAkhir} sembunyiNominal={sembunyiNominal} pohon={pohon} />
          : <TampilanTeks linimasa={linimasa} urutan={urutan} indeks={indeks} semua={semua} babak={babak} ringkasanAkhir={ringkasanAkhir} sembunyiNominal={sembunyiNominal} pohon={pohon} />}
      </div>
      <footer className="bawah-ldl">
        <div className="kemajuan-ldl">
          {linimasa.tahap.map((satu, nomor) => (
            <button key={nomor} type="button" className="ruas" style={{ flex: satu.langkah.length }} onClick={() => keTahap(nomor)}
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
            {sinema && (
              <button type="button" className="tombol-putar" onClick={() => setBermain(!bermain)} aria-pressed={bermain}
                aria-label={bermain ? t('langkah.jeda_otomatis') : t('langkah.putar_otomatis')}><Ikon nama={bermain ? 'jeda' : 'putar'} /></button>
            )}
            <button type="button" className="aw-btn aw-btn-primary" onClick={maju}>{terakhir ? t('langkah.selesai') : t('umum.lanjut')}</button>
          </div>
        )}
      </footer>
      {lapisan && (
        <div className="lapisan-ldl" role="dialog" aria-label={lapisan === 'pohon' ? t('langkah.pohon_keluarga') : t('langkah.tabel_faraidh')}>
          <div className="atas-lainnya"><b>{lapisan === 'pohon' ? t('langkah.pohon_keluarga') : t('langkah.tabel_faraidh')}</b><button type="button" className="tautan-ldl" onClick={() => setLapisan(null)}>{t('umum.tutup')}</button></div>
          {lapisan === 'pohon' ? pohon : (
            <div className="wadah-tabel"><TabelLangkah kolom={linimasa.tabel[nomorBabak]!} hasil={babak[nomorBabak]!.hasil} ringkasan={babak[nomorBabak]!.ringkasan} sembunyiNominal={sembunyiNominal} {...selSampai(linimasa, urutan, indeks, nomorBabak)} kini={new Set()} /></div>
          )}
        </div>
      )}
      {lainnyaTerbuka && (
        <div className="lainnya-ldl" role="dialog" aria-label={t('langkah.lainnya')}>
          <div className="atas-lainnya"><b>{t('langkah.lainnya')}</b><button type="button" className="tautan-ldl" onClick={() => setLainnyaTerbuka(false)}>{t('umum.tutup')}</button></div>
          <p className="sub-lainnya">{t('langkah.lompat_ke_tahap')}</p>
          <div className="tahapan-lainnya">
            {linimasa.tahap.map((satu, nomor) => (
              <button key={nomor} type="button" aria-current={!semua && nomor === posisi.tahap} onClick={() => keTahap(nomor)}>{angka(String(nomor + 1))}. {satu.judul}</button>
            ))}
          </div>
          {!sinema && <button type="button" className="baris-lainnya" onClick={() => { setSemua(true); setLainnyaTerbuka(false); }}>{t('langkah.tampilkan_semua')}</button>}
          {sinema && <>
            <button type="button" className="baris-lainnya" onClick={gantiKecepatan}>{t('langkah.kecepatan', { kali: angka(String(kecepatan)) })}</button>
            <button type="button" className="baris-lainnya" aria-pressed={suaraNyala} onClick={gantiSuara}>{suaraNyala ? t('langkah.suara_nyala') : t('langkah.suara_mati')}</button>
            {!adaSuara && <p className="catatan-lainnya">{t('langkah.suara_tak_ada')}</p>}
            <button type="button" className="baris-lainnya" onClick={() => { setLapisan('pohon'); setLainnyaTerbuka(false); }}>{t('langkah.lihat_pohon')}</button>
            {babak.length > 0 && <button type="button" className="baris-lainnya" onClick={() => { setLapisan('tabel'); setLainnyaTerbuka(false); }}>{t('langkah.lihat_tabel')}</button>}
          </>}
        </div>
      )}
    </div>,
    document.body,
  );
}
