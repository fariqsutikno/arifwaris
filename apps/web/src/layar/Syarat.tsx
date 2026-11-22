// Syarat layanan: teks lewat diksi `syarat.*`; versi persetujuan ikut VERSI_KEBIJAKAN_PRIVASI (dialog yang sama).

import { TANGGAL_BERLAKU_KEBIJAKAN, VERSI_KEBIJAKAN_PRIVASI } from '../akun/persetujuan';
import { t } from '../terjemah';

export function Syarat() {
  return (
    <main className="halaman tumpuk">
      <header className="tumpuk-rapat">
        <h1>{t('syarat.judul')}</h1>
        <p className="catatan-info">{t('syarat.versi', { versi: VERSI_KEBIJAKAN_PRIVASI, tanggal: TANGGAL_BERLAKU_KEBIJAKAN })}</p>
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
  { id: 'tentang', judul: t('syarat.tentang_judul'), isi: t('syarat.tentang_isi') },
  { id: 'hasil', judul: t('syarat.hasil_judul'), isi: t('syarat.hasil_isi') },
  { id: 'akun', judul: t('syarat.akun_judul'), isi: t('syarat.akun_isi') },
  { id: 'pemakaian', judul: t('syarat.pemakaian_judul'), isi: t('syarat.pemakaian_isi') },
  { id: 'konten', judul: t('syarat.konten_judul'), isi: t('syarat.konten_isi') },
  { id: 'pilihan', judul: t('syarat.pilihan_judul'), isi: t('syarat.pilihan_isi') },
  { id: 'beta', judul: t('syarat.beta_judul'), isi: t('syarat.beta_isi') },
  { id: 'tanggung_jawab', judul: t('syarat.tanggung_jawab_judul'), isi: t('syarat.tanggung_jawab_isi') },
  { id: 'penghentian', judul: t('syarat.penghentian_judul'), isi: t('syarat.penghentian_isi') },
  { id: 'perubahan', judul: t('syarat.perubahan_judul'), isi: t('syarat.perubahan_isi') },
  { id: 'hukum', judul: t('syarat.hukum_judul'), isi: t('syarat.hukum_isi') },
  { id: 'umum', judul: t('syarat.umum_judul'), isi: t('syarat.umum_isi') },
  { id: 'kontak', judul: t('syarat.kontak_judul'), isi: t('syarat.kontak_isi') },
];
