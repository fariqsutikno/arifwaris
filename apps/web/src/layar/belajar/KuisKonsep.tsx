// Kuis konsep: satu sesi paket (daftar paketnya ada di PapanKuis.tsx).
// Sesi: layar awal (mode latihan = jawaban tepat langsung muncul, mode ujian = muncul di akhir; di mode ujian jawaban
// masih bisa diganti dan soal sebelumnya dibuka lagi sampai diselesaikan) → soal satu per satu →
// hasil: skor lalu pembahasan tiap soal. Keluar di tengah sesi ditanya dulu (usePenjaga).
// Mode ujian diberi batas waktu (lihat durasiUjian); waktu habis = jawaban otomatis dikumpulkan, yang kosong dihitung salah.

import { useEffect, useRef, useState } from 'react';
import { JUDUL_BAB, type SoalKuis } from '@waris/content';
import { daftarSoalKuis } from '../../konten/sumber';
import { bacaPilihan, catatAktivitas, simpanPilihan } from '../../preferensi';
import { bacaRekorPaket, catatLatihan, simpanSkorPaket } from '../../progres';
import { tautanLatihan } from '../../rute';
import { capaianKuis, persenBulat, predikatDari, type Capaian } from '../../skorKuis';
import { teksPredikat, teksTarget } from './teksSkor';
import { Ikon } from '../../ui/Ikon';
import { usePenjaga } from '../../ui/Penjaga';
import { hurufPilihan, KartuSoalKuis, PembahasanTambahan, type ModePembahasan } from './KartuSoalKuis';
import { Sebaris } from './Sebaris';
import { angka, t } from '../../terjemah';

/** Kelompokkan per bab KB, urut nomor bab. */
export function perBab<T extends { bab: number }>(daftar: T[]): Array<[number, T[]]> {
  return [...new Set(daftar.map(soal => soal.bab))].sort((a, b) => a - b)
    .map(bab => [bab, daftar.filter(soal => soal.bab === bab)]);
}

export const JUMLAH_SOAL_ACAK = 10;
export const PAKET_ACAK = 'acak';
export const kodePaketBab = (bab: number) => `bab-${bab}`;
const KUNCI_MODE = 'mode-pembahasan';

/** Patokan 5 soal = 3 menit (36 detik per soal), dibulatkan ke kelipatan 30 detik supaya angkanya enak dibaca. */
const DETIK_PER_SOAL = 36;
const KELIPATAN_DETIK = 30;
export const durasiUjian = (jumlahSoal: number) =>
  Math.max(KELIPATAN_DETIK, Math.round((jumlahSoal * DETIK_PER_SOAL) / KELIPATAN_DETIK) * KELIPATAN_DETIK);
const formatDurasi = (detik: number) => {
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;
  return [menit > 0 ? t('latihan.jumlah_menit', { jumlah: menit }) : '', sisa > 0 ? t('latihan.jumlah_detik', { jumlah: sisa }) : ''].filter(Boolean).join(' ');
};
const jamDigital = (detik: number) => angka(`${Math.floor(detik / 60)}:${String(detik % 60).padStart(2, '0')}`);
const DETIK_PERINGATAN = 30;

export function soalPaket(paket: string, acak: () => number = Math.random): SoalKuis[] {
  if (paket === PAKET_ACAK) {
    // Fisher–Yates; urutan acak hanya di UI, bukan di engine.
    const salinan = [...daftarSoalKuis()];
    for (let indeks = salinan.length - 1; indeks > 0; indeks--) {
      const tukar = Math.floor(acak() * (indeks + 1));
      [salinan[indeks], salinan[tukar]] = [salinan[tukar]!, salinan[indeks]!];
    }
    return salinan.slice(0, JUMLAH_SOAL_ACAK);
  }
  return daftarSoalKuis().filter(soal => kodePaketBab(soal.bab) === paket);
}

const judulPaket = (paket: string) => {
  if (paket === PAKET_ACAK) return t('umum.kuis_acak');
  const bab = Number(paket.replace('bab-', ''));
  return judulTopik(bab);
};

