// Tabel faraidh isian soal latihan (spec B2–B6, B9; acuan: mockup-tabel-faraidh-final.html, tab "Soal biasa").
//   Menerima: TabelSoal (kunci dari engine, @waris/latihan), mode, jangkar dari luar, dan aksi ke kartu induk.
//   Memutuskan: tampilan sel (pilih/angka/terisi/0/–), sel bersama saat pelajar memilih, penilaian lewat nilaiSemuaKolom.
//   Menyerahkan: PercobaanTabel ke Hasil tiap Periksa yang lolos "belum lengkap" (XP, confetti, pencatatan diputuskan Hasil);
//   jawaban dibuka lewat dialog tahan milik Hasil, yang menerima isian terakhir.

import { Fragment, useEffect, useRef, useState } from 'react';
import { Confetti } from '../ui/Confetti';
import { Ikon } from '../ui/Ikon';
import { angka, angkaLatin, t } from '../terjemah';
import { jenisDari } from '../checklist';
import { bacaIsianSoal, hapusIsianSoal, hitungTerisi, simpanIsianSoal } from '../isianSoal';
import { LABEL_SEHARI } from '../konten/ahliWaris';
import { ID_BARIS_MAUQUF, nilaiSemuaKolom, PILIHAN_BAGIAN, putusanLatihan, type BarisSoal, type HasilNilai, type IsianTabel, type Jangkar, type KolomSoal, type ModeSoal, type PercobaanTabel, type TabelSoal } from '@waris/latihan';

interface Props {
  tabel: TabelSoal;
  mode: ModeSoal;
  /** Dipilih pemanggil sekali per sesi soal (di server: dari sesi); komponen tidak mengacak sendiri (B5). */
  jangkar: Jangkar | null;
  saatPercobaan: (percobaan: PercobaanTabel) => void;
  /** Mengirim isian terakhir supaya pemanggil bisa mencatat Lihat jawaban sesudah dialog tahan dikonfirmasi. */
  saatLihatJawaban: (isian: IsianTabel) => void;
  /** Jawaban sudah dibuka (dialog tahan di Hasil), atau soal sudah dijawab benar. */
  terbuka: boolean;
  /** Isian dikunci dari luar (Ujian sesudah Kirim, tugas kelas yang ditutup). */
  terkunci?: boolean;
  /** Nama mayit untuk judul kolom munasakhat; tanpa ini id dipakai apa adanya. */
  namaDari?: (id: string) => string;
  /** Soal latihan: isian tersimpan per kode soal supaya soal yang terputus bisa dilanjutkan (spec siklus kasus dan soal). */
  kodeSoal?: string | undefined;
  /** Kotak Cara mengisi tidak ditampilkan (tabel kedua dan seterusnya dalam satu soal, mis. gharqa). */
  tanpaCara?: boolean;
}

const BATAS_DIGIT = /^\d{0,6}$/;
const BAGIAN_TERHALANG = 'Terhalang';
const adalahAshabah = (bagian: string | undefined) => bagian === 'Ashabah' || bagian === '1/6 + Ashabah';

const hurufAwalBesar = (teks: string) => teks.charAt(0).toUpperCase() + teks.slice(1);
const namaKemungkinan = (kemungkinan: string | undefined): string => (
  kemungkinan === 'hidup' ? t('hitung.tabel.kemungkinan.hidup') : kemungkinan === 'mati' ? t('hitung.tabel.kemungkinan.mati')
  : kemungkinan === 'lk' ? t('hitung.tabel.kemungkinan.lk') : kemungkinan === 'pr' ? t('hitung.tabel.kemungkinan.pr')
  : kemungkinan === 'haml.mati' ? t('hitung.tabel.kemungkinan.haml_mati') : kemungkinan === 'haml.lk' ? t('hitung.tabel.kemungkinan.haml_lk')
  : kemungkinan === 'haml.pr' ? t('hitung.tabel.kemungkinan.haml_pr') : kemungkinan === 'haml.duaPr' ? t('hitung.tabel.kemungkinan.haml_dua_pr')
  : kemungkinan === 'hamlHnb.mati' ? t('hitung.tabel.kemungkinan.haml_hnb_mati') : kemungkinan === 'hamlHnb.lk' ? t('hitung.tabel.kemungkinan.haml_hnb_lk')
  : kemungkinan === 'hamlHnb.pr' ? t('hitung.tabel.kemungkinan.haml_hnb_pr') : kemungkinan === 'hamlHnb.duaLk' ? t('hitung.tabel.kemungkinan.haml_hnb_dua_lk')
  : kemungkinan === 'hamlHnb.duaPr' ? t('hitung.tabel.kemungkinan.haml_hnb_dua_pr') : kemungkinan === 'hamlHnb.lkPr' ? t('hitung.tabel.kemungkinan.haml_hnb_lk_pr') : kemungkinan ?? '');

