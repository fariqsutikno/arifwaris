// Saudara almarhum di pohon: dikelompokkan per pasangan orang tua (untuk bingkai di pohon lengkap) dan diringkas
// jadi satu simpul (untuk pohon samping yang sempit). Fungsi murni dari graf; data kasus tidak diubah.

import type { GrafKeluarga, IdOrang, Orang } from '@waris/engine';

export type JenisSaudara = 'kandung' | 'sebapak' | 'seibu';
export interface KelompokSaudara { jenis: JenisSaudara; anak: IdOrang[] }
export interface RingkasanSaudara { jumlah: number; menurutJenis: Record<JenisSaudara, number> }

/** Id simpul ringkasan: bukan orang sungguhan, hanya ada di graf yang digambar. */
export const ID_RINGKAS_SAUDARA = 'SAUDARA_RINGKAS';

const jenisDariPewaris = (graf: GrafKeluarga, orang: Orang): JenisSaudara | undefined => {
  const pewaris = graf.orang[graf.idPewaris]!;
  const seAyah = !!pewaris.idAyah && orang.idAyah === pewaris.idAyah;
  const seIbu = !!pewaris.idIbu && orang.idIbu === pewaris.idIbu;
  return seAyah && seIbu ? 'kandung' : seAyah ? 'sebapak' : seIbu ? 'seibu' : undefined;
};

/** Saudara pewaris (tanpa pewaris sendiri) menurut jenisnya. */
function daftarSaudara(graf: GrafKeluarga): Array<{ id: IdOrang; jenis: JenisSaudara }> {
  return Object.values(graf.orang).flatMap(orang => {
    const jenis = orang.id === graf.idPewaris ? undefined : jenisDariPewaris(graf, orang);
    return jenis ? [{ id: orang.id, jenis }] : [];
  });
}

/**
 * Kelompok anak per pasangan orang tua yang menyangkut pewaris (pewaris ikut di kelompok kandung). Kosong bila hanya satu kelompok:
 * bingkai berlabel baru berguna untuk membedakan kandung, seayah, dan seibu.
 */
export function kelompokSaudara(graf: GrafKeluarga): KelompokSaudara[] {
  const menurutOrangTua = new Map<string, KelompokSaudara>();
  for (const orang of [graf.orang[graf.idPewaris]!, ...daftarSaudara(graf).map(({ id }) => graf.orang[id]!)]) {
    const jenis = orang.id === graf.idPewaris ? 'kandung' : jenisDariPewaris(graf, orang)!;
    const kunci = `${orang.idAyah}|${orang.idIbu}`;
    const kelompok = menurutOrangTua.get(kunci) ?? { jenis, anak: [] };
    kelompok.anak.push(orang.id);
    menurutOrangTua.set(kunci, kelompok);
  }
  return menurutOrangTua.size > 1 ? [...menurutOrangTua.values()] : [];
}

/**
 * Graf untuk pohon samping: semua saudara (beserta keturunan dan pasangan yang hanya terhubung lewat mereka) diganti satu simpul ringkasan
 * yang digantung di orang tua pewaris. Orang tua tiri (istri lain ayah, suami ibu) ikut hilang bila tidak punya hubungan lain.
 * Tanpa saudara, graf dikembalikan apa adanya.
 */
export function ringkaskanSaudara(graf: GrafKeluarga): { graf: GrafKeluarga; ringkasan?: RingkasanSaudara } {
  const saudara = daftarSaudara(graf);
  if (saudara.length === 0) return { graf };
  const pewaris = graf.orang[graf.idPewaris]!;
  const semua = Object.values(graf.orang);
  const keturunan = new Set(saudara.map(({ id }) => id));
  for (const id of keturunan) for (const anak of semua) if ((anak.idAyah === id || anak.idIbu === id) && !keturunan.has(anak.id)) keturunan.add(anak.id);
  const leluhur = new Set<IdOrang>();
  for (const id of leluhur.add(graf.idPewaris)) for (const idOrangTua of [graf.orang[id]!.idAyah, graf.orang[id]!.idIbu]) if (idOrangTua && graf.orang[idOrangTua]) leluhur.add(idOrangTua);
  leluhur.delete(graf.idPewaris);

  // Yang tinggal: terjangkau dari pewaris lewat orang tua, anak, dan pasangan, tanpa masuk ke saudara dan tanpa lewat pasangan leluhur
  // (pasangan lain leluhur hanya terjangkau sebagai orang tua dari orang yang tinggal).
  const tinggal = new Set<IdOrang>([graf.idPewaris]);
  for (const id of tinggal) {
    const orang = graf.orang[id]!;
    const tetangga = [
      orang.idAyah, orang.idIbu,
      ...semua.filter(anak => anak.idAyah === id || anak.idIbu === id).map(anak => anak.id),
      ...(leluhur.has(id) ? [] : graf.pernikahan.flatMap(nikah => (nikah.idSuami === id ? [nikah.idIstri] : nikah.idIstri === id ? [nikah.idSuami] : []))),
    ];
    for (const idLain of tetangga) if (idLain && graf.orang[idLain] && !keturunan.has(idLain)) tinggal.add(idLain);
  }

  const orang: Record<IdOrang, Orang> = {};
  for (const id of tinggal) {
    const { idAyah, idIbu, ...inti } = graf.orang[id]!;
    orang[id] = { ...inti, ...(idAyah && tinggal.has(idAyah) ? { idAyah } : {}), ...(idIbu && tinggal.has(idIbu) ? { idIbu } : {}) };
  }
  orang[ID_RINGKAS_SAUDARA] = {
    id: ID_RINGKAS_SAUDARA, jenisKelamin: 'L', statusHidup: 'hidup', agama: 'islam',
    ...(pewaris.idAyah ? { idAyah: pewaris.idAyah } : {}), ...(pewaris.idIbu ? { idIbu: pewaris.idIbu } : {}),
  };
  const menurutJenis: Record<JenisSaudara, number> = { kandung: 0, sebapak: 0, seibu: 0 };
  for (const { jenis } of saudara) menurutJenis[jenis]++;
  return {
    graf: { ...graf, orang, pernikahan: graf.pernikahan.filter(nikah => tinggal.has(nikah.idSuami) && tinggal.has(nikah.idIstri)) },
    ringkasan: { jumlah: saudara.length, menurutJenis },
  };
}
