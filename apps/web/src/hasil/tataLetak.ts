// Tata letak pohon keluarga: graf → baris per generasi (orang tua di atas, anak di bawah, pasangan sebaris)
// dan daftar keluarga (orang tua → anak) untuk digambar sebagai garis. Fungsi murni; posisi piksel dihitung komponen.

import type { GrafKeluarga, IdOrang } from '@waris/engine';

export interface Keluarga { orangTua: IdOrang[]; anak: IdOrang[] }
export interface TataLetak {
  /** Baris dari generasi tertua ke termuda; urutan dalam baris = urutan kiri ke kanan. */
  baris: IdOrang[][];
  keluarga: Keluarga[];
  /** Pasangan menikah yang tidak punya anak di graf: cukup garis menikah. */
  pasanganSaja: Array<[IdOrang, IdOrang]>;
}

/** Satu baris generasi dibungkus rata bila melebihi batas (7 → 4+3, 12 → 6+6) supaya pohon tumbuh ke bawah, bukan ke samping. */
export const BATAS_PER_BARIS = 6;
export function jumlahPerBaris(jumlah: number, maks: number = BATAS_PER_BARIS): number {
  return jumlah <= maks ? jumlah : Math.ceil(jumlah / Math.ceil(jumlah / maks));
}

// Urutan awal memakai rata-rata posisi kerabat; sisa garis bersilangan dikurangi oleh kurangiSilang (spec 5.5, P5).
export function tataLetak(graf: GrafKeluarga): TataLetak {
  const generasi = hitungGenerasi(graf);
  const semuaGenerasi = [...new Set(generasi.values())].sort((a, b) => a - b);
  const barisMenurutGenerasi = new Map(semuaGenerasi.map(g => [g, [...generasi].filter(([, gen]) => gen === g).map(([id]) => id)]));

  const pasanganDari = (id: IdOrang) => graf.pernikahan.flatMap(nikah =>
    nikah.idSuami === id ? [nikah.idIstri] : nikah.idIstri === id ? [nikah.idSuami] : []);
  const anakDari = (id: IdOrang) => Object.values(graf.orang).filter(orang => orang.idAyah === id || orang.idIbu === id).map(orang => orang.id);
  const orangTuaDari = (id: IdOrang) => [graf.orang[id]?.idAyah, graf.orang[id]?.idIbu].filter((x): x is IdOrang => !!x);

  // Baris pewaris: kerabat lain di kiri, pewaris, lalu pasangannya di kanan.
  const barisPewaris = barisMenurutGenerasi.get(0)!;
  const pasanganPewaris = pasanganDari(graf.idPewaris).filter(id => barisPewaris.includes(id));
  const lainnya = barisPewaris.filter(id => id !== graf.idPewaris && !pasanganPewaris.includes(id));
  barisMenurutGenerasi.set(0, [...lainnya, graf.idPewaris, ...pasanganPewaris]);

  // Ke atas: tiap orang diletakkan di atas anak-anaknya.
  for (const g of semuaGenerasi.filter(g => g < 0).reverse()) {
    const bawah = barisMenurutGenerasi.get(g + 1)!;
    barisMenurutGenerasi.set(g, rapikanPasangan(urutkanMenurut(barisMenurutGenerasi.get(g)!, id => rataRataIndeks(anakDari(id), bawah), graf), pasanganDari));
  }
  // Kerabat di baris pewaris diurutkan ulang di bawah orang tua masing-masing.
  const atas = barisMenurutGenerasi.get(-1);
  if (atas) barisMenurutGenerasi.set(0, [...urutkanMenurut(lainnya, id => rataRataIndeks(orangTuaDari(id), atas), graf), graf.idPewaris, ...pasanganPewaris]);
  // Ke bawah: anak di bawah orang tuanya, pasangan tepat di sebelahnya.
  for (const g of semuaGenerasi.filter(g => g > 0)) {
    const atasnya = barisMenurutGenerasi.get(g - 1)!;
    barisMenurutGenerasi.set(g, rapikanPasangan(urutkanMenurut(barisMenurutGenerasi.get(g)!, id => rataRataIndeks(orangTuaDari(id), atasnya), graf), pasanganDari));
  }

  const keluarga = kelompokkanKeluarga(graf, generasi);
  const barisUrut = semuaGenerasi.map(g => barisMenurutGenerasi.get(g)!);
  const barisRapi = kurangiSilang(barisUrut, keluarga, pasanganDari);
  const sudahDisambung = new Set(keluarga.map(k => [...k.orangTua].sort().join('|')));
  const pasanganSaja = graf.pernikahan
    .filter(nikah => generasi.has(nikah.idSuami) && generasi.has(nikah.idIstri))
    .map((nikah): [IdOrang, IdOrang] => [nikah.idSuami, nikah.idIstri])
    .filter(pasangan => !sudahDisambung.has([...pasangan].sort().join('|')))
    .map(([suami, istri]): [IdOrang, IdOrang] => (istri === graf.idPewaris ? [istri, suami] : [suami, istri]));

  return { baris: barisRapi, keluarga, pasanganSaja };
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
function urutkanMenurut(daftarId: IdOrang[], kunci: (id: IdOrang) => number, graf: GrafKeluarga): IdOrang[] {
  return [...daftarId].sort((a, b) => kunci(a) - kunci(b)
    || (graf.orang[a]!.jenisKelamin === graf.orang[b]!.jenisKelamin ? 0 : graf.orang[a]!.jenisKelamin === 'L' ? -1 : 1)
    || a.localeCompare(b, 'en', { numeric: true }));
}

/** Pasangan yang ada di baris yang sama diletakkan bersebelahan. */
function rapikanPasangan(baris: IdOrang[], pasanganDari: (id: IdOrang) => IdOrang[]): IdOrang[] {
  const hasil: IdOrang[] = [];
  for (const id of baris) {
    if (hasil.includes(id)) continue;
    hasil.push(id);
    for (const pasangan of pasanganDari(id)) if (baris.includes(pasangan) && !hasil.includes(pasangan)) hasil.push(pasangan);
  }
  return hasil;
}

const MAKS_PUTARAN_SILANG = 24; // spec 5.5 langkah 3

/** Jumlah pasangan garis orang tua → anak yang bersilangan; garis hanya dibandingkan bila berangkat dari baris yang sama. */
function hitungSilang(baris: IdOrang[][], keluarga: Keluarga[]): number {
  const posisi = new Map<IdOrang, { baris: number; kolom: number }>();
  baris.forEach((isi, indeksBaris) => isi.forEach((id, kolom) => posisi.set(id, { baris: indeksBaris, kolom })));
  const garis: Array<{ barisAtas: number; atas: number; bawah: number }> = [];
  for (const { orangTua, anak } of keluarga) {
    const letakOrangTua = orangTua.map(id => posisi.get(id)!);
    const tengah = letakOrangTua.reduce((jumlah, letak) => jumlah + letak.kolom, 0) / letakOrangTua.length;
    for (const id of anak) {
      const letak = posisi.get(id)!;
      if (letak.baris > letakOrangTua[0]!.baris) garis.push({ barisAtas: letakOrangTua[0]!.baris, atas: tengah, bawah: letak.kolom });
    }
  }
  let silang = 0;
  for (let i = 0; i < garis.length; i++) {
    for (let j = i + 1; j < garis.length; j++) {
      const a = garis[i]!, b = garis[j]!;
      if (a.barisAtas === b.barisAtas && (a.atas - b.atas) * (a.bawah - b.bawah) < 0) silang++;
    }
  }
  return silang;
}

/** Blok = pasangan (atau satu suami dengan istri-istrinya) yang bersebelahan; blok tidak dipisah saat ditukar. */
function bagiBlok(baris: IdOrang[], menikah: (a: IdOrang, b: IdOrang) => boolean): IdOrang[][] {
  const blok: IdOrang[][] = [];
  for (const id of baris) {
    const terakhir = blok[blok.length - 1];
    if (terakhir && terakhir.some(lain => menikah(lain, id))) terakhir.push(id); else blok.push([id]);
  }
  return blok;
}

/** Tukar blok bertetangga dan balik blok pasangan (dua orang) selama jumlah silang tidak naik; susunan yang sudah dicoba tidak diulang, jadi deterministik dan berhenti. Urutan awal dipertahankan bila tak ada perbaikan. */
function kurangiSilang(baris: IdOrang[][], keluarga: Keluarga[], pasanganDari: (id: IdOrang) => IdOrang[]): IdOrang[][] {
  const menikah = (a: IdOrang, b: IdOrang) => pasanganDari(a).includes(b);
  let terbaik = baris;
  let silangTerbaik = hitungSilang(terbaik, keluarga);
  const sudahDicoba = new Set([JSON.stringify(terbaik)]);
  for (let putaran = 0; putaran < MAKS_PUTARAN_SILANG && silangTerbaik > 0; putaran++) {
    let membaik = false;
    for (let b = 0; b < terbaik.length && silangTerbaik > 0; b++) {
      const blok = bagiBlok(terbaik[b]!, menikah);
      const calon: IdOrang[][][] = [];
      for (let i = 0; i < blok.length; i++) {
        if (i + 1 < blok.length) calon.push(blok.map((x, k) => (k === i ? blok[i + 1]! : k === i + 1 ? blok[i]! : x)));
        if (blok[i]!.length === 2) calon.push(blok.map((x, k) => (k === i ? [...x].reverse() : x)));
      }
      for (const susunan of calon) {
        const percobaan = terbaik.map((isi, k) => (k === b ? susunan.flat() : isi));
        const kunci = JSON.stringify(percobaan);
        if (sudahDicoba.has(kunci)) continue;
        sudahDicoba.add(kunci);
        const silang = hitungSilang(percobaan, keluarga);
        if (silang <= silangTerbaik) { terbaik = percobaan; silangTerbaik = silang; membaik = true; break; }
      }
    }
    if (!membaik) break;
  }
  return terbaik;
}