// Munasakhat: kolom mas'alah dinomori dari id ('m2' → 2); nama mayit dari pemanggil (`namaDari`).
const judulKolomDari = (kolom: KolomSoal, namaDari: (id: string) => string): string => {
  const nama = kolom.mayit ? namaDari(kolom.mayit) : '';
  const nomor = kolom.id.replace(/^m/, '');
  return ({
    bagian: () => (kolom.mayit ? t('hitung.tabel.judul_bagian_mayit', { nama }) : t('hitung.bagian')),
    asalMasalah: () => t('hitung.asal_masalah'), asalMasalahAkhir: () => t('hitung.tabel.asal_masalah_akhir'),
    masalahPertama: () => t('hitung.tabel.judul_masalah', { nomor, nama }), masalahLanjutan: () => t('hitung.tabel.judul_masalah', { nomor, nama }),
    jamiah: () => t('hitung.jami_ah'),
    bagianKemungkinan: () => t('hitung.tabel.judul_bagian_kemungkinan', { kemungkinan: namaKemungkinan(kolom.kemungkinan) }),
    sahamKemungkinan: () => hurufAwalBesar(namaKemungkinan(kolom.kemungkinan)), jamiahSekarang: () => t('hitung.tabel.jamiah_diberikan'),
    didudukkanSebagai: () => t('hitung.tabel.didudukkan_sebagai'), bagianPerantara: () => t('hitung.tabel.bagian_perantara'),
  } as Record<string, () => string>)[kolom.idJudul]?.() ?? kolom.idJudul;
};

function labelPilihan(bagian: string): string {
  if (bagian === 'Ashabah') return t('hitung.ashabah');
  if (bagian === BAGIAN_TERHALANG) return t('hitung.terhalang');
  return bagian.split(' + ').map(potong => (potong === 'Ashabah' ? t('hitung.ashabah') : angka(potong))).join(' + ');
}

/** Kursi dzawil arham (kunci ahli waris dari engine) → nama sehari-hari. */
const labelKursi = (kunci: string): string => (LABEL_SEHARI as Record<string, string>)[kunci] ?? jenisDari(kunci as never)?.label ?? kunci;
const labelUntuk = (kolom: KolomSoal, nilai: string): string => (kolom.idJudul === 'didudukkanSebagai' ? labelKursi(nilai) : labelPilihan(nilai));