/**
 * Judul bab KB tanpa nomor dan tanpa keterangan dalam kurung. Nomor bab KB sengaja tidak ditampilkan supaya tidak
 * tertukar dengan nomor Modul di halaman Belajar (keduanya tidak sepadan satu-satu).
 */
export const judulTopik = (bab: number) => (JUDUL_BAB[bab] ?? '').replace(/\s*\(.*\)\s*$/, '');

type Tahap = 'awal' | 'mengerjakan' | 'hasil';

export function SesiKuis({ paket }: { paket: string }) {
  const [daftarSoal, setDaftarSoal] = useState(() => soalPaket(paket));
  const [tahap, setTahap] = useState<Tahap>('awal');
  const [mode, setMode] = useState<ModePembahasan>(() => (bacaPilihan(KUNCI_MODE) === 'akhir' ? 'akhir' : 'langsung'));
  const [posisi, setPosisi] = useState(0);
  const [capaian, setCapaian] = useState<Capaian | null>(null);
  // Sesi "ulangi yang salah" hanya melatih; nilai terbaik paket tidak disentuh.
  const [ulangiSalah, setUlangiSalah] = useState(false);
  // Indeks = nomor soal; kosong = belum dijawab.
  const [pilihan, setPilihan] = useState<Array<number | undefined>>([]);
  const judul = judulPaket(paket);
  const [batasWaktu, setBatasWaktu] = useState<number | null>(null);
  const saatWaktuHabis = useRef<() => void>(() => {});
  const sisaDetik = useHitungMundur(tahap === 'mengerjakan' ? batasWaktu : null, () => saatWaktuHabis.current());

  usePenjaga(tahap === 'mengerjakan', {
    berlaku: () => true,
    judul: t('latihan.keluar_dari_kuis'),
    isi: <p>{t('latihan.jawabanmu_di_sesi_ini_terjawab_dari', { terjawab: pilihan.filter(isi => isi !== undefined).length, total: daftarSoal.length })}</p>,
    labelTetap: t('latihan.lanjut_mengerjakan'),
    labelPergi: t('latihan.keluar'),
  });

  if (daftarSoal.length === 0) return <p role="alert">{t('latihan.kuis_ini_tidak_ada')} <a href={tautanLatihan('kuis')}>{t('latihan.kembali_ke_daftar_kuis')}</a></p>;

  const mulai = (modeBaru: ModePembahasan) => {
    simpanPilihan(KUNCI_MODE, modeBaru);
    setMode(modeBaru);
    setDaftarSoal(soalPaket(paket));
    setPosisi(0);
    setPilihan([]);
    setBatasWaktu(modeBaru === 'akhir' ? Date.now() + durasiUjian(daftarSoal.length) * 1000 : null);
    setUlangiSalah(false);
    setTahap('mengerjakan');
  };

  const mulaiUlangiSalah = () => {
    const salah = daftarSoal.filter((soal, urutan) => pilihan[urutan] !== soal.indeksBenar);
    setDaftarSoal(salah);
    setPosisi(0);
    setPilihan([]);
    setBatasWaktu(mode === 'akhir' ? Date.now() + durasiUjian(salah.length) * 1000 : null);
    setUlangiSalah(true);
    setTahap('mengerjakan');
  };

  const judulTampil = ulangiSalah ? t('latihan.judul_ulangi_yang_salah', { judul }) : judul;
  const penandaWaktu = tahap === 'mengerjakan' && sisaDetik !== null && (
    <span className={sisaDetik <= DETIK_PERINGATAN ? 'sisa-waktu hampir' : 'sisa-waktu'} role="timer" aria-label={t('latihan.sisa_waktu_durasi', { durasi: formatDurasi(sisaDetik) || t('latihan.jumlah_detik', { jumlah: 0 }) })}>
      <Ikon nama="jam" ukuran={16} /> {jamDigital(sisaDetik)}
    </span>
  );
  const kepala = (
    <div className={tahap === 'awal' ? 'bar-ujian polos' : 'bar-ujian'}>
      <a className="keluar-ujian" href={tautanLatihan('kuis')}><Ikon nama="keluar" ukuran={18} />{t('latihan.keluar')}</a>
      {tahap !== 'awal' && <span className="judul-sesi">{judulTampil}</span>}
      {penandaWaktu || <span />}
    </div>
  );

  if (tahap === 'awal') {
    return (
      <Rangka kepala={kepala} hero={<div className="judul-hero-sesi"><h1>{judul}</h1><p>{t('latihan.jumlah_soal', { jumlah: daftarSoal.length })}</p></div>}>
        <div className="awal-ujian">
          <fieldset className="pilihan-mode">
            <legend>{t('latihan.pilih_mode')}</legend>
            <label className={mode === 'langsung' ? 'opsi-mode dipilih' : 'opsi-mode'}>
              <input type="radio" name="mode" checked={mode === 'langsung'} onChange={() => setMode('langsung')} />
              <span className="ikon-mode" aria-hidden="true"><Ikon nama="pensil" ukuran={22} /></span>
              <span className="teks-mode"><b>{t('latihan.mode_latihan')}</b><small>{t('latihan.jawaban_yang_tepat_dan_pembahasannya_muncul')}</small></span>
            </label>
            <label className={mode === 'akhir' ? 'opsi-mode dipilih' : 'opsi-mode'}>
              <input type="radio" name="mode" checked={mode === 'akhir'} onChange={() => setMode('akhir')} />
              <span className="ikon-mode" aria-hidden="true"><Ikon nama="jam" ukuran={22} /></span>
              <span className="teks-mode"><b>{t('latihan.mode_ujian')}</b><small>{t('latihan.waktunya_durasi_jawaban_yang_tepat_baru', { durasi: formatDurasi(durasiUjian(daftarSoal.length)) })}</small></span>
            </label>
          </fieldset>
          <button type="button" className="aw-btn aw-btn-primary tombol-mulai" onClick={() => mulai(mode)}>{t('latihan.mulai_kuis')}</button>
        </div>
      </Rangka>
    );
  }

  if (tahap === 'hasil') return <HasilKuis kepala={kepala} daftarSoal={daftarSoal} pilihan={pilihan} capaian={capaian} ulangiSalah={ulangiSalah} saatUlang={() => mulai(mode)} saatUlangiSalah={mulaiUlangiSalah} />;

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
    daftarSoal.forEach((soalIni, urutan) => catatLatihan('kuis', soalIni.kode, pilihan[urutan] === soalIni.indeksBenar, pilihan[urutan] ?? null));
    const skor = `${benarSejauhIni}/${daftarSoal.length}`;
    if (ulangiSalah) {
      setCapaian(null);
    } else {
      // Capaian dihitung sebelum rekor diperbarui, karena yang dibandingkan adalah nilai terbaik sebelum sesi ini.
      setCapaian(paket === PAKET_ACAK ? null : capaianKuis(bacaRekorPaket()[paket]?.terbaik, skor));
      simpanSkorPaket(paket, skor);
      catatAktivitas({ jenis: 'kuis', kode: paket, judul, waktu: Date.now(), hasil: skor });
    }
    setTahap('hasil');
  };
  saatWaktuHabis.current = selesaikan;
  const terakhir = posisi + 1 === daftarSoal.length;
  // Mode latihan maju satu arah (jawaban langsung dibuka), jadi kotak nomor hanya bisa dipakai loncat di mode ujian.
  const bolehLoncat = (urutan: number) => mode === 'akhir' && (urutan <= posisi || pilihan[urutan - 1] !== undefined);
  const jenisNomor = (urutan: number) => {
    const dipilih = pilihan[urutan];
    if (dipilih === undefined) return undefined;
    if (mode === 'akhir') return 'terjawab';
    return dipilih === daftarSoal[urutan]!.indeksBenar ? 'terjawab benar' : 'terjawab salah';
  };
  return (
    <Rangka kepala={kepala} hero={<>
      <nav className="nomor-ujian" aria-label={t('latihan.navigasi_soal')}>
          <ol className="kotak-nomor">
            {daftarSoal.map((soalIni, urutan) => {
              const terjawab = pilihan[urutan] !== undefined;
              return (
                <li key={`${soalIni.kode}-${urutan}`}>
                  <button type="button" className={jenisNomor(urutan)} aria-current={urutan === posisi}
                    aria-label={t('latihan.soal_nomor_status', { nomor: urutan + 1, status: terjawab ? t('latihan.terjawab') : t('latihan.belum_dijawab') })}
                    disabled={!bolehLoncat(urutan)} onClick={() => setPosisi(urutan)}>{angka(String(urutan + 1))}</button>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="progres-sesi">
          <span className="angka-progres">{t('umum.soal_nomor_dari_total', { nomor: posisi + 1, total: daftarSoal.length })}</span>
          {mode === 'langsung' && <span className="angka-progres">{t('latihan.benar_jumlah', { jumlah: benarSejauhIni })}</span>}
        </div>
    </>}>
      <KartuSoalKuis key={`${soal.kode}-${posisi}`} soal={soal} label={t('latihan.soal_nomor', { nomor: posisi + 1 })} sembunyikanLabel mode={mode} saatDijawab={jawab} dipilihAwal={pilihan[posisi]} />
      <div className="nav-langkah">
        {mode === 'akhir' && posisi > 0
          ? <button type="button" className="aw-btn aw-btn-secondary" onClick={() => setPosisi(posisi - 1)}>{t('latihan.soal_sebelumnya')}</button>
          : <span />}
        <button type="button" className="aw-btn aw-btn-primary" disabled={!sudahDijawab} onClick={() => (terakhir ? selesaikan() : setPosisi(posisi + 1))}>
          {terakhir ? (mode === 'akhir' ? t('latihan.selesaikan') : t('hitung.lihat_hasil')) : t('latihan.soal_berikutnya')}
        </button>
      </div>
    </Rangka>
  );
}

function HasilKuis({ kepala, daftarSoal, pilihan, capaian, ulangiSalah, saatUlang, saatUlangiSalah }: {
  kepala: React.ReactNode; daftarSoal: SoalKuis[]; pilihan: Array<number | undefined>; capaian: Capaian | null; ulangiSalah: boolean;
  saatUlang: () => void; saatUlangiSalah: () => void;
}) {
  const benar = daftarSoal.filter((soal, urutan) => pilihan[urutan] === soal.indeksBenar).length;
  const persen = persenBulat({ benar, total: daftarSoal.length });
  return (
    <Rangka kepala={kepala} hero={<div className="judul-hero-sesi"><h1>{t('latihan.skor')}</h1></div>}>
      <div className="kartu ringkasan-kuis" aria-live="polite">
        <div>
          <p className="label-langkah">{t('latihan.skor')}</p>
          <p className="skor-besar">{angka(String(benar))}<small>/{angka(String(daftarSoal.length))}</small></p>
        </div>
        <dl className="rincian-skor">
          <div className="skor-benar"><dt>{t('latihan.benar')}</dt><dd>{angka(String(benar))}</dd></div>
          <div className="skor-salah"><dt>{t('latihan.salah')}</dt><dd>{angka(String(daftarSoal.length - benar))}</dd></div>
          <div><dt>{t('latihan.nilai')}</dt><dd>{angka(String(persen))}</dd></div>
        </dl>
        {capaian && <CapaianKuis capaian={capaian} />}
        {ulangiSalah && <p className="capaian-kuis keterangan">{t('latihan.nilai_terbaik_paket_tidak_berubah')}</p>}
        <div className="aksi-hasil">
          {benar < daftarSoal.length
            ? <button type="button" className="aw-btn aw-btn-primary" onClick={saatUlangiSalah}>{t('latihan.ulangi_yang_salah')}</button>
            : <button type="button" className="aw-btn aw-btn-primary" onClick={saatUlang}>{t('latihan.kerjakan_lagi')}</button>}
          <a className="tautan-aksi" href={tautanLatihan('kuis')}>{t('latihan.pilih_kuis_lain')}</a>
        </div>
      </div>

      <section className="tumpuk-rapat" aria-labelledby="judul-pembahasan">
        <h2 id="judul-pembahasan">{t('hitung.pembahasan')}</h2>
        <ol className="daftar-polos tumpuk-rapat">
          {daftarSoal.map((soal, urutan) => {
            const dipilih = pilihan[urutan];
            const tepat = dipilih === soal.indeksBenar;
            return (
              <li key={soal.kode}>
                <details className={tepat ? 'butir-pembahasan benar' : 'butir-pembahasan salah'} open={!tepat}>
                  <summary>
                    <span className="status-butir"><Ikon nama={tepat ? 'benar' : 'salah'} ukuran={16} />{tepat ? t('latihan.benar') : t('latihan.salah')}</span>
                    <span className="soal-butir"><b>{t('latihan.soal_nomor_2', { nomor: urutan + 1 })}</b> <Sebaris isi={soal.pertanyaan} /></span>
                    <Ikon nama="kembali" ukuran={18} />
                  </summary>
                  <div className="isi-butir">
                    <div className={tepat ? 'jawab-butir tepat' : 'jawab-butir salah'}>
                      <span className="label-butir">{t('hitung.jawabanmu')}</span>
                      {dipilih === undefined ? <span>{t('latihan.tidak_dijawab_waktu_habis')}</span>
                        : <span><b>{hurufPilihan(dipilih)}.</b> <Sebaris isi={soal.pilihan[dipilih]!} /></span>}
                    </div>
                    {!tepat && (
                      <div className="jawab-butir tepat">
                        <span className="label-butir">{t('latihan.jawaban_tepat')}</span>
                        <span><b>{hurufPilihan(soal.indeksBenar)}.</b> <Sebaris isi={soal.pilihan[soal.indeksBenar]!} /></span>
                      </div>
                    )}
                    <div className="teks-butir">
                      <span className="label-butir">{t('hitung.pembahasan')}</span>
                      <p><Sebaris isi={soal.pembahasan} /></p>
                      <PembahasanTambahan soal={soal} dipilih={dipilih} />
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>
    </Rangka>
  );
}

/** Rangka halaman sesi: hero gelap (bar atas, judul/nomor soal) lalu lembar terang berujung membulat yang menimpa hero dan mengisi sisa layar. */
function Rangka({ kepala, hero, children }: { kepala: React.ReactNode; hero: React.ReactNode; children: React.ReactNode }) {
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  return (
    <main className="halaman-beranda halaman-sesi">
      <div className="hero-beranda latar-sesi" aria-hidden="true" />
      {kepala}
      <div className="hero-sesi">{hero}</div>
      <div className="lembar-sesi">
        <div className="sesi-kuis ruang-ujian tumpuk">{children}</div>
      </div>
    </main>
  );
}

/** Nilai terbaik di paket ini setelah sesi barusan: apakah naik, dan seberapa jauh lagi ke predikat berikutnya. */
function CapaianKuis({ capaian }: { capaian: Capaian }) {
  const { persenTerbaik, persenSebelumnya, terbaikBaru, predikatNaik } = capaian;
  const target = teksTarget(persenTerbaik);
  return (
    <div className="capaian-kuis">
      <p><b>{t('latihan.nilai_terbaikmu_persen_predikat', { persen: angka(String(persenTerbaik)), predikat: teksPredikat(predikatDari(persenTerbaik)) })}</b></p>
      <p className="keterangan">
        {terbaikBaru
          ? (persenSebelumnya === null ? t('latihan.percobaan_pertama_di_paket_ini') : t('latihan.nilai_terbaik_baru_naik_dari', { persen: angka(String(persenSebelumnya)) }))
          : t('latihan.belum_melampaui_nilai_terbaikmu')}
        {predikatNaik && persenSebelumnya !== null && <> {t('latihan.predikat_naik_ke', { predikat: teksPredikat(predikatNaik) })}</>}
        {target && <> {target}.</>}
      </p>
    </div>
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
