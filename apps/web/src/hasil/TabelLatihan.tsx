// Tabel faraidh isian soal latihan (spec B2–B6, B9; acuan: mockup-tabel-faraidh-final.html, tab "Soal biasa").
//   Menerima: TabelSoal (kunci dari engine, hasil/tabelLatihan.ts) + tiga aksi ke kartu induk (XP, percobaan, buka jawaban).
//   Memutuskan: tampilan sel (pilih/angka/terisi/0/–), sel bersama saat pelajar memilih, penilaian lewat nilaiTabel.
//   Menyerahkan: saatMencoba / saatBenar ke Hasil (XP dan penanda dikerjakan); jawaban dibuka lewat dialog tahan milik Hasil.

import { Fragment, useEffect, useRef, useState } from 'react';
import { Confetti } from '../ui/Confetti';
import { Ikon } from '../ui/Ikon';
import { angka, angkaLatin, t } from '../terjemah';
import { nilaiTabel, PILIHAN_BAGIAN, pilihJangkar, type BarisSoal, type HasilNilai, type IsianTabel, type KolomSoal, type TabelSoal } from './tabelLatihan';

interface Props {
  tabel: TabelSoal;
  saatMencoba: () => void;
  saatBenar: () => void;
  saatLihatJawaban: () => void;
  /** Jawaban sudah dibuka (dialog tahan di Hasil), atau soal sudah dijawab benar. */
  terbuka: boolean;
}

const BATAS_DIGIT = /^\d{0,6}$/;
const BAGIAN_TERHALANG = 'Terhalang';
const adalahAshabah = (bagian: string | undefined) => bagian === 'Ashabah' || bagian === '1/6 + Ashabah';

const judulKolomDari = (kolom: KolomSoal): string =>
  ({ bagian: t('hitung.bagian'), ashl: t('hitung.asal_masalah'), akhir: t('hitung.tabel.asal_masalah_akhir') } as Record<string, string>)[kolom.id] ?? kolom.judul;

function labelPilihan(bagian: string): string {
  if (bagian === 'Ashabah') return t('hitung.ashabah');
  if (bagian === BAGIAN_TERHALANG) return t('hitung.terhalang');
  return bagian.split(' + ').map(potong => (potong === 'Ashabah' ? t('hitung.ashabah') : angka(potong))).join(' + ');
}

