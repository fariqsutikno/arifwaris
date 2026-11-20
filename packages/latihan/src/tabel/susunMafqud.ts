// Tabel soal mafqud (spec B7): per kemungkinan (hidup / wafat) sepasang kolom Bagian · Mas'alah, baris Pengali,
// kolom Jami'ah (diberikan sekarang) dan baris Ditahan (mauquf).
//   Masuk : HasilTaqdir OK dari engine (daftarDunia: bagian, mas'alah, pengali per dunia; diberikan; mauquf).
//   Putus : semua kunci dari engine. Hanya mafqud satu orang (dua dunia hidup/mati); haml dan khuntsa menyusul sendiri-sendiri.
//   Keluar: TabelSoal dengan `pengali`. Mafqud tidak punya sel Jami'ah: bagiannya ada di baris Ditahan [R13-18].

import type { HasilTaqdir, IdOrang } from '@waris/engine';
import { qDari } from './qMatriks.js';
import { BAGIAN_TERHALANG, ID_BARIS_MAUQUF, PILIHAN_BAGIAN, type BarisSoal, type KolomSoal, type SusunanTabel } from './model.js';
import { labelBagian } from './susunBiasa.js';

const ID_JAMIAH = 'jamiah';
const KEMUNGKINAN_MAFQUD = ['hidup', 'mati'];

export function susunTabelMafqud(hasil: HasilTaqdir, namaDari: (id: IdOrang) => string): SusunanTabel {
  if (hasil.status !== 'OK') return { status: 'TIDAK_DIDUKUNG' };
  const { daftarDunia } = hasil;
  const sumber = Object.keys(daftarDunia[0]?.taqdir ?? {});
  const adalahMafqud = sumber.length === 1
    && daftarDunia.every(dunia => dunia.bagian && dunia.kelompok.length === 0 && KEMUNGKINAN_MAFQUD.includes(dunia.taqdir[sumber[0]!]!));
  if (!adalahMafqud) return { status: 'TIDAK_DIDUKUNG' };
  const idMafqud = sumber[0]!;

  const baris = new Map<IdOrang, BarisSoal>();
  const barisDari = (id: IdOrang): BarisSoal => {
    if (!baris.has(id)) baris.set(id, { id, nama: namaDari(id), kunci: {}, kelompok: {} });
    return baris.get(id)!;
  };
  const kolom: KolomSoal[] = [];
  const kunciPengali: Record<string, bigint> = {};

  daftarDunia.forEach((dunia, indeks) => {
    const idBagian = `b${indeks + 1}`;
    const idMasalah = `m${indeks + 1}`;
    const kemungkinan = dunia.taqdir[idMafqud]!;
    kolom.push({ id: idBagian, idJudul: 'bagianKemungkinan', ...qDari('bagianKemungkinan'), jenis: 'pilih', pilihan: PILIHAN_BAGIAN, kemungkinan });
    kolom.push({ id: idMasalah, idJudul: 'sahamKemungkinan', ...qDari('sahamKemungkinan'), jenis: 'bulat', kepala: dunia.masalah, kemungkinan });
    kunciPengali[idMasalah] = dunia.pengali;

    for (const kelompok of dunia.bagian!) {
      for (const id of kelompok.anggota) {
        const sel = barisDari(id);
        sel.kunci[idBagian] = labelBagian(kelompok);
        sel.kunci[idMasalah] = String(kelompok.perOrang[id]!);
      }
    }
    // Terhalang di dunia ini: punya baris (karena berbagian di dunia lain) tapi tanpa angka.
    for (const [id, status] of Object.entries(dunia.statusOrang)) {
      if (status.jenis === 'mahjub' || status.jenis === 'mamnu') barisDari(id).kunci[idBagian] = BAGIAN_TERHALANG;
    }
  });

  kolom.push({ id: ID_JAMIAH, idJudul: 'jamiahSekarang', ...qDari('jamiah'), jenis: 'bulat', kepala: hasil.jamiah });
  for (const [id, sel] of baris) if (id !== idMafqud) sel.kunci[ID_JAMIAH] = String(hasil.diberikan[id] ?? 0n);
  // [R13-18] bagian mafqud ditahan sampai statusnya jelas.
  baris.set(ID_BARIS_MAUQUF, { id: ID_BARIS_MAUQUF, nama: ID_BARIS_MAUQUF, kunci: { [ID_JAMIAH]: String(hasil.mauquf) }, kelompok: {} });

  return { kolom, baris: [...baris.values()], pengali: { kunci: kunciPengali, kolomJamiah: ID_JAMIAH } };
}
