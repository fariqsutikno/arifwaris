// Struktur kasus bank → Kasus siap layar (spec bank soal §6, G3). Menerima KasusBiasa atau KasusLanjutan yang sah
// secara struktur; menyerahkan Kasus yang graf-nya dibangun pembangun checklist yang sama dengan wizard.
// Melempar Error bila graf tak bisa dibangun (mis. istri mayit tak boleh dinikahkan lagi, ibu janin sudah wafat):
// pemanggil menerjemahkannya jadi KASUS_TIDAK_SAH.
// Harta tiap mayit satu nilai tetap (HARTA_SOAL_BANK); hanya mayit pertama yang dibagi nominalnya di munasakhat.

import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import {
  hitungIsian, isiOrangTua, jenisChecklistDari, pastikanOrangTua, tambahAhliWaris, tambahOrangBaru, tambahSaudara, ubahOrang,
} from '../grafAhliWaris.js';
import { kasusBaru, type Kasus } from '../kasus.js';
import { kasusDariSoal } from '../soal.js';
import { URUTAN_KUNCI, type KasusBiasa } from './kodeBiasa.js';
import type { AhliWarisTambahan, KasusLanjutan, KerabatJauh, MayitBerantai, Rujukan } from './kodeLanjutan.js';
import { URUTAN_KERABAT_JAUH } from './kodeLanjutan.js';

/** Harta soal bank tetap satu nilai: soal menguji pembagian, bukan aritmetika rupiah (keputusan pemilik 2026-11-25). */
export const HARTA_SOAL_BANK = 120_000_000n;

/** Urutan kunci tetap, sama dengan urutan saat kode diurai, supaya id orang (O1, O2, ...) tak bergantung cara kasus dibuat. */
export function kasusBiasaDariKunci(dasar: KasusBiasa): Kasus {
  const ahliWaris = URUTAN_KUNCI.flatMap(kunci => Array<string>(dasar.ahliWaris[kunci] ?? 0).fill(kunci));
  return kasusDariSoal({ pewaris: dasar.pewaris, ahliWaris, harta: HARTA_SOAL_BANK, harapan: { saham: {}, ashlAkhir: 0n } });
}

export function bangunKasusLanjutan(kasus: KasusLanjutan): Kasus {
  if (kasus.keluarga === 'dzawilArham') return bangunKerabatJauh(kasus);
  const awal = kasusBiasaDariKunci(kasus.dasar);
  if (kasus.keluarga === 'munasakhat' || kasus.keluarga === 'gharqa') return bangunBerantai(awal, kasus);
  return { ...awal, graf: tandaiBelumPasti(awal.graf, kasus.sasaran, kasus.keluarga) };
}

// ─── Munasakhat dan gharqa ────────────────────────────────────────────────────

function bangunBerantai(awal: Kasus, kasus: Extract<KasusLanjutan, { mayit: MayitBerantai[] }>): Kasus {
  // Id dibaca dari graf awal sebelum ahli waris tambahan masuk: urutan dalam kunci tak bergeser.
  const idMayit = kasus.mayit.map(mayit => idDari(awal.graf, mayit));
  let graf = kasus.mayit.reduce((grafIni, mayit, urutan) => tambahkanAhliWaris(grafIni, idMayit[urutan]!, mayit.tambahan), awal.graf);
  if (kasus.keluarga === 'munasakhat') return { ...awal, graf, urutanWafat: idMayit };
  for (const id of idMayit) graf = ubahOrang(graf, id, { statusHidup: 'wafat' });
  const tirkah = { ...awal.tirkah };
  return { ...awal, graf, gharqa: { anggota: [graf.idPewaris, ...idMayit], keadaan: kasus.keadaan, tirkah: Object.fromEntries(idMayit.map(id => [id, tirkah])) } };
}

function idDari(graf: GrafKeluarga, rujukan: Rujukan): IdOrang {
  const id = hitungIsian(graf, graf.idPewaris)[rujukan.kunci]?.[rujukan.urutan];
  if (!id) throw new Error(`ahli waris ${rujukan.kunci}#${rujukan.urutan} tidak ada`);
  return id;
}

