// Checklist ahli waris ⇄ graf keluarga.
// Menerima graf + mayit + jenis ahli waris yang dicentang, menyerahkan graf baru untuk engine.
// Jenis kerabat (kandung/sebapak/seibu, paman, sepupu) tidak disimpan: engine menurunkannya dari
// idAyah/idIbu. Orang tua yang dibutuhkan tapi tidak diisi dibuat sebagai penghubung (wafat).

import {
  KONFIGURASI_BAWAAN, tambahKerabat, turunkanPeran,
  type GrafKeluarga, type IdOrang, type KunciAhliWaris, type Orang,
} from '@waris/engine';
import { LABEL_SEHARI } from './konten/ahliWaris';
import { t } from './terjemah';

export type Kelompok = 'pasangan' | 'keturunan' | 'leluhur' | 'saudara';

export interface JenisAhliWaris {
  kunci: KunciAhliWaris;
  label: string;
  kelompok: Kelompok;
  /** Orang ini harus diturunkan dari induk berkunci ini (cucu dari anak lk, dst.). */
  kunciInduk?: KunciAhliWaris;
  maksimal?: number;
  /** Hanya muncul bila mayit berjenis kelamin ini. */
  hanyaUntuk?: 'L' | 'P';
}

// ponytail: cucu hanya satu tingkat dan mu'tiq tidak ditawarkan; tambah bila bab 16 butuh lewat UI.
export const DAFTAR_JENIS: JenisAhliWaris[] = [
  { kunci: 'SUAMI', label: t('hitung.suami'), kelompok: 'pasangan', maksimal: 1, hanyaUntuk: 'P' },
  { kunci: 'ISTRI', label: t('hitung.istri'), kelompok: 'pasangan', maksimal: 4, hanyaUntuk: 'L' },
  { kunci: 'ANAK_LK', label: t('hitung.anak_laki_laki'), kelompok: 'keturunan' },
  { kunci: 'ANAK_PR', label: t('hitung.anak_perempuan'), kelompok: 'keturunan' },
  { kunci: 'CUCU_LK', label: t('hitung.cucu_laki_laki_dari_anak_lk'), kelompok: 'keturunan', kunciInduk: 'ANAK_LK' },
  { kunci: 'CUCU_PR', label: t('hitung.cucu_perempuan_dari_anak_lk'), kelompok: 'keturunan', kunciInduk: 'ANAK_LK' },
  { kunci: 'AYAH', label: t('hitung.ayah'), kelompok: 'leluhur', maksimal: 1 },
  { kunci: 'IBU', label: t('hitung.ibu'), kelompok: 'leluhur', maksimal: 1 },
  { kunci: 'KAKEK', label: t('hitung.kakek_ayahnya_ayah'), kelompok: 'leluhur', maksimal: 1 },
  { kunci: 'NENEK_DARI_AYAH', label: t('hitung.nenek_ibunya_ayah'), kelompok: 'leluhur', maksimal: 1 },
  { kunci: 'NENEK_DARI_IBU', label: t('hitung.nenek_ibunya_ibu'), kelompok: 'leluhur', maksimal: 1 },
  { kunci: 'SAUDARA_KANDUNG', label: t('hitung.saudara_lk_kandung'), kelompok: 'saudara' },
  { kunci: 'SAUDARI_KANDUNG', label: t('hitung.saudari_kandung'), kelompok: 'saudara' },
  { kunci: 'SAUDARA_SEBAPAK', label: t('hitung.saudara_lk_sebapak'), kelompok: 'saudara' },
  { kunci: 'SAUDARI_SEBAPAK', label: t('hitung.saudari_sebapak'), kelompok: 'saudara' },
  { kunci: 'SAUDARA_SEIBU', label: t('hitung.saudara_lk_seibu'), kelompok: 'saudara' },
  { kunci: 'SAUDARI_SEIBU', label: t('hitung.saudari_seibu'), kelompok: 'saudara' },
  { kunci: 'KEPONAKAN_KANDUNG', label: t('hitung.keponakan_lk_dari_saudara_kandung'), kelompok: 'saudara', kunciInduk: 'SAUDARA_KANDUNG' },
  { kunci: 'KEPONAKAN_SEBAPAK', label: t('hitung.keponakan_lk_dari_saudara_sebapak'), kelompok: 'saudara', kunciInduk: 'SAUDARA_SEBAPAK' },
  { kunci: 'PAMAN_KANDUNG', label: t('hitung.paman_kandung_saudara_ayah'), kelompok: 'saudara' },
  { kunci: 'PAMAN_SEBAPAK', label: t('hitung.paman_sebapak'), kelompok: 'saudara' },
  { kunci: 'SEPUPU_KANDUNG', label: t('hitung.sepupu_lk_dari_paman_kandung'), kelompok: 'saudara', kunciInduk: 'PAMAN_KANDUNG' },
  { kunci: 'SEPUPU_SEBAPAK', label: t('hitung.sepupu_lk_dari_paman_sebapak'), kelompok: 'saudara', kunciInduk: 'PAMAN_SEBAPAK' },
];

