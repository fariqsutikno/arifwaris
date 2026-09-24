// Kasus = satu-satunya state yang disimpan (localStorage & file JSON).
// Menerima isian wizard; menyerahkan Kasus ke jalankan.ts. File import adalah batas kepercayaan:
// bentuknya divalidasi penuh sebelum dipakai, bigint disimpan sebagai string digit.

import type { GrafKeluarga, IdOrang, InputTirkah, Orang, Pernikahan } from '@waris/engine';

export const SATUAN_PEMBULATAN = [1n, 100n, 1000n] as const;
const KUNCI_PENYIMPANAN = 'arif-waris:kasus';
const ID_PEWARIS = 'PEWARIS';

export interface Kasus {
  versi: 1;
  graf: GrafKeluarga;
  tirkah: InputTirkah;
  satuanPembulatan: bigint;
  /** Kosong = bukan munasakhat. Urut waktu wafat, setelah pewaris. */
  urutanWafat: IdOrang[];
}

export function kasusBaru(jenisKelaminPewaris: 'L' | 'P'): Kasus {
  return {
    versi: 1,
    graf: {
      idPewaris: ID_PEWARIS,
      orang: { [ID_PEWARIS]: { id: ID_PEWARIS, jenisKelamin: jenisKelaminPewaris, statusHidup: 'wafat', agama: 'islam' } },
      pernikahan: [],
    },
    tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n },
    satuanPembulatan: 1n,
    urutanWafat: [],
  };
}

export const keJson = (kasus: Kasus): string =>
  JSON.stringify(kasus, (_kunci, nilai) => (typeof nilai === 'bigint' ? nilai.toString() : nilai));

export function dariJson(teks: string): { berhasil: true; kasus: Kasus } | { berhasil: false; pesan: string } {
  try {
    return { berhasil: true, kasus: bacaKasus(JSON.parse(teks)) };
  } catch (galat) {
    return { berhasil: false, pesan: galat instanceof Error ? galat.message : 'File tidak bisa dibaca.' };
  }
}

/** Buang orang yang tidak lagi ada/hidup dari urutan wafat (mis. setelah dikurangi di checklist). */
export function rapikanUrutanWafat(kasus: Kasus): Kasus {
  const urutanWafat = kasus.urutanWafat.filter(id => {
    const orang = kasus.graf.orang[id];
    return orang && !orang.penghubung && orang.statusHidup !== 'wafat';
  });
  return urutanWafat.length === kasus.urutanWafat.length ? kasus : { ...kasus, urutanWafat };
}

export function simpanLokal(kasus: Kasus | null): void {
  try {
    if (kasus) localStorage.setItem(KUNCI_PENYIMPANAN, keJson(kasus));
    else localStorage.removeItem(KUNCI_PENYIMPANAN);
  } catch {
    // Mode privat / penyimpanan penuh: aplikasi tetap jalan tanpa autosave.
  }
}

export function muatLokal(): Kasus | null {
  try {
    const teks = localStorage.getItem(KUNCI_PENYIMPANAN);
    if (!teks) return null;
    const hasil = dariJson(teks);
    return hasil.berhasil ? hasil.kasus : null;
  } catch {
    return null;
  }
}

// ─── Validasi file ────────────────────────────────────────────────────────────

