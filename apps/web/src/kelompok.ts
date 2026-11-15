// Bagian wawancara kanvas silsilah (spec 5.2): untuk tiap almarhum, kelompok keluarga yang ditanyakan berurutan.
// Menerima Kasus; menyerahkan daftar bagian, anggota tiap bagian, dan apakah bagian sudah lengkap.
// Bagian tampil bila sudah berisi, sudah dijawab, atau engine menyatakan posisinya berpengaruh (ujiHipotetis).

import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import { pertanyaanUrutanBerikut } from './antreanUrutan';
import { hitungIsian } from './checklist';
import type { Kasus, Kelompok } from './kasus';
import { posisiPerluDitanya } from './ujiHipotetis';

export type JenisBagian = Kelompok | 'urutan' | 'kamu';
export interface Bagian { id: string; milik: IdOrang; jenis: JenisBagian }

/** Urutan hanya bermakna bila ada dua orang atau lebih yang wafat sebelum harta dibagi. */
const MINIMAL_ALMARHUM_UNTUK_URUTAN = 2;

export const KUNCI_PER_KELOMPOK: Partial<Record<Kelompok, KunciAhliWaris[]>> = {
  kakekNenek: ['KAKEK', 'NENEK_DARI_AYAH', 'NENEK_DARI_IBU'],
  saudara: ['SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU'],
  jauh: ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK', 'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'],
};

export function daftarBagian(kasus: Kasus): Bagian[] {
  const { idPewaris } = kasus.graf;
  const daftar: Bagian[] = [...bagianPewaris(kasus, idPewaris)];
  for (const idAlmarhum of kasus.urutanWafat) {
    // Cabang: orang yang wafat sesudah pewaris, sebelum harta dibagi (spec 5.2).
    const istriPewaris = pasanganDari(kasus, idPewaris).includes(idAlmarhum);
    const jenis: JenisBagian[] = istriPewaris ? ['anakBersama', 'orangTua', 'halLain'] : ['pasangan', 'anak', 'halLain'];
    daftar.push(...jenis.map(j => buatBagian(j, idAlmarhum)));
  }
  if (kasus.urutanWafat.length >= MINIMAL_ALMARHUM_UNTUK_URUTAN) daftar.push(buatBagian('urutan', idPewaris));
  daftar.push(buatBagian('kamu', idPewaris));
  return daftar.flatMap(bagian => (bagian.jenis === 'anak' ? [bagian, ...bagianCucu(kasus, bagian.milik)] : [bagian]));
}

/** Anak `milik` yang wafat sebelum harta dibagi dan bukan bagian dari urutan; anaknya (cucu) hanya ditanya bila berpengaruh. */
export function anakWafatSebelum(kasus: Kasus, milik: IdOrang): IdOrang[] {
  const diUrutan = new Set(kasus.urutanWafat);
  const bersamaPewaris = new Set(kasus.gharqa?.anggota ?? []);
  return anggotaBagian(kasus, buatBagian('anak', milik))
    .filter(id => kasus.graf.orang[id]?.statusHidup === 'wafat' && !diUrutan.has(id) && !bersamaPewaris.has(id));
}

/** Bagian anak dari tiap anak yang wafat sebelum: tampil bila sudah berisi, sudah dijawab, atau engine menyatakan cucu berpengaruh. */
function bagianCucu(kasus: Kasus, milik: IdOrang): Bagian[] {
  return anakWafatSebelum(kasus, milik).flatMap(id => {
    const bagian = buatBagian('anak', id);
    const tampil = anggotaBagian(kasus, bagian).length > 0 || sudahDijawab(kasus, id, 'anak')
      || posisiPerluDitanya(kasus, id, 'ANAK_LK') || posisiPerluDitanya(kasus, id, 'ANAK_PR');
    return tampil ? [bagian, ...bagianCucu(kasus, id)] : [];
  });
}

