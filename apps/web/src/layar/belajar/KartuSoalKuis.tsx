// Satu soal kuis pilihan ganda berlabel A, B, C, D.
// mode 'langsung': setelah memilih, benar/salah dan pembahasan langsung tampil.
// mode 'akhir': pilihan hanya ditandai terpilih; penilaian ditunda ke halaman hasil.

import { useState, type ReactNode } from 'react';
import type { SoalKuis } from '@waris/content';
import { Ikon } from '../../ui/Ikon';
import { Sebaris } from './Sebaris';

export const HURUF = 'ABCDEFGH';
export type ModePembahasan = 'langsung' | 'akhir';

interface Props {
  soal: SoalKuis;
  label?: string;
  mode?: ModePembahasan;
  saatDijawab?: (indeks: number) => void;
  /** Tombol setelah menjawab (mis. "Soal berikutnya"); tanpa ini muncul "Coba lagi". */
  aksiSetelahJawab?: ReactNode;
}

export function KartuSoalKuis({ soal, label = soal.kode, mode = 'langsung', saatDijawab, aksiSetelahJawab }: Props) {
  const [dipilih, setDipilih] = useState<number | null>(null);
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
          <button key={indeks} type="button" disabled={sudahMenjawab} onClick={() => pilih(indeks)} className={kelas(indeks)}
            aria-label={`${HURUF[indeks]}. ${pilihan.map(potongan => ('teks' in potongan ? potongan.teks : '')).join('')}`}>
            <span className="huruf-pilihan" aria-hidden="true">{HURUF[indeks]}</span>
            <span><Sebaris isi={pilihan} /></span>
          </button>
        ))}
      </div>
      {tampilkanNilai && (
        <div className={benar ? 'hasil-tebak benar' : 'hasil-tebak salah'} role="status">
          <b><Ikon nama={benar ? 'benar' : 'salah'} ukuran={18} /> {benar ? 'Benar' : `Belum tepat, jawabannya ${HURUF[soal.indeksBenar]}`}</b>
          <p><Sebaris isi={soal.pembahasan} /></p>
        </div>
      )}
      {sudahMenjawab && (
        <div className="aksi-pembahasan">
          {aksiSetelahJawab ?? <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => setDipilih(null)}>Coba lagi</button>}
        </div>
      )}
    </fieldset>
  );
}
