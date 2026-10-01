// Nama hubungan (mertua, menantu, besan, ipar, anak tiri, ...) sebagai jalur dari satu orang (pusat).
// Menerima graf + pusat + nama hubungan + jawaban; menyerahkan graf baru, atau satu pertanyaan jangkar, atau pesan galat.
// Semua langkah memakai aksi dasar kerabatPohon.ts; langkah orang tua yang belum ada dibuat sebagai penghubung (pola checklist).

import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { isiOrangTua, pastikanOrangTua } from './checklist';
import { PASANGAN_LAIN, pasanganAktif, tambahDariOrang, type JalurSaudara } from './kerabatPohon';
import { t } from './terjemah';

type Langkah = 'ayah' | 'ibu' | 'orangTua' | 'pasangan' | 'anak' | 'saudara';
type Akhir =
  | { aksi: 'orangTua'; sebagai?: 'ayah' | 'ibu' }
  | { aksi: 'pasangan'; mantan?: true }
  | { aksi: 'anak'; tiri?: true }
  | { aksi: 'saudara'; jalur: JalurSaudara; jenisKelamin?: 'L' | 'P' };
interface Jalur {
  label: string;
  perantara: Langkah[];
  akhir: Akhir;
  /** Jenis kelamin orang baru ditanyakan di dialog. */
  tanyaKelamin: boolean;
  /** Penyajian saja: hasilnya bukan jenis di daftar ± (hitungIsian), jadi tanpa nama kotaknya tidak bisa disebut. Dites terhadap hitungIsian. */
  wajibNama: boolean;
  /** Langkah pasangan tidak boleh memilih orang tua pusat sendiri (saudara tiri: istri ayah selain ibu pusat). */
  kecualiOrangTuaPusat?: true;
}

export const HUBUNGAN = {
  kakekDariAyah: { label: t('hitung.pohon.hub_kakek_dari_ayah'), perantara: ['ayah'], akhir: { aksi: 'orangTua', sebagai: 'ayah' }, tanyaKelamin: false, wajibNama: false },
  nenekDariAyah: { label: t('hitung.pohon.hub_nenek_dari_ayah'), perantara: ['ayah'], akhir: { aksi: 'orangTua', sebagai: 'ibu' }, tanyaKelamin: false, wajibNama: false },
  kakekDariIbu: { label: t('hitung.pohon.hub_kakek_dari_ibu'), perantara: ['ibu'], akhir: { aksi: 'orangTua', sebagai: 'ayah' }, tanyaKelamin: false, wajibNama: true },
  nenekDariIbu: { label: t('hitung.pohon.hub_nenek_dari_ibu'), perantara: ['ibu'], akhir: { aksi: 'orangTua', sebagai: 'ibu' }, tanyaKelamin: false, wajibNama: false },
  buyut: { label: t('hitung.pohon.hub_buyut'), perantara: ['orangTua', 'orangTua'], akhir: { aksi: 'orangTua' }, tanyaKelamin: true, wajibNama: true },
  cucu: { label: t('hitung.pohon.hub_cucu'), perantara: ['anak'], akhir: { aksi: 'anak' }, tanyaKelamin: true, wajibNama: false },
  cicit: { label: t('hitung.pohon.hub_cicit'), perantara: ['anak', 'anak'], akhir: { aksi: 'anak' }, tanyaKelamin: true, wajibNama: false },
  paman: { label: t('hitung.pohon.hub_paman'), perantara: ['orangTua'], akhir: { aksi: 'saudara', jalur: 'kandung', jenisKelamin: 'L' }, tanyaKelamin: false, wajibNama: false },
  bibi: { label: t('hitung.pohon.hub_bibi'), perantara: ['orangTua'], akhir: { aksi: 'saudara', jalur: 'kandung', jenisKelamin: 'P' }, tanyaKelamin: false, wajibNama: true },
  keponakan: { label: t('hitung.pohon.hub_keponakan'), perantara: ['saudara'], akhir: { aksi: 'anak' }, tanyaKelamin: true, wajibNama: false },
  sepupu: { label: t('hitung.pohon.hub_sepupu'), perantara: ['orangTua', 'saudara'], akhir: { aksi: 'anak' }, tanyaKelamin: true, wajibNama: false },
  mertua: { label: t('hitung.pohon.hub_mertua'), perantara: ['pasangan'], akhir: { aksi: 'orangTua' }, tanyaKelamin: true, wajibNama: true },
  menantu: { label: t('hitung.pohon.hub_menantu'), perantara: ['anak'], akhir: { aksi: 'pasangan' }, tanyaKelamin: false, wajibNama: true },
  besan: { label: t('hitung.pohon.hub_besan'), perantara: ['anak', 'pasangan'], akhir: { aksi: 'orangTua' }, tanyaKelamin: true, wajibNama: true },
  iparSaudaraPasangan: { label: t('hitung.pohon.hub_ipar_saudara_pasangan'), perantara: ['pasangan'], akhir: { aksi: 'saudara', jalur: 'kandung' }, tanyaKelamin: true, wajibNama: true },
  iparPasanganSaudara: { label: t('hitung.pohon.hub_ipar_pasangan_saudara'), perantara: ['saudara'], akhir: { aksi: 'pasangan' }, tanyaKelamin: false, wajibNama: true },
  cucuMenantu: { label: t('hitung.pohon.hub_cucu_menantu'), perantara: ['anak', 'anak'], akhir: { aksi: 'pasangan' }, tanyaKelamin: false, wajibNama: true },
  anakTiri: { label: t('hitung.pohon.hub_anak_tiri'), perantara: ['pasangan'], akhir: { aksi: 'anak', tiri: true }, tanyaKelamin: true, wajibNama: true },
  ibuTiri: { label: t('hitung.pohon.hub_ibu_tiri'), perantara: ['ayah'], akhir: { aksi: 'pasangan' }, tanyaKelamin: false, wajibNama: true },
  saudaraTiri: { label: t('hitung.pohon.hub_saudara_tiri'), perantara: ['ayah', 'pasangan'], akhir: { aksi: 'anak', tiri: true }, tanyaKelamin: true, wajibNama: true, kecualiOrangTuaPusat: true },
  mantan: { label: t('hitung.pohon.hub_mantan'), perantara: [], akhir: { aksi: 'pasangan', mantan: true }, tanyaKelamin: false, wajibNama: true },
} satisfies Record<string, Jalur>;
export type KunciHubungan = keyof typeof HUBUNGAN;

