// Tabel soal biasa (spec B1, B7 "Biasa"): kolom Bagian · Asal masalah · Asal masalah akhir.
//   Masuk : hasil engine OK dengan tabel (TabelMasalah) + pengambil nama orang.
//   Putus : kunci semuanya dari engine; hasil yang bersisa-keluar (sisaKeluar) belum punya tabel.
//   Keluar: TabelSoal. Fungsi murni.

import type { HasilEngine, HasilTaqdir, IdOrang } from '@waris/engine';
import type { Pecahan } from '@waris/math';
import { qDari } from './qMatriks.js';
import { BAGIAN_TERHALANG, PILIHAN_BAGIAN, type BarisSoal, type SusunanTabel } from './model.js';

const ID_BAGIAN = 'bagian';
const ID_ASHL = 'ashl';
const ID_AKHIR = 'akhir';

export function susunTabelBiasa(hasil: HasilEngine | HasilTaqdir, namaDari: (id: IdOrang) => string): SusunanTabel {
  if (hasil.status !== 'OK' || !('tabel' in hasil) || hasil.sisaKeluar) return { status: 'TIDAK_DIDUKUNG' };
  const { tabel } = hasil;
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
      { id: ID_BAGIAN, idJudul: 'bagian', ...qDari('bagian'), jenis: 'pilih', pilihan: PILIHAN_BAGIAN },
      { id: ID_ASHL, idJudul: 'asalMasalah', ...qDari('asalMasalah'), jenis: 'bulat', kepala: tabel.totalKolom.ashl!, gabungDari: ID_BAGIAN },
      { id: ID_AKHIR, idJudul: 'asalMasalahAkhir', ...qDari('asalMasalahAkhir'), jenis: 'bulat', kepala: tabel.totalKolom[kolomAkhir]! },
    ],
    baris,
  };
}

export function labelBagian(kelompok: { fardh?: Pecahan; ashabah?: boolean }): string {
  const fardh = kelompok.fardh ? `${kelompok.fardh.n}/${kelompok.fardh.d}` : undefined;
  if (fardh && kelompok.ashabah) return `${fardh} + Ashabah`;
  return fardh ?? 'Ashabah';
}
