// Syarat layanan: teks lewat diksi `syarat.*`; versi persetujuan ikut VERSI_KEBIJAKAN_PRIVASI (dialog yang sama).

import { t } from '../terjemah';

export function Syarat() {
  return (
    <main className="halaman tumpuk">
      <header className="tumpuk-rapat"><h1>{t('syarat.judul')}</h1></header>
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
  { id: 'hasil', judul: t('syarat.hasil_judul'), isi: t('syarat.hasil_isi') },
  { id: 'akun', judul: t('syarat.akun_judul'), isi: t('syarat.akun_isi') },
  { id: 'pemakaian', judul: t('syarat.pemakaian_judul'), isi: t('syarat.pemakaian_isi') },
  { id: 'konten', judul: t('syarat.konten_judul'), isi: t('syarat.konten_isi') },
  { id: 'beta', judul: t('syarat.beta_judul'), isi: t('syarat.beta_isi') },
  { id: 'tanggung_jawab', judul: t('syarat.tanggung_jawab_judul'), isi: t('syarat.tanggung_jawab_isi') },
  { id: 'perubahan', judul: t('syarat.perubahan_judul'), isi: t('syarat.perubahan_isi') },
  { id: 'hukum', judul: t('syarat.hukum_judul'), isi: t('syarat.hukum_isi') },
  { id: 'kontak', judul: t('syarat.kontak_judul'), isi: t('syarat.kontak_isi') },
];
