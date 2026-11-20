// Checklist ahli waris ⇄ graf keluarga, sisi web: label berbahasa dan sebutan hubungan.
// Pembangunan graf (tambah/kurangi/hapus, kerabat per jenis) ada di @waris/latihan (murni, dipakai juga server);
// berkas ini meneruskannya karena puluhan layar mengimpor dari sini, lalu menambah label dan sebutan tampil.

import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import {
  DAFTAR_JENIS_CHECKLIST, hitungIsian, kelompokkanPerKunci,
  type JenisChecklist, type KelompokJenis,
} from '@waris/latihan';
import { LABEL_SEHARI } from './konten/ahliWaris';
import { t } from './terjemah';

export {
  daftarInduk, hapusAhliWaris, hitungIsian, hubungkanAnakTanpaOrangTuaLain, idBaru, INDUK_BARU_WAFAT, isiOrangTua,
  kurangiAhliWaris, pastikanOrangTua, tambahAhliWaris, tambahOrangBaru, tambahSaudara, ubahNama, ubahOrang,
} from '@waris/latihan';

export type Kelompok = KelompokJenis;

export interface JenisAhliWaris extends JenisChecklist { label: string }

const LABEL_JENIS: Record<KunciAhliWaris, string> = {
  SUAMI: t('hitung.suami'), ISTRI: t('hitung.istri'), ANAK_LK: t('hitung.anak_laki_laki'), ANAK_PR: t('hitung.anak_perempuan'),
  CUCU_LK: t('hitung.cucu_laki_laki_dari_anak_lk'), CUCU_PR: t('hitung.cucu_perempuan_dari_anak_lk'),
  AYAH: t('hitung.ayah'), IBU: t('hitung.ibu'), KAKEK: t('hitung.kakek_ayahnya_ayah'),
  NENEK_DARI_AYAH: t('hitung.nenek_ibunya_ayah'), NENEK_DARI_IBU: t('hitung.nenek_ibunya_ibu'),
  SAUDARA_KANDUNG: t('hitung.saudara_lk_kandung'), SAUDARI_KANDUNG: t('hitung.saudari_kandung'),
  SAUDARA_SEBAPAK: t('hitung.saudara_lk_sebapak'), SAUDARI_SEBAPAK: t('hitung.saudari_sebapak'),
  SAUDARA_SEIBU: t('hitung.saudara_lk_seibu'), SAUDARI_SEIBU: t('hitung.saudari_seibu'),
  KEPONAKAN_KANDUNG: t('hitung.keponakan_lk_dari_saudara_kandung'), KEPONAKAN_SEBAPAK: t('hitung.keponakan_lk_dari_saudara_sebapak'),
  PAMAN_KANDUNG: t('hitung.paman_kandung_saudara_ayah'), PAMAN_SEBAPAK: t('hitung.paman_sebapak'),
  SEPUPU_KANDUNG: t('hitung.sepupu_lk_dari_paman_kandung'), SEPUPU_SEBAPAK: t('hitung.sepupu_lk_dari_paman_sebapak'),
} as Record<KunciAhliWaris, string>;

export const DAFTAR_JENIS: JenisAhliWaris[] = DAFTAR_JENIS_CHECKLIST.map(jenis => ({ ...jenis, label: LABEL_JENIS[jenis.kunci] }));

export const jenisDari = (kunci: KunciAhliWaris): JenisAhliWaris | undefined =>
  DAFTAR_JENIS.find(jenis => jenis.kunci === kunci);

/** Hubungan ke `idMayit` tanpa nomor ("Anak laki-laki", "Kakek dari ibu"); undefined bila tidak bisa diturunkan dari graf. */
export function peranDariMayit(graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang, kunci?: KunciAhliWaris, singkat = false): string | undefined {
  const kunciOrang = kunci ?? (Object.entries(hitungIsian(graf, idMayit)).find(([, ids]) => ids!.includes(idOrang))?.[0] as KunciAhliWaris | undefined);
  if (kunciOrang) return labelPeran(kunciOrang, singkat);
  const jalur = jalurKeLeluhur(graf, idMayit, idOrang);
  if (jalur) return sebutLeluhur(graf, jalur);
  const tiri = sebutOrangTuaTiri(graf, idMayit, idOrang);
  if (tiri) return tiri;
  // Yang sudah wafat tidak masuk hitungIsian, tetapi hubungannya tetap bisa disebut ("Anak laki-laki", bukan "Kerabat").
  const kunciWafat = Object.entries(kelompokkanPerKunci(graf, idMayit, () => true)).find(([, ids]) => ids!.includes(idOrang))?.[0] as KunciAhliWaris | undefined;
  return kunciWafat && labelPeran(kunciWafat, singkat);
}

