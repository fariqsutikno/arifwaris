// Kerangka satu layar wizard: pita gelap ringkas (nomor langkah, stepper, pertanyaan utama) lalu lembar terang yang menimpanya
// berisi penjelasan singkat, isian, dan panggung pohon di samping (di HP: di bawah isian, supaya isian pertama langsung terlihat).
// Pita memakai kerangka Beranda, jadi navbar menyatu dengannya. Pertanyaan dan caption bisa diganti per layar (Keluarga punya dua layar).
// Aksi merusak (Mulai kasus baru) ada di kaki lembar sebagai tautan pelan, bukan di dekat judul.

import type { ReactNode } from 'react';
import { LANGKAH_WIZARD } from '../../konten/wizard';
import { t } from '../../terjemah';

interface Props {
  langkah: number;
  children: ReactNode;
  ringkasan?: ReactNode;
  subjudul?: string | undefined;
  stepper: ReactNode;
  saatReset: () => void;
  /** Mengganti pertanyaan utama bawaan langkah (mis. layar keadaan di langkah Keluarga). */
  pertanyaan?: string | undefined;
  caption?: string | undefined;
}

export function KerangkaLangkah({ langkah, children, ringkasan, subjudul, stepper, saatReset, pertanyaan, caption }: Props) {
  const teks = LANGKAH_WIZARD[langkah - 1]!;
  const keterangan = caption ?? teks.caption;
  return (
    <>
      <div className="hero-beranda hero-wizard">
        <div className="isi-hero-wizard">
          <p className="label-langkah">{t('hitung.langkah_nomor_dari_total', { nomor: langkah, total: LANGKAH_WIZARD.length })}{subjudul && <> · {subjudul}</>}</p>
          {stepper}
          <h1 id="pertanyaan-utama" data-tur="pertanyaan" className="pertanyaan-utama">{tanpaPatahDiTandaHubung(pertanyaan ?? teks.pertanyaan)}</h1>
        </div>
      </div>
      <div className="lembar-wizard">
        <div className="kerangka-langkah">
          <section className="kerangka-utama" aria-labelledby="pertanyaan-utama">
            {keterangan && <p className="caption-langkah caption-isi">{keterangan}</p>}
            <div className="tumpuk">{children}</div>
            <button type="button" className="tautan-aksi kaki-reset" onClick={saatReset}>{t('hitung.mulai_dari_awal')}</button>
          </section>
          {ringkasan && <aside className="kerangka-samping" aria-label={t('hitung.ringkasan_kasus')}>{ringkasan}</aside>}
        </div>
      </div>
    </>
  );
}

/** Kata ulang ("laki-laki") jangan dipatah di tanda hubung; judul besar jadi "laki-/laki" kalau dibiarkan. */
function tanpaPatahDiTandaHubung(teks: string): ReactNode {
  return teks.split(/(\S+-\S+)/).map((bagian, indeks) => (indeks % 2 ? <span key={indeks} className="tanpa-patah">{bagian}</span> : bagian));
}
