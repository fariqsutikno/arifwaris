// Penilaian tabel latihan (spec B6): kolom kiri→kanan, berhenti di kolom pertama yang belum lengkap atau salah.
//   Masuk : TabelSoal + isian pelajar + jangkar.  Keluar: HasilNilai.  Murni, bigint, tanpa bahasa.

import { angkaLatin } from '../angka.js';
import type { BarisSoal, HasilNilai, IsianTabel, Jangkar, KolomSoal, TabelSoal } from './model.js';

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
  const { id: idKolom, idJudul } = kolom;
  const adaJangkar = jangkar?.idKolom === idKolom;
  const diisi = (baris: BarisSoal) => (adaJangkar && jangkar.idBaris === baris.id ? baris.kunci[idKolom] : bersihkan(isian.sel[baris.id]?.[idKolom]));
  // Sel bersama dinilai sekali, di baris pertama kelompoknya [B4].
  const dinilai = tabel.baris.filter((baris, indeks) => baris.kunci[idKolom] !== undefined
    && (baris.kelompok[idKolom] === undefined || tabel.baris.findIndex(lain => lain.kelompok[idKolom] === baris.kelompok[idKolom]) === indeks));

  const kepalaIsi = kolom.kepala === undefined ? undefined : bacaBulat(isian.kepala[idKolom]);
  const idBarisKosong = dinilai.filter(baris => !diisi(baris)).map(baris => baris.id);
  if (idBarisKosong.length > 0 || (kolom.kepala !== undefined && kepalaIsi === undefined)) {
    return { jenis: 'belumLengkap', idKolom, idJudul, kepalaKosong: kolom.kepala !== undefined && kepalaIsi === undefined, idBarisKosong };
  }

  if (kolom.jenis === 'pilih') {
    const idBarisSalah = dinilai.filter(baris => diisi(baris) !== baris.kunci[idKolom]).map(baris => baris.id);
    return idBarisSalah.length > 0 ? { jenis: 'salah', idKolom, idJudul, kepalaSalah: false, idBarisSalah } : { jenis: 'benar' };
  }

  // Kolom bulat berkepala: sebanding diterima, isi × kunci kepala = kunci sel × isian kepala (B6 butir 4).
  const terkecil = kolom.kepala!;
  const kepala = kepalaIsi!;
  const kepalaSalah = kepala === 0n || kepala % terkecil !== 0n || (adaJangkar && kepala !== terkecil);
  const idBarisSalah = dinilai.filter(baris => {
    const nilai = bacaBulat(diisi(baris));
    return nilai === undefined || nilai * terkecil !== BigInt(baris.kunci[idKolom]!) * kepala;
  }).map(baris => baris.id);
  if (kepalaSalah || idBarisSalah.length > 0) return { jenis: 'salah', idKolom, idJudul, kepalaSalah, idBarisSalah };
  return { jenis: 'benar', ...(kepala !== terkecil ? { bentuk: { idKolom, idJudul, diisi: kepala, terkecil } } : {}) };
}

const bersihkan = (teks: string | undefined): string | undefined => (teks?.trim() ? teks.trim() : undefined);

/** Hanya bilangan bulat tak negatif (B2); selain itu dianggap kosong. */
function bacaBulat(teks: string | undefined): bigint | undefined {
  const bersih = angkaLatin(teks ?? '').trim();
  return /^\d{1,6}$/.test(bersih) ? BigInt(bersih) : undefined;
}
