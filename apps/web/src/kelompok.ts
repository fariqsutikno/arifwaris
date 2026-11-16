// Bagian wawancara kanvas silsilah (spec 5.2): untuk tiap almarhum, kelompok keluarga yang ditanyakan berurutan.
// Menerima Kasus; menyerahkan daftar bagian, anggota tiap bagian, dan apakah bagian sudah lengkap.
// Bagian tampil bila sudah berisi, sudah dijawab, atau engine menyatakan posisinya berpengaruh (ujiHipotetis).

import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import { pertanyaanUrutanBerikut } from './antreanUrutan';
import { daftarInduk, hitungIsian } from './checklist';
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
  // Dilihat dari kakek: saudara laki-lakinya = paman ayah bagi pewaris [R03-2].
  saudaraKakek: ['SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK'],
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
  return daftar.flatMap(bagian => [bagian, ...bagianTurunan(kasus, bagian)]);
}

/** Orang wafat (bukan pewaris) yang bagian "Anak X"-nya tampil: di situ anaknya bisa ditambah langsung dari pohon. */
export const bisaTambahAnak = (kasus: Kasus, id: IdOrang): boolean =>
  id !== kasus.graf.idPewaris && kasus.graf.orang[id]?.statusHidup === 'wafat'
  && daftarBagian(kasus).some(bagian => bagian.jenis === 'anak' && bagian.milik === id);

/** Bagian yang memuat orang itu (tujuan "Lihat di Keluarga"); `anakBersama` tidak dihitung karena orang yang sama ada di bagian anak. */
export const bagianDariOrang = (kasus: Kasus, id: IdOrang): Bagian | null =>
  daftarBagian(kasus).find(bagian => bagian.jenis !== 'anakBersama' && anggotaBagian(kasus, bagian).includes(id)) ?? null;

/** Wafat sebelum harta dibagi dan bukan bagian dari urutan wafat; anaknya hanya ditanya bila berpengaruh. */
function wafatSebelum(kasus: Kasus, ids: IdOrang[]): IdOrang[] {
  const diUrutan = new Set(kasus.urutanWafat);
  const bersamaPewaris = new Set(kasus.gharqa?.anggota ?? []);
  return ids.filter(id => kasus.graf.orang[id]?.statusHidup === 'wafat' && !diUrutan.has(id) && !bersamaPewaris.has(id));
}

/** Anak `milik` yang wafat sebelum harta dibagi. */
export const anakWafatSebelum = (kasus: Kasus, milik: IdOrang): IdOrang[] =>
  wafatSebelum(kasus, anggotaBagian(kasus, buatBagian('anak', milik)));

/** Orang wafat yang anaknya ditanya di bawah `bagian`: anak (cucu) atau kerabat jauh (keponakan, paman, sepupu). */
function wafatDi(kasus: Kasus, bagian: Bagian): IdOrang[] {
  if (bagian.jenis === 'anak') return anakWafatSebelum(kasus, bagian.milik);
  if (bagian.jenis === 'jauh') return wafatSebelum(kasus, jauhLangsung(kasus, bagian.milik));
  if (bagian.jenis === 'saudaraKakek') return wafatSebelum(kasus, saudaraKakek(kasus, bagian.milik));
  return [];
}

/** Bagian yang menyusul sesudah `bagian`: saudara kakek (di bawah kakek-nenek) dan Anak X untuk tiap orang wafat di dalamnya. */
function bagianTurunan(kasus: Kasus, bagian: Bagian): Bagian[] {
  const saudara = bagian.jenis === 'kakekNenek' ? bagianSaudaraKakek(kasus, bagian.milik) : [];
  return [...saudara.flatMap(satu => [satu, ...bagianTurunan(kasus, satu)]), ...bagianAnakDariWafat(kasus, wafatDi(kasus, bagian))];
}