function bacaKasus(data: unknown): Kasus {
  const objek = wajibObjek(data, 'kasus');
  if (objek.versi !== 1) throw new Error('Versi file tidak dikenal. Pakai file dari Arif Waris versi ini.');
  const graf = bacaGraf(objek.graf);
  const tirkahMentah = wajibObjek(objek.tirkah, 'tirkah');
  const tirkah: InputTirkah = {
    kotor: bacaUang(tirkahMentah.kotor, 'harta'),
    tajhiz: bacaUang(tirkahMentah.tajhiz, 'biaya jenazah'),
    hutang: bacaUang(tirkahMentah.hutang, 'hutang'),
    wasiat: bacaUang(tirkahMentah.wasiat, 'wasiat'),
  };
  const satuanPembulatan = bacaUang(objek.satuanPembulatan, 'satuan pembulatan');
  if (!SATUAN_PEMBULATAN.includes(satuanPembulatan as 1n)) throw new Error('Satuan pembulatan harus 1, 100, atau 1000.');
  if (!Array.isArray(objek.urutanWafat) || !objek.urutanWafat.every(id => typeof id === 'string' && graf.orang[id])) {
    throw new Error('Daftar yang wafat berisi orang yang tidak ada.');
  }
  return { versi: 1, graf, tirkah, satuanPembulatan, urutanWafat: objek.urutanWafat as IdOrang[] };
}

function bacaGraf(data: unknown): GrafKeluarga {
  const objek = wajibObjek(data, 'graf');
  const orangMentah = wajibObjek(objek.orang, 'daftar orang');
  const orang: Record<IdOrang, Orang> = {};
  for (const [id, isi] of Object.entries(orangMentah)) orang[id] = bacaOrang(id, isi);
  for (const orangIni of Object.values(orang)) {
    for (const idOrangTua of [orangIni.idAyah, orangIni.idIbu]) {
      if (idOrangTua !== undefined && !orang[idOrangTua]) throw new Error(`Orang tua ${idOrangTua} tidak ada di file.`);
    }
  }
  if (typeof objek.idPewaris !== 'string' || !orang[objek.idPewaris]) throw new Error('Pewaris tidak ada di file.');
  if (!Array.isArray(objek.pernikahan)) throw new Error('Data pernikahan rusak.');
  const pernikahan = objek.pernikahan.map(isi => bacaPernikahan(isi, orang));
  return { idPewaris: objek.idPewaris, orang, pernikahan };
}

function bacaOrang(id: string, data: unknown): Orang {
  const objek = wajibObjek(data, `orang ${id}`);
  const salah = () => new Error(`Data orang ${id} rusak.`);
  if (objek.id !== id) throw salah();
  if (objek.jenisKelamin !== 'L' && objek.jenisKelamin !== 'P') throw salah();
  if (!['hidup', 'wafat', 'tidakDiketahui'].includes(objek.statusHidup as string)) throw salah();
  if (!['islam', 'nonIslam', 'tidakDiketahui'].includes(objek.agama as string)) throw salah();
  for (const kunci of ['idAyah', 'idIbu', 'nama'] as const) {
    if (objek[kunci] !== undefined && typeof objek[kunci] !== 'string') throw salah();
  }
  for (const kunci of ['membunuhPewaris', 'penghubung'] as const) {
    if (objek[kunci] !== undefined && typeof objek[kunci] !== 'boolean') throw salah();
  }
  return objek as unknown as Orang;
}

function bacaPernikahan(data: unknown, orang: Record<IdOrang, Orang>): Pernikahan {
  const objek = wajibObjek(data, 'pernikahan');
  const statusSah = ['utuh', 'talakRajiIddah', 'talakBain'];
  if (typeof objek.idSuami !== 'string' || typeof objek.idIstri !== 'string' || !orang[objek.idSuami] || !orang[objek.idIstri]
    || !statusSah.includes(objek.status as string)) {
    throw new Error('Data pernikahan rusak.');
  }
  return objek as unknown as Pernikahan;
}

function bacaUang(nilai: unknown, nama: string): bigint {
  if (typeof nilai !== 'string' || !/^\d+$/.test(nilai)) throw new Error(`Nilai ${nama} harus angka bulat tidak negatif.`);
  return BigInt(nilai);
}

function wajibObjek(nilai: unknown, nama: string): Record<string, unknown> {
  if (typeof nilai !== 'object' || nilai === null || Array.isArray(nilai)) throw new Error(`Bagian ${nama} rusak.`);
  return nilai as Record<string, unknown>;
}
