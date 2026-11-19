// Tabel faraidh untuk soal latihan (spec B1): kunci diturunkan dari keluaran engine, tidak diketik di konten soal.
//   Masuk : hasil engine (TabelMasalah) + graf untuk nama; isian pelajar; jangkar.
//   Putus : soal biasa saja (kolom Bagian · Asal masalah · Asal masalah akhir); jenis lain → TIDAK_DIDUKUNG sampai E3–E5.
//   Keluar: TabelSoal, penilaian kolom-demi-kolom (B6), dan pemilihan satu sel jangkar (B5). Fungsi murni, bigint.

import type { GrafKeluarga, HasilEngine, HasilTaqdir, IdOrang, TabelMasalah } from '@waris/engine';
import { namaOrang } from '../format';
import { angkaLatin } from '../terjemah';

/** Daftar tertutup kolom Bagian (B2). */
export const PILIHAN_BAGIAN = ['1/2', '1/4', '1/8', '2/3', '1/3', '1/6', 'Ashabah', '1/6 + Ashabah', 'Terhalang'] as const;

export interface KolomSoal {
  id: string;
  judul: string;
  jenis: 'pilih' | 'bulat';
  pilihan?: readonly string[];
  /** Kunci asal masalah/jami'ah; pelajar mengisi kepala kolom, sebanding diterima. */
  kepala?: bigint;
  terkunci?: boolean;
  /** Kolom pilihan acuan untuk menggabungkan sel kelompok (B4). */
  gabungDari?: string;
}

export interface BarisSoal {
  id: IdOrang;
  nama: string;
  /** id kolom → jawaban ('1/8', 'Ashabah', '24'); tidak ada = sel "–" atau diturunkan dari pilihan (Terhalang → 0). */
  kunci: Record<string, string>;
  /** id kolom → id kelompok engine, hanya untuk sel bersama (anggota > 1). */
  kelompok: Record<string, string>;
}

export interface TabelSoal { kolom: KolomSoal[]; baris: BarisSoal[] }

export interface IsianTabel { kepala: Record<string, string>; sel: Record<IdOrang, Record<string, string>> }
export interface Jangkar { idBaris: IdOrang; idKolom: string }

export type HasilNilai =
  | { jenis: 'belumLengkap'; idKolom: string; judul: string; kepalaKosong: boolean; idBarisKosong: IdOrang[] }
  | { jenis: 'salah'; idKolom: string; judul: string; kepalaSalah: boolean; idBarisSalah: IdOrang[] }
  | { jenis: 'benar'; bentukTerkecil: Array<{ idKolom: string; judul: string; diisi: bigint; terkecil: bigint }> };

const ID_BAGIAN = 'bagian';
const ID_ASHL = 'ashl';
const ID_AKHIR = 'akhir';
const BAGIAN_TERHALANG = 'Terhalang';

type SusunanTabel = TabelSoal | { status: 'TIDAK_DIDUKUNG' };

/** Soal biasa dari hasil pipeline. Orkestrator (taqdir, munasakhat) dan hasil bersisa-keluar belum punya tabel B7 → TIDAK_DIDUKUNG. */
export function susunTabelSoal(hasil: HasilEngine | HasilTaqdir, graf: GrafKeluarga): SusunanTabel {
  if (hasil.status !== 'OK' || !('tabel' in hasil) || hasil.sisaKeluar) return { status: 'TIDAK_DIDUKUNG' };
  const { tabel } = hasil;
  const namaDari = (id: IdOrang) => namaOrang(graf, hasil.statusOrang, id);
  // [R09-1] kolom akhir = kolom terakhir yang ada: tashih, lalu 'aul/radd, lalu ashl.
  const kolomAkhir = (['tashih', 'radd', 'aul', 'ashl'] as const).find(kolom => tabel.totalKolom[kolom] !== undefined)!;

  const baris: BarisSoal[] = tabel.baris.flatMap(kelompok => kelompok.anggota.map((id): BarisSoal => ({
    id, nama: namaDari(id),
    kunci: { [ID_BAGIAN]: labelBagian(kelompok), [ID_ASHL]: String(kelompok.sel.ashl), [ID_AKHIR]: String(kelompok.perOrang[id]!.saham) },
    kelompok: kelompok.anggota.length > 1 ? { [ID_ASHL]: kelompok.kelompok } : {},
  })));
  for (const id of tabel.dikecualikan) baris.push({ id, nama: namaDari(id), kunci: { [ID_BAGIAN]: BAGIAN_TERHALANG }, kelompok: {} });

  return {
    kolom: [
      { id: ID_BAGIAN, judul: 'Bagian', jenis: 'pilih', pilihan: PILIHAN_BAGIAN },
      { id: ID_ASHL, judul: 'Asal masalah', jenis: 'bulat', kepala: tabel.totalKolom.ashl!, gabungDari: ID_BAGIAN },
      { id: ID_AKHIR, judul: 'Asal masalah akhir', jenis: 'bulat', kepala: tabel.totalKolom[kolomAkhir]! },
    ],
    baris,
  };
}

