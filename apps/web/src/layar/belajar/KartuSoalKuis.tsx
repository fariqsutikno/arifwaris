// Satu soal kuis pilihan ganda berlabel A, B, C, D.
// mode 'langsung': setelah memilih, benar/salah dan pembahasan langsung tampil.
// mode 'akhir': pilihan hanya ditandai terpilih dan masih bisa diganti; penilaian ditunda ke halaman hasil.

import { useState } from 'react';
import type { SoalKuis } from '@waris/content';
import { Ikon } from '../../ui/Ikon';
import { Sebaris } from './Sebaris';
import { bahasaArab, t } from '../../terjemah';

const HURUF = 'ABCDEFGH';
const HURUF_ARAB = 'أبجدهوزح';
/** Label pilihan: A B C D, atau أ ب ج د di tampilan Arab. */
export const hurufPilihan = (indeks: number): string => (bahasaArab() ? HURUF_ARAB : HURUF)[indeks] ?? '';
export type ModePembahasan = 'langsung' | 'akhir';

interface Props {
  soal: SoalKuis;
  label?: string;
  mode?: ModePembahasan;
  /** Tanpa ini (kuis di materi) muncul tombol "Coba lagi" setelah menjawab; navigasi sesi diurus pemanggil. */
  saatDijawab?: (indeks: number) => void;
  /** Jawaban yang sudah dipilih sebelumnya (kembali ke soal di mode ujian). */
  dipilihAwal?: number | undefined;
}

export function KartuSoalKuis({ soal, label = soal.kode, mode = 'langsung', saatDijawab, dipilihAwal }: Props) {
  const [dipilih, setDipilih] = useState<number | null>(dipilihAwal ?? null);
  const sudahMenjawab = dipilih !== null;
  const tampilkanNilai = sudahMenjawab && mode === 'langsung';
  const benar = dipilih === soal.indeksBenar;
  const pilih = (indeks: number) => { setDipilih(indeks); saatDijawab?.(indeks); };
  const kelas = (indeks: number) => ['pilihan-kuis-item',
    tampilkanNilai && indeks === soal.indeksBenar && 'benar',
    tampilkanNilai && indeks === dipilih && !benar && 'salah',
    !tampilkanNilai && indeks === dipilih && 'dipilih'].filter(Boolean).join(' ');
  return (
    <fieldset className="kartu kartu-kuis">
      <legend className="label-langkah">{label}</legend>
      <p className="pertanyaan-kuis"><Sebaris isi={soal.pertanyaan} /></p>
      <div className="pilihan-kuis">
        {soal.pilihan.map((pilihan, indeks) => (
          <button key={indeks} type="button" disabled={sudahMenjawab && mode === 'langsung'} onClick={() => pilih(indeks)} className={kelas(indeks)}
            aria-pressed={mode === 'akhir' ? indeks === dipilih : undefined}
            aria-label={`${hurufPilihan(indeks)}. ${pilihan.map(potongan => ('teks' in potongan ? potongan.teks : '')).join('')}`}>
            <span className="huruf-pilihan" aria-hidden="true">{hurufPilihan(indeks)}</span>
            <span><Sebaris isi={pilihan} /></span>
          </button>
        ))}
      </div>
      {tampilkanNilai && (
        <div className={benar ? 'hasil-tebak benar' : 'hasil-tebak salah'} role="status">
          <b><Ikon nama={benar ? 'benar' : 'salah'} ukuran={18} /> {benar ? t('Benar') : t('Belum tepat, jawabannya {huruf}', { huruf: hurufPilihan(soal.indeksBenar) })}</b>
          <p><Sebaris isi={soal.pembahasan} /></p>
        </div>
      )}
      {sudahMenjawab && !saatDijawab && (
        <div className="aksi-pembahasan">
          <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => setDipilih(null)}>{t('Coba lagi')}</button>
        </div>
      )}
    </fieldset>
  );
}
