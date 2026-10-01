// Aksi menu orang di pohon (spec Tahap 4 bagian 2): menerima graf + satu orang, menyerahkan graf baru.
// Hanya menyusun graf lewat pembangun yang sudah ada (engine graf.ts dan checklist.ts), tanpa aturan fikih.
// Hubungan jauh (mertua, besan, dst.) disusun dari aksi-aksi ini di hubunganPohon.ts.

import { opsiRelasi, tambahKerabat, type GrafKeluarga, type IdOrang } from '@waris/engine';
import { hapusAhliWaris, hubungkanAnakTanpaOrangTuaLain, idBaru, isiOrangTua, tambahSaudara, ubahNama } from './checklist';
import { t } from './terjemah';

export const PASANGAN_LAIN = 'PASANGAN_LAIN';
export type Aksi = 'orangTua' | 'pasangan' | 'anak' | 'saudara';
export type JalurSaudara = 'kandung' | 'sebapak' | 'seibu';
export type Masukan =
  | { aksi: 'orangTua'; sebagai: 'ayah' | 'ibu'; nama?: string | undefined }
  | { aksi: 'pasangan'; nama?: string | undefined; /** false: anak pusat yang belum punya orang tua lain tidak otomatis dihubungkan ke pasangan baru (mantan, ibu tiri). */ hubungkanAnak?: boolean | undefined }
  | { aksi: 'anak'; jenisKelamin: 'L' | 'P'; idPasangan?: IdOrang | undefined; nama?: string | undefined }
  | { aksi: 'saudara'; jenisKelamin: 'L' | 'P'; jalur: JalurSaudara; nama?: string | undefined };
type Hasil = { graf: GrafKeluarga; idBaru: IdOrang };

/** Pasangan yang pernikahannya belum talak bain (urutan pernikahan). */
export const pasanganAktif = (graf: GrafKeluarga, idOrang: IdOrang): IdOrang[] =>
  graf.pernikahan
    .filter(nikah => nikah.status !== 'talakBain' && (nikah.idSuami === idOrang || nikah.idIstri === idOrang))
    .map(nikah => (nikah.idSuami === idOrang ? nikah.idIstri : nikah.idSuami));

/** Slot ayah/ibu yang masih bisa diisi: kosong, atau berisi penghubung (orang buatan sistem yang dihidupkan saat diisi). */
export function slotOrangTuaTerbuka(graf: GrafKeluarga, idOrang: IdOrang): Array<'ayah' | 'ibu'> {
  const orang = graf.orang[idOrang]!;
  const terbuka = (id: IdOrang | undefined) => !id || !!graf.orang[id]?.penghubung;
  return [...(terbuka(orang.idAyah) ? ['ayah' as const] : []), ...(terbuka(orang.idIbu) ? ['ibu' as const] : [])];
}

/** Aksi yang boleh ditawarkan di menu; yang tidak mungkin (slot terisi orang nyata, batas istri) tidak tampil. */
export function aksiTersedia(graf: GrafKeluarga, idOrang: IdOrang): Aksi[] {
  const aksi: Aksi[] = [];
  if (slotOrangTuaTerbuka(graf, idOrang).length > 0) aksi.push('orangTua');
  if (opsiRelasi(graf, idOrang).some(relasi => relasi === 'suami' || relasi === 'istri')) aksi.push('pasangan');
  aksi.push('anak', 'saudara');
  return aksi;
}

export function tambahDariOrang(graf: GrafKeluarga, idOrang: IdOrang, masukan: Masukan): Hasil {
  const hasil = bangunDari(graf, idOrang, masukan);
  return masukan.nama?.trim() ? { ...hasil, graf: ubahNama(hasil.graf, hasil.idBaru, masukan.nama) } : hasil;
}

function bangunDari(graf: GrafKeluarga, idOrang: IdOrang, masukan: Masukan): Hasil {
  const id = idBaru(graf);
  switch (masukan.aksi) {
    case 'orangTua': {
      // Penghubung di slot itu dihidupkan (bukan dibuat kedua); orang nyata di slot = galat dari isiOrangTua.
      const hasil = isiOrangTua(graf, idOrang, masukan.sebagai === 'ayah' ? 'L' : 'P', {});
      return { graf: hasil.graf, idBaru: hasil.idOrang };
    }
    case 'pasangan': {
      const relasi = graf.orang[idOrang]!.jenisKelamin === 'L' ? 'istri' : 'suami';
      const grafBaru = tambahKerabat(graf, idOrang, relasi, { id });
      return { graf: masukan.hubungkanAnak === false ? grafBaru : hubungkanAnakTanpaOrangTuaLain(grafBaru, idOrang), idBaru: id };
    }
    case 'anak': {
      const hidup = pasanganAktif(graf, idOrang).filter(pasangan => graf.orang[pasangan]!.statusHidup !== 'wafat');
      if (hidup.length > 1 && masukan.idPasangan === undefined) throw new Error(t('hitung.pohon.pilih_pasangan_anak'));
      const orangTuaLain = masukan.idPasangan === PASANGAN_LAIN ? undefined : masukan.idPasangan ?? hidup[0];
      const relasi = masukan.jenisKelamin === 'L' ? 'anakLaki' : 'anakPerempuan';
      return { graf: tambahKerabat(graf, idOrang, relasi, { id }, orangTuaLain ? { idOrangTuaLain: orangTuaLain } : {}), idBaru: id };
    }
    case 'saudara': {
      const hasil = tambahSaudara(graf, idOrang, masukan.jalur, masukan.jenisKelamin, {});
      return { graf: hasil.graf, idBaru: hasil.idOrang };
    }
  }
}

/** Dampak menghapus: yang punya keturunan tetap di graf sebagai penghubung (garis keturunan utuh); pernikahannya putus. */
export function dampakHapus(graf: GrafKeluarga, idOrang: IdOrang): { menjadiPenghubung: boolean; pasangan: IdOrang[] } {
  return {
    menjadiPenghubung: Object.values(graf.orang).some(orang => orang.idAyah === idOrang || orang.idIbu === idOrang),
    // Yang masih punya keturunan tetap di graf (hapusAhliWaris): pernikahannya tidak dilepas, jadi bukan dampak.
    pasangan: Object.values(graf.orang).some(orang => orang.idAyah === idOrang || orang.idIbu === idOrang) ? [] : graf.pernikahan.flatMap(nikah => (nikah.idSuami === idOrang ? [nikah.idIstri] : nikah.idIstri === idOrang ? [nikah.idSuami] : [])),
  };
}

/** Pewaris tidak bisa dihapus; penghubung yang masih punya keturunan sudah "terhapus" dan tidak perlu tautan hapus. */
export const bolehHapus = (graf: GrafKeluarga, idOrang: IdOrang): boolean =>
  idOrang !== graf.idPewaris && !(graf.orang[idOrang]!.penghubung && dampakHapus(graf, idOrang).menjadiPenghubung);

export { hapusAhliWaris };
