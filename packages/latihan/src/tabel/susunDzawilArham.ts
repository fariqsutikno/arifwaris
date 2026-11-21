// Tabel soal dzawil arham tanzil [SYF] (spec B7): Didudukkan sebagai · Bagian perantara · Asal masalah.
//   Masuk : HasilEngine OK dengan `tanzil` (E5): kursi tiap kerabat + tabel para perantara.
//   Putus : kerabat memakai bagian dan saham perantaranya [R14-5]. Yang belum punya desain tabel → TIDAK_DIDUKUNG:
//           kerabat tanpa jalur terpakai (kalah jihah/cepat), satu perantara untuk beberapa kerabat, satu orang dua jalur [R14-11],
//           dan ahli waris selain kerabat (mis. suami bersama dzawil arham).
//   Keluar: TabelSoal; pilihan "Didudukkan sebagai" = kursi yang ada di tabel perantara soal ini (bukan daftar tetap).

import type { HasilEngine, IdOrang } from '@waris/engine';
import { qDari } from './qMatriks.js';
import { BAGIAN_TERHALANG, PILIHAN_BAGIAN, type BarisSoal, type SusunanTabel } from './model.js';
import { labelBagian } from './susunBiasa.js';

const ID_DUDUK = 'duduk';
const ID_BAGIAN = 'bagian';
const ID_ASHL = 'ashl';
const TIDAK_DIDUKUNG: SusunanTabel = { status: 'TIDAK_DIDUKUNG' };

export function susunTabelDzawilArham(hasil: HasilEngine, namaDari: (id: IdOrang) => string): SusunanTabel {
  if (hasil.status !== 'OK' || !hasil.tanzil) return TIDAK_DIDUKUNG;
  const { didudukkan, tabelPerantara } = hasil.tanzil;
  const terpakai = didudukkan.filter(kursi => kursi.lolos);
  const kerabat = [...new Set(didudukkan.map(kursi => kursi.idOrang))];
  const perantara = terpakai.map(kursi => kursi.perantara);
  const tanpaJalurTunggal = kerabat.some(id => terpakai.filter(kursi => kursi.idOrang === id).length !== 1 || didudukkan.filter(kursi => kursi.idOrang === id).length !== 1);
  const orangDiTabel = new Set([...hasil.tabel.baris.flatMap(baris => baris.anggota), ...hasil.tabel.dikecualikan]);
  if (tanpaJalurTunggal || new Set(perantara).size !== perantara.length || orangDiTabel.size !== kerabat.length || kerabat.some(id => !orangDiTabel.has(id))) return TIDAK_DIDUKUNG;

  const baris = terpakai.map((kursi): BarisSoal => {
    const sel = tabelPerantara.baris.find(lain => lain.perantara === kursi.perantara)!;
    return { id: kursi.idOrang, nama: namaDari(kursi.idOrang), kelompok: {},
      kunci: { [ID_DUDUK]: kursi.sebagai, ...(sel.terhalang ? { [ID_BAGIAN]: BAGIAN_TERHALANG } : { [ID_BAGIAN]: labelBagian(sel), [ID_ASHL]: String(sel.saham) }) } };
  });
  return {
    kolom: [
      { id: ID_DUDUK, idJudul: 'didudukkanSebagai', ...qDari('didudukkanSebagai'), jenis: 'pilih', pilihan: [...new Set(tabelPerantara.baris.map(sel => sel.sebagai))] },
      { id: ID_BAGIAN, idJudul: 'bagianPerantara', ...qDari('bagianPerantara'), jenis: 'pilih', pilihan: PILIHAN_BAGIAN },
      { id: ID_ASHL, idJudul: 'asalMasalah', ...qDari('asalMasalah'), jenis: 'bulat', kepala: tabelPerantara.masalah },
    ],
    baris,
  };
}
