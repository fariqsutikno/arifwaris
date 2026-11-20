// Menerima Kasus, memanggil orkestrator engine yang tepat, menyerahkan HasilTampil ke layar (spec 2.5).
// Urutan: wafat bersamaan (13d) → ada yang belum pasti (13a–c) → munasakhat (12) → biasa + dzawil arham (14).
// Exception dari engine = pelanggaran invarian; ditampilkan sebagai galat, bukan hasil setengah jadi.

import {
  hitungDzawilArham, hitungGharqa, hitungMunasakhat, hitungTaqdir, KONFIGURASI_BAWAAN,
  type HasilEngine, type HasilGharqa, type HasilMunasakhat, type HasilTaqdir, type InputEngine,
} from '@waris/engine';
import type { JenisSoal } from './kejadian.js';
import type { Kasus } from './kasus.js';

/** Dipakai bila pemanggil tidak tahu versi enginenya (uji, skrip); kejadian percobaan selalu membawa versi yang sebenarnya. */
export const VERSI_ENGINE_TIDAK_DIKETAHUI = 'tak-diketahui';

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

/** `versiEngine`: hash commit terakhir yang mengubah packages/engine atau packages/math, disuntik saat build (S6). */
export function keInputEngine(kasus: Kasus, versiEngine: string = VERSI_ENGINE_TIDAK_DIKETAHUI): InputEngine {
  return {
    graf: kasus.graf,
    tirkah: kasus.tirkah,
    pembulatan: { satuan: kasus.satuanPembulatan },
    konfigurasi: KONFIGURASI_BAWAAN,
    ruleset: kasus.madzhab ?? 'syafii',
    versiKb: versiEngine,
  };
}

/** Orang yang bisa dihitung sebagai taqdir; `tidakDiketahui` tidak termasuk: engine mengembalikan PERLU_INPUT. */
export const orangBelumPasti = (kasus: Kasus) =>
  Object.values(kasus.graf.orang).filter(o => o.statusHidup === 'dalamKandungan' || o.statusHidup === 'mafqud' || !!o.khuntsa);
export const adaBelumPasti = (kasus: Kasus): boolean => orangBelumPasti(kasus).length > 0;
const adaJanin = (kasus: Kasus): boolean => Object.values(kasus.graf.orang).some(o => o.statusHidup === 'dalamKandungan');

export function jalankan(kasus: Kasus, versiEngine: string = VERSI_ENGINE_TIDAK_DIKETAHUI): HasilTampil {
  try {
    const dasar = keInputEngine(kasus, versiEngine);
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

/** Jenis soal untuk kejadian percobaan (spec 2.1), dari hasil yang ditampilkan. */
export function jenisSoalDari(kasus: Kasus, tampil: HasilTampil): JenisSoal {
  switch (tampil.jenis) {
    case 'gharqa': return 'gharqa';
    case 'munasakhat': return 'munasakhat';
    case 'taqdir': case 'menunggu': return jenisTaqdirDari(kasus);
    default: {
      const adaDzawilArham = tampil.jenis === 'biasa' && tampil.hasil.status === 'OK'
        && Object.values(tampil.hasil.statusOrang).some(status => status.jenis === 'ahliWaris' && status.peran.kunci === 'DZAWIL_ARHAM');
      return adaDzawilArham ? 'dzawilArham' : 'biasa';
    }
  }
}

/** Taqdir berarti ada yang belum pasti; janin lebih dulu, lalu khuntsa, selebihnya mafqud. */
const jenisTaqdirDari = (kasus: Kasus): JenisSoal =>
  adaJanin(kasus) ? 'haml' : Object.values(kasus.graf.orang).some(orang => !!orang.khuntsa) ? 'khuntsa' : 'mafqud';
