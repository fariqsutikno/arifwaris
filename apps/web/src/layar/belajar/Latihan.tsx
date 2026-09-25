// Latihan: dua tab.
//   Soal hitung — daftar kasus per bab (ala LeetCode): tanda sudah dikerjakan, tingkat, dan tombol Kerjakan yang
//   membuka kasusnya di kalkulator mode Belajar. Soal ditandai selesai saat jawabannya dibuka di sana.
//   Kuis konsep — pilihan ganda per bab; memilih langsung menampilkan benar/salah dan pembahasan.

import { useState } from 'react';
import { DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, JUDUL_BAB, type SoalHitung, type SoalKuis } from '@waris/content';
import type { Kasus } from '../../kasus';
import { bacaCatatan, simpanCatatan } from '../../preferensi';
import { tautanLatihan } from '../../rute';
import { Sebaris } from './Materi';
import { TombolBukaKasus } from './TombolBukaKasus';

interface Props {
  tab: 'hitung' | 'kuis';
  kasusSekarang: Kasus | null;
  saatKerjakan: (soal: SoalHitung) => void;
}

export function Latihan({ tab, kasusSekarang, saatKerjakan }: Props) {
  return (
    <main className="halaman tumpuk">
      <h1>Latihan</h1>
      <nav className="tab-kecil tab-latihan" aria-label="Jenis latihan">
        <a href={tautanLatihan('hitung')} aria-current={tab === 'hitung' ? 'page' : undefined}>Soal hitung</a>
        <a href={tautanLatihan('kuis')} aria-current={tab === 'kuis' ? 'page' : undefined}>Kuis konsep</a>
      </nav>
      {tab === 'hitung' ? <DaftarSoalHitung kasusSekarang={kasusSekarang} saatKerjakan={saatKerjakan} /> : <DaftarKuis />}
    </main>
  );
}

/** Kelompokkan per bab KB, urut nomor bab. */
function perBab<T extends { bab: number }>(daftar: T[]): Array<[number, T[]]> {
  return [...new Set(daftar.map(soal => soal.bab))].sort((a, b) => a - b)
    .map(bab => [bab, daftar.filter(soal => soal.bab === bab)]);
}

function DaftarSoalHitung({ kasusSekarang, saatKerjakan }: Omit<Props, 'tab'>) {
  const catatan = bacaCatatan('soal');
  const jumlahSelesai = DAFTAR_SOAL_HITUNG.filter(soal => catatan[soal.kode]).length;
  return (
    <>
      <p className="keterangan">
        Tiap soal dibuka di kalkulator mode Belajar: jawabannya disembunyikan dulu, ikuti langkahnya atau tebak sendiri.
        {' '}{jumlahSelesai} dari {DAFTAR_SOAL_HITUNG.length} soal sudah dikerjakan.
      </p>
      {perBab(DAFTAR_SOAL_HITUNG).map(([bab, daftar]) => (
        <section key={bab} className="tumpuk-rapat">
          <h2 className="judul-bab-latihan">Bab {bab} · {JUDUL_BAB[bab]} <span className="keterangan">{daftar.filter(soal => catatan[soal.kode]).length}/{daftar.length}</span></h2>
          <ul className="daftar-polos daftar-soal">
            {daftar.map(soal => {
              const selesai = !!catatan[soal.kode];
              return (
                <li key={soal.kode} className={selesai ? 'baris-soal selesai' : 'baris-soal'}>
                  <span className="status-soal" aria-label={selesai ? 'sudah dikerjakan' : 'belum dikerjakan'}>{selesai ? '✓' : '○'}</span>
                  <div className="isi-soal">
                    <b>{soal.judul}</b>
                    <span className="keterangan">
                      <span className={`tingkat tingkat-${soal.tingkat}`}>{soal.tingkat}</span>
                      {selesai && <> · {soal.topik}</>}
                    </span>
                  </div>
                  <TombolBukaKasus kasusSekarang={kasusSekarang} saatBuka={() => saatKerjakan(soal)} varian={selesai ? 'secondary' : 'primary'}>
                    {selesai ? 'Ulangi' : 'Kerjakan'}
                  </TombolBukaKasus>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

function DaftarKuis() {
  const catatan = bacaCatatan('kuis');
  const jumlahBenar = DAFTAR_SOAL_KUIS.filter(soal => catatan[soal.kode] === 'benar').length;
  return (
    <>
      <p className="keterangan">Pilih satu jawaban; pembahasannya langsung muncul. {jumlahBenar} dari {DAFTAR_SOAL_KUIS.length} sudah dijawab benar.</p>
      <p className="lencana-draf">Draf, belum direview tim keilmuan</p>
      {perBab(DAFTAR_SOAL_KUIS).map(([bab, daftar]) => (
        <section key={bab} className="tumpuk-rapat">
          <h2 className="judul-bab-latihan">Bab {bab} · {JUDUL_BAB[bab]}</h2>
          {daftar.map(soal => <KartuKuis key={soal.kode} soal={soal} hasilLalu={catatan[soal.kode]} />)}
        </section>
      ))}
    </>
  );
}

function KartuKuis({ soal, hasilLalu }: { soal: SoalKuis; hasilLalu: string | undefined }) {
  const [dipilih, setDipilih] = useState<number | null>(null);
  const sudahMenjawab = dipilih !== null;
  const benar = dipilih === soal.indeksBenar;
  const pilih = (indeks: number) => {
    setDipilih(indeks);
    simpanCatatan('kuis', soal.kode, indeks === soal.indeksBenar ? 'benar' : 'salah');
  };
  return (
    <fieldset className="kartu kartu-kuis">
      <legend className="label-langkah">{soal.kode}{hasilLalu && !sudahMenjawab ? ` · terakhir ${hasilLalu}` : ''}</legend>
      <p className="pertanyaan-kuis"><Sebaris isi={soal.pertanyaan} /></p>
      <div className="pilihan-kuis">
        {soal.pilihan.map((pilihan, indeks) => (
          <button key={indeks} type="button" disabled={sudahMenjawab} onClick={() => pilih(indeks)}
            className={!sudahMenjawab ? 'pilihan-kuis-item' : indeks === soal.indeksBenar ? 'pilihan-kuis-item benar' : indeks === dipilih ? 'pilihan-kuis-item salah' : 'pilihan-kuis-item'}>
            <Sebaris isi={pilihan} />
          </button>
        ))}
      </div>
      {sudahMenjawab && (
        <div className={benar ? 'pembahasan-kuis benar' : 'pembahasan-kuis salah'} role="status">
          <b>{benar ? 'Benar.' : 'Belum tepat.'}</b> <Sebaris isi={soal.pembahasan} />
          <div><button type="button" className="tautan-tombol" onClick={() => setDipilih(null)}>Coba lagi</button></div>
        </div>
      )}
    </fieldset>
  );
}
