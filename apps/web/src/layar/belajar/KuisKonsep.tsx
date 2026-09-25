// Kuis konsep: daftar paket (per bab + acak) dan satu sesi paket.
// Sesi: layar awal (pilih kapan pembahasan muncul: langsung per soal atau di akhir) → soal satu per satu →
// hasil: skor lalu pembahasan tiap soal. Keluar di tengah sesi ditanya dulu (usePenjaga).

import { useState } from 'react';
import { DAFTAR_SOAL_KUIS, JUDUL_BAB, type SoalKuis } from '@waris/content';
import { bacaCatatan, bacaPilihan, catatAktivitas, simpanCatatan, simpanPilihan } from '../../preferensi';
import { tautanLatihan } from '../../rute';
import { Ikon } from '../../ui/Ikon';
import { usePenjaga } from '../../ui/Penjaga';
import { HURUF, KartuSoalKuis, type ModePembahasan } from './KartuSoalKuis';
import { Sebaris } from './Sebaris';

/** Kelompokkan per bab KB, urut nomor bab. */
export function perBab<T extends { bab: number }>(daftar: T[]): Array<[number, T[]]> {
  return [...new Set(daftar.map(soal => soal.bab))].sort((a, b) => a - b)
    .map(bab => [bab, daftar.filter(soal => soal.bab === bab)]);
}

const JUMLAH_SOAL_ACAK = 10;
export const PAKET_ACAK = 'acak';
const kodePaketBab = (bab: number) => `bab-${bab}`;
const KUNCI_MODE = 'mode-pembahasan';

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

const judulPaket = (paket: string) => {
  if (paket === PAKET_ACAK) return 'Kuis acak';
  const bab = Number(paket.replace('bab-', ''));
  return `Bab ${bab} · ${JUDUL_BAB[bab] ?? ''}`;
};

