// Tata letak pohon keluarga: graf → baris per generasi (orang tua di atas, anak di bawah, pasangan sebaris)
// dan daftar keluarga (orang tua → anak) untuk digambar sebagai garis. Fungsi murni; posisi piksel dihitung komponen.

import type { GrafKeluarga, IdOrang } from '@waris/engine';

export interface Keluarga { orangTua: IdOrang[]; anak: IdOrang[] }
/** Orang beristri/bersuami lebih dari satu: pasangannya digantung berjajar di satu rel di bawahnya (C5-1). */
export interface Rel { induk: IdOrang; pasangan: IdOrang[] }
export interface TataLetak {
  /** Baris dari generasi tertua ke termuda; urutan dalam baris = urutan kiri ke kanan. */
  baris: IdOrang[][];
  keluarga: Keluarga[];
  /** Pasangan menikah yang tidak punya anak di graf: cukup garis menikah. */
  pasanganSaja: Array<[IdOrang, IdOrang]>;
  rel: Rel[];
}

/** Satu baris generasi dibungkus rata bila melebihi batas (7 → 4+3, 12 → 6+6) supaya pohon tumbuh ke bawah, bukan ke samping. */
export const BATAS_PER_BARIS = 6;
/** Pasangan sebaris maksimum per orang bukan pewaris: dua membentuk rantai "istri lain — ayah — ibu — suami ibu". */
const MAKS_PASANGAN_SEBARIS = 2;
export function jumlahPerBaris(jumlah: number, maks: number = BATAS_PER_BARIS): number {
  return jumlah <= maks ? jumlah : Math.ceil(jumlah / Math.ceil(jumlah / maks));
}

// ponytail: urutan dalam baris memakai rata-rata posisi kerabat (heuristik), garis bisa bersilangan pada keluarga
// yang sangat bercabang; ganti dengan algoritma tata letak pohon bila kasus seperti itu sering muncul.
export function tataLetak(graf: GrafKeluarga): TataLetak {
  const generasi = hitungGenerasi(graf);
  const semuaGenerasi = [...new Set(generasi.values())].sort((a, b) => a - b);
  const barisMenurutGenerasi = new Map(semuaGenerasi.map(g => [g, [...generasi].filter(([, gen]) => gen === g).map(([id]) => id)]));

  // Pasangan = yang tercatat menikah ditambah ayah-ibu dari anak yang sama (pernikahan orang tua sering tidak dicatat, hanya tersirat dari anak).
  const pasanganDari = (id: IdOrang) => [...new Set([
    ...graf.pernikahan.flatMap(nikah => nikah.idSuami === id ? [nikah.idIstri] : nikah.idIstri === id ? [nikah.idSuami] : []),
    ...Object.values(graf.orang).flatMap(anak => anak.idAyah === id && anak.idIbu ? [anak.idIbu] : anak.idIbu === id && anak.idAyah ? [anak.idAyah] : []),
  ])].filter(idLain => graf.orang[idLain]);
  const anakDari = (id: IdOrang) => Object.values(graf.orang).filter(orang => orang.idAyah === id || orang.idIbu === id).map(orang => orang.id);
  const orangTuaDari = (id: IdOrang) => [graf.orang[id]?.idAyah, graf.orang[id]?.idIbu].filter((x): x is IdOrang => !!x);

  // Baris pewaris: kerabat lain di kiri, pewaris, lalu pasangannya di kanan.
  const barisPewaris = barisMenurutGenerasi.get(0)!;
  const pasanganPewaris = pasanganDari(graf.idPewaris).filter(id => barisPewaris.includes(id));
  const lainnya = barisPewaris.filter(id => id !== graf.idPewaris && !pasanganPewaris.includes(id));
  barisMenurutGenerasi.set(0, [...rapikanPasangan(lainnya, pasanganDari), graf.idPewaris, ...pasanganPewaris]);

  // Ke atas: tiap orang diletakkan di atas anak-anaknya.
  for (const g of semuaGenerasi.filter(g => g < 0).reverse()) {
    const bawah = barisMenurutGenerasi.get(g + 1)!;
    barisMenurutGenerasi.set(g, rapikanPasangan(urutkanMenurut(barisMenurutGenerasi.get(g)!, id => rataRataIndeks(anakDari(id), bawah), graf), pasanganDari));
  }
  // Kerabat dan pewaris diurutkan ulang di bawah orang tua masing-masing, supaya saudara sekandung, seayah, dan seibu
  // mengelompok di bawah pasangan orang tuanya dan garisnya tidak bersilangan. Pewaris paling akhir di kelompoknya; pasangannya menempel di kanannya.
  const atas = barisMenurutGenerasi.get(-1);
  if (atas) {
    const berurutan = rapikanPasangan(urutkanMenurut([...lainnya, graf.idPewaris], id => rataRataIndeks(orangTuaDari(id), atas), graf, graf.idPewaris), pasanganDari);
    berurutan.splice(berurutan.indexOf(graf.idPewaris) + 1, 0, ...pasanganPewaris);
    barisMenurutGenerasi.set(0, berurutan);
  }
  // Ke bawah: anak di bawah orang tuanya, pasangan tepat di sebelahnya.
  for (const g of semuaGenerasi.filter(g => g > 0)) {
    const atasnya = barisMenurutGenerasi.get(g - 1)!;
    barisMenurutGenerasi.set(g, rapikanPasangan(urutkanMenurut(barisMenurutGenerasi.get(g)!, id => rataRataIndeks(orangTuaDari(id), atasnya), graf), pasanganDari));
  }

  const keluargaAwal = kelompokkanKeluarga(graf, generasi);
  const { baris, rel } = turunkanPasanganGanda(semuaGenerasi.map(g => barisMenurutGenerasi.get(g)!), pasanganDari, orangTuaDari, graf.idPewaris);
  const keluarga = gabungKeluarga(keluargaAwal.map(k => gantungDiIbu(k, rel)));
  const kunciNikah = (a: IdOrang, b: IdOrang) => [a, b].sort().join('|');
  const sudahDisambung = new Set([
    ...keluargaAwal.map(k => [...k.orangTua].sort().join('|')),
    ...rel.flatMap(r => r.pasangan.map(p => kunciNikah(r.induk, p))),
  ]);
  const pasanganSaja = graf.pernikahan
    .filter(nikah => generasi.has(nikah.idSuami) && generasi.has(nikah.idIstri))
    .map((nikah): [IdOrang, IdOrang] => [nikah.idSuami, nikah.idIstri])
    .filter(pasangan => !sudahDisambung.has(kunciNikah(...pasangan)))
    .map(([suami, istri]): [IdOrang, IdOrang] => (istri === graf.idPewaris ? [istri, suami] : [suami, istri]));

  return { baris, keluarga, pasanganSaja, rel };
}

