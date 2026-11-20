// Bentuk teks kanonik sebuah TabelSoal: sama persis untuk tabel yang sama, apa pun urutan kunci objeknya.
// Pemanggil menghash-nya (SHA-256, 16 karakter heks) menjadi `versi.kunci` kejadian, supaya tahu percobaan mana
// yang dinilai dengan kunci lama bila engine berubah. Hash dihitung pemanggil (crypto.subtle) agar paket tetap sinkron.

import type { TabelSoal } from './model.js';

export function tabelKanonik(tabel: TabelSoal): string {
  return JSON.stringify({
    kolom: tabel.kolom.map(kolom => [kolom.id, kolom.idJudul, kolom.jenis, kolom.pilihan ?? null, kolom.kepala?.toString() ?? null, !!kolom.terkunci, kolom.gabungDari ?? null]),
    baris: tabel.baris.map(baris => [baris.id, urut(baris.kunci), urut(baris.kelompok)]),
  });
}

const urut = (isi: Record<string, string>): Array<[string, string]> => Object.entries(isi).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
