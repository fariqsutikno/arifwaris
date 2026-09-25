// Kuis konsep: daftar paket (per bab + acak) dan satu sesi paket.
// Sesi: layar awal (mode latihan = jawaban tepat langsung muncul, mode ujian = muncul di akhir; di mode ujian jawaban
// masih bisa diganti dan soal sebelumnya dibuka lagi sampai diselesaikan) → soal satu per satu →
// hasil: skor lalu pembahasan tiap soal. Keluar di tengah sesi ditanya dulu (usePenjaga).
// Mode ujian diberi batas waktu (lihat durasiUjian); waktu habis = jawaban otomatis dikumpulkan, yang kosong dihitung salah.

import { useEffect, useRef, useState } from 'react';
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

/** Patokan 5 soal = 3 menit (36 detik per soal), dibulatkan ke kelipatan 30 detik supaya angkanya enak dibaca. */
const DETIK_PER_SOAL = 36;
const KELIPATAN_DETIK = 30;
export const durasiUjian = (jumlahSoal: number) =>
  Math.max(KELIPATAN_DETIK, Math.round((jumlahSoal * DETIK_PER_SOAL) / KELIPATAN_DETIK) * KELIPATAN_DETIK);
const formatDurasi = (detik: number) => {
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;
  return [menit > 0 ? `${menit} menit` : '', sisa > 0 ? `${sisa} detik` : ''].filter(Boolean).join(' ');
};
const jamDigital = (detik: number) => `${Math.floor(detik / 60)}:${String(detik % 60).padStart(2, '0')}`;
const DETIK_PERINGATAN = 30;

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
  return judulTopik(bab);
};

/**
 * Judul bab KB tanpa nomor dan tanpa keterangan dalam kurung. Nomor bab KB sengaja tidak ditampilkan supaya tidak
 * tertukar dengan nomor Modul di halaman Belajar (keduanya tidak sepadan satu-satu).
 */
export const judulTopik = (bab: number) => (JUDUL_BAB[bab] ?? '').replace(/\s*\(.*\)\s*$/, '');

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
            <b>{judulTopik(bab)}</b>
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
  // Indeks = nomor soal; kosong = belum dijawab.
  const [pilihan, setPilihan] = useState<Array<number | undefined>>([]);
  const judul = judulPaket(paket);
  const [batasWaktu, setBatasWaktu] = useState<number | null>(null);
  const saatWaktuHabis = useRef<() => void>(() => {});
  const sisaDetik = useHitungMundur(tahap === 'mengerjakan' ? batasWaktu : null, () => saatWaktuHabis.current());

  usePenjaga(tahap === 'mengerjakan', {
    berlaku: () => true,
    judul: 'Keluar dari kuis?',
    isi: <p>Jawabanmu di sesi ini ({pilihan.filter(isi => isi !== undefined).length} dari {daftarSoal.length} soal) tidak disimpan.</p>,
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
    setBatasWaktu(modeBaru === 'akhir' ? Date.now() + durasiUjian(daftarSoal.length) * 1000 : null);
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
            <legend>Pilih mode</legend>
            <label className={mode === 'langsung' ? 'opsi-mode dipilih' : 'opsi-mode'}>
              <input type="radio" name="mode" checked={mode === 'langsung'} onChange={() => setMode('langsung')} />
              <span><b>Mode latihan</b><small>Jawaban yang tepat dan pembahasannya muncul setiap selesai menjawab.</small></span>
            </label>
            <label className={mode === 'akhir' ? 'opsi-mode dipilih' : 'opsi-mode'}>
              <input type="radio" name="mode" checked={mode === 'akhir'} onChange={() => setMode('akhir')} />
              <span><b>Mode ujian</b><small>Waktunya {formatDurasi(durasiUjian(daftarSoal.length))}. Jawaban yang tepat baru muncul setelah selesai atau waktu habis.</small></span>
            </label>
          </fieldset>
          <button type="button" className="aw-btn aw-btn-primary" onClick={() => mulai(mode)}>Mulai kuis</button>
        </div>
      </section>
    );
  }

  if (tahap === 'hasil') return <HasilKuis kepala={kepala} daftarSoal={daftarSoal} pilihan={pilihan} saatUlang={() => mulai(mode)} />;

  const soal = daftarSoal[posisi]!;
  const sudahDijawab = pilihan[posisi] !== undefined;
  const benarSejauhIni = pilihan.filter((indeks, urutan) => indeks === daftarSoal[urutan]!.indeksBenar).length;
  const jawab = (indeks: number) => {
    const baru = [...pilihan];
    baru[posisi] = indeks;
    setPilihan(baru);
  };
  // Penilaian dicatat saat sesi diselesaikan, karena di mode ujian jawaban masih bisa diganti sampai saat itu.
  const selesaikan = () => {
    daftarSoal.forEach((soalIni, urutan) => simpanCatatan('kuis', soalIni.kode, pilihan[urutan] === soalIni.indeksBenar ? 'benar' : 'salah'));
    const skor = `${benarSejauhIni}/${daftarSoal.length}`;
    simpanCatatan('kuis', paket, skor);
    catatAktivitas({ jenis: 'kuis', kode: paket, judul, waktu: Date.now(), hasil: skor });
    setTahap('hasil');
  };
  saatWaktuHabis.current = selesaikan;
  const terakhir = posisi + 1 === daftarSoal.length;
  // Mode latihan maju satu arah (jawaban langsung dibuka), jadi kotak nomor hanya bisa dipakai loncat di mode ujian.
  const bolehLoncat = (urutan: number) => mode === 'akhir' && (urutan <= posisi || pilihan[urutan - 1] !== undefined);
  return (
    <section className="sesi-kuis tumpuk-rapat">
      {kepala}
      <div className="tata-sesi">
      <div className="tumpuk-rapat">
      <div className="progres-sesi">
        <span className="angka-progres">Soal {posisi + 1} dari {daftarSoal.length}</span>
        {mode === 'langsung' && <span className="angka-progres">Benar {benarSejauhIni}</span>}
        {sisaDetik !== null && (
          <span className={sisaDetik <= DETIK_PERINGATAN ? 'sisa-waktu hampir' : 'sisa-waktu'} role="timer" aria-label={`Sisa waktu ${formatDurasi(sisaDetik) || '0 detik'}`}>
            <Ikon nama="jam" ukuran={16} /> {jamDigital(sisaDetik)}
          </span>
        )}
      </div>
      <span className="bar-progres" aria-hidden="true"><span style={{ width: `${((posisi + (sudahDijawab ? 1 : 0)) / daftarSoal.length) * 100}%` }} /></span>
      <KartuSoalKuis key={`${soal.kode}-${posisi}`} soal={soal} label={`Soal ${posisi + 1}`} mode={mode} saatDijawab={jawab} dipilihAwal={pilihan[posisi]} />
      <div className="nav-langkah">
        {mode === 'akhir' && posisi > 0
          ? <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => setPosisi(posisi - 1)}>Soal sebelumnya</button>
          : <span />}
        <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" disabled={!sudahDijawab} onClick={() => (terakhir ? selesaikan() : setPosisi(posisi + 1))}>
          {terakhir ? (mode === 'akhir' ? 'Selesaikan' : 'Lihat hasil') : 'Soal berikutnya'}
        </button>
      </div>
      </div>
      <nav className="nav-soal" aria-labelledby="judul-nav-soal">
        <h2 id="judul-nav-soal">Navigasi soal</h2>
        <ol className="kotak-nomor">
          {daftarSoal.map((soalIni, urutan) => {
            const terjawab = pilihan[urutan] !== undefined;
            return (
              <li key={`${soalIni.kode}-${urutan}`}>
                <button type="button" className={terjawab ? 'terjawab' : undefined} aria-current={urutan === posisi}
                  aria-label={`Soal ${urutan + 1}, ${terjawab ? 'terjawab' : 'belum dijawab'}`}
                  disabled={!bolehLoncat(urutan)} onClick={() => setPosisi(urutan)}>{urutan + 1}</button>
              </li>
            );
          })}
        </ol>
        <p className="legenda-nav"><span><i className="terjawab" />Terjawab</span><span><i />Belum</span></p>
      </nav>
      </div>
    </section>
  );
}