// ponytail: pasangan yang diturunkan ikut baris sisipan, jadi garis keluarga lain yang melewati baris itu bisa
// menembus kotaknya bila kebetulan tepat di jalurnya; ganti dengan penempatan koordinat bila kasus itu muncul.
/**
 * Pewaris yang beristri/bersuami lebih dari satu (atau siapa pun dengan lebih dari dua pasangan): pasangannya pindah ke baris sisipan
 * di bawahnya, anak-anaknya diurutkan mengikuti ibu/ayahnya. Leluhur dan orang lain dengan dua pasangan berjajar sebaris (rantai) di rapikanPasangan.
 */
function turunkanPasanganGanda(baris: IdOrang[][], pasanganDari: (id: IdOrang) => IdOrang[], orangTuaDari: (id: IdOrang) => IdOrang[], idPewaris: IdOrang) {
  const rel: Rel[] = [];
  const hasil: IdOrang[][] = [];
  const barisPasangan: number[] = [];
  for (const deret of baris) {
    const sebaris = (id: IdOrang) => pasanganDari(id).filter(pasangan => deret.includes(pasangan));
    // Pasangan yang sendiri beristri/bersuami banyak tidak bisa jadi gantungan (bukan pola poligami sederhana).
    const induk = deret.filter(id => (id === idPewaris ? sebaris(id).length > 1 : sebaris(id).length > MAKS_PASANGAN_SEBARIS) && sebaris(id).every(pasangan => sebaris(pasangan).length === 1));
    const relDeret = induk.map((id): Rel => ({ induk: id, pasangan: deret.filter(orang => sebaris(id).includes(orang)) }));
    rel.push(...relDeret);
    const turun = new Set(relDeret.flatMap(r => r.pasangan));
    hasil.push(deret.filter(id => !turun.has(id)));
    if (relDeret.length > 0) { barisPasangan.push(hasil.length); hasil.push(relDeret.flatMap(r => r.pasangan)); }
  }
  for (const indeks of barisPasangan) {
    const bawah = hasil[indeks + 1];
    if (!bawah) continue;
    const posisiIbu = (id: IdOrang) => orangTuaDari(id).map(orangTua => hasil[indeks]!.indexOf(orangTua)).find(i => i >= 0);
    const slot = bawah.flatMap((id, i) => (posisiIbu(id) === undefined ? [] : [i]));
    const urut = slot.map(i => bawah[i]!).sort((a, b) => posisiIbu(a)! - posisiIbu(b)!);
    slot.forEach((i, ke) => { bawah[i] = urut[ke]!; });
  }
  return { baris: hasil, rel };
}

/** Anak dari induk berpasangan banyak digantung di bawah ibu/ayah pasangan itu, bukan di titik tengah garis menikah. */
function gantungDiIbu(keluarga: Keluarga, rel: Rel[]): Keluarga {
  if (keluarga.orangTua.length !== 2) return keluarga;
  const gantungan = rel.find(r => keluarga.orangTua.includes(r.induk));
  const pasangan = gantungan && keluarga.orangTua.find(id => id !== gantungan.induk);
  return pasangan && gantungan.pasangan.includes(pasangan) ? { orangTua: [pasangan], anak: keluarga.anak } : keluarga;
}