export function TabelLatihan({ tabel, saatMencoba, saatBenar, saatLihatJawaban, terbuka }: Props) {
  const [isian, setIsian] = useState<IsianTabel>({ kepala: {}, sel: {} });
  const [hasil, setHasil] = useState<HasilNilai | null>(null);
  const [tolakBulat, setTolakBulat] = useState(false);
  // Jangkar tetap sampai soal ditutup; Kosongkan tidak mengacak ulang (B5).
  const [jangkar] = useState(() => pilihJangkar(tabel, Math.random));
  const sudahBergabung = useRef(new Set<string>());

  const selesai = hasil?.jenis === 'benar';
  const modeKunci = terbuka && !selesai;
  const terkunciIsian = selesai || modeKunci;

  const periksa = () => {
    const nilai = nilaiTabel(tabel, isian, jangkar);
    setHasil(nilai);
    setTolakBulat(false);
    if (nilai.jenis === 'belumLengkap') return;
    saatMencoba();
    if (nilai.jenis === 'benar') saatBenar();
  };
  const kosongkan = () => { setIsian({ kepala: {}, sel: {} }); setHasil(null); setTolakBulat(false); };

  const isiPilihan = (idBaris: string, idKolom: string, nilai: string) => {
    setIsian(lama => ({ ...lama, sel: { ...lama.sel, [idBaris]: { ...lama.sel[idBaris], [idKolom]: nilai } } }));
    setHasil(null);
  };
  // Hanya bilangan bulat (B2): ketikan lain ditolak utuh, kotak kembali ke isi terakhir yang sah.
  const isiAngka = (teks: string, simpan: (nilai: string) => void) => {
    const latin = angkaLatin(teks);
    if (BATAS_DIGIT.test(latin)) simpan(latin); else setTolakBulat(true);
  };

  const kunciSel = (baris: BarisSoal, kolom: KolomSoal): string | undefined =>
    baris.kunci[kolom.id] ?? (baris.kunci.bagian === BAGIAN_TERHALANG && kolom.jenis === 'bulat' ? '0' : undefined);
  const bagianDipilih = (baris: BarisSoal, idKolom: string) => (modeKunci ? baris.kunci[idKolom] : isian.sel[baris.id]?.[idKolom]);
  const memilihTerhalang = (baris: BarisSoal, kolom: KolomSoal) => {
    const acuan = tabel.kolom.slice(0, tabel.kolom.indexOf(kolom)).filter(lain => lain.jenis === 'pilih').pop();
    return !!acuan && bagianDipilih(baris, acuan.id) === BAGIAN_TERHALANG;
  };

  // B4: baris berurutan yang satu kelompok engine dan dipilih sama oleh pelajar bergabung langsung.
  const rentangGabung = (kolom: KolomSoal): Map<number, number> => {
    const rentang = new Map<number, number>();
    if (!kolom.gabungDari) return rentang;
    const kelas = (baris: BarisSoal) => {
      const bagian = bagianDipilih(baris, kolom.gabungDari!);
      return !bagian || bagian === BAGIAN_TERHALANG ? undefined : adalahAshabah(bagian) ? 'ashabah' : bagian;
    };
    for (let awal = 0; awal < tabel.baris.length; awal++) {
      const kelompok = tabel.baris[awal]!.kelompok[kolom.id];
      const jenis = kelas(tabel.baris[awal]!);
      if (kelompok === undefined || jenis === undefined) continue;
      let akhir = awal + 1;
      while (akhir < tabel.baris.length && tabel.baris[akhir]!.kelompok[kolom.id] === kelompok && kelas(tabel.baris[akhir]!) === jenis) akhir++;
      if (akhir - awal > 1) { rentang.set(awal, akhir - awal); awal = akhir - 1; }
    }
    return rentang;
  };

  const tandai = new Set<string>();
  if (hasil?.jenis === 'belumLengkap') {
    hasil.idBarisKosong.forEach(id => tandai.add(`${hasil.idKolom}|${id}`));
    if (hasil.kepalaKosong) tandai.add(`${hasil.idKolom}|kepala`);
  }
  if (hasil?.jenis === 'salah') {
    hasil.idBarisSalah.forEach(id => tandai.add(`${hasil.idKolom}|${id}`));
    if (hasil.kepalaSalah) tandai.add(`${hasil.idKolom}|kepala`);
  }

  const kunciDicoret = (diisi: string | undefined, kunci: string, tampil: (teks: string) => string) => (
    <span className="kunci">{diisi && diisi !== kunci && <s>{tampil(diisi)}</s>}{tampil(kunci)}</span>
  );
  const kotakAngka = (nilai: string | undefined, label: string, simpan: (nilai: string) => void) => (
    <input className="kotak-bulat" inputMode="numeric" pattern="[0-9]*" autoComplete="off" aria-label={label} disabled={terkunciIsian}
      value={nilai ?? ''} onChange={event => isiAngka(event.target.value, simpan)} />
  );

  function isiSel(baris: BarisSoal, kolom: KolomSoal, gabung: boolean) {
    const kunci = kunciSel(baris, kolom);
    const label = `${judulKolomDari(kolom)} ${baris.nama}`;
    if (kunci === undefined) return '–';
    if (jangkar?.idBaris === baris.id && jangkar.idKolom === kolom.id) return <span className="terisi">{angka(kunci)}</span>;
    if (kolom.terkunci) return <span className="terisi">{angka(kunci)}</span>;
    if (kolom.jenis === 'bulat' && !modeKunci && memilihTerhalang(baris, kolom)) return <span className="nol">{angka('0')}</span>;
    const diisi = isian.sel[baris.id]?.[kolom.id];
    const bersama = gabung && <span className="bersama">{t('hitung.tabel.bersama')}</span>;
    if (modeKunci) return <>{kunciDicoret(diisi, kunci, kolom.jenis === 'pilih' ? labelPilihan : angka)}{bersama}</>;
    if (kolom.jenis === 'pilih') {
      return (
        <select aria-label={label} disabled={terkunciIsian} value={diisi ?? ''} onChange={event => isiPilihan(baris.id, kolom.id, event.target.value)}>
          <option value="">–</option>
          {(kolom.pilihan ?? PILIHAN_BAGIAN).map(pilihan => <option key={pilihan} value={pilihan}>{labelPilihan(pilihan)}</option>)}
        </select>
      );
    }
    return <>{kotakAngka(diisi, gabung ? `${judulKolomDari(kolom)} ${t('hitung.tabel.bersama')}` : label, nilai => isiPilihan(baris.id, kolom.id, nilai))}{bersama}</>;
  }

  function sel(kolom: KolomSoal, indeks: number, rentang: Map<number, number>, terlewat: Set<number>) {
    if (terlewat.has(indeks)) return null;
    const span = rentang.get(indeks) ?? 1;
    for (let lanjut = 1; lanjut < span; lanjut++) terlewat.add(indeks + lanjut);
    const baris = tabel.baris[indeks]!;
    const kunciGabung = `${kolom.id}|${indeks}|${span}`;
    const baru = span > 1 && !sudahBergabung.current.has(kunciGabung);
    const kelas = [tandai.has(`${kolom.id}|${baris.id}`) && 'keliru', baru && 'baru-gabung'].filter(Boolean).join(' ');
    return <td key={kolom.id} className={kelas || undefined} rowSpan={span > 1 ? span : undefined}>{isiSel(baris, kolom, span > 1)}</td>;
  }

  const rentangPerKolom = new Map(tabel.kolom.map(kolom => [kolom.id, rentangGabung(kolom)]));
  const terlewatPerKolom = new Map(tabel.kolom.map(kolom => [kolom.id, new Set<number>()]));
  useEffect(() => {
    sudahBergabung.current = new Set(tabel.kolom.flatMap(kolom => [...rentangPerKolom.get(kolom.id)!].filter(([, span]) => span > 1).map(([awal, span]) => `${kolom.id}|${awal}|${span}`)));
  });

  const umpan = modeKunci ? { gaya: 'buka', teks: t('hitung.tabel.jawaban_dibuka') } : hasilUmpan(hasil, tabel);

  return (
    <div className="bento-s12 tata-tabel-latihan">
      <section className="ubin-h tabel-latihan" aria-labelledby="judul-tabel-latihan">
        <h2 id="judul-tabel-latihan">{t('hitung.tabel.judul')}</h2>
        <div className="wadah-tabel-latihan">
          <table className="tabel-kitab">
            <thead>
              <tr>
                <th className="nama" scope="col">{t('hitung.banding_madzhab_orang')}</th>
                {tabel.kolom.map(kolom => (
                  <th key={kolom.id} scope="col" className={tandai.has(`${kolom.id}|kepala`) ? 'keliru' : undefined}>
                    <span className="judul-kolom">{judulKolomDari(kolom)}</span>
                    {kolom.kepala !== undefined && (kolom.terkunci ? <span className="terisi">{angka(String(kolom.kepala))}</span>
                      : modeKunci ? kunciDicoret(isian.kepala[kolom.id], String(kolom.kepala), angka)
                      : kotakAngka(isian.kepala[kolom.id], judulKolomDari(kolom), nilai => { setIsian(lama => ({ ...lama, kepala: { ...lama.kepala, [kolom.id]: nilai } })); }))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabel.baris.map((baris, indeks) => (
                <tr key={baris.id}>
                  <th className="nama" scope="row">{baris.nama}</th>
                  {tabel.kolom.map(kolom => <Fragment key={kolom.id}>{sel(kolom, indeks, rentangPerKolom.get(kolom.id)!, terlewatPerKolom.get(kolom.id)!)}</Fragment>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tolakBulat && <p className="petunjuk-bulat" role="status">{t('hitung.tabel.hanya_bilangan_bulat')}</p>}
        {!selesai && !modeKunci && (
          <div className="aksi-tabel">
            <button type="button" className="aw-btn aw-btn-primary" onClick={periksa}>{t('hitung.langkah_periksa')}</button>
            <button type="button" className="tautan-aksi" onClick={kosongkan}>{t('hitung.kosongkan')}</button>
            <button type="button" className="tautan-aksi tautan-bahaya" onClick={saatLihatJawaban}><Ikon nama="mata" ukuran={18} />{t('hitung.lihat_jawaban')}</button>
          </div>
        )}
        {umpan && <div className={`umpan-tabel ${umpan.gaya}`} role="status">{umpan.teks}</div>}
        {selesai && <Confetti />}
      </section>
      <section className="ubin-h cara-mengisi" aria-labelledby="judul-cara-mengisi">
        <h2 id="judul-cara-mengisi">{t('hitung.tabel.cara_mengisi')}</h2>
        <ol>
          {[t('hitung.tabel.cara.biasa_1'), t('hitung.tabel.cara.biasa_2'), t('hitung.tabel.cara.biasa_3'), t('hitung.tabel.cara.biasa_4'), t('hitung.tabel.cara.umum_boleh_bukan_terkecil')].map(teks => (
            <li key={teks}><Tebal teks={teks} /></li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function hasilUmpan(hasil: HasilNilai | null, tabel: TabelSoal): { gaya: string; teks: string } | null {
  if (!hasil) return null;
  const judul = (idKolom: string) => judulKolomDari(tabel.kolom.find(kolom => kolom.id === idKolom)!);
  if (hasil.jenis === 'belumLengkap') return { gaya: 'kurang', teks: t('hitung.tabel.kolom_belum_lengkap', { judul: judul(hasil.idKolom) }) };
  if (hasil.jenis === 'salah') return { gaya: 'salah', teks: t('hitung.tabel.mulai_salah', { judul: judul(hasil.idKolom) }) };
  if (hasil.bentukTerkecil.length === 0) return { gaya: 'benar', teks: t('hitung.tabel.benar_semua') };
  const daftar = hasil.bentukTerkecil.map(bentuk => t('hitung.tabel.butir_terkecil', { judul: judul(bentuk.idKolom), diisi: angka(String(bentuk.diisi)), terkecil: angka(String(bentuk.terkecil)) })).join(', ');
  return { gaya: 'benar', teks: t('hitung.tabel.benar_semua_terkecil', { daftar }) };
}

/** Kata kunci tebal ditandai **…** di teks diksi. */
const Tebal = ({ teks }: { teks: string }) => <>{teks.split('**').map((potong, indeks) => (indeks % 2 ? <b key={indeks}>{potong}</b> : potong))}</>;