export interface Jawaban { jenisKelamin?: 'L' | 'P' | undefined; nama?: string | undefined; pilihan?: string[] | undefined }
export interface Pilihan { nilai: string; label: string }
export type HasilJalur =
  | { graf: GrafKeluarga; idBaru: IdOrang }
  | { pertanyaan: { indeks: number; judul: string; pilihan: Pilihan[] } }
  | { galat: string };

const JUDUL_TANYA = { orangTua: t('hitung.pohon.tanya_orang_tua'), pasangan: t('hitung.pohon.tanya_pasangan'), anak: t('hitung.pohon.tanya_anak'), saudara: t('hitung.pohon.tanya_saudara') };
const GALAT_BELUM_ADA = { pasangan: t('hitung.pohon.belum_ada_pasangan'), anak: t('hitung.pohon.belum_ada_anak'), saudara: t('hitung.pohon.belum_ada_saudara') };

export function selesaikanJalur(graf: GrafKeluarga, idPusat: IdOrang, kunci: KunciHubungan, jawaban: Jawaban = {}): HasilJalur {
  const jalur: Jalur = HUBUNGAN[kunci];
  let grafKini = graf;
  let sekarang = idPusat;
  for (const [indeks, langkah] of jalur.perantara.entries()) {
    if (langkah === 'ayah' || langkah === 'ibu' || langkah === 'orangTua') {
      const sebagai = langkah === 'orangTua' ? jawaban.pilihan?.[indeks] : langkah;
      if (sebagai !== 'ayah' && sebagai !== 'ibu') {
        return { pertanyaan: { indeks, judul: JUDUL_TANYA.orangTua, pilihan: [{ nilai: 'ayah', label: t('hitung.pohon.ayah') }, { nilai: 'ibu', label: t('hitung.pohon.ibu') }] } };
      }
      const orangTua = pastikanOrangTua(grafKini, sekarang, sebagai === 'ayah' ? 'L' : 'P');
      grafKini = orangTua.graf;
      sekarang = orangTua.idOrang;
      continue;
    }
    const kandidat = kandidatLangkah(grafKini, sekarang, langkah, jalur.kecualiOrangTuaPusat ? idPusat : undefined);
    if (kandidat.length === 0) return { galat: GALAT_BELUM_ADA[langkah] };
    const dipilih = kandidat.length === 1 ? kandidat[0]!.nilai : jawaban.pilihan?.[indeks];
    if (!dipilih || !kandidat.some(pilihan => pilihan.nilai === dipilih)) {
      return { pertanyaan: { indeks, judul: JUDUL_TANYA[langkah], pilihan: kandidat } };
    }
    sekarang = dipilih;
  }
  return akhiri(grafKini, sekarang, jalur, jawaban);
}

