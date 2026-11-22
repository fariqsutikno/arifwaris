// Kebijakan privasi (UU PDP Pasal 21 ayat 1): data, tujuan, retensi, lokasi, prosesor, hak, kontak.
// Teks lewat diksi (bagian bertanda [DIISI PEMILIK] menunggu keputusan pemilik); versi = VERSI_KEBIJAKAN_PRIVASI.

import { t } from '../terjemah';


export function Privasi() {
  return (
    <main className="halaman tumpuk">
      <header className="tumpuk-rapat">
        <h1>{t('privasi.judul')}</h1>
      </header>
      {bagian().map(({ id, judul, isi }) => (
        <section key={id} className="tumpuk-rapat" aria-labelledby={`privasi-${id}`}>
          <h2 id={`privasi-${id}`}>{judul}</h2>
          {isi.split('\n\n').map(paragraf => <p key={paragraf}>{paragraf}</p>)}
        </section>
      ))}
    </main>
  );
}

// Kunci ditulis literal (bukan disusun dari teks) supaya uji cakupan diksi bisa memeriksanya.
const bagian = () => [
  { id: 'data', judul: t('privasi.data_judul'), isi: t('privasi.data_isi') },
  { id: 'tujuan', judul: t('privasi.tujuan_judul'), isi: t('privasi.tujuan_isi') },
  { id: 'retensi', judul: t('privasi.retensi_judul'), isi: t('privasi.retensi_isi') },
  { id: 'lokasi', judul: t('privasi.lokasi_judul'), isi: t('privasi.lokasi_isi') },
  { id: 'prosesor', judul: t('privasi.prosesor_judul'), isi: t('privasi.prosesor_isi') },
  { id: 'hak', judul: t('privasi.hak_judul'), isi: t('privasi.hak_isi') },
  { id: 'keamanan', judul: t('privasi.keamanan_judul'), isi: t('privasi.keamanan_isi') },
  { id: 'anak', judul: t('privasi.anak_judul'), isi: t('privasi.anak_isi') },
  { id: 'perubahan', judul: t('privasi.perubahan_judul'), isi: t('privasi.perubahan_isi') },
  { id: 'kontak', judul: t('privasi.kontak_judul'), isi: t('privasi.kontak_isi') },
];
