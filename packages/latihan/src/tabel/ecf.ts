// ECF (error carried forward): menilai tiap sel terhadap isian pelajar SENDIRI di kolom sebelumnya, supaya salah di
// Bagian tidak menghukum lagi Asal masalah (dan seterusnya). Hanya hitungan [KH] yang diulang dengan angka pelajar
// (@waris/math); keputusan fikih (siapa terhalang, satu kelompok, bobot 2:1 [R10-5], siapa ikut radd) selalu dari kunci
// engine. Soal biasa saja; kolom lain menyalin `benar`.
// ponytail: ECF penuh hanya soal biasa; jenis lain menyalin benar, perluas bila profil prosedur terlihat timpang.

import { bagi, bandingkan, kali, kurang, pecahan, tambah, type Pecahan } from '@waris/math';
import { bacaBulat, barisDinilai, bersihkan, isiSel } from './isian.js';
import { BAGIAN_TERHALANG, type BarisSoal, type HasilKolom, type IsianTabel, type Jangkar, type KolomSoal, type TabelSoal } from './model.js';

const NOL = pecahan(0n);
const SATU = pecahan(1n);

/** Mengisi `benarEcf` kolom hisab soal biasa; `benarEcf` tidak pernah lebih rendah dari `benar`. */
export function terapkanEcf(tabel: TabelSoal, isian: IsianTabel, jangkar: Jangkar | null, kolom: HasilKolom[]): HasilKolom[] {
  const kolomSoal = (id: string) => tabel.kolom.find(lain => lain.id === id);
  const [bagian, ashl, akhir] = ['bagian', 'ashl', 'akhir'].map(id => kolomSoal(id));
  if (!bagian || !ashl || !akhir) return kolom;
  const hasil = (id: string) => kolom.find(lain => lain.idKolom === id);
  const hasilBagian = hasil('bagian'), hasilAshl = hasil('ashl'), hasilAkhir = hasil('akhir');
  if (!hasilBagian || !hasilAshl || !hasilAkhir) return kolom;

  const ecfAshl = hasilBagian.status === 'benar' ? null : ecfAsalMasalah(tabel, ashl, bagian, isian, jangkar);
  const ecfAkhir = hasilAshl.status === 'benar' ? null : ecfAsalMasalahAkhir(tabel, ashl, akhir, isian, jangkar);
  return kolom.map(hasilKolom => {
    const ecf = hasilKolom.idKolom === 'ashl' ? ecfAshl : hasilKolom.idKolom === 'akhir' ? ecfAkhir : null;
    if (!ecf) return hasilKolom;
    return { ...hasilKolom, sel: hasilKolom.sel.map(sel => ({ ...sel, benarEcf: sel.benar || (ecf.get(sel.idBaris) ?? false) })) };
  });
}

type PetaEcf = Map<string, boolean>;

interface PilihanBagian { fardh: Pecahan; ashabah: boolean }

function bacaPilihan(pilihan: string | undefined): PilihanBagian | undefined {
  if (!pilihan) return undefined;
  if (pilihan === BAGIAN_TERHALANG) return { fardh: NOL, ashabah: false };
  if (pilihan === 'Ashabah') return { fardh: NOL, ashabah: true };
  const [pecah, ...sisa] = pilihan.split(' + ');
  const cocok = /^(\d+)\/(\d+)$/.exec(pecah!);
  if (!cocok || BigInt(cocok[2]!) === 0n) return undefined;
  return { fardh: pecahan(BigInt(cocok[1]!), BigInt(cocok[2]!)), ashabah: sisa.join(' + ') === 'Ashabah' };
}

/** Sel sama dengan `bagian` (pecahan dari 1) × kepala pelajar: isi / kepala = bagian ⇔ isi × d = n × kepala. */
const cocokDenganBagian = (isi: bigint, kepala: bigint, bagian: Pecahan): boolean => isi * bagian.d === bagian.n * kepala;

/** Asal masalah: bagian tiap kelompok dari pilihan Bagian pelajar sendiri; sisa (ashabah) = 1 − Σ fardh [R10-1]. */
function ecfAsalMasalah(tabel: TabelSoal, ashl: KolomSoal, bagian: KolomSoal, isian: IsianTabel, jangkar: Jangkar | null): PetaEcf | null {
  const kepala = bacaBulat(isian.kepala[ashl.id]);
  const kelompok = barisDinilai(tabel, ashl);
  const pilihan = kelompok.map(baris => ({ baris, ...(bacaPilihan(bersihkan(isian.sel[baris.id]?.[bagian.id])) ?? { fardh: NOL, ashabah: false, kosong: true }) }));
  if (kepala === undefined || pilihan.some(p => 'kosong' in p)) return null;
  const jumlahFardh = pilihan.reduce((jumlah, p) => tambah(jumlah, p.fardh), NOL);
  const sisa = kurang(SATU, jumlahFardh);
  const adaAshabah = pilihan.some(p => p.ashabah);
  // Sisa negatif hanya mengganggu bila ada ashabah yang bergantung padanya; fardh murni ('aul) tetap bagian apa adanya.
  if ((adaAshabah && bandingkan(sisa, NOL) < 0) || pilihan.filter(p => p.ashabah).length > 1) return null;
  const peta: PetaEcf = new Map();
  for (const p of pilihan) {
    const diisi = isiSel(p.baris, ashl, isian, jangkar);
    const terhalang = isian.sel[p.baris.id]?.[bagian.id] === BAGIAN_TERHALANG;
    const harapan = tambah(p.fardh, p.ashabah ? sisa : NOL);
    const isi = bacaBulat(diisi);
    peta.set(p.baris.id, jangkar?.idBaris === p.baris.id && jangkar.idKolom === ashl.id ? true
      : terhalang && diisi === undefined ? true
      : isi !== undefined && cocokDenganBagian(isi, kepala, harapan));
  }
  return peta;
}

