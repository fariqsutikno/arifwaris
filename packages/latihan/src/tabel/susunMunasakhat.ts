// Tabel soal munasakhat (spec B7): Mas'alah 1 (terkunci) · [Bagian · Mas'alah] tiap mayit berikutnya · Jami'ah, plus baris Pengali.
//   Masuk : HasilMunasakhat OK dari engine (daftarLangkah: tabel, masalah, pengali per mas'alah; jami'ah; saham akhir).
//   Putus : semua kunci dari engine. Munasakhat yang memuat sisa keluar (dzawil arham/baitul mal) belum punya tabel (G2 hanya yang biasa).
//   Keluar: TabelSoal dengan `pengali`. Satu baris per orang lintas mas'alah; mayit hanya punya sel di mas'alah tempat ia mewarisi.

import type { HasilMunasakhat, IdOrang } from '@waris/engine';
import { qDari } from './qMatriks.js';
import { BAGIAN_TERHALANG, PILIHAN_BAGIAN, type BarisSoal, type KolomSoal, type SusunanTabel } from './model.js';
import { labelBagian } from './susunBiasa.js';

const ID_JAMIAH = 'jamiah';

export function susunTabelMunasakhat(hasil: HasilMunasakhat, namaDari: (id: IdOrang) => string): SusunanTabel {
  if (hasil.status !== 'OK' || hasil.sisaKeluar.length > 0) return { status: 'TIDAK_DIDUKUNG' };

  const baris = new Map<IdOrang, BarisSoal>();
  const barisDari = (id: IdOrang): BarisSoal => {
    if (!baris.has(id)) baris.set(id, { id, nama: namaDari(id), kunci: {}, kelompok: {} });
    return baris.get(id)!;
  };
  const kolom: KolomSoal[] = [];
  const kunciPengali: Record<string, bigint> = {};

  hasil.daftarLangkah.forEach((langkah, indeks) => {
    const idMasalah = `m${indeks + 1}`;
    const idBagian = `b${indeks + 1}`;
    const { tabel } = langkah.hasil;
    const pertama = indeks === 0;
    // Mas'alah 1 dikerjakan di soal sebelumnya: ditampilkan terisi, tidak dinilai (B7).
    if (!pertama) kolom.push({ id: idBagian, idJudul: 'bagian', ...qDari('bagian'), jenis: 'pilih', pilihan: PILIHAN_BAGIAN, mayit: langkah.mayit });
    kolom.push(pertama
      ? { id: idMasalah, idJudul: 'masalahPertama', ...qDari('masalahPertama'), jenis: 'bulat', kepala: langkah.masalah, terkunci: true, mayit: langkah.mayit }
      : { id: idMasalah, idJudul: 'masalahLanjutan', ...qDari('masalahLanjutan'), jenis: 'bulat', kepala: langkah.masalah, mayit: langkah.mayit });
    kunciPengali[idMasalah] = langkah.pengali;

    for (const kelompok of tabel.baris) {
      for (const id of kelompok.anggota) {
        const sel = barisDari(id);
        sel.kunci[idMasalah] = String(kelompok.perOrang[id]!.saham);
        if (!pertama) sel.kunci[idBagian] = labelBagian(kelompok);
      }
    }
    // Terhalang di mas'alah pertama tidak punya sel apa pun (kolom terkunci), jadi tidak perlu barisnya.
    if (!pertama) for (const id of tabel.dikecualikan) barisDari(id).kunci[idBagian] = BAGIAN_TERHALANG;
  });

  kolom.push({ id: ID_JAMIAH, idJudul: 'jamiah', ...qDari('jamiah'), jenis: 'bulat', kepala: hasil.jamiah });
  const mayit = new Set(hasil.daftarLangkah.map(langkah => langkah.mayit));
  for (const [id, sel] of baris) if (!mayit.has(id)) sel.kunci[ID_JAMIAH] = String(hasil.saham[id] ?? 0n);

  return { kolom, baris: [...baris.values()], pengali: { kunci: kunciPengali, kolomJamiah: ID_JAMIAH } };
}
