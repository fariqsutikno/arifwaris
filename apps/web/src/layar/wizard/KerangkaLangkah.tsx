// Kerangka satu langkah: pertanyaan utama (paling besar), caption penjelas, isi, dan ringkasan kasus di samping (desktop).

import type { ReactNode } from 'react';
import { LANGKAH_WIZARD } from '../../konten/wizard';

export function KerangkaLangkah({ langkah, children, ringkasan }: { langkah: number; children: ReactNode; ringkasan?: ReactNode }) {
  const teks = LANGKAH_WIZARD[langkah - 1]!;
  return (
    <div className="kerangka-langkah">
      <section className="kerangka-utama" aria-labelledby="pertanyaan-utama">
        <p className="label-langkah">Langkah {langkah} dari {LANGKAH_WIZARD.length}</p>
        <h1 id="pertanyaan-utama" data-tur="pertanyaan" className="pertanyaan-utama">{tanpaPatahDiTandaHubung(teks.pertanyaan)}</h1>
        <p className="caption-langkah">{teks.caption}</p>
        <div className="tumpuk">{children}</div>
      </section>
      {ringkasan && <aside className="kerangka-samping" aria-label="Ringkasan kasus">{ringkasan}</aside>}
    </div>
  );
}

/** Kata ulang ("laki-laki") jangan dipatah di tanda hubung; judul besar jadi "laki-/laki" kalau dibiarkan. */
function tanpaPatahDiTandaHubung(teks: string): ReactNode {
  return teks.split(/(\S+-\S+)/).map((bagian, indeks) => (indeks % 2 ? <span key={indeks} className="tanpa-patah">{bagian}</span> : bagian));
}