/** Kakek (dari ayah) yang wafat; saudaranya masuk lewat dia, bukan lewat baris paman (spec: paman ayah masuk lewat kakek). */
const kakekWafat = (kasus: Kasus, milik: IdOrang): IdOrang[] =>
  orangDenganKunci(kasus, milik, 'KAKEK').filter(id => kasus.graf.orang[id]!.statusHidup === 'wafat');

/** Saudara laki-laki (kandung/sebapak) `kakek`, hidup maupun wafat. */
const saudaraKakek = (kasus: Kasus, kakek: IdOrang): IdOrang[] =>
  KUNCI_PER_KELOMPOK.saudaraKakek!.flatMap(kunci => orangDenganKunci(kasus, kakek, kunci));

/** Satu bagian per kakek wafat: tampil bila sudah berisi, sudah dijawab, atau engine menyatakan saudaranya berpengaruh. */
function bagianSaudaraKakek(kasus: Kasus, milik: IdOrang): Bagian[] {
  return kakekWafat(kasus, milik).map(kakek => buatBagian('saudaraKakek', kakek)).filter(bagian =>
    anggotaBagian(kasus, bagian).length > 0 || sudahDijawab(kasus, bagian.milik, 'saudaraKakek')
    || KUNCI_PER_KELOMPOK.saudaraKakek!.some(kunci => posisiPerluDitanya(kasus, bagian.milik, kunci)));
}

/** Bagian anak dari tiap orang wafat itu: tampil bila sudah berisi, sudah dijawab, atau engine menyatakan anaknya berpengaruh; berulang ke bawah. */
function bagianAnakDariWafat(kasus: Kasus, wafat: IdOrang[]): Bagian[] {
  return wafat.flatMap(id => {
    const bagian = buatBagian('anak', id);
    const tampil = anggotaBagian(kasus, bagian).length > 0 || sudahDijawab(kasus, id, 'anak')
      || posisiPerluDitanya(kasus, id, 'ANAK_LK') || posisiPerluDitanya(kasus, id, 'ANAK_PR');
    return tampil ? [bagian, ...bagianAnakDariWafat(kasus, anakWafatSebelum(kasus, id))] : [];
  });
}

/** Kerabat jauh `milik` (hidup atau wafat) yang bukan anak dari kerabat jauh lain: anak mereka tampil di bagian "Anak X", bukan di baris kerabat jauh. */
export function jauhLangsung(kasus: Kasus, milik: IdOrang): IdOrang[] {
  const semua = KUNCI_PER_KELOMPOK.jauh!.flatMap(kunci => orangDenganKunci(kasus, milik, kunci));
  const orang = kasus.graf.orang;
  const lewatKakek = kakekWafat(kasus, milik).flatMap(kakek => saudaraKakek(kasus, kakek));
  return semua.filter(id => !lewatKakek.includes(id) && ![orang[id]?.idAyah, orang[id]?.idIbu].some(induk => induk !== undefined && semua.includes(induk)));
}

/** Orang di baris `kunci` bagian itu; di kerabat jauh hanya yang langsung. */
export const orangDiBaris = (kasus: Kasus, bagian: Bagian, kunci: KunciAhliWaris): IdOrang[] => {
  const semua = orangDenganKunci(kasus, bagian.milik, kunci);
  if (bagian.jenis !== 'jauh') return semua;
  const langsung = jauhLangsung(kasus, bagian.milik);
  return semua.filter(id => langsung.includes(id));
};

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
    case 'jauh': return jauhLangsung(kasus, bagian.milik).filter(id => graf.orang[id]!.statusHidup !== 'wafat');
    case 'saudaraKakek': return saudaraKakek(kasus, bagian.milik).filter(id => graf.orang[id]!.statusHidup !== 'wafat');
    case 'kakekNenek': case 'saudara': {
      const isian = hitungIsian(graf, bagian.milik);
      return (KUNCI_PER_KELOMPOK[bagian.jenis] ?? []).flatMap(kunci => isian[kunci] ?? []).filter(id => adalahOrangNyata(kasus, id));
    }
    case 'halLain': case 'urutan': case 'kamu': return [];
  }
}