function tambahkanAhliWaris(graf: GrafKeluarga, idMayit: IdOrang, tambahan: AhliWarisTambahan): GrafKeluarga {
  const pasangan: KunciAhliWaris = graf.orang[idMayit]!.jenisKelamin === 'L' ? 'ISTRI' : 'SUAMI';
  const daftar: KunciAhliWaris[] = [...(tambahan.pasangan ? [pasangan] : []),
    ...Array<KunciAhliWaris>(tambahan.anakLk).fill('ANAK_LK'), ...Array<KunciAhliWaris>(tambahan.anakPr).fill('ANAK_PR')];
  return daftar.reduce((grafIni, kunci) => tambahAhliWaris(grafIni, idMayit, kunci), graf);
}

// ─── Mafqud, khuntsa, haml ────────────────────────────────────────────────────

/** [R13-9] khuntsa dan janin hanya di jihah keturunan/saudara: bukan pasangan dan bukan leluhur (janin tak mungkin ayah mayit). */
const KELOMPOK_BISA_BELUM_PASTI = ['keturunan', 'saudara'];

function tandaiBelumPasti(graf: GrafKeluarga, sasaran: Rujukan, jenis: 'mafqud' | 'khuntsa' | 'haml'): GrafKeluarga {
  const idOrang = idDari(graf, sasaran);
  const orang = graf.orang[idOrang]!;
  if (jenis === 'mafqud') return ubahOrang(graf, idOrang, { statusHidup: 'mafqud' });
  const kelompok = jenisChecklistDari(sasaran.kunci)?.kelompok;
  if (!kelompok || !KELOMPOK_BISA_BELUM_PASTI.includes(kelompok)) throw new Error(`${jenis} hanya di jihah keturunan atau saudara`);
  if (jenis === 'khuntsa') return ubahOrang(graf, idOrang, { khuntsa: 'diharapkanJelas' });
  // [R13-1] janin harus punya ibu yang masih hidup: ibunya yang mengandung.
  const ibu = orang.idIbu ? graf.orang[orang.idIbu] : undefined;
  if (!ibu || ibu.statusHidup !== 'hidup' || ibu.penghubung) throw new Error('janin butuh ibu yang masih hidup');
  return ubahOrang(graf, idOrang, { statusHidup: 'dalamKandungan' });
}

// ─── Dzawil arham ─────────────────────────────────────────────────────────────

const PENGHUBUNG = { penghubung: true, statusHidup: 'wafat' } as const;
type Pembangun = { graf: GrafKeluarga; perantara: Map<string, IdOrang> };

/** Perantara (orang wafat di antara pewaris dan kerabat) dibuat sekali per jalur dan dipakai bersama. */
function perantaraSaudara(p: Pembangun, jalur: 'kandung' | 'sebapak' | 'seibu', jenisKelamin: 'L' | 'P'): IdOrang {
  const tanda = `saudara-${jalur}-${jenisKelamin}`;
  if (!p.perantara.has(tanda)) {
    const baru = tambahSaudara(p.graf, p.graf.idPewaris, jalur, jenisKelamin, PENGHUBUNG);
    p.graf = baru.graf;
    p.perantara.set(tanda, baru.idOrang);
  }
  return p.perantara.get(tanda)!;
}

function perantaraAnakPerempuan(p: Pembangun): IdOrang {
  if (!p.perantara.has('anakPr')) {
    const pewaris = p.graf.orang[p.graf.idPewaris]!;
    const baru = tambahOrangBaru(p.graf, { jenisKelamin: 'P', ...(pewaris.jenisKelamin === 'L' ? { idAyah: pewaris.id } : { idIbu: pewaris.id }), ...PENGHUBUNG });
    p.graf = baru.graf;
    p.perantara.set('anakPr', baru.idOrang);
  }
  return p.perantara.get('anakPr')!;
}

function perantaraPamanKandung(p: Pembangun): IdOrang {
  if (!p.perantara.has('paman')) {
    const ayah = pastikanOrangTua(p.graf, p.graf.idPewaris, 'L');
    const baru = tambahSaudara(ayah.graf, ayah.idOrang, 'kandung', 'L', PENGHUBUNG);
    p.graf = baru.graf;
    p.perantara.set('paman', baru.idOrang);
  }
  return p.perantara.get('paman')!;
}

/** Anak dari `idInduk`: `lewat` = garis ibu atau ayah. */
function tambahAnak(p: Pembangun, idInduk: IdOrang, lewat: 'idIbu' | 'idAyah', jenisKelamin: 'L' | 'P') {
  p.graf = tambahOrangBaru(p.graf, { jenisKelamin, [lewat]: idInduk }).graf;
}

