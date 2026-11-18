// Pesan untuk kasus bab 13 yang belum bisa dihitung: data kurang (PERLU_INPUT, termasuk batas jumlah kemungkinan) atau
// tidak didukung. Hasil yang selesai (taqdir, menunggu kelahiran, gharqa) tampil di kerangka Hasil v6 (layar/Hasil.tsx).

import type { HasilGharqa, HasilTaqdir, Pertanyaan } from '@waris/engine';
import type { Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { namaSingkat } from '../keadaanOrang';
import { Tombol } from '../ui/komponen';
import { t } from '../terjemah';

type HasilBelumSelesai = Extract<HasilTaqdir | HasilGharqa, { status: 'PERLU_INPUT' | 'TIDAK_DIDUKUNG' | 'MAUQUF_SEMUA' }>;
interface Props { kasus: Kasus; hasil: HasilBelumSelesai; kirim: (aksi: Aksi) => void }

export function PesanKasusKhusus({ kasus, hasil, kirim }: Props) {
  const ubahData = <Tombol varian="secondary" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3 })}>{t('hitung.ubah_data')}</Tombol>;
  return (
    <main className="halaman tumpuk">
      <div className="kartu kartu-peringatan tumpuk" role="alert">
        {hasil.status === 'PERLU_INPUT' ? <PerluInput kasus={kasus} pertanyaan={hasil.pertanyaan} kirim={kirim} />
          : <><h1 className="judul-langkah">{t('hitung.kasus_ini_belum_bisa_dihitung_di')}</h1><p>{hasil.alasan}</p></>}
      </div>
      {ubahData}
    </main>
  );
}

// Batas kemungkinan (BATAS_DUNIA) datang sebagai satu pertanyaan statusHidup per sumber: tampil sebagai daftar orang, bukan pesan teknis.
function PerluInput({ kasus, pertanyaan, kirim }: { kasus: Kasus; pertanyaan: Pertanyaan[]; kirim: Props['kirim'] }) {
  const terlaluBanyak = pertanyaan.length > 1 && pertanyaan.every(p => p.isian === 'statusHidup' && p.idOrang);
  return (
    <>
      <h1 className="judul-langkah">{terlaluBanyak ? t('hasil.titipan.terlalu_banyak') : t('hitung.bentar_masih_ada_yang_perlu_diisi')}</h1>
      {terlaluBanyak ? (
        <>
          <p>{t('hasil.titipan.terlalu_banyak_ket')}</p>
          <ul className="daftar-keadaan">
            {pertanyaan.map(p => (
              <li key={p.idOrang} className="baris-kerabat">
                <b>{namaSingkat(kasus, p.idOrang!)}</b>
                <button type="button" className="tautan" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3 })}>{t('hasil.titipan.pastikan')}</button>
              </li>
            ))}
          </ul>
        </>
      ) : <ul>{pertanyaan.map((p, indeks) => <li key={indeks}>{p.alasan}</li>)}</ul>}
    </>
  );
}