/** Peran yang dihitung di bagian itu, menurut jenis kelamin pemiliknya. */
export function kunciBagian(kasus: Kasus, bagian: Bagian): KunciAhliWaris[] {
  switch (bagian.jenis) {
    case 'pasangan': return [kasus.graf.orang[bagian.milik]?.jenisKelamin === 'L' ? 'ISTRI' : 'SUAMI'];
    case 'anak': case 'anakBersama': return ['ANAK_LK', 'ANAK_PR'];
    case 'orangTua': return ['AYAH', 'IBU'];
    case 'kakekNenek': case 'saudara': case 'jauh': case 'saudaraKakek': return KUNCI_PER_KELOMPOK[bagian.jenis] ?? [];
    case 'halLain': case 'urutan': case 'kamu': return [];
  }
}

/** Baris tetap yang tampil: orang tua selalu; kakek-nenek hanya posisi yang sudah terisi atau yang berpengaruh (engine). */
export function slotTetap(kasus: Kasus, bagian: Bagian): KunciAhliWaris[] {
  const kunci = kunciBagian(kasus, bagian);
  if (bagian.jenis !== 'kakekNenek') return kunci;
  return kunci.filter(satu => orangDenganKunci(kasus, bagian.milik, satu).length > 0 || posisiPerluDitanya(kasus, bagian.milik, satu));
}

/** Semua orang (wafat dan penghubung ikut) yang berperan `kunci` bagi `milik`. */
export const orangDenganKunci = (kasus: Kasus, milik: IdOrang, kunci: KunciAhliWaris): IdOrang[] =>
  daftarInduk(kasus.graf, milik, kunci).filter(id => !kasus.graf.orang[id]!.penghubung);

/** Baris tetap (orang tua, kakek-nenek) yang harus ditanya tetapi belum punya orang: bagiannya belum bisa dianggap dijawab. */
export const adaSlotKosong = (kasus: Kasus, bagian: Bagian): boolean =>
  (bagian.jenis === 'orangTua' || bagian.jenis === 'kakekNenek')
  && slotTetap(kasus, bagian).some(kunci => orangDenganKunci(kasus, bagian.milik, kunci).length === 0);

/** Yang membuat bagian belum lengkap: pertanyaannya sendiri, baris tetap yang kosong, atau orang yang keadaannya belum rampung. Satu sumber untuk status dan pesan. */
export type Kekurangan = { jenis: 'jawaban' } | { jenis: 'slot'; kunci: KunciAhliWaris } | { jenis: 'orang'; id: IdOrang };

export function kekuranganBagian(kasus: Kasus, bagian: Bagian): Kekurangan[] {
  if (bagian.jenis === 'kamu') return kasus.saya === undefined ? [{ jenis: 'jawaban' }] : [];
  if (bagian.jenis === 'urutan') return pertanyaanUrutanBerikut(kasus) === null ? [] : [{ jenis: 'jawaban' }];
  const belumDiisi = new Set(kasus.belumDiisi ?? []);
  const slotKosong = bagian.jenis === 'orangTua' || bagian.jenis === 'kakekNenek'
    ? slotTetap(kasus, bagian).filter(kunci => orangDenganKunci(kasus, bagian.milik, kunci).length === 0) : [];
  return [
    // Baris tetap dijawab lewat barisnya sendiri; selama ada yang kosong, itulah yang disebut.
    ...(sudahDijawab(kasus, bagian.milik, bagian.jenis) || slotKosong.length > 0 ? [] : [{ jenis: 'jawaban' } as const]),
    ...slotKosong.map(kunci => ({ jenis: 'slot', kunci }) as const),
    ...anggotaBagian(kasus, bagian).filter(id => belumDiisi.has(id)).map(id => ({ jenis: 'orang', id }) as const),
  ];
}