/**
 * Asal masalah akhir dari saham pelajar di kolom Asal masalah. Kunci memutuskan MODE ('aul / radd / tak ada) dan siapa
 * ikut radd dan bobot anggota kelompok (2:1); pelajar menentukan angkanya. 'Aul bila Σ saham pelajar > kepalanya [R09-4].
 */
function ecfAsalMasalahAkhir(tabel: TabelSoal, ashl: KolomSoal, akhir: KolomSoal, isian: IsianTabel, jangkar: Jangkar | null): PetaEcf | null {
  const kepalaAshl = bacaBulat(isian.kepala[ashl.id]);
  const kepalaAkhir = bacaBulat(isian.kepala[akhir.id]);
  const kelompok = barisDinilai(tabel, ashl);
  const sahamMentah = kelompok.map(baris => bacaBulat(isiSel(baris, ashl, isian, jangkar)));
  if (kepalaAshl === undefined || kepalaAkhir === undefined || kepalaAkhir === 0n || kepalaAshl === 0n || sahamMentah.some(s => s === undefined)) return null;
  const saham = sahamMentah as bigint[];

  const kunciKepalaAshl = ashl.kepala!;
  const kunciKepalaAkhir = akhir.kepala!;
  const kunciSaham = (baris: BarisSoal) => BigInt(baris.kunci[ashl.id]!);
  const anggota = (baris: BarisSoal) => tabel.baris.filter(lain => lain.kunci[akhir.id] !== undefined
    && (baris.kelompok[ashl.id] === undefined ? lain.id === baris.id : lain.kelompok[ashl.id] === baris.kelompok[ashl.id]));
  const kunciAkhirKelompok = (baris: BarisSoal) => anggota(baris).reduce((jumlah, lain) => jumlah + BigInt(lain.kunci[akhir.id]!), 0n);

  // Mode dari kunci: Σ kunci saham vs kepala kunci; peserta radd = kelompok yang bagiannya berubah antara dua kolom.
  const jumlahKunci = kelompok.reduce((jumlah, baris) => jumlah + kunciSaham(baris), 0n);
  const berubah = (baris: BarisSoal) => kunciAkhirKelompok(baris) * kunciKepalaAshl !== kunciSaham(baris) * kunciKepalaAkhir;
  const pesertaRadd = jumlahKunci < kunciKepalaAshl ? kelompok.map(berubah) : kelompok.map(() => false);

  const jumlahPelajar = saham.reduce((jumlah, s) => jumlah + s, 0n);
  const sahamPelajar = (indeks: number) => pecahan(saham[indeks]!);
  let bagianKelompok: Pecahan[];
  if (jumlahPelajar > kepalaAshl) {
    bagianKelompok = kelompok.map((_, i) => bagi(sahamPelajar(i), pecahan(jumlahPelajar)));
  } else if (jumlahPelajar < kepalaAshl && pesertaRadd.some(Boolean)) {
    const tetap = kelompok.reduce((jumlah, _, i) => (pesertaRadd[i] ? jumlah : tambah(jumlah, bagi(sahamPelajar(i), pecahan(kepalaAshl)))), NOL);
    const jumlahPeserta = kelompok.reduce((jumlah, _, i) => (pesertaRadd[i] ? jumlah + saham[i]! : jumlah), 0n);
    if (jumlahPeserta === 0n) return null;
    bagianKelompok = kelompok.map((_, i) => (pesertaRadd[i]
      ? kali(kurang(SATU, tetap), bagi(sahamPelajar(i), pecahan(jumlahPeserta))) : bagi(sahamPelajar(i), pecahan(kepalaAshl))));
  } else {
    bagianKelompok = kelompok.map((_, i) => bagi(sahamPelajar(i), pecahan(kepalaAshl)));
  }

  const peta: PetaEcf = new Map();
  kelompok.forEach((baris, i) => {
    const total = kunciAkhirKelompok(baris);
    for (const orang of anggota(baris)) {
      const harapan = kali(bagianKelompok[i]!, pecahan(BigInt(orang.kunci[akhir.id]!), total));
      const isi = bacaBulat(isiSel(orang, akhir, isian, jangkar));
      peta.set(orang.id, jangkar?.idBaris === orang.id && jangkar.idKolom === akhir.id ? true
        : isi !== undefined && cocokDenganBagian(isi, kepalaAkhir, harapan));
    }
  });
  return peta;
}