export const jenisDari = (kunci: KunciAhliWaris): JenisAhliWaris | undefined =>
  DAFTAR_JENIS.find(jenis => jenis.kunci === kunci);

/** Orang hidup (bukan penghubung) per kunci ahli waris, dilihat dari `idMayit`. */
export function hitungIsian(graf: GrafKeluarga, idMayit: IdOrang): Partial<Record<KunciAhliWaris, IdOrang[]>> {
  return kelompokkanPerKunci(graf, idMayit, orang => !orang.penghubung && orang.statusHidup !== 'wafat');
}

/** Calon induk untuk jenis bertingkat: yang hidup maupun penghubung. */
export function daftarInduk(graf: GrafKeluarga, idMayit: IdOrang, kunciInduk: KunciAhliWaris): IdOrang[] {
  return kelompokkanPerKunci(graf, idMayit, () => true)[kunciInduk] ?? [];
}

/** Pilihan induk "yang lain, sudah wafat": selalu buat penghubung baru, bukan memakai yang sudah ada. */
export const INDUK_BARU_WAFAT = 'INDUK_BARU_WAFAT';

export function tambahAhliWaris(
  graf: GrafKeluarga, idMayit: IdOrang, kunci: KunciAhliWaris, opsi: { idInduk?: IdOrang } = {},
): GrafKeluarga {
  const jenis = jenisDari(kunci);
  if (!jenis) throw new Error(`jenis ${kunci} tidak ada di checklist`);
  const sudahAda = hitungIsian(graf, idMayit)[kunci]?.length ?? 0;
  if (jenis.maksimal !== undefined && sudahAda >= jenis.maksimal) throw new Error(`${jenis.label} maksimal ${jenis.maksimal}`);
  return bangun(graf, idMayit, kunci, false, opsi.idInduk).graf;
}

/** Kurangi satu (yang terakhir ditambah). Yang masih punya keturunan di graf jadi penghubung. */
export function kurangiAhliWaris(graf: GrafKeluarga, idMayit: IdOrang, kunci: KunciAhliWaris): GrafKeluarga {
  const idOrang = hitungIsian(graf, idMayit)[kunci]?.at(-1);
  return idOrang ? hapusAhliWaris(graf, idOrang) : graf;
}

/** Hapus satu orang tertentu. Yang masih punya keturunan di graf jadi penghubung (wafat) supaya garis keturunan tetap utuh. */
export function hapusAhliWaris(graf: GrafKeluarga, idOrang: IdOrang): GrafKeluarga {
  const adaKeturunan = Object.values(graf.orang).some(orang => orang.idAyah === idOrang || orang.idIbu === idOrang);
  if (adaKeturunan) return ubahOrang(graf, idOrang, { penghubung: true, statusHidup: 'wafat' });
  const { [idOrang]: _dihapus, ...orangSisa } = graf.orang;
  return {
    ...graf,
    orang: orangSisa,
    pernikahan: graf.pernikahan.filter(nikah => nikah.idSuami !== idOrang && nikah.idIstri !== idOrang),
  };
}

// ─── Membangun orang per jenis ────────────────────────────────────────────────

type Hasil = { graf: GrafKeluarga; idOrang: IdOrang };