export function TabelLatihan({ tabel, mode, jangkar, saatPercobaan, saatLihatJawaban, terbuka, terkunci = false, namaDari = id => id, tanpaCara = false, kodeSoal }: Props) {
  const judul = (kolom: KolomSoal) => judulKolomDari(kolom, namaDari);
  const [isian, setIsian] = useState<IsianTabel>(() => (kodeSoal && bacaIsianSoal(kodeSoal)?.isian) || { kepala: {}, sel: {} });
  const isianAwal = useRef(isian);
  const [hasil, setHasil] = useState<HasilNilai | null>(null);
  const [tolakBulat, setTolakBulat] = useState(false);
  const sudahBergabung = useRef(new Set<string>());

  // Setiap perubahan isian disimpan; kosong = hapus. Soal benar / jawaban dibuka dihapus oleh Hasil.
  useEffect(() => {
    if (!kodeSoal || isian === isianAwal.current) return;
    if (hitungTerisi(isian) > 0) simpanIsianSoal(kodeSoal, isian, hitungKotak(tabel, jangkar)); else hapusIsianSoal(kodeSoal);
  }, [isian]); // eslint-disable-line react-hooks/exhaustive-deps

  const selesai = hasil?.jenis === 'benar';
  const modeKunci = terbuka && !selesai;
  const terkunciIsian = selesai || modeKunci || terkunci;

  const periksa = () => {
    const hasilKolom = nilaiSemuaKolom(tabel, isian, jangkar);
    const nilai = putusanLatihan(hasilKolom);
    setHasil(nilai);
    setTolakBulat(false);
    if (nilai.jenis === 'belumLengkap') return;
    saatPercobaan({ mode, aksi: 'periksa', isian, jangkar, hasilKolom, benarSemua: nilai.jenis === 'benar' });
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

  const namaBaris = (baris: BarisSoal) => (baris.id === ID_BARIS_MAUQUF ? t('hitung.tabel.ditahan') : baris.nama);
  const acuanPilihan = (kolom: KolomSoal) => tabel.kolom.slice(0, tabel.kolom.indexOf(kolom)).filter(lain => lain.jenis === 'pilih').pop();
  const kunciSel = (baris: BarisSoal, kolom: KolomSoal): string | undefined => {
    const acuan = kolom.jenis === 'bulat' ? acuanPilihan(kolom) : undefined;
    return baris.kunci[kolom.id] ?? (acuan && baris.kunci[acuan.id] === BAGIAN_TERHALANG ? '0' : undefined);
  };
  const bagianDipilih = (baris: BarisSoal, idKolom: string) => (modeKunci ? baris.kunci[idKolom] : isian.sel[baris.id]?.[idKolom]);
  const memilihTerhalang = (baris: BarisSoal, kolom: KolomSoal) => {
    // Jami'ah menjumlah semua mas'alah: Terhalang di satu mas'alah tidak menolkannya.
    if (kolom.id === tabel.pengali?.kolomJamiah) return false;
    const acuan = acuanPilihan(kolom);
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
    const label = `${judul(kolom)} ${namaBaris(baris)}`;
    if (kunci === undefined) return '–';
    if (jangkar?.idBaris === baris.id && jangkar.idKolom === kolom.id) return <span className="terisi">{angka(kunci)}</span>;
    if (kolom.terkunci) return <span className="terisi">{angka(kunci)}</span>;
    if (kolom.jenis === 'bulat' && !modeKunci && memilihTerhalang(baris, kolom)) return <span className="nol">{angka('0')}</span>;
    const diisi = isian.sel[baris.id]?.[kolom.id];
    const bersama = gabung && <span className="bersama">{t('hitung.tabel.bersama')}</span>;
    if (modeKunci) return <>{kunciDicoret(diisi, kunci, kolom.jenis === 'pilih' ? nilai => labelUntuk(kolom, nilai) : angka)}{bersama}</>;
    if (kolom.jenis === 'pilih') {
      return (
        <select aria-label={label} disabled={terkunciIsian} value={diisi ?? ''} onChange={event => isiPilihan(baris.id, kolom.id, event.target.value)}>
          <option value="">–</option>
          {(kolom.pilihan ?? PILIHAN_BAGIAN).map(pilihan => <option key={pilihan} value={pilihan}>{labelUntuk(kolom, pilihan)}</option>)}
        </select>
      );
    }
    return <>{kotakAngka(diisi, gabung ? `${judul(kolom)} ${t('hitung.tabel.bersama')}` : label, nilai => isiPilihan(baris.id, kolom.id, nilai))}{bersama}</>;
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

  const umpan = modeKunci ? { gaya: 'buka', teks: t('hitung.tabel.jawaban_dibuka') } : hasilUmpan(hasil, tabel, namaDari);

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
                    <span className="judul-kolom">{judul(kolom)}</span>
                    {kolom.kepala !== undefined && (kolom.terkunci ? <span className="terisi">{angka(String(kolom.kepala))}</span>
                      : modeKunci ? kunciDicoret(isian.kepala[kolom.id], String(kolom.kepala), angka)
                      : kotakAngka(isian.kepala[kolom.id], judul(kolom), nilai => { setIsian(lama => ({ ...lama, kepala: { ...lama.kepala, [kolom.id]: nilai } })); }))}
                  </th>
                ))}
              </tr>
              {tabel.pengali && (
                <tr className="baris-pengali">
                  <th className="nama" scope="row"><i>{t('hitung.tabel.pengali')}</i></th>
                  {tabel.kolom.map(kolom => {
                    const kunci = tabel.pengali!.kunci[kolom.id];
                    const diisi = isian.pengali?.[kolom.id];
                    return (
                      <td key={kolom.id} className={tandai.has(`pengali|${kolom.id}`) ? 'keliru' : undefined}>
                        {kunci === undefined ? null : modeKunci ? kunciDicoret(diisi, String(kunci), angka)
                          : kotakAngka(diisi, `${t('hitung.tabel.pengali')} ${judul(kolom)}`, nilai => { setIsian(lama => ({ ...lama, pengali: { ...lama.pengali, [kolom.id]: nilai } })); setHasil(null); })}
                      </td>
                    );
                  })}
                </tr>
              )}
            </thead>
            <tbody>
              {tabel.baris.map((baris, indeks) => (
                <tr key={baris.id} className={baris.id === ID_BARIS_MAUQUF ? 'baris-ditahan' : undefined}>
                  <th className="nama" scope="row">{namaBaris(baris)}</th>
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
            <button type="button" className="tautan-aksi tautan-bahaya" onClick={() => saatLihatJawaban(isian)}><Ikon nama="mata" ukuran={18} />{t('hitung.lihat_jawaban')}</button>
          </div>
        )}
        {umpan && <div className={`umpan-tabel ${umpan.gaya}`} role="status">{umpan.teks}</div>}
        {selesai && <Confetti />}
      </section>
      {!tanpaCara && <section className="ubin-h cara-mengisi" aria-labelledby="judul-cara-mengisi">
        <h2 id="judul-cara-mengisi">{t('hitung.tabel.cara_mengisi')}</h2>
        <ol>
          {[...(tabel.kolom[0]?.kemungkinan?.startsWith('hamlHnb.')
            ? [t('hitung.tabel.cara.haml_hnb_1'), t('hitung.tabel.cara.haml_hnb_2'), t('hitung.tabel.cara.haml_hnb_3'), t('hitung.tabel.cara.haml_hnb_4')]
            : tabel.kolom[0]?.kemungkinan?.startsWith('haml.')
            ? [t('hitung.tabel.cara.haml_1'), t('hitung.tabel.cara.haml_2'), t('hitung.tabel.cara.haml_3'), t('hitung.tabel.cara.haml_4')]
            : tabel.kolom[0]?.idJudul === 'bagianKemungkinan'
            ? [tabel.kolom[0]!.kemungkinan === 'lk' ? t('hitung.tabel.cara.khuntsa_1') : t('hitung.tabel.cara.mafqud_1'), t('hitung.tabel.cara.mafqud_2'), t('hitung.tabel.cara.mafqud_3'), t('hitung.tabel.cara.mafqud_4')]
            : tabel.pengali
            ? [t('hitung.tabel.cara.munasakhat_1'), t('hitung.tabel.cara.munasakhat_2'), t('hitung.tabel.cara.munasakhat_3'), t('hitung.tabel.cara.munasakhat_4')]
            : tabel.kolom[0]?.idJudul === 'didudukkanSebagai'
            ? [t('hitung.tabel.cara.dzawil_arham_1'), t('hitung.tabel.cara.dzawil_arham_2'), t('hitung.tabel.cara.dzawil_arham_3')]
            : [t('hitung.tabel.cara.biasa_1'), t('hitung.tabel.cara.biasa_2'), t('hitung.tabel.cara.biasa_3'), t('hitung.tabel.cara.biasa_4')]),
            t('hitung.tabel.cara.umum_boleh_bukan_terkecil')].map(teks => (
            <li key={teks}><Tebal teks={teks} /></li>
          ))}
        </ol>
      </section>}
    </div>
  );
}

