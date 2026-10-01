// Baris tab kategori di atas isi kategori: pindah antarjenis dalil tanpa kembali ke Awal.

import { angka, t } from '../../terjemah';
import { tautanRujukan } from '../../rute';
import { DAFTAR_KATEGORI, jumlahDi } from './Kategori';

export function BarisKategori({ aktif }: { aktif: string }) {
  return (
    <nav className="baris-kategori" aria-label={t('rujukan.kategori_dalil')}>
      {DAFTAR_KATEGORI.map(isi => (
        <a key={isi.id} href={tautanRujukan(isi.id)} aria-current={isi.id === aktif ? 'page' : undefined}>
          {isi.judul} <small>{angka(String(jumlahDi(isi)))}</small>
        </a>
      ))}
    </nav>
  );
}