function labelBagian(kelompok: TabelMasalah['baris'][number]): string {
  const fardh = kelompok.fardh ? `${kelompok.fardh.n}/${kelompok.fardh.d}` : undefined;
  if (fardh && kelompok.ashabah) return `${fardh} + Ashabah`;
  return fardh ?? 'Ashabah';
}

/**
 * Satu sel saham terisi per soal (B5): kolom bulat, berkunci, bukan 0, bukan sel bersama, bukan kolom terkunci.
 * Tidak ada calon → null. `acak` disuntikkan supaya uji deterministik.
 */
export function pilihJangkar(tabel: TabelSoal, acak: () => number): Jangkar | null {
  const calon = tabel.kolom.filter(kolom => kolom.jenis === 'bulat' && !kolom.terkunci).flatMap(kolom => tabel.baris
    .filter(baris => baris.kunci[kolom.id] !== undefined && baris.kunci[kolom.id] !== '0' && baris.kelompok[kolom.id] === undefined)
    .map(baris => ({ idBaris: baris.id, idKolom: kolom.id })));
  return calon.length === 0 ? null : calon[Math.min(Math.floor(acak() * calon.length), calon.length - 1)]!;
}

/** B6 langkah 1–5 dan 7: periksa kolom kiri→kanan, berhenti di kolom pertama yang belum lengkap atau salah. */
export function nilaiTabel(tabel: TabelSoal, isian: IsianTabel, jangkar: Jangkar | null): HasilNilai {
  const bentukTerkecil: Extract<HasilNilai, { jenis: 'benar' }>['bentukTerkecil'] = [];
  for (const kolom of tabel.kolom.filter(kolom => !kolom.terkunci)) {
    const hasil = nilaiKolom(tabel, kolom, isian, jangkar);
    if (hasil.jenis !== 'benar') return hasil;
    if (hasil.bentuk) bentukTerkecil.push(hasil.bentuk);
  }
  return { jenis: 'benar', bentukTerkecil };
}

type HasilKolom = Exclude<HasilNilai, { jenis: 'benar' }> | { jenis: 'benar'; bentuk?: Extract<HasilNilai, { jenis: 'benar' }>['bentukTerkecil'][number] };

function nilaiKolom(tabel: TabelSoal, kolom: KolomSoal, isian: IsianTabel, jangkar: Jangkar | null): HasilKolom {
  const { id: idKolom, judul } = kolom;
  const adaJangkar = jangkar?.idKolom === idKolom;
  const diisi = (baris: BarisSoal) => (adaJangkar && jangkar.idBaris === baris.id ? baris.kunci[idKolom] : bersihkan(isian.sel[baris.id]?.[idKolom]));
  // Sel bersama dinilai sekali, di baris pertama kelompoknya [B4].
  const dinilai = tabel.baris.filter((baris, indeks) => baris.kunci[idKolom] !== undefined
    && (baris.kelompok[idKolom] === undefined || tabel.baris.findIndex(lain => lain.kelompok[idKolom] === baris.kelompok[idKolom]) === indeks));

  const kepalaIsi = kolom.kepala === undefined ? undefined : bacaBulat(isian.kepala[idKolom]);
  const idBarisKosong = dinilai.filter(baris => !diisi(baris)).map(baris => baris.id);
  if (idBarisKosong.length > 0 || (kolom.kepala !== undefined && kepalaIsi === undefined)) {
    return { jenis: 'belumLengkap', idKolom, judul, kepalaKosong: kolom.kepala !== undefined && kepalaIsi === undefined, idBarisKosong };
  }

  if (kolom.jenis === 'pilih') {
    const idBarisSalah = dinilai.filter(baris => diisi(baris) !== baris.kunci[idKolom]).map(baris => baris.id);
    return idBarisSalah.length > 0 ? { jenis: 'salah', idKolom, judul, kepalaSalah: false, idBarisSalah } : { jenis: 'benar' };
  }

  // Kolom bulat berkepala: sebanding diterima, isi × kunci kepala = kunci sel × isian kepala (B6 butir 4).
  const terkecil = kolom.kepala!;
  const kepala = kepalaIsi!;
  const kepalaSalah = kepala === 0n || kepala % terkecil !== 0n || (adaJangkar && kepala !== terkecil);
  const idBarisSalah = dinilai.filter(baris => {
    const nilai = bacaBulat(diisi(baris));
    return nilai === undefined || nilai * terkecil !== BigInt(baris.kunci[idKolom]!) * kepala;
  }).map(baris => baris.id);
  if (kepalaSalah || idBarisSalah.length > 0) return { jenis: 'salah', idKolom, judul, kepalaSalah, idBarisSalah };
  return { jenis: 'benar', ...(kepala !== terkecil ? { bentuk: { idKolom, judul, diisi: kepala, terkecil } } : {}) };
}

const bersihkan = (teks: string | undefined): string | undefined => (teks?.trim() ? teks.trim() : undefined);

/** Hanya bilangan bulat tak negatif (B2); selain itu dianggap kosong. */
function bacaBulat(teks: string | undefined): bigint | undefined {
  const bersih = angkaLatin(teks ?? '').trim();
  return /^\d{1,6}$/.test(bersih) ? BigInt(bersih) : undefined;
}
