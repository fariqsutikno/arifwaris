// Menerima Kasus, memanggil orkestrator engine yang tepat, menyerahkan HasilTampil ke layar (spec 2.5).
// Urutan: wafat bersamaan (13d) → ada yang belum pasti (13a–c) → munasakhat (12) → biasa + dzawil arham (14).
// Exception dari engine = pelanggaran invarian; ditampilkan sebagai galat, bukan hasil setengah jadi.

import {
  hitungDzawilArham, hitungGharqa, hitungMunasakhat, hitungTaqdir, KONFIGURASI_BAWAAN,
  type HasilEngine, type HasilGharqa, type HasilMunasakhat, type HasilTaqdir, type InputEngine,
} from '@waris/engine';
import type { Kasus } from './kasus.js';

const VERSI_KB = '1.0.0-dev';

export type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
export type HasilMunasakhatOk = Extract<HasilMunasakhat, { status: 'OK' }>;
export type HasilTampil =
  | { jenis: 'biasa'; hasil: HasilEngine }
  | { jenis: 'munasakhat'; hasil: HasilMunasakhat }
  | { jenis: 'taqdir'; hasil: HasilTaqdir }
  | { jenis: 'gharqa'; hasil: HasilGharqa }
  /** Menunggu kelahiran [R13-17]: tidak dibagi; taqdir tetap dihitung untuk menunjukkan yang sudah pasti. */
  | { jenis: 'menunggu'; hasil: HasilTaqdir }
  | { jenis: 'galat'; pesan: string };

export function keInputEngine(kasus: Kasus): InputEngine {
  return {
    graf: kasus.graf,
    tirkah: kasus.tirkah,
    pembulatan: { satuan: kasus.satuanPembulatan },
    konfigurasi: KONFIGURASI_BAWAAN,
    ruleset: kasus.madzhab ?? 'syafii',
    versiKb: VERSI_KB,
  };
}

/** Orang yang bisa dihitung sebagai taqdir; `tidakDiketahui` tidak termasuk: engine mengembalikan PERLU_INPUT. */
export const orangBelumPasti = (kasus: Kasus) =>
  Object.values(kasus.graf.orang).filter(o => o.statusHidup === 'dalamKandungan' || o.statusHidup === 'mafqud' || !!o.khuntsa);
export const adaBelumPasti = (kasus: Kasus): boolean => orangBelumPasti(kasus).length > 0;
const adaJanin = (kasus: Kasus): boolean => Object.values(kasus.graf.orang).some(o => o.statusHidup === 'dalamKandungan');

export function jalankan(kasus: Kasus): HasilTampil {
  try {
    const dasar = keInputEngine(kasus);
    const lanjutan = { urutanWafat: kasus.urutanWafat, ...(kasus.dikandungSetelahWafat ? { dikandungSetelahWafat: kasus.dikandungSetelahWafat } : {}) };
    if (kasus.gharqa) {
      const { anggota, keadaan, tirkah } = kasus.gharqa;
      return { jenis: 'gharqa', hasil: hitungGharqa({ dasar, anggota, keadaan, tirkah: { ...tirkah, [kasus.graf.idPewaris]: kasus.tirkah } }) };
    }
    if (adaBelumPasti(kasus)) {
      // [R13-17] menunggu kelahiran lebih utama; pengguna yang memilih.
      const hasil = hitungTaqdir(dasar, lanjutan);
      return kasus.pilihanJanin === 'tunggu' && adaJanin(kasus) ? { jenis: 'menunggu', hasil } : { jenis: 'taqdir', hasil };
    }
    if (kasus.urutanWafat.length > 0) return { jenis: 'munasakhat', hasil: hitungMunasakhat({ dasar, ...lanjutan }) };
    return { jenis: 'biasa', hasil: hitungDzawilArham(dasar) };
  } catch (galat) {
    return { jenis: 'galat', pesan: galat instanceof Error ? galat.message : String(galat) };
  }
}