function gabungKeluarga(daftar: Keluarga[]): Keluarga[] {
  const menurutKunci = new Map<string, Keluarga>();
  for (const k of daftar) {
    const kunci = k.orangTua.join('|');
    const ada = menurutKunci.get(kunci);
    if (ada) ada.anak.push(...k.anak); else menurutKunci.set(kunci, { orangTua: k.orangTua, anak: [...k.anak] });
  }
  return [...menurutKunci.values()];
}

/** Generasi relatif ke pewaris lewat penelusuran: orang tua −1, anak +1, pasangan sama. */
function hitungGenerasi(graf: GrafKeluarga): Map<IdOrang, number> {
  const generasi = new Map<IdOrang, number>([[graf.idPewaris, 0]]);
  const antrean = [graf.idPewaris];
  while (antrean.length > 0) {
    const id = antrean.shift()!;
    const g = generasi.get(id)!;
    const orang = graf.orang[id]!;
    const tetangga: Array<[IdOrang | undefined, number]> = [
      [orang.idAyah, g - 1], [orang.idIbu, g - 1],
      ...Object.values(graf.orang).filter(lain => lain.idAyah === id || lain.idIbu === id).map((lain): [IdOrang, number] => [lain.id, g + 1]),
      ...graf.pernikahan.flatMap((nikah): Array<[IdOrang, number]> =>
        nikah.idSuami === id ? [[nikah.idIstri, g]] : nikah.idIstri === id ? [[nikah.idSuami, g]] : []),
    ];
    for (const [idLain, gLain] of tetangga) {
      if (idLain && graf.orang[idLain] && !generasi.has(idLain)) { generasi.set(idLain, gLain); antrean.push(idLain); }
    }
  }
  return generasi;
}

function kelompokkanKeluarga(graf: GrafKeluarga, generasi: Map<IdOrang, number>): Keluarga[] {
  const menurutOrangTua = new Map<string, Keluarga>();
  for (const orang of Object.values(graf.orang)) {
    if (!generasi.has(orang.id)) continue;
    const orangTua = [orang.idAyah, orang.idIbu].filter((id): id is IdOrang => !!id && generasi.has(id));
    if (orangTua.length === 0) continue;
    const kunci = orangTua.join('|');
    const keluarga = menurutOrangTua.get(kunci) ?? { orangTua, anak: [] };
    keluarga.anak.push(orang.id);
    menurutOrangTua.set(kunci, keluarga);
  }
  return [...menurutOrangTua.values()];
}

function rataRataIndeks(daftarId: IdOrang[], baris: IdOrang[]): number {
  const indeks = daftarId.map(id => baris.indexOf(id)).filter(i => i >= 0);
  return indeks.length === 0 ? Number.MAX_SAFE_INTEGER : indeks.reduce((a, b) => a + b, 0) / indeks.length;
}

/** Urut menurut kunci; seri dipecah dengan laki-laki dulu lalu id, supaya hasilnya stabil. */
function urutkanMenurut(daftarId: IdOrang[], kunci: (id: IdOrang) => number, graf: GrafKeluarga, taruhTerakhir?: IdOrang): IdOrang[] {
  return [...daftarId].sort((a, b) => kunci(a) - kunci(b)
    || (a === taruhTerakhir ? 1 : b === taruhTerakhir ? -1 : 0)
    || (graf.orang[a]!.jenisKelamin === graf.orang[b]!.jenisKelamin ? 0 : graf.orang[a]!.jenisKelamin === 'L' ? -1 : 1)
    || a.localeCompare(b, 'en', { numeric: true }));
}

/**
 * Pasangan yang ada di baris yang sama diletakkan bersebelahan. Pasangan yang membentuk rantai lurus (A–B–C–D) dijajarkan
 * berurutan mulai dari ujung rantai yang lebih dulu muncul; yang bercabang (satu orang >2 pasangan) memakai pola pusat + pasangannya.
 */
function rapikanPasangan(baris: IdOrang[], pasanganDari: (id: IdOrang) => IdOrang[]): IdOrang[] {
  const sebaris = (id: IdOrang) => pasanganDari(id).filter(pasangan => baris.includes(pasangan));
  const hasil: IdOrang[] = [];
  for (const id of baris) {
    if (hasil.includes(id)) continue;
    const gugus = kumpulkanGugus(id, sebaris);
    const lurus = gugus.every(orang => sebaris(orang).length <= MAKS_PASANGAN_SEBARIS);
    if (!lurus) {
      hasil.push(id);
      for (const pasangan of sebaris(id)) if (!hasil.includes(pasangan)) hasil.push(pasangan);
      continue;
    }
    const ujung = baris.find(orang => gugus.includes(orang) && sebaris(orang).length <= 1) ?? id;
    for (let sekarang: IdOrang | undefined = ujung; sekarang && !hasil.includes(sekarang); sekarang = sebaris(sekarang).find(lain => !hasil.includes(lain))) hasil.push(sekarang);
  }
  return hasil;
}

function kumpulkanGugus(awal: IdOrang, tetangga: (id: IdOrang) => IdOrang[]): IdOrang[] {
  const gugus = [awal];
  for (const id of gugus) for (const lain of tetangga(id)) if (!gugus.includes(lain)) gugus.push(lain);
  return gugus;
}