/** Kerabat hidup yang bukan keturunan: saudara/saudari ayah atau ibu, atau leluhur jauh. */
function tambahKerabatHidup(p: Pembangun, sisi: 'ayah' | 'ibu', buat: (graf: GrafKeluarga, idOrangTua: IdOrang) => GrafKeluarga) {
  const orangTua = pastikanOrangTua(p.graf, p.graf.idPewaris, sisi === 'ayah' ? 'L' : 'P');
  p.graf = buat(orangTua.graf, orangTua.idOrang);
}

const PEMBANGUN_KERABAT: Record<KerabatJauh, (p: Pembangun) => void> = {
  CUCU_LK_ANAK_PR: p => tambahAnak(p, perantaraAnakPerempuan(p), 'idIbu', 'L'),
  CUCU_PR_ANAK_PR: p => tambahAnak(p, perantaraAnakPerempuan(p), 'idIbu', 'P'),
  ANAK_LK_SAUDARI_KANDUNG: p => tambahAnak(p, perantaraSaudara(p, 'kandung', 'P'), 'idIbu', 'L'),
  ANAK_PR_SAUDARI_KANDUNG: p => tambahAnak(p, perantaraSaudara(p, 'kandung', 'P'), 'idIbu', 'P'),
  ANAK_LK_SAUDARI_SEBAPAK: p => tambahAnak(p, perantaraSaudara(p, 'sebapak', 'P'), 'idIbu', 'L'),
  ANAK_PR_SAUDARI_SEBAPAK: p => tambahAnak(p, perantaraSaudara(p, 'sebapak', 'P'), 'idIbu', 'P'),
  ANAK_LK_SAUDARI_SEIBU: p => tambahAnak(p, perantaraSaudara(p, 'seibu', 'P'), 'idIbu', 'L'),
  ANAK_PR_SAUDARI_SEIBU: p => tambahAnak(p, perantaraSaudara(p, 'seibu', 'P'), 'idIbu', 'P'),
  ANAK_PR_SAUDARA_KANDUNG: p => tambahAnak(p, perantaraSaudara(p, 'kandung', 'L'), 'idAyah', 'P'),
  ANAK_PR_SAUDARA_SEBAPAK: p => tambahAnak(p, perantaraSaudara(p, 'sebapak', 'L'), 'idAyah', 'P'),
  ANAK_LK_SAUDARA_SEIBU: p => tambahAnak(p, perantaraSaudara(p, 'seibu', 'L'), 'idAyah', 'L'),
  ANAK_PR_SAUDARA_SEIBU: p => tambahAnak(p, perantaraSaudara(p, 'seibu', 'L'), 'idAyah', 'P'),
  KHAL: p => tambahKerabatHidup(p, 'ibu', (graf, ibu) => tambahSaudara(graf, ibu, 'kandung', 'L', {}).graf),
  KHALAH: p => tambahKerabatHidup(p, 'ibu', (graf, ibu) => tambahSaudara(graf, ibu, 'kandung', 'P', {}).graf),
  AMMAH: p => tambahKerabatHidup(p, 'ayah', (graf, ayah) => tambahSaudara(graf, ayah, 'kandung', 'P', {}).graf),
  PAMAN_SEIBU: p => tambahKerabatHidup(p, 'ayah', (graf, ayah) => tambahSaudara(graf, ayah, 'seibu', 'L', {}).graf),
  JADD_RAHIM: p => tambahKerabatHidup(p, 'ibu', (graf, ibu) => isiOrangTua(graf, ibu, 'L', {}).graf),
  ANAK_PR_PAMAN_KANDUNG: p => tambahAnak(p, perantaraPamanKandung(p), 'idAyah', 'P'),
};

function bangunKerabatJauh(kasus: Extract<KasusLanjutan, { keluarga: 'dzawilArham' }>): Kasus {
  const awal = kasusBaru(kasus.pewaris, 'latihan');
  const pasangan: KunciAhliWaris = kasus.pewaris === 'L' ? 'ISTRI' : 'SUAMI';
  const pembangun: Pembangun = { graf: kasus.pasangan ? tambahAhliWaris(awal.graf, awal.graf.idPewaris, pasangan) : awal.graf, perantara: new Map() };
  URUTAN_KERABAT_JAUH.forEach((nama, urutan) => {
    for (let ke = 0; ke < kasus.kerabat[urutan]!; ke++) PEMBANGUN_KERABAT[nama](pembangun);
  });
  return { ...awal, graf: pembangun.graf, tirkah: { ...awal.tirkah, kotor: HARTA_SOAL_BANK } };
}