/** Nama opsional seseorang; string kosong menghapus nama. */
export function ubahNama(graf: GrafKeluarga, idOrang: IdOrang, nama: string): GrafKeluarga {
  const { nama: _lama, ...tanpaNama } = graf.orang[idOrang]!;
  const namaBersih = nama.trim();
  return { ...graf, orang: { ...graf.orang, [idOrang]: namaBersih ? { ...tanpaNama, nama: namaBersih } : tanpaNama } };
}

/** `sebagaiPenghubung`: dipakai saat jenis ini hanya dibutuhkan sebagai induk/orang tua. */
function bangun(graf: GrafKeluarga, idMayit: IdOrang, kunci: KunciAhliWaris, sebagaiPenghubung: boolean, idInduk?: IdOrang): Hasil {
  const status: Partial<Orang> = sebagaiPenghubung ? { penghubung: true, statusHidup: 'wafat' } : {};
  switch (kunci) {
    case 'SUAMI': case 'ISTRI': {
      const idOrang = idBaru(graf);
      const grafBaru = tambahKerabat(graf, idMayit, kunci === 'SUAMI' ? 'suami' : 'istri', { id: idOrang });
      return { graf: hubungkanAnakTanpaOrangTuaLain(grafBaru, idMayit), idOrang };
    }
    case 'ANAK_LK': case 'ANAK_PR':
      return tambahAnakDariMayit(graf, idMayit, kunci === 'ANAK_LK' ? 'L' : 'P', status);
    case 'AYAH': return isiOrangTua(graf, idMayit, 'L', status);
    case 'IBU': return isiOrangTua(graf, idMayit, 'P', status);
    case 'KAKEK': { const ayah = pastikanOrangTua(graf, idMayit, 'L'); return isiOrangTua(ayah.graf, ayah.idOrang, 'L', status); }
    case 'NENEK_DARI_AYAH': { const ayah = pastikanOrangTua(graf, idMayit, 'L'); return isiOrangTua(ayah.graf, ayah.idOrang, 'P', status); }
    case 'NENEK_DARI_IBU': { const ibu = pastikanOrangTua(graf, idMayit, 'P'); return isiOrangTua(ibu.graf, ibu.idOrang, 'P', status); }
    case 'SAUDARA_KANDUNG': case 'SAUDARI_KANDUNG':
      return tambahSaudara(graf, idMayit, 'kandung', kunci === 'SAUDARA_KANDUNG' ? 'L' : 'P', status);
    case 'SAUDARA_SEBAPAK': case 'SAUDARI_SEBAPAK':
      return tambahSaudara(graf, idMayit, 'sebapak', kunci === 'SAUDARA_SEBAPAK' ? 'L' : 'P', status);
    case 'SAUDARA_SEIBU': case 'SAUDARI_SEIBU':
      return tambahSaudara(graf, idMayit, 'seibu', kunci === 'SAUDARA_SEIBU' ? 'L' : 'P', status);
    case 'PAMAN_KANDUNG': case 'PAMAN_SEBAPAK': {
      const ayah = pastikanOrangTua(graf, idMayit, 'L');
      return tambahSaudara(ayah.graf, ayah.idOrang, kunci === 'PAMAN_KANDUNG' ? 'kandung' : 'sebapak', 'L', status);
    }
    case 'CUCU_LK': case 'CUCU_PR': case 'KEPONAKAN_KANDUNG': case 'KEPONAKAN_SEBAPAK':
    case 'SEPUPU_KANDUNG': case 'SEPUPU_SEBAPAK': {
      const induk = pilihInduk(graf, idMayit, jenisDari(kunci)!.kunciInduk!, idInduk);
      const jenisKelamin = kunci === 'CUCU_PR' ? 'P' : 'L';
      return tambahOrang(induk.graf, { jenisKelamin, idAyah: induk.idOrang, ...status });
    }
    default:
      throw new Error(`jenis ${kunci} belum bisa dibangun dari checklist`);
  }
}

