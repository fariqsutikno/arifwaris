// Satu soal kuis pilihan ganda: pilihan berlabel A, B, C, D; memilih langsung menampilkan benar/salah dan
// pembahasan. Dipakai di sesi kuis Latihan (satu per satu) dan di bagian "Cek pemahaman" materi.

import { useState, type ReactNode } from 'react';
import type { SoalKuis } from '@waris/content';
import { Sebaris } from './Sebaris';

const HURUF = 'ABCDEFGH';

interface Props {
  soal: SoalKuis;
  label?: string;
  saatDijawab?: (benar: boolean) => void;
  /** Tombol di bawah pembahasan (mis. "Soal berikutnya"); tanpa ini muncul "Coba lagi". */
  aksiSetelahJawab?: ReactNode;
}

export function KartuSoalKuis({ soal, label = soal.kode, saatDijawab, aksiSetelahJawab }: Props) {
  const [dipilih, setDipilih] = useState<number | null>(null);
  const sudahMenjawab = dipilih !== null;
  const benar = dipilih === soal.indeksBenar;
  const pilih = (indeks: number) => { setDipilih(indeks); saatDijawab?.(indeks === soal.indeksBenar); };
  const kelas = (indeks: number) => ['pilihan-kuis-item',
    sudahMenjawab && indeks === soal.indeksBenar && 'benar', sudahMenjawab && indeks === dipilih && !benar && 'salah'].filter(Boolean).join(' ');
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
      {sudahMenjawab && (
        <div className={benar ? 'pembahasan-kuis benar' : 'pembahasan-kuis salah'} role="status">
          <b>{benar ? 'Benar!' : `Belum tepat. Jawabannya ${HURUF[soal.indeksBenar]}.`}</b> <Sebaris isi={soal.pembahasan} />
          <div className="aksi-pembahasan">
            {aksiSetelahJawab ?? <button type="button" className="tautan-tombol" onClick={() => setDipilih(null)}>Coba lagi</button>}
          </div>
        </div>
      )}
    </fieldset>
  );
}