export const bagianLengkap = (kasus: Kasus, bagian: Bagian): boolean => kekuranganBagian(kasus, bagian).length === 0;

function bagianPewaris(kasus: Kasus, idPewaris: IdOrang): Bagian[] {
  const perluDitanya = (kunci: KunciAhliWaris) => posisiPerluDitanya(kasus, idPewaris, kunci);
  // Sudah berisi atau sudah dijawab selalu tampil; selain itu menunggu uji hipotetis.
  const tampil = (jenis: Kelompok, berpengaruh: () => boolean) =>
    anggotaBagian(kasus, buatBagian(jenis, idPewaris)).length > 0 || sudahDijawab(kasus, idPewaris, jenis) || berpengaruh();
  const anakDijawab = sudahDijawab(kasus, idPewaris, 'anak');

  const daftar: Bagian[] = [buatBagian('pasangan', idPewaris), buatBagian('anak', idPewaris), buatBagian('orangTua', idPewaris)];
  // Menunggu keadaan Ayah dan Ibu dijawab; sesudahnya engine yang menentukan (Ayah wafat, belum tahu, atau hilang sama saja bagi uji).
  const orangTuaSudahDijawab = sudahDijawab(kasus, idPewaris, 'orangTua');
  if (tampil('kakekNenek', () => orangTuaSudahDijawab && KUNCI_PER_KELOMPOK.kakekNenek!.some(perluDitanya))) daftar.push(buatBagian('kakekNenek', idPewaris));
  const saudaraTampil = tampil('saudara', () => anakDijawab && perluDitanya('SAUDARA_KANDUNG'));
  if (saudaraTampil) daftar.push(buatBagian('saudara', idPewaris));
  const saudaraSudahDilewati = !saudaraTampil || sudahDijawab(kasus, idPewaris, 'saudara');
  if (tampil('jauh', () => anakDijawab && saudaraSudahDilewati && perluDitanya('PAMAN_KANDUNG'))) daftar.push(buatBagian('jauh', idPewaris));
  daftar.push(buatBagian('halLain', idPewaris));
  return daftar;
}

/** Bagian lintas-cabang (`urutan`, `kamu`) hanya satu per kasus, jadi id-nya tanpa pemilik. */
export const buatBagian = (jenis: JenisBagian, milik: IdOrang): Bagian =>
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
  const tidakHidup = (id: IdOrang | undefined) => !!id && !!orang[id]?.statusHidup && orang[id]!.statusHidup !== 'hidup';
  const orangTuaTidakHidup = tidakHidup(orang[idPewaris]?.idAyah) || tidakHidup(orang[idPewaris]?.idIbu);
  const anakDijawab = !!kasus.kelompokDijawab?.[idPewaris]?.includes('anak');
  const dilewati: BagianDilewati[] = [];
  if (anakDijawab) {
    const saudaraTampil = tampil.has(`saudara:${idPewaris}`);
    if (!saudaraTampil) dilewati.push({ jenis: 'saudara', milik: idPewaris });
    // Kerabat jauh baru ditanya sesudah saudara; selama saudara masih menunggu jawaban, ia belum "dilewati".
    if (!tampil.has(`jauh:${idPewaris}`) && (!saudaraTampil || kasus.kelompokDijawab?.[idPewaris]?.includes('saudara'))) {
      dilewati.push({ jenis: 'jauh', milik: idPewaris });
    }
    if (orangTuaTidakHidup && sudahDijawab(kasus, idPewaris, 'orangTua') && !tampil.has(`kakekNenek:${idPewaris}`)) dilewati.push({ jenis: 'kakekNenek', milik: idPewaris });
  }
  for (const bagian of daftarBagian(kasus)) {
    for (const id of wafatDi(kasus, bagian)) {
      if (!tampil.has(`anak:${id}`)) dilewati.push({ jenis: 'anakDariWafat', milik: bagian.milik, sebab: id });
    }
  }
  return dilewati;
}