const labelPeran = (kunci: KunciAhliWaris, singkat: boolean): string | undefined =>
  (singkat ? LABEL_POHON[kunci] : undefined) ?? LABEL_SEHARI[kunci] ?? jenisDari(kunci)?.label;

/** Label pendek khusus kotak pohon; kartu isian tetap memakai LABEL_SEHARI. */
const LABEL_POHON: Partial<Record<KunciAhliWaris, string>> = {
  SAUDARA_KANDUNG: t('hitung.pohon.saudara_lk_kandung'), SAUDARI_KANDUNG: t('hitung.pohon.saudari_kandung'),
  SAUDARA_SEBAPAK: t('hitung.pohon.saudara_lk_seayah'), SAUDARI_SEBAPAK: t('hitung.pohon.saudari_seayah'),
  SAUDARA_SEIBU: t('hitung.pohon.saudara_lk_seibu'), SAUDARI_SEIBU: t('hitung.pohon.saudari_seibu'),
};

/** Ibu dari saudara seayah ("Istri lain ayah") dan ayah dari saudara seibu ("Suami ibu"): orang tua tiri almarhum. */
function sebutOrangTuaTiri(graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang): string | undefined {
  const mayit = graf.orang[idMayit]!;
  const anak = Object.values(graf.orang).filter(orang => orang.id !== idMayit);
  if (mayit.idAyah && idOrang !== mayit.idIbu && anak.some(orang => orang.idAyah === mayit.idAyah && orang.idIbu === idOrang)) return t('hitung.istri_lain_ayah');
  if (mayit.idIbu && idOrang !== mayit.idAyah && anak.some(orang => orang.idIbu === mayit.idIbu && orang.idAyah === idOrang)) return t('hitung.suami_ibu');
  return undefined;
}

/**
 * Sebutan orang yang tak punya peran bagi `idMayit` tapi menikah dengan yang punya ("Istri Anak laki-laki 2", "Suami Anak perempuan");
 * pasangannya cukup yang punya peran langsung, supaya tidak berputar pada dua orang yang saling menikah.
 */
function sebutPasangan(graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang): string | undefined {
  for (const nikah of graf.pernikahan) {
    const idPasangan = nikah.idSuami === idOrang ? nikah.idIstri : nikah.idIstri === idOrang ? nikah.idSuami : undefined;
    if (!idPasangan || idPasangan === idMayit || !peranDariMayit(graf, idMayit, idPasangan)) continue;
    const pasangan = graf.orang[idPasangan]!;
    const jenisPasangan = graf.orang[idOrang]?.jenisKelamin === 'L' ? t('hitung.suami') : t('hitung.istri');
    return `${jenisPasangan} ${pasangan.nama ?? labelBawaan(graf, idMayit, idPasangan)}`;
  }
  return undefined;
}

/** Hubungan ke `idMayit` tanpa nomor, termasuk menantu dan semacamnya; undefined hanya bila benar-benar tak bisa diturunkan. */
const hubunganKeMayit = (graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang, kunci?: KunciAhliWaris, singkat = false): string | undefined =>
  peranDariMayit(graf, idMayit, idOrang, kunci, singkat) ?? sebutPasangan(graf, idMayit, idOrang);

/** Ada sebutan hubungan ke `idMayit` yang bisa diturunkan (selain "Kerabat"). */
export const adaHubungan = (graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang): boolean => hubunganKeMayit(graf, idMayit, idOrang) !== undefined;

