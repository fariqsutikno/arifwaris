// Latihan: dua tab.
//   Soal hitung — daftar kasus per bab (ala LeetCode): tanda sudah dikerjakan, tingkat, dan tombol Kerjakan yang
//   membuka kasusnya di kalkulator mode Belajar. Soal ditandai selesai saat jawabannya dibuka di sana.
//   Kuis konsep — paket per bab dan paket acak; soal tampil satu per satu (pilihan A–D), pembahasan langsung
//   setelah memilih, skor di akhir. Skor terakhir tiap paket disimpan di perangkat.

import { useState } from 'react';
import { DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, JUDUL_BAB, type SoalHitung, type SoalKuis } from '@waris/content';
import type { Kasus } from '../../kasus';
import { bacaCatatan, catatAktivitas, simpanCatatan } from '../../preferensi';
import { tautanLatihan } from '../../rute';
import { KartuSoalKuis } from './KartuSoalKuis';
import { Sebaris } from './Sebaris';
import { TombolBukaKasus } from './TombolBukaKasus';

interface Props {
  tab: 'hitung' | 'kuis';
  paket?: string | undefined;
  kasusSekarang: Kasus | null;
  saatKerjakan: (soal: SoalHitung) => void;
}

export function Latihan({ tab, paket, kasusSekarang, saatKerjakan }: Props) {
  return (
    <main className="halaman tumpuk">
      <h1>Latihan</h1>
      <nav className="tab-kecil tab-latihan" aria-label="Jenis latihan">
        <a href={tautanLatihan('hitung')} aria-current={tab === 'hitung' ? 'page' : undefined}>Soal hitung</a>
        <a href={tautanLatihan('kuis')} aria-current={tab === 'kuis' ? 'page' : undefined}>Kuis konsep</a>
      </nav>
      {tab === 'hitung' ? <DaftarSoalHitung kasusSekarang={kasusSekarang} saatKerjakan={saatKerjakan} />
        : paket ? <SesiKuis key={paket} paket={paket} /> : <DaftarPaketKuis />}
    </main>
  );
}

/** Kelompokkan per bab KB, urut nomor bab. */
function perBab<T extends { bab: number }>(daftar: T[]): Array<[number, T[]]> {
  return [...new Set(daftar.map(soal => soal.bab))].sort((a, b) => a - b)
    .map(bab => [bab, daftar.filter(soal => soal.bab === bab)]);
}