function HasilKuis({ kepala, daftarSoal, pilihan, saatUlang }: {
  kepala: React.ReactNode; daftarSoal: SoalKuis[]; pilihan: Array<number | undefined>; saatUlang: () => void;
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
          <div className="skor-benar"><dt>Benar</dt><dd>{benar}</dd></div>
          <div className="skor-salah"><dt>Salah</dt><dd>{daftarSoal.length - benar}</dd></div>
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
            const dipilih = pilihan[urutan];
            const tepat = dipilih === soal.indeksBenar;
            return (
              <li key={soal.kode}>
                <details className={tepat ? 'kartu-lipat pembahasan-item' : 'kartu-lipat pembahasan-item salah'} open={!tepat}>
                  <summary>
                    <span className={tepat ? 'status-jawaban benar' : 'status-jawaban salah'}><Ikon nama={tepat ? 'benar' : 'salah'} ukuran={16} /></span>
                    <span className="pertanyaan-pembahasan"><b>Soal {urutan + 1}.</b> <Sebaris isi={soal.pertanyaan} /></span>
                    <span className="panah-lipat" aria-hidden="true" />
                  </summary>
                  <div className="isi-pembahasan">
                    <div className={tepat ? 'baris-jawaban benar' : 'baris-jawaban salah'}>
                      <span className="label-jawaban">Jawabanmu</span>
                      {dipilih === undefined ? <span>Tidak dijawab (waktu habis)</span>
                        : <span><b>{HURUF[dipilih]}.</b> <Sebaris isi={soal.pilihan[dipilih]!} /></span>}
                    </div>
                    {!tepat && (
                      <div className="baris-jawaban benar">
                        <span className="label-jawaban">Jawaban tepat</span>
                        <span><b>{HURUF[soal.indeksBenar]}.</b> <Sebaris isi={soal.pilihan[soal.indeksBenar]!} /></span>
                      </div>
                    )}
                    <div className="teks-pembahasan">
                      <span className="label-jawaban">Pembahasan</span>
                      <p><Sebaris isi={soal.pembahasan} /></p>
                    </div>
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

/** Sisa detik sampai `batas` (epoch ms), diperbarui tiap seperempat detik; memanggil `saatHabis` sekali saat nol. */
function useHitungMundur(batas: number | null, saatHabis: () => void): number | null {
  const [sekarang, setSekarang] = useState(() => Date.now());
  useEffect(() => {
    if (batas === null) return;
    setSekarang(Date.now());
    const jeda = window.setInterval(() => {
      const kini = Date.now();
      setSekarang(kini);
      if (kini >= batas) { window.clearInterval(jeda); saatHabis(); }
    }, 250);
    return () => window.clearInterval(jeda);
  }, [batas]);
  return batas === null ? null : Math.max(0, Math.ceil((batas - sekarang) / 1000));
}