/** Induk pilihan pengguna; kalau tidak dipilih, pakai penghubung yang sudah ada atau buat baru. */
function pilihInduk(graf: GrafKeluarga, idMayit: IdOrang, kunciInduk: KunciAhliWaris, idInduk?: IdOrang): Hasil {
  if (idInduk === INDUK_BARU_WAFAT) return bangun(graf, idMayit, kunciInduk, true);
  if (idInduk) return { graf, idOrang: idInduk };
  const penghubungAda = daftarInduk(graf, idMayit, kunciInduk).find(id => graf.orang[id]!.penghubung);
  return penghubungAda ? { graf, idOrang: penghubungAda } : bangun(graf, idMayit, kunciInduk, true);
}

/** Pasangan mayit yang masih hidup, bila tepat satu; dialah orang tua lain anak-anak mayit. */
function satuSatunyaPasanganHidup(graf: GrafKeluarga, idMayit: IdOrang): IdOrang | undefined {
  const idPasangan = graf.pernikahan
    .filter(nikah => nikah.status !== 'talakBain' && (nikah.idSuami === idMayit || nikah.idIstri === idMayit))
    .map(nikah => (nikah.idSuami === idMayit ? nikah.idIstri : nikah.idSuami))
    .filter(id => graf.orang[id]?.statusHidup !== 'wafat');
  return idPasangan.length === 1 ? idPasangan[0] : undefined;
}

/** Pasangan diisi setelah anak: anak mayit yang belum punya orang tua lain dihubungkan ke pasangan itu. */
export function hubungkanAnakTanpaOrangTuaLain(graf: GrafKeluarga, idMayit: IdOrang): GrafKeluarga {
  const idPasangan = satuSatunyaPasanganHidup(graf, idMayit);
  if (!idPasangan) return graf;
  const [kunciMayit, kunciPasangan] = graf.orang[idMayit]!.jenisKelamin === 'L' ? ['idAyah', 'idIbu'] as const : ['idIbu', 'idAyah'] as const;
  return Object.values(graf.orang)
    .filter(orang => orang[kunciMayit] === idMayit && !orang[kunciPasangan])
    .reduce((grafKini, anak) => ubahOrang(grafKini, anak.id, { [kunciPasangan]: idPasangan }), graf);
}

/** Anak mayit. Pasangan yang masih hidup (tepat satu) otomatis jadi orang tua lainnya. */
function tambahAnakDariMayit(graf: GrafKeluarga, idMayit: IdOrang, jenisKelamin: 'L' | 'P', status: Partial<Orang>): Hasil {
  const mayit = graf.orang[idMayit]!;
  const orangTuaLain = satuSatunyaPasanganHidup(graf, idMayit);
  const [idAyah, idIbu] = mayit.jenisKelamin === 'L' ? [idMayit, orangTuaLain] : [orangTuaLain, idMayit];
  return tambahOrang(graf, { jenisKelamin, ...(idAyah ? { idAyah } : {}), ...(idIbu ? { idIbu } : {}), ...status });
}

/** Ayah/ibu seseorang: penghubung yang ada diubah jadi hidup; yang sudah hidup = sudah penuh. */
export function isiOrangTua(graf: GrafKeluarga, idAnak: IdOrang, jenisKelamin: 'L' | 'P', status: Partial<Orang>): Hasil {
  const idAda = jenisKelamin === 'L' ? graf.orang[idAnak]!.idAyah : graf.orang[idAnak]!.idIbu;
  if (idAda) {
    // Dibutuhkan sebagai penghubung: orang tua yang sudah ada (hidup atau penghubung) dipakai.
    if (status.penghubung) return { graf, idOrang: idAda };
    if (!graf.orang[idAda]!.penghubung) throw new Error(`orang tua ${idAnak} sudah terisi`);
    return { graf: ubahOrang(graf, idAda, { penghubung: false, statusHidup: 'hidup' }), idOrang: idAda };
  }
  const baru = tambahOrang(graf, { jenisKelamin, ...status });
  return { graf: ubahOrang(baru.graf, idAnak, jenisKelamin === 'L' ? { idAyah: baru.idOrang } : { idIbu: baru.idOrang }), idOrang: baru.idOrang };
}

export const pastikanOrangTua = (graf: GrafKeluarga, idAnak: IdOrang, jenisKelamin: 'L' | 'P'): Hasil =>
  isiOrangTua(graf, idAnak, jenisKelamin, { penghubung: true, statusHidup: 'wafat' });

