// Kartu "Hasil ini bergantung pada n hal yang belum pasti" (spec 10-01 bag. 3): pemilih kemungkinan, bukan jawaban. Memilih hanya
// membandingkan (Kasus tersimpan tidak berubah); selisih dihitung terhadap pilihan pertama. Aplikasi tidak memilih mana yang benar.
// Bila semua kemungkinan menghasilkan pembagian yang sama, hanya satu catatan kecil ("tidak memengaruhi"). Terlalu banyak
// kemungkinan diganti daftar hal dengan tautan Pastikan.

import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { namaSingkat } from '../keadaanOrang';
import type { HasilKemungkinan } from '../kemungkinan';
import { KerangkaHasilKhusus } from './KerangkaHasilKhusus';
import { t } from '../terjemah';

export interface InfoKemungkinan { hasil: HasilKemungkinan; indeks: number; saatPilih: (indeks: number) => void }

interface Props { kasus: Kasus; info: InfoKemungkinan; saatPastikan: () => void }

export function KartuBelumPasti({ kasus, info, saatPastikan }: Props) {
  const { hasil, indeks, saatPilih } = info;
  if (hasil.jenis !== 'daftar') return null;
  if (!hasil.berpengaruh) {
    const { a, b } = hasil.hal[0]!;
    return <p className="catatan-info catatan-belum-pasti">{t('hitung.kemungkinan.tidak_berpengaruh', { dulu: namaSingkat(kasus, a), lalu: namaSingkat(kasus, b) })}</p>;
  }
  return (
    <section className="kartu-sisi kartu-isi kartu-belum-pasti" aria-labelledby="judul-belum-pasti">
      <div className="judul-kartu">
        <h2 id="judul-belum-pasti">{t('hitung.kemungkinan.judul', { jumlah: hasil.hal.length })}</h2>
        <p className="sub-kartu">{t('hitung.kemungkinan.ket')} <button type="button" className="tautan-aksi tautan-sebaris" onClick={saatPastikan}>{t('hitung.kemungkinan.pastikan')}</button></p>
      </div>
      <div className="pilihan-bulat pilihan-kemungkinan" role="radiogroup" aria-label={t('hitung.kemungkinan.sedang_dilihat')}>
        {hasil.daftar.map((kemungkinan, urutan) => (
          <button key={kemungkinan.label} type="button" role="radio" aria-checked={urutan === indeks} onClick={() => saatPilih(urutan)}>
            <b>{kemungkinan.label}</b>
          </button>
        ))}
      </div>
      <p className="sub-kartu">{t('hitung.kemungkinan.membandingkan')}</p>
    </section>
  );
}

/** Lebih dari batas kemungkinan: tidak ada hasil, hanya daftar hal yang perlu dipastikan. */
export function HalamanTerlaluBanyak({ kasus, hal, kirim }: { kasus: Kasus; hal: Array<{ a: IdOrang; b: IdOrang }>; kirim: (aksi: Aksi) => void }) {
  return (
    <KerangkaHasilKhusus kasus={kasus} kirim={kirim} bolehEkspor={false} judul={t('hasil.titipan.terlalu_banyak')} keterangan={t('hitung.kemungkinan.terlalu_banyak')}>
      <section className="kartu-sisi kartu-isi" role="alert">
        <ul className="daftar-keadaan">
          {hal.map(({ a, b }) => (
            <li key={`${a}-${b}`} className="baris-kerabat">
              <b>{t('hitung.cerita.urutan_belum_pasti', { a: namaSingkat(kasus, a), b: namaSingkat(kasus, b) })}</b>
              <button type="button" className="tautan" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3 })}>{t('hitung.kemungkinan.pastikan')}</button>
            </li>
          ))}
        </ul>
      </section>
    </KerangkaHasilKhusus>
  );
}