export function DaftarPaketKuis() {
  const catatan = bacaCatatan('kuis');
  return (
    <>
      <p className="lencana-draf">Draf, belum direview tim keilmuan</p>
      <div className="grid-paket">
        <a className="kartu-paket paket-acak" href={tautanLatihan('kuis', PAKET_ACAK)}>
          <Ikon nama="acak" ukuran={24} />
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

type Tahap = 'awal' | 'mengerjakan' | 'hasil';

export function SesiKuis({ paket }: { paket: string }) {
  const [daftarSoal, setDaftarSoal] = useState(() => soalPaket(paket));
  const [tahap, setTahap] = useState<Tahap>('awal');
  const [mode, setMode] = useState<ModePembahasan>(() => (bacaPilihan(KUNCI_MODE) === 'akhir' ? 'akhir' : 'langsung'));
  const [posisi, setPosisi] = useState(0);
  const [pilihan, setPilihan] = useState<number[]>([]);
  const judul = judulPaket(paket);

  usePenjaga(tahap === 'mengerjakan', {
    berlaku: () => true,
    judul: 'Keluar dari kuis?',
    isi: <p>Jawabanmu di sesi ini ({pilihan.length} dari {daftarSoal.length} soal) tidak disimpan.</p>,
    labelTetap: 'Lanjut mengerjakan',
    labelPergi: 'Keluar',
  });

  if (daftarSoal.length === 0) return <p role="alert">Kuis ini tidak ada. <a href={tautanLatihan('kuis')}>Kembali ke daftar kuis</a></p>;

  const mulai = (modeBaru: ModePembahasan) => {
    simpanPilihan(KUNCI_MODE, modeBaru);
    setMode(modeBaru);
    setDaftarSoal(soalPaket(paket));
    setPosisi(0);
    setPilihan([]);
    setTahap('mengerjakan');
  };

  const kepala = (
    <div className="kepala-sesi">
      <a className="aw-btn aw-btn-secondary aw-btn-sm" href={tautanLatihan('kuis')}><Ikon nama="keluar" ukuran={18} /> Keluar</a>
      <span className="judul-sesi">{judul}</span>
    </div>
  );

  if (tahap === 'awal') {
    return (
      <section className="sesi-kuis tumpuk">
        {kepala}
        <div className="kartu tumpuk-rapat">
          <h1 className="judul-awal-kuis">{daftarSoal.length} soal</h1>
          <fieldset className="pilihan-mode">
            <legend>Kapan pembahasan muncul?</legend>
            <label className={mode === 'langsung' ? 'opsi-mode dipilih' : 'opsi-mode'}>
              <input type="radio" name="mode" checked={mode === 'langsung'} onChange={() => setMode('langsung')} />
              <span><b>Langsung</b><small>Benar atau salah, beserta pembahasannya, muncul setiap selesai menjawab.</small></span>
            </label>
            <label className={mode === 'akhir' ? 'opsi-mode dipilih' : 'opsi-mode'}>
              <input type="radio" name="mode" checked={mode === 'akhir'} onChange={() => setMode('akhir')} />
              <span><b>Di akhir</b><small>Jawab semua dulu; skor dan pembahasan muncul setelah soal terakhir.</small></span>
            </label>
          </fieldset>
          <button type="button" className="aw-btn aw-btn-primary" onClick={() => mulai(mode)}>Mulai kuis</button>
        </div>
      </section>
    );
  }

  if (tahap === 'hasil') return <HasilKuis kepala={kepala} daftarSoal={daftarSoal} pilihan={pilihan} saatUlang={() => mulai(mode)} />;

  const soal = daftarSoal[posisi]!;
  const sudahDijawab = pilihan.length > posisi;
  const benarSejauhIni = pilihan.filter((indeks, urutan) => indeks === daftarSoal[urutan]!.indeksBenar).length;
  const jawab = (indeks: number) => {
    const baru = [...pilihan, indeks];
    setPilihan(baru);
    simpanCatatan('kuis', soal.kode, indeks === soal.indeksBenar ? 'benar' : 'salah');
    if (baru.length === daftarSoal.length) {
      const skor = `${baru.filter((isi, urutan) => isi === daftarSoal[urutan]!.indeksBenar).length}/${daftarSoal.length}`;
      simpanCatatan('kuis', paket, skor);
      catatAktivitas({ jenis: 'kuis', kode: paket, judul, waktu: Date.now(), hasil: skor });
    }
  };
  const terakhir = posisi + 1 === daftarSoal.length;
  return (
    <section className="sesi-kuis tumpuk-rapat">
      {kepala}
      <div className="progres-sesi">
        <span className="angka-progres">Soal {posisi + 1} dari {daftarSoal.length}</span>
        {mode === 'langsung' && <span className="angka-progres">Benar {benarSejauhIni}</span>}
      </div>
      <span className="bar-progres" aria-hidden="true"><span style={{ width: `${((posisi + (sudahDijawab ? 1 : 0)) / daftarSoal.length) * 100}%` }} /></span>
      <KartuSoalKuis key={`${soal.kode}-${posisi}`} soal={soal} label={`Soal ${posisi + 1}`} mode={mode} saatDijawab={jawab}
        aksiSetelahJawab={
          <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" onClick={() => (terakhir ? setTahap('hasil') : setPosisi(posisi + 1))}>
            {terakhir ? 'Lihat hasil' : 'Soal berikutnya'}
          </button>
        } />
    </section>
  );
}

function HasilKuis({ kepala, daftarSoal, pilihan, saatUlang }: {
  kepala: React.ReactNode; daftarSoal: SoalKuis[]; pilihan: number[]; saatUlang: () => void;
}) {
  const benar = daftarSoal.filter((soal, urutan) => pilihan[urutan] === soal.indeksBenar).length;
  const persen = Math.round((benar / daftarSoal.length) * 100);
  return (
    <section className="sesi-kuis tumpuk">
      {kepala}
      <div className="kartu ringkasan-kuis" aria-live="polite">
        <div>
          <p className="label-langkah">Skor</p>
          <p className="skor-besar">{benar}<small>/{daftarSoal.length}</small></p>
        </div>
        <dl className="rincian-skor">
          <div><dt>Benar</dt><dd>{benar}</dd></div>
          <div><dt>Salah</dt><dd>{daftarSoal.length - benar}</dd></div>
          <div><dt>Nilai</dt><dd>{persen}</dd></div>
        </dl>
        <div className="aksi-konfirmasi">
          <a className="aw-btn aw-btn-secondary" href={tautanLatihan('kuis')}>Pilih kuis lain</a>
          <button type="button" className="aw-btn aw-btn-primary" onClick={saatUlang}>Kerjakan lagi</button>
        </div>
      </div>

      <section className="tumpuk-rapat" aria-labelledby="judul-pembahasan">
        <h2 id="judul-pembahasan">Pembahasan</h2>
        <ol className="daftar-polos tumpuk-rapat">
          {daftarSoal.map((soal, urutan) => {
            const dipilih = pilihan[urutan]!;
            const tepat = dipilih === soal.indeksBenar;
            return (
              <li key={soal.kode}>
                <details className={tepat ? 'kartu-lipat pembahasan-item' : 'kartu-lipat pembahasan-item salah'} open={!tepat}>
                  <summary>
                    <span className={tepat ? 'status-jawaban benar' : 'status-jawaban salah'}><Ikon nama={tepat ? 'benar' : 'salah'} ukuran={16} /></span>
                    <span><b>Soal {urutan + 1}.</b> <Sebaris isi={soal.pertanyaan} /></span>
                  </summary>
                  <div className="isi-pembahasan">
                    <p><span className="keterangan">Jawabanmu</span> {HURUF[dipilih]}. <Sebaris isi={soal.pilihan[dipilih]!} /></p>
                    {!tepat && <p><span className="keterangan">Jawaban benar</span> {HURUF[soal.indeksBenar]}. <Sebaris isi={soal.pilihan[soal.indeksBenar]!} /></p>}
                    <p><Sebaris isi={soal.pembahasan} /></p>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>
    </section>
  );
}