/** Orang tua mayit, orang tua orang tua, dst. sampai `idLeluhur`; null bila bukan leluhur mayit. */
function jalurKeLeluhur(graf: GrafKeluarga, idDari: IdOrang, idLeluhur: IdOrang, sisaTingkat = BATAS_TINGKAT_LELUHUR): IdOrang[] | null {
  if (sisaTingkat === 0) return null;
  for (const idOrangTua of [graf.orang[idDari]?.idAyah, graf.orang[idDari]?.idIbu]) {
    if (!idOrangTua) continue;
    if (idOrangTua === idLeluhur) return [idOrangTua];
    const lanjut = jalurKeLeluhur(graf, idOrangTua, idLeluhur, sisaTingkat - 1);
    if (lanjut) return [idOrangTua, ...lanjut];
  }
  return null;
}
const BATAS_TINGKAT_LELUHUR = 8;

/** Jalur [orang tua, ..., leluhur]: "Ayah", "Kakek dari ayah", lebih jauh "Ayah dari kakek dari ayah". */
function sebutLeluhur(graf: GrafKeluarga, jalur: IdOrang[]): string {
  const laki = graf.orang[jalur.at(-1)!]?.jenisKelamin === 'L';
  if (jalur.length === 1) return laki ? t('hitung.ayah') : t('hitung.ibu');
  if (jalur.length === 2) {
    const dariAyah = graf.orang[jalur[0]!]?.jenisKelamin === 'L';
    return t('hitung.sebutan_leluhur', { peran: laki ? t('hitung.sebutan_kakek') : t('hitung.sebutan_nenek'), asal: (dariAyah ? t('hitung.ayah') : t('hitung.ibu')).toLowerCase() });
  }
  return t('hitung.sebutan_leluhur', { peran: laki ? t('hitung.ayah') : t('hitung.ibu'), asal: sebutLeluhur(graf, jalur.slice(0, -1)).toLowerCase() });
}

/** Hubungan ke `idMayit` + nomor bila perannya bisa lebih dari satu orang yang hidup ("Anak laki-laki 2"); tanpa nama orangnya. */
export function labelBawaan(graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang, kunci?: KunciAhliWaris): string {
  return labelDasar(graf, idMayit, idOrang, kunci).bernomor;
}

function labelDasar(graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang, kunci?: KunciAhliWaris, singkat = false): { label: string; bernomor: string } {
  const isian = hitungIsian(graf, idMayit);
  const kunciOrang = kunci ?? (Object.entries(isian).find(([, ids]) => ids!.includes(idOrang))?.[0] as KunciAhliWaris | undefined);
  const label = hubunganKeMayit(graf, idMayit, idOrang, kunciOrang, singkat) ?? t('hitung.kerabat');
  const sePeran = kunciOrang ? isian[kunciOrang] ?? [] : [];
  return { label, bernomor: sePeran.length > 1 ? `${label} ${sePeran.indexOf(idOrang) + 1}` : label };
}

/** "Anak laki-laki 2", "Ahmad (Anak laki-laki)", atau "Anak laki-laki (sudah wafat)" untuk penghubung. Dipakai juga di langkah 5. */
export function labelOrangChecklist(graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang, kunci?: KunciAhliWaris, singkat = false): string {
  const orang = graf.orang[idOrang]!;
  const { label, bernomor } = labelDasar(graf, idMayit, idOrang, kunci, singkat);
  if (orang.nama) return `${orang.nama} (${label}${orang.penghubung ? t('hitung.sudah_wafat_2') : ''})`;
  if (orang.penghubung) return t('hitung.label_sudah_wafat', { label });
  return bernomor;
}

/** Sebutan simpul di semua pohon (label saudara dipendekkan), dari sudut almarhum pemilik harta. Penghubung tanpa embel-embel "sudah wafat": itu tugas penanda di kotak. */
export function buatSebutSimpul(graf: GrafKeluarga): (id: IdOrang) => string {
  const adaPeran = new Set(Object.values(hitungIsian(graf, graf.idPewaris)).flatMap(ids => ids ?? []));
  return id => {
    const orang = graf.orang[id]!;
    if (orang.penghubung) {
      const label = hubunganKeMayit(graf, graf.idPewaris, id, undefined, true) ?? t('hitung.kerabat');
      return orang.nama ? `${orang.nama} (${label})` : label;
    }
    return adaPeran.has(id) || !orang.nama ? labelOrangChecklist(graf, graf.idPewaris, id, undefined, true) : orang.nama;
  };
}
