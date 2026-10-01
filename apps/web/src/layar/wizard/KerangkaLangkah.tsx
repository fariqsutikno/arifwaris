// Kerangka satu langkah: hero gelap (nomor langkah, stepper, pertanyaan utama, caption) lalu lembar terang yang
// menimpanya berisi isian dan panggung pohon di samping. Hero memakai kerangka Beranda, jadi navbar menyatu dengannya.

import type { ReactNode } from 'react';
import { LANGKAH_WIZARD } from '../../konten/wizard';
import { t } from '../../terjemah';

export function KerangkaLangkah({ langkah, children, ringkasan, subjudul, stepper, saatReset }: { langkah: number; children: ReactNode; ringkasan?: ReactNode; subjudul?: string | undefined; stepper: ReactNode; saatReset: () => void }) {
  const teks = LANGKAH_WIZARD[langkah - 1]!;
  return (
    <>
      <div className="hero-beranda hero-wizard">
        <div className="isi-hero-wizard">
          <p className="label-langkah">{t('hitung.langkah_nomor_dari_total', { nomor: langkah, total: LANGKAH_WIZARD.length })}{subjudul && <> · {subjudul}</>}</p>
          {stepper}
          <h1 id="pertanyaan-utama" data-tur="pertanyaan" className="pertanyaan-utama">{tanpaPatahDiTandaHubung(teks.pertanyaan)}</h1>
          <p className="caption-langkah">{teks.caption}</p>
          <button type="button" className="tautan-hero" onClick={saatReset}>{t('umum.reset_skenario_2')}</button>
        </div>
      </div>
      <div className="lembar-wizard">
        <div className="kerangka-langkah">
          <section className="kerangka-utama" aria-labelledby="pertanyaan-utama"><div className="tumpuk">{children}</div></section>
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
