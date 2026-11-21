// Kebijakan privasi (UU PDP Pasal 21 ayat 1): data, tujuan, retensi, lokasi, prosesor, hak, kontak.
// Teks lewat diksi (bagian bertanda [DIISI PEMILIK] menunggu keputusan pemilik); versi = VERSI_KEBIJAKAN_PRIVASI.

import { t } from '../terjemah';

const BAGIAN = ['data', 'tujuan', 'retensi', 'lokasi', 'prosesor', 'hak', 'kontak'] as const;

export function Privasi() {
  return (
    <main className="halaman tumpuk">
      <header className="tumpuk-rapat">
        <h1>{t('privasi.judul')}</h1>
        <p className="catatan-info">{t('privasi.draf')}</p>
      </header>
      {BAGIAN.map(bagian => (
        <section key={bagian} className="tumpuk-rapat" aria-labelledby={`privasi-${bagian}`}>
          <h2 id={`privasi-${bagian}`}>{t(`privasi.${bagian}_judul`)}</h2>
          <p>{t(`privasi.${bagian}_isi`)}</p>
        </section>
      ))}
    </main>
  );
}
