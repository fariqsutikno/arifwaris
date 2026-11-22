// Kebijakan privasi (UU PDP Pasal 21 ayat 1): data, tujuan, retensi, lokasi, prosesor, hak, kontak.
// Teks lewat diksi (bagian bertanda [DIISI PEMILIK] menunggu keputusan pemilik); versi = VERSI_KEBIJAKAN_PRIVASI.

import { SISIPAN_KEBIJAKAN } from '../akun/persetujuan';
import { t } from '../terjemah';


export function Privasi() {
  return (
    <main className="halaman tumpuk">
      <header className="tumpuk-rapat">
        <h1>{t('privasi.judul', SISIPAN_KEBIJAKAN)}</h1>
        <p className="catatan-info">{t('privasi.versi')}</p>
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
  { id: 'data', judul: t('privasi.data_judul', SISIPAN_KEBIJAKAN), isi: t('privasi.data_isi', SISIPAN_KEBIJAKAN) },
  { id: 'tujuan', judul: t('privasi.tujuan_judul', SISIPAN_KEBIJAKAN), isi: t('privasi.tujuan_isi', SISIPAN_KEBIJAKAN) },
  { id: 'retensi', judul: t('privasi.retensi_judul', SISIPAN_KEBIJAKAN), isi: t('privasi.retensi_isi', SISIPAN_KEBIJAKAN) },
  { id: 'lokasi', judul: t('privasi.lokasi_judul', SISIPAN_KEBIJAKAN), isi: t('privasi.lokasi_isi', SISIPAN_KEBIJAKAN) },
  { id: 'prosesor', judul: t('privasi.prosesor_judul', SISIPAN_KEBIJAKAN), isi: t('privasi.prosesor_isi', SISIPAN_KEBIJAKAN) },
  { id: 'hak', judul: t('privasi.hak_judul', SISIPAN_KEBIJAKAN), isi: t('privasi.hak_isi', SISIPAN_KEBIJAKAN) },
  { id: 'keamanan', judul: t('privasi.keamanan_judul', SISIPAN_KEBIJAKAN), isi: t('privasi.keamanan_isi', SISIPAN_KEBIJAKAN) },
  { id: 'anak', judul: t('privasi.anak_judul', SISIPAN_KEBIJAKAN), isi: t('privasi.anak_isi', SISIPAN_KEBIJAKAN) },
  { id: 'perubahan', judul: t('privasi.perubahan_judul', SISIPAN_KEBIJAKAN), isi: t('privasi.perubahan_isi', SISIPAN_KEBIJAKAN) },
  { id: 'kontak', judul: t('privasi.kontak_judul', SISIPAN_KEBIJAKAN), isi: t('privasi.kontak_isi', SISIPAN_KEBIJAKAN) },
];