/** Kotak yang harus diisi pelajar: kepala kolom, baris pengali, dan sel yang bukan petunjuk (jangkar/terkunci). */
function hitungKotak(tabel: TabelSoal, jangkar: Jangkar | null): number {
  const kepala = tabel.kolom.filter(kolom => kolom.kepala !== undefined && !kolom.terkunci).length;
  const pengali = tabel.pengali ? Object.keys(tabel.pengali.kunci).length : 0;
  const sel = tabel.baris.reduce((jumlah, baris) => jumlah + tabel.kolom.filter(kolom => baris.kunci[kolom.id] !== undefined && !kolom.terkunci
    && !(jangkar?.idBaris === baris.id && jangkar.idKolom === kolom.id)).length, 0);
  return kepala + pengali + sel;
}

function hasilUmpan(hasil: HasilNilai | null, tabel: TabelSoal, namaDari: (id: string) => string): { gaya: string; teks: string } | null {
  if (!hasil) return null;
  const judul = (idKolom: string) => judulKolomDari(tabel.kolom.find(kolom => kolom.id === idKolom)!, namaDari);
  // Baris Pengali bukan kolom di `tabel.kolom`; kalimatnya sendiri (B6 langkah 6).
  if (hasil.jenis !== 'benar' && hasil.idKolom === 'pengali') return hasil.jenis === 'belumLengkap'
    ? { gaya: 'kurang', teks: t('hitung.tabel.pengali_belum_lengkap') } : { gaya: 'salah', teks: t('hitung.tabel.pengali_belum_tepat') };
  if (hasil.jenis === 'belumLengkap') return { gaya: 'kurang', teks: t('hitung.tabel.kolom_belum_lengkap', { judul: judul(hasil.idKolom) }) };
  if (hasil.jenis === 'salah') return { gaya: 'salah', teks: t('hitung.tabel.mulai_salah', { judul: judul(hasil.idKolom) }) };
  if (hasil.bentukTerkecil.length === 0) return { gaya: 'benar', teks: t('hitung.tabel.benar_semua') };
  const daftar = hasil.bentukTerkecil.map(bentuk => t('hitung.tabel.butir_terkecil', { judul: judul(bentuk.idKolom), diisi: angka(String(bentuk.diisi)), terkecil: angka(String(bentuk.terkecil)) })).join(', ');
  return { gaya: 'benar', teks: t('hitung.tabel.benar_semua_terkecil', { daftar }) };
}

/** Kata kunci tebal ditandai **…** di teks diksi. */
export const Tebal = ({ teks }: { teks: string }) => <>{teks.split('**').map((potong, indeks) => (indeks % 2 ? <b key={indeks}>{potong}</b> : potong))}</>;