/** Saudara `idOrang`: kandung = ayah & ibu sama; sebapak = ayah sama, ibu lain; seibu = sebaliknya. */
export function tambahSaudara(
  graf: GrafKeluarga, idOrang: IdOrang, jalur: 'kandung' | 'sebapak' | 'seibu', jenisKelamin: 'L' | 'P', status: Partial<Orang>,
): Hasil {
  const ayah = pastikanOrangTua(graf, idOrang, 'L');
  const ibu = pastikanOrangTua(ayah.graf, idOrang, 'P');
  let grafKini = ibu.graf;
  let idAyah = ayah.idOrang;
  let idIbu = ibu.idOrang;
  if (jalur === 'sebapak') ({ graf: grafKini, idOrang: idIbu } = orangTuaLain(grafKini, idAyah, idIbu, 'P'));
  if (jalur === 'seibu') ({ graf: grafKini, idOrang: idAyah } = orangTuaLain(grafKini, idIbu, idAyah, 'L'));
  return tambahOrang(grafKini, { jenisKelamin, idAyah, idIbu, ...status });
}

/** Pasangan lain (penghubung) dari `idOrangTua`, dipakai ulang supaya saudara sebapak/seibu sekandung satu sama lain. */
function orangTuaLain(graf: GrafKeluarga, idOrangTua: IdOrang, idBukan: IdOrang, jenisKelamin: 'L' | 'P'): Hasil {
  const kunciOrangTua = jenisKelamin === 'P' ? 'idIbu' : 'idAyah';
  const kunciSaya = jenisKelamin === 'P' ? 'idAyah' : 'idIbu';
  const ada = Object.values(graf.orang).find(orang => orang[kunciSaya] === idOrangTua && orang[kunciOrangTua] && orang[kunciOrangTua] !== idBukan
    && graf.orang[orang[kunciOrangTua]!]!.penghubung);
  if (ada) return { graf, idOrang: ada[kunciOrangTua]! };
  return tambahOrang(graf, { jenisKelamin, penghubung: true, statusHidup: 'wafat' });
}

// ─── Utilitas graf ────────────────────────────────────────────────────────────

function kelompokkanPerKunci(graf: GrafKeluarga, idMayit: IdOrang, saring: (orang: Orang) => boolean) {
  const { daftarPeran } = turunkanPeran({ ...graf, idPewaris: idMayit }, KONFIGURASI_BAWAAN);
  const hasil: Partial<Record<KunciAhliWaris, IdOrang[]>> = {};
  for (const idOrang of Object.keys(graf.orang)) {
    const kunci = daftarPeran[idOrang]?.kunci;
    if (!kunci || !jenisDari(kunci as KunciAhliWaris) || !saring(graf.orang[idOrang]!)) continue;
    (hasil[kunci as KunciAhliWaris] ??= []).push(idOrang);
  }
  return hasil;
}

function tambahOrang(graf: GrafKeluarga, data: Omit<Orang, 'id' | 'statusHidup' | 'agama'> & Partial<Orang>): Hasil {
  const idOrang = idBaru(graf);
  const orang: Orang = { statusHidup: 'hidup', agama: 'islam', ...data, id: idOrang };
  return { graf: { ...graf, orang: { ...graf.orang, [idOrang]: orang } }, idOrang };
}

/** Dipakai keadaanOrang.ts untuk janin dan bayi (orang tanpa jenis checklist). */
export const tambahOrangBaru = tambahOrang;

export const ubahOrang = (graf: GrafKeluarga, idOrang: IdOrang, perubahan: Partial<Orang>): GrafKeluarga =>
  ({ ...graf, orang: { ...graf.orang, [idOrang]: { ...graf.orang[idOrang]!, ...perubahan } } });

/** Id berurutan O1, O2, ... supaya deterministik dan mudah dibaca di file JSON. */
export function idBaru(graf: GrafKeluarga): IdOrang {
  const nomorTerbesar = Object.keys(graf.orang).reduce((maks, id) => Math.max(maks, Number(/^O(\d+)$/.exec(id)?.[1] ?? 0)), 0);
  return `O${nomorTerbesar + 1}`;
}

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
