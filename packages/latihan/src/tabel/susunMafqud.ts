// Tabel soal mafqud dan khuntsa (spec B7; keduanya satu sumber dengan dua kemungkinan: hidup/wafat atau laki-laki/perempuan): per kemungkinan (hidup / wafat) sepasang kolom Bagian · Mas'alah, baris Pengali,
// kolom Jami'ah (diberikan sekarang) dan baris Ditahan (mauquf).
//   Masuk : HasilTaqdir OK dari engine (daftarDunia: bagian, mas'alah, pengali per dunia; diberikan; mauquf).
//   Putus : semua kunci dari engine. Hanya satu sumber dengan dua kemungkinan; haml dan kelompok bersama menyusul sendiri-sendiri.
//   Keluar: TabelSoal dengan `pengali`. Mafqud tidak punya sel Jami'ah: bagiannya ada di baris Ditahan [R13-18].

import type { HasilTaqdir, IdOrang } from '@waris/engine';
import { qDari } from './qMatriks.js';
import { BAGIAN_TERHALANG, ID_BARIS_MAUQUF, PILIHAN_BAGIAN, type BarisSoal, type KolomSoal, type SusunanTabel } from './model.js';
import { labelBagian } from './susunBiasa.js';

const ID_JAMIAH = 'jamiah';
// Mafqud, khuntsa, lalu haml [SYF] (empat taqdir, KB 13a.5 [R13-20]); haml [HNB] enam taqdir belum didukung.
const KEMUNGKINAN_TIAP_JENIS = [['hidup', 'mati'], ['lk', 'pr'], ['mati', 'lk', 'pr', 'duaPr']];
const JENIS_HAML = 2;

export function susunTabelMafqud(hasil: HasilTaqdir, namaDari: (id: IdOrang) => string): SusunanTabel {
  if (hasil.status !== 'OK') return { status: 'TIDAK_DIDUKUNG' };
  const { daftarDunia } = hasil;
  const sumber = Object.keys(daftarDunia[0]?.taqdir ?? {});
  const jenis = KEMUNGKINAN_TIAP_JENIS.findIndex(nilai => daftarDunia.every(dunia => dunia.bagian && nilai.includes(dunia.taqdir[sumber[0]!]!)));
  const adalahHaml = jenis === JENIS_HAML;
  if (sumber.length !== 1 || jenis < 0 || (adalahHaml && hasil.ruleset !== 'syafii')) return { status: 'TIDAK_DIDUKUNG' };
  const idMafqud = sumber[0]!; // juga khuntsa dan haml: bagiannya ditahan sama [R13-18]

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
    const kemungkinan = adalahHaml ? `haml.${dunia.taqdir[idMafqud]}` : dunia.taqdir[idMafqud]!;
    const adaKelompokBersama = dunia.bagian!.some(kelompok => kelompok.bersama);
    kolom.push({ id: idBagian, idJudul: 'bagianKemungkinan', ...qDari('bagianKemungkinan'), jenis: 'pilih', pilihan: PILIHAN_BAGIAN, kemungkinan });
    kolom.push({ id: idMasalah, idJudul: 'sahamKemungkinan', ...qDari('sahamKemungkinan'), jenis: 'bulat', kepala: dunia.masalah, kemungkinan, ...(adaKelompokBersama ? { gabungDari: idBagian } : {}) });
    kunciPengali[idMasalah] = dunia.pengali;

    dunia.bagian!.forEach((kelompok, urutan) => {
      for (const id of kelompok.anggota) {
        const sel = barisDari(id);
        sel.kunci[idBagian] = labelBagian(kelompok);
        // [R13-20] [SYF] sahamnya satu angka untuk seluruh kelompok: sel bersama.
        sel.kunci[idMasalah] = String(kelompok.bersama ? kelompok.saham : kelompok.perOrang[id]!);
        if (kelompok.bersama) sel.kelompok[idMasalah] = `${idMasalah}-${urutan}`;
      }
    });
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