export function anggotaBagian(kasus: Kasus, bagian: Bagian): IdOrang[] {
  const { graf } = kasus;
  const anakDari = (idOrangTua: IdOrang) => Object.values(graf.orang)
    .filter(orang => !orang.penghubung && (orang.idAyah === idOrangTua || orang.idIbu === idOrangTua));
  switch (bagian.jenis) {
    case 'pasangan': return pasanganDari(kasus, bagian.milik).filter(id => adalahOrangNyata(kasus, id));
    case 'anak': return anakDari(bagian.milik).map(orang => orang.id);
    // Anak pewaris bersama pemilik cabang; anak pewaris dari pasangan lain bukan anggota cabang ini.
    case 'anakBersama': return anakDari(graf.idPewaris)
      .filter(orang => orang.idAyah === bagian.milik || orang.idIbu === bagian.milik).map(orang => orang.id);
    case 'orangTua': return [graf.orang[bagian.milik]?.idAyah, graf.orang[bagian.milik]?.idIbu]
      .filter((id): id is IdOrang => adalahOrangNyata(kasus, id));
    case 'kakekNenek': case 'saudara': case 'jauh': {
      const isian = hitungIsian(graf, bagian.milik);
      return (KUNCI_PER_KELOMPOK[bagian.jenis] ?? []).flatMap(kunci => isian[kunci] ?? []).filter(id => adalahOrangNyata(kasus, id));
    }
    case 'halLain': case 'urutan': case 'kamu': return [];
  }
}

export function bagianLengkap(kasus: Kasus, bagian: Bagian): boolean {
  if (bagian.jenis === 'kamu') return kasus.saya !== undefined;
  if (bagian.jenis === 'urutan') return pertanyaanUrutanBerikut(kasus) === null;
  if (!sudahDijawab(kasus, bagian.milik, bagian.jenis)) return false;
  const belumDiisi = new Set(kasus.belumDiisi ?? []);
  return anggotaBagian(kasus, bagian).every(id => !belumDiisi.has(id));
}

function bagianPewaris(kasus: Kasus, idPewaris: IdOrang): Bagian[] {
  const { orang } = kasus.graf;
  const perluDitanya = (kunci: KunciAhliWaris) => posisiPerluDitanya(kasus, idPewaris, kunci);
  // Sudah berisi atau sudah dijawab selalu tampil; selain itu menunggu uji hipotetis.
  const tampil = (jenis: Kelompok, berpengaruh: () => boolean) =>
    anggotaBagian(kasus, buatBagian(jenis, idPewaris)).length > 0 || sudahDijawab(kasus, idPewaris, jenis) || berpengaruh();
  // hitungIsian hanya memuat orang hidup, jadi orang tua yang wafat dibaca dari graf.
  const sudahWafat = (id: IdOrang | undefined) => !!id && orang[id]?.statusHidup === 'wafat';
  const ayahWafat = sudahWafat(orang[idPewaris]?.idAyah);
  const ibuWafat = sudahWafat(orang[idPewaris]?.idIbu);
  const anakDijawab = sudahDijawab(kasus, idPewaris, 'anak');

  const daftar: Bagian[] = [buatBagian('pasangan', idPewaris), buatBagian('anak', idPewaris), buatBagian('orangTua', idPewaris)];
  if (tampil('kakekNenek', () => (ayahWafat && perluDitanya('KAKEK'))
    || (ibuWafat && (perluDitanya('NENEK_DARI_IBU') || perluDitanya('NENEK_DARI_AYAH'))))) daftar.push(buatBagian('kakekNenek', idPewaris));
  const saudaraTampil = tampil('saudara', () => anakDijawab && perluDitanya('SAUDARA_KANDUNG'));
  if (saudaraTampil) daftar.push(buatBagian('saudara', idPewaris));
  const saudaraSudahDilewati = !saudaraTampil || sudahDijawab(kasus, idPewaris, 'saudara');
  if (tampil('jauh', () => anakDijawab && saudaraSudahDilewati && perluDitanya('PAMAN_KANDUNG'))) daftar.push(buatBagian('jauh', idPewaris));
  daftar.push(buatBagian('halLain', idPewaris));
  return daftar;
}

