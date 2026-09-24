// Menerima Kasus, memanggil engine, menyerahkan HasilTampil ke layar.
// Bukan munasakhat → hitung(); ada yang wafat sebelum pembagian → hitungMunasakhat() (bab 12).
// Exception dari engine = pelanggaran invarian; ditampilkan sebagai galat, bukan hasil setengah jadi.

import {
  hitung, hitungMunasakhat, KONFIGURASI_BAWAAN,
  type HasilEngine, type HasilMunasakhat, type InputEngine,
} from '@waris/engine';
import type { Kasus } from './kasus';

const VERSI_KB = '1.0.0-dev';

export type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
export type HasilMunasakhatOk = Extract<HasilMunasakhat, { status: 'OK' }>;
export type HasilTampil =
  | { jenis: 'biasa'; hasil: HasilEngine }
  | { jenis: 'munasakhat'; hasil: HasilMunasakhat }
  | { jenis: 'galat'; pesan: string };

export function keInputEngine(kasus: Kasus): InputEngine {
  return {
    graf: kasus.graf,
    tirkah: kasus.tirkah,
    pembulatan: { satuan: kasus.satuanPembulatan },
    konfigurasi: KONFIGURASI_BAWAAN,
    ruleset: 'syafii',
    versiKb: VERSI_KB,
  };
}

export function jalankan(kasus: Kasus): HasilTampil {
  try {
    const dasar = keInputEngine(kasus);
    return kasus.urutanWafat.length === 0
      ? { jenis: 'biasa', hasil: hitung(dasar) }
      : { jenis: 'munasakhat', hasil: hitungMunasakhat({ dasar, urutanWafat: kasus.urutanWafat }) };
  } catch (galat) {
    return { jenis: 'galat', pesan: galat instanceof Error ? galat.message : String(galat) };
  }
}
