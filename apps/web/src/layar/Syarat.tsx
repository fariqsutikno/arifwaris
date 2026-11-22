// Syarat layanan: teks lewat diksi `syarat.*`; versi persetujuan ikut VERSI_KEBIJAKAN_PRIVASI (dialog yang sama).

import { SISIPAN_KEBIJAKAN } from '../akun/persetujuan';
import { t } from '../terjemah';

export function Syarat() {
  return (
    <main className="halaman tumpuk">
      <header className="tumpuk-rapat">
        <h1>{t('syarat.judul', SISIPAN_KEBIJAKAN)}</h1>
        <p className="catatan-info">{t('syarat.versi')}</p>
      </header>
      {bagian().map(({ id, judul, isi }) => (
        <section key={id} className="tumpuk-rapat" aria-labelledby={`syarat-${id}`}>
          <h2 id={`syarat-${id}`}>{judul}</h2>
          {isi.split('\n\n').map(paragraf => <p key={paragraf}>{paragraf}</p>)}
        </section>
      ))}
    </main>
  );
}

// Kunci ditulis literal supaya uji cakupan diksi bisa memeriksanya.
const bagian = () => [
  { id: 'tentang', judul: t('syarat.tentang_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.tentang_isi', SISIPAN_KEBIJAKAN) },
  { id: 'hasil', judul: t('syarat.hasil_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.hasil_isi', SISIPAN_KEBIJAKAN) },
  { id: 'akun', judul: t('syarat.akun_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.akun_isi', SISIPAN_KEBIJAKAN) },
  { id: 'pemakaian', judul: t('syarat.pemakaian_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.pemakaian_isi', SISIPAN_KEBIJAKAN) },
  { id: 'konten', judul: t('syarat.konten_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.konten_isi', SISIPAN_KEBIJAKAN) },
  { id: 'data', judul: t('syarat.data_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.data_isi', SISIPAN_KEBIJAKAN) },
  { id: 'pilihan', judul: t('syarat.pilihan_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.pilihan_isi', SISIPAN_KEBIJAKAN) },
  { id: 'beta', judul: t('syarat.beta_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.beta_isi', SISIPAN_KEBIJAKAN) },
  { id: 'tanggung_jawab', judul: t('syarat.tanggung_jawab_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.tanggung_jawab_isi', SISIPAN_KEBIJAKAN) },
  { id: 'penghentian', judul: t('syarat.penghentian_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.penghentian_isi', SISIPAN_KEBIJAKAN) },
  { id: 'perubahan', judul: t('syarat.perubahan_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.perubahan_isi', SISIPAN_KEBIJAKAN) },
  { id: 'hukum', judul: t('syarat.hukum_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.hukum_isi', SISIPAN_KEBIJAKAN) },
  { id: 'umum', judul: t('syarat.umum_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.umum_isi', SISIPAN_KEBIJAKAN) },
  { id: 'kontak', judul: t('syarat.kontak_judul', SISIPAN_KEBIJAKAN), isi: t('syarat.kontak_isi', SISIPAN_KEBIJAKAN) },
];