function DaftarSoalHitung({ kasusSekarang, saatKerjakan }: Omit<Props, 'tab' | 'paket'>) {
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

/** Paket kuis: satu per bab, ditambah paket acak dari semua bab. */
const JUMLAH_SOAL_ACAK = 10;
export const PAKET_ACAK = 'acak';
const kodePaketBab = (bab: number) => `bab-${bab}`;

export function soalPaket(paket: string, acak: () => number = Math.random): SoalKuis[] {
  if (paket === PAKET_ACAK) {
    // Fisher–Yates; urutan acak hanya di UI, bukan di engine.
    const salinan = [...DAFTAR_SOAL_KUIS];
    for (let indeks = salinan.length - 1; indeks > 0; indeks--) {
      const tukar = Math.floor(acak() * (indeks + 1));
      [salinan[indeks], salinan[tukar]] = [salinan[tukar]!, salinan[indeks]!];
    }
    return salinan.slice(0, JUMLAH_SOAL_ACAK);
  }
  return DAFTAR_SOAL_KUIS.filter(soal => kodePaketBab(soal.bab) === paket);
}

function DaftarPaketKuis() {
  const catatan = bacaCatatan('kuis');
  return (
    <>
      <p className="lencana-draf">Draf, belum direview tim keilmuan</p>
      <div className="grid-paket">
        <a className="kartu-paket paket-acak" href={tautanLatihan('kuis', PAKET_ACAK)}>
          <span className="label-langkah">Campuran</span>
          <b>Kuis acak</b>
          <span className="keterangan">{Math.min(JUMLAH_SOAL_ACAK, DAFTAR_SOAL_KUIS.length)} soal dari semua bab</span>
          {catatan[PAKET_ACAK] && <span className="skor-paket">Skor terakhir {catatan[PAKET_ACAK]}</span>}
        </a>
        {perBab(DAFTAR_SOAL_KUIS).map(([bab, daftar]) => (
          <a key={bab} className="kartu-paket" href={tautanLatihan('kuis', kodePaketBab(bab))}>
            <span className="label-langkah">Bab {bab}</span>
            <b>{JUDUL_BAB[bab]}</b>
            <span className="keterangan">{daftar.length} soal</span>
            {catatan[kodePaketBab(bab)] && <span className="skor-paket">Skor terakhir {catatan[kodePaketBab(bab)]}</span>}
          </a>
        ))}
      </div>
    </>
  );
}

/** Satu sesi paket: soal ditampilkan satu per satu, skor di akhir. */
function SesiKuis({ paket }: { paket: string }) {
  const [daftarSoal, setDaftarSoal] = useState(() => soalPaket(paket));
  const [posisi, setPosisi] = useState(0);
  const [jawaban, setJawaban] = useState<boolean[]>([]);
  const judul = paket === PAKET_ACAK ? 'Kuis acak' : `Bab ${paket.replace('bab-', '')} · ${JUDUL_BAB[Number(paket.replace('bab-', ''))] ?? ''}`;
  const ulangi = () => { setDaftarSoal(soalPaket(paket)); setPosisi(0); setJawaban([]); };

  if (daftarSoal.length === 0) return <p role="alert">Paket ini tidak ada. <a href={tautanLatihan('kuis')}>Kembali ke daftar paket</a></p>;
  const selesai = posisi >= daftarSoal.length;
  const benar = jawaban.filter(Boolean).length;

  if (selesai) {
    return (
      <section className="kartu hasil-kuis tumpuk-rapat" aria-live="polite">
        <p className="label-langkah">{judul}</p>
        <p className="skor-besar">{benar}<small>/{daftarSoal.length}</small></p>
        <p>{benar === daftarSoal.length ? 'Sempurna!' : benar >= daftarSoal.length / 2 ? 'Bagus, tinggal sedikit lagi.' : 'Yuk ulangi, pelan-pelan saja.'}</p>
        <ol className="rekap-kuis">
          {daftarSoal.map((soal, indeks) => (
            <li key={soal.kode} className={jawaban[indeks] ? 'benar' : 'salah'}>{jawaban[indeks] ? '✓' : '✗'} <Sebaris isi={soal.pertanyaan} /></li>
          ))}
        </ol>
        <div className="chip-deret">
          <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" onClick={ulangi}>Ulangi paket</button>
          <a className="aw-btn aw-btn-secondary aw-btn-sm" href={tautanLatihan('kuis')}>Paket lain</a>
        </div>
      </section>
    );
  }

  const soal = daftarSoal[posisi]!;
  const sudahDijawab = jawaban.length > posisi;
  const catatJawaban = (hasil: boolean) => {
    const baru = [...jawaban, hasil];
    setJawaban(baru);
    simpanCatatan('kuis', soal.kode, hasil ? 'benar' : 'salah');
    if (baru.length === daftarSoal.length) {
      const skor = `${baru.filter(Boolean).length}/${daftarSoal.length}`;
      simpanCatatan('kuis', paket, skor);
      catatAktivitas({ jenis: 'kuis', kode: paket, judul, waktu: Date.now(), hasil: skor });
    }
  };
  return (
    <section className="tumpuk-rapat sesi-kuis">
      <div className="kepala-sesi">
        <a href={tautanLatihan('kuis')}>← Paket</a>
        <span className="label-langkah">{judul}</span>
        <span className="angka-progres">Skor {benar}</span>
      </div>
      <span className="bar-progres" aria-hidden="true"><span style={{ width: `${((posisi + (sudahDijawab ? 1 : 0)) / daftarSoal.length) * 100}%` }} /></span>
      <KartuSoalKuis key={`${soal.kode}-${posisi}`} soal={soal} label={`Soal ${posisi + 1} dari ${daftarSoal.length}`} saatDijawab={catatJawaban}
        aksiSetelahJawab={
          <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" onClick={() => setPosisi(posisi + 1)}>
            {posisi + 1 < daftarSoal.length ? 'Soal berikutnya →' : 'Lihat skor'}
          </button>
        } />
    </section>
  );
}