/** Bagian lintas-cabang (`urutan`, `kamu`) hanya satu per kasus, jadi id-nya tanpa pemilik. */
const buatBagian = (jenis: JenisBagian, milik: IdOrang): Bagian =>
  ({ id: jenis === 'urutan' || jenis === 'kamu' ? jenis : `${jenis}:${milik}`, milik, jenis });
const sudahDijawab = (kasus: Kasus, milik: IdOrang, jenis: Kelompok) => !!kasus.kelompokDijawab?.[milik]?.includes(jenis);
/** Bagian lintas-cabang (urutan, kamu) punya aturan jawab sendiri, jadi dianggap belum dijawab di sini. */
export const bagianDijawab = (kasus: Kasus, bagian: Bagian): boolean =>
  bagian.jenis !== 'urutan' && bagian.jenis !== 'kamu' && sudahDijawab(kasus, bagian.milik, bagian.jenis);
const adalahOrangNyata = (kasus: Kasus, id: IdOrang | undefined): id is IdOrang =>
  !!id && !!kasus.graf.orang[id] && !kasus.graf.orang[id]!.penghubung;
const pasanganDari = (kasus: Kasus, id: IdOrang) =>
  kasus.graf.pernikahan.flatMap(nikah => (nikah.idSuami === id ? [nikah.idIstri] : nikah.idIstri === id ? [nikah.idSuami] : []));

/** Bagian pertama sebuah cabang (milik ≠ pewaris): di sinilah pengantar "wafat sesudah, sebelum dibagi" tampil (spec 5.2). */
export function awalCabang(kasus: Kasus, bagian: Bagian): boolean {
  if (!kasus.urutanWafat.includes(bagian.milik) || bagian.jenis === 'urutan' || bagian.jenis === 'kamu') return false;
  return daftarBagian(kasus).find(lain => lain.milik === bagian.milik)?.id === bagian.id;
}

export interface BagianDilewati { jenis: 'saudara' | 'jauh' | 'kakekNenek' | 'anakDariWafat'; milik: IdOrang; sebab?: IdOrang }

/** Bagian yang tidak ditanyakan karena engine menyatakan tidak berpengaruh (spec 5.7); untuk Details "Kenapa … tidak ditanyakan?". */
export function bagianDilewati(kasus: Kasus): BagianDilewati[] {
  const { idPewaris, orang } = kasus.graf;
  const tampil = new Set(daftarBagian(kasus).map(bagian => bagian.id));
  const sudahWafat = (id: IdOrang | undefined) => !!id && orang[id]?.statusHidup === 'wafat';
  const orangTuaWafat = sudahWafat(orang[idPewaris]?.idAyah) || sudahWafat(orang[idPewaris]?.idIbu);
  const anakDijawab = !!kasus.kelompokDijawab?.[idPewaris]?.includes('anak');
  const dilewati: BagianDilewati[] = [];
  if (anakDijawab) {
    const saudaraTampil = tampil.has(`saudara:${idPewaris}`);
    if (!saudaraTampil) dilewati.push({ jenis: 'saudara', milik: idPewaris });
    // Kerabat jauh baru ditanya sesudah saudara; selama saudara masih menunggu jawaban, ia belum "dilewati".
    if (!tampil.has(`jauh:${idPewaris}`) && (!saudaraTampil || kasus.kelompokDijawab?.[idPewaris]?.includes('saudara'))) {
      dilewati.push({ jenis: 'jauh', milik: idPewaris });
    }
    if (orangTuaWafat && !tampil.has(`kakekNenek:${idPewaris}`)) dilewati.push({ jenis: 'kakekNenek', milik: idPewaris });
  }
  for (const bagian of daftarBagian(kasus).filter(satu => satu.jenis === 'anak')) {
    for (const id of anakWafatSebelum(kasus, bagian.milik)) {
      if (!tampil.has(`anak:${id}`)) dilewati.push({ jenis: 'anakDariWafat', milik: bagian.milik, sebab: id });
    }
  }
  return dilewati;
}