function kandidatLangkah(graf: GrafKeluarga, idOrang: IdOrang, langkah: 'pasangan' | 'anak' | 'saudara', kecualiOrangTuaDari: IdOrang | undefined): Pilihan[] {
  const kecuali = new Set(kecualiOrangTuaDari ? [graf.orang[kecualiOrangTuaDari]!.idAyah, graf.orang[kecualiOrangTuaDari]!.idIbu] : []);
  const ids = langkah === 'pasangan' ? pasanganAktif(graf, idOrang).filter(id => !kecuali.has(id))
    : langkah === 'anak' ? Object.values(graf.orang).filter(o => o.idAyah === idOrang || o.idIbu === idOrang).map(o => o.id)
    : Object.values(graf.orang).filter(o => o.id !== idOrang && ((o.idAyah && o.idAyah === graf.orang[idOrang]!.idAyah) || (o.idIbu && o.idIbu === graf.orang[idOrang]!.idIbu))).map(o => o.id);
  return ids.map((id, urutan) => ({ nilai: id, label: graf.orang[id]!.nama ?? t('hitung.pohon.tanpa_nama', { nomor: urutan + 1 }) }));
}

function akhiri(graf: GrafKeluarga, dari: IdOrang, jalur: Jalur, jawaban: Jawaban): HasilJalur {
  const { akhir } = jalur;
  const jenisKelamin = (akhir.aksi === 'saudara' ? akhir.jenisKelamin : undefined) ?? jawaban.jenisKelamin;
  const perluKelamin = akhir.aksi === 'anak' || akhir.aksi === 'saudara' || (akhir.aksi === 'orangTua' && !akhir.sebagai);
  if (perluKelamin && !jenisKelamin) return { galat: t('hitung.pohon.kelamin_wajib') };
  try {
    switch (akhir.aksi) {
      case 'orangTua': {
        const sebagai = akhir.sebagai ?? (jenisKelamin === 'L' ? 'ayah' : 'ibu');
        // Penghubung di slot itu dihidupkan (bukan dibuat kedua); orang nyata = sudah terisi.
        const hasil = isiOrangTua(graf, dari, sebagai === 'ayah' ? 'L' : 'P', {});
        return { graf: beriNama(hasil.graf, hasil.idOrang, jawaban.nama), idBaru: hasil.idOrang };
      }
      case 'pasangan': {
        const hasil = tambahDariOrang(graf, dari, { aksi: 'pasangan', nama: jawaban.nama });
        return akhir.mantan ? { graf: talakBain(hasil.graf, hasil.idBaru), idBaru: hasil.idBaru } : hasil;
      }
      case 'anak':
        return tambahDariOrang(graf, dari, { aksi: 'anak', jenisKelamin: jenisKelamin!, nama: jawaban.nama, ...(akhir.tiri ? { idPasangan: PASANGAN_LAIN } : {}) });
      case 'saudara':
        return tambahDariOrang(graf, dari, { aksi: 'saudara', jenisKelamin: jenisKelamin!, jalur: akhir.jalur, nama: jawaban.nama });
    }
  } catch (galat) {
    return { galat: galat instanceof Error && !/sudah terisi/.test(galat.message) ? galat.message : t('hitung.pohon.sudah_terisi') };
  }
}

const talakBain = (graf: GrafKeluarga, idPasangan: IdOrang): GrafKeluarga =>
  ({ ...graf, pernikahan: graf.pernikahan.map(nikah => (nikah.idSuami === idPasangan || nikah.idIstri === idPasangan ? { ...nikah, status: 'talakBain' as const } : nikah)) });

function beriNama(graf: GrafKeluarga, idOrang: IdOrang, nama: string | undefined): GrafKeluarga {
  const bersih = nama?.trim();
  return bersih ? { ...graf, orang: { ...graf.orang, [idOrang]: { ...graf.orang[idOrang]!, nama: bersih } } } : graf;
}

