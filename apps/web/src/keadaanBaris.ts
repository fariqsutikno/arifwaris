// Keadaan satu baris orang di kanvas keluarga (spec kanvas 5.3). Menerima Kasus + orang; menyerahkan Kasus dengan keadaan
// diterapkan lewat terapkanKeadaan (aturan fikih tidak diulang di sini). `belumDiisi` hanya penanda UI: baris masuk saat
// ditambah dan keluar saat keadaan beserta lanjutannya lengkap. Graf selalu sah bagi engine, jadi keadaan sementara
// (misalnya wafat sebelum "sebelum atau sesudah" dijawab) tetap bisa dihitung.

import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import type { Kasus, TanggalKira } from './kasus';
import { alasanTidakDidukung, daftarAlmarhum, KHUNTSA_MUNGKIN, keadaanOrang, namaSingkat, terapkanKeadaan, type JawabanKeadaan } from './keadaanOrang';
import { anggotaBagian, daftarBagian, kunciBagian, orangDiBaris, type Bagian, type JenisBagian } from './kelompok';
import { aturTahunWafat, waktuRelatif } from './silsilah';
import { t } from './terjemah';

export type PilihanKeadaan = 'hidup' | 'wafat' | 'belumTahu' | 'hilang' | 'bercerai' | 'khuntsa';
export type Lanjutan = 'wafat' | 'putusan' | 'iddah' | 'baligh';
export type JawabanLanjutan =
  | { jenis: 'wafat'; tahun?: TanggalKira | null; waktu?: 'sebelum' | 'sesudah' }
  | { jenis: 'putusan'; ada: boolean }
  | { jenis: 'iddah'; selesai: boolean }
  | { jenis: 'baligh'; sudah: boolean };

const PILIHAN_UMUM: PilihanKeadaan[] = ['hidup', 'wafat', 'belumTahu'];

/** Hilang tanpa kabar dan cerai tidak jadi pil di kartu orang; keduanya dijawab di pertanyaan lanjutan akhir langkah (calonHilang, calonCerai). */
export const pilihanKeadaan = (kunci: KunciAhliWaris): PilihanKeadaan[] =>
  KHUNTSA_MUNGKIN.includes(kunci) ? [...PILIHAN_UMUM, 'khuntsa'] : PILIHAN_UMUM;

/** `kunci`, `nomor` (urutan dalam perannya), dan `jenis` supaya daftar memakai sebutan yang sama dengan kartu orangnya. */
export interface CalonLanjutan { id: IdOrang; milik: IdOrang; kunci: KunciAhliWaris; nomor: number; jenis: JenisBagian }
const KEADAAN_BISA_HILANG: Array<PilihanKeadaan | null> = [null, 'hidup', 'belumTahu', 'hilang'];
const KEADAAN_BISA_CERAI: Array<PilihanKeadaan | null> = [null, 'hidup', 'belumTahu', 'bercerai'];

/** Orang di kartu mana pun (satu kali, tanpa janin) yang keadaannya masih boleh diganti menjadi hilang tanpa kabar. */
export const calonHilang = (kasus: Kasus): CalonLanjutan[] => calonDi(kasus, () => true, KEADAAN_BISA_HILANG);
/** Pasangan almarhum yang keadaannya masih boleh diganti menjadi sudah dicerai. */
export const calonCerai = (kasus: Kasus): CalonLanjutan[] => calonDi(kasus, bagian => bagian.jenis === 'pasangan', KEADAAN_BISA_CERAI);

function calonDi(kasus: Kasus, bagianDipakai: (bagian: Bagian) => boolean, keadaanBoleh: Array<PilihanKeadaan | null>): CalonLanjutan[] {
  const dilihat = new Set<IdOrang>();
  // Dari anggotaBagian, bukan dari baris kartu: pasangan yang talaknya sudah bain bukan lagi ahli waris sehingga lepas dari baris, tapi tetap harus ada di daftar.
  return daftarBagian(kasus).filter(bagian => bagian.jenis !== 'anakBersama' && bagianDipakai(bagian)).flatMap(bagian => {
    const anggota = anggotaBagian(kasus, bagian);
    const kunciDari = (id: IdOrang) => kunciBagian(kasus, bagian).find(kunci => orangDiBaris(kasus, bagian, kunci).includes(id)) ?? kunciBagian(kasus, bagian)[0]!;
    return anggota.filter(id => !dilihat.has(id) && dilihat.add(id) && keadaanOrang(kasus, id) !== 'dalamKandungan' && keadaanBoleh.includes(keadaanTerpilih(kasus, id)))
      .map(id => ({ id, milik: bagian.milik, jenis: bagian.jenis, kunci: kunciDari(id), nomor: anggota.filter(lain => kunciDari(lain) === kunciDari(id)).indexOf(id) + 1 }));
  });
}

/** null = belum dipilih. Keadaan sementara (menunggu lanjutan) sudah terbaca dari graf. */
export function keadaanTerpilih(kasus: Kasus, id: IdOrang): PilihanKeadaan | null {
  if (!kasus.graf.orang[id]) return null;
  switch (keadaanOrang(kasus, id)) {
    case 'wafatSebelum': case 'wafatSesudah': case 'wafatSesudahDibagi': case 'bersamaan': return 'wafat';
    case 'hilang': return 'hilang';
    case 'khuntsa': return 'khuntsa';
    case 'belumTahu': return 'belumTahu';
    case 'dalamKandungan': return null;   // janin dikelola alur kandungan, bukan baris ini
    case 'hidup':
      if (nikahBerakhir(kasus, id)) return 'bercerai';
      return daftarBelumDiisi(kasus).includes(id) ? null : 'hidup';
  }
}

export function pilihKeadaan(kasus: Kasus, id: IdOrang, pilihan: PilihanKeadaan, milik: IdOrang): Kasus {
  if (keadaanTerpilih(kasus, id) === pilihan) return kasus;
  const dasar = aturTahunWafat(pulihkanNikah(terapkanKeadaan(kasus, id, { jenis: 'hidup' }), id, milik), id, undefined);
  switch (pilihan) {
    case 'hidup': return tandaiBelumDiisi(dasar, id, false);
    case 'belumTahu': return tandaiBelumDiisi(terapkanKeadaan(dasar, id, { jenis: 'belumTahu' }), id, false);
    case 'wafat': return tandaiBelumDiisi(terapkanKeadaan(dasar, id, { jenis: 'wafatSebelum' }), id, true);     // sementara sampai sebelum/sesudah diketahui
    case 'hilang': return tandaiBelumDiisi(terapkanKeadaan(dasar, id, { jenis: 'hilang' }), id, true);          // menunggu putusan [R13-6]
    case 'khuntsa': return tandaiBelumDiisi(terapkanKeadaan(dasar, id, { jenis: 'khuntsa', keadaan: 'diharapkanJelas' }), id, true);
    case 'bercerai': return tandaiBelumDiisi(ubahStatusNikah(dasar, id, milik, 'talakRajiIddah'), id, true);
  }
}

export function lanjutanDiperlukan(kasus: Kasus, id: IdOrang): Lanjutan | null {
  if (!daftarBelumDiisi(kasus).includes(id)) return null;
  switch (keadaanTerpilih(kasus, id)) {
    case 'wafat': return 'wafat';
    case 'hilang': return 'putusan';
    case 'bercerai': return 'iddah';
    case 'khuntsa': return 'baligh';
    default: return null;
  }
}

export function jawabLanjutan(kasus: Kasus, id: IdOrang, milik: IdOrang, jawaban: JawabanLanjutan): Kasus {
  switch (jawaban.jenis) {
    case 'wafat': {
      const denganTahun = jawaban.tahun === undefined ? kasus : aturTahunWafat(kasus, id, jawaban.tahun ?? undefined);
      // Dua tahun yang bisa dibandingkan menentukan sebelum/sesudah; selain itu pengguna yang memilih, tidak ditebak.
      const relatif = waktuRelatif(denganTahun, id, milik) ?? jawaban.waktu ?? null;
      if (!relatif) return denganTahun;
      // Dipanggil juga saat baris sudah lengkap (tahun diubah belakangan), jadi keadaan "dibagi" yang sudah dipilih tidak ditimpa.
      if (relatif === 'sesudah' && keadaanOrang(denganTahun, id) === 'wafatSesudahDibagi') return denganTahun;
      if (relatif === 'sebelum') return tandaiBelumDiisi(terapkanKeadaan(denganTahun, id, { jenis: 'wafatSebelum' }), id, false);
      const sesudah: JawabanKeadaan = { jenis: 'wafatSesudah', hartaSudahDibagi: false };
      // Kasus yang belum didukung engine (gharqa lain) dibiarkan tertunda; barisnya menampilkan alasan lewat alasanWafatSesudahDitolak.
      if (alasanTidakDidukung(denganTahun, id, sesudah)) return denganTahun;
      return tandaiBelumDiisi(terapkanKeadaan(denganTahun, id, sesudah), id, false);
    }
    // [R13-18] butir 3: sudah ada putusan = diperlakukan seperti wafat, kapan wafatnya masih ditanya.
    case 'putusan': return jawaban.ada ? terapkanKeadaan(kasus, id, { jenis: 'wafatSebelum' }) : tandaiBelumDiisi(kasus, id, false);
    case 'iddah': return tandaiBelumDiisi(ubahStatusNikah(kasus, id, milik, jawaban.selesai ? 'talakBain' : 'talakRajiIddah'), id, false);
    case 'baligh': return tandaiBelumDiisi(
      terapkanKeadaan(kasus, id, { jenis: 'khuntsa', keadaan: jawaban.sudah ? 'tidakDiharapkanJelas' : 'diharapkanJelas' }), id, false);
  }
}

/** Teks alasan baris belum lengkap, null bila lengkap. `milik` = almarhum pemilik bagian (untuk "sebelum/sesudah {milik}"). */
export function alasanBarisKurang(kasus: Kasus, id: IdOrang, milik: IdOrang): string | null {
  if (!daftarBelumDiisi(kasus).includes(id)) return null;
  const terpilih = keadaanTerpilih(kasus, id);
  if (terpilih === null) return t('hitung.kanvas.baris_pilih_keadaan');
  if (terpilih === 'wafat') return t('hitung.kanvas.baris_isi_waktu', { rel: namaSingkat(kasus, milik) });
  return t('hitung.kanvas.baris_jawab_lanjutan');
}

/** Tahun menyatakan "sesudah" tetapi engine belum mendukung kombinasinya (keadaan tetap "sebelum"); null bila tidak ada masalah. */
export function alasanWafatSesudahDitolak(kasus: Kasus, id: IdOrang, milik: IdOrang): string | null {
  if (keadaanTerpilih(kasus, id) !== 'wafat' || keadaanOrang(kasus, id) !== 'wafatSebelum' || waktuRelatif(kasus, id, milik) !== 'sesudah') return null;
  return alasanTidakDidukung(kasus, id, { jenis: 'wafatSesudah', hartaSudahDibagi: false }) ? t('hitung.keadaan.belum_didukung') : null;
}

const daftarBelumDiisi = (kasus: Kasus): IdOrang[] => kasus.belumDiisi ?? [];

export function tandaiBelumDiisi(kasus: Kasus, id: IdOrang, belumDiisi: boolean): Kasus {
  const lain = daftarBelumDiisi(kasus).filter(orang => orang !== id);
  const { belumDiisi: _lama, ...inti } = kasus;
  const daftar = belumDiisi ? [...lain, id] : lain;
  return daftar.length ? { ...inti, belumDiisi: daftar } : inti;
}

const melibatkan = (id: IdOrang) => (nikah: { idSuami: IdOrang; idIstri: IdOrang }) => nikah.idSuami === id || nikah.idIstri === id;
/** Pernikahan `id` dengan `milik`, atau dengan almarhum mana pun bila `milik` tak diketahui; pernikahan dengan orang lain tidak dihitung. */
const nikahDenganAlmarhum = (kasus: Kasus, id: IdOrang, milik?: IdOrang) => {
  const almarhum = milik ? [milik] : daftarAlmarhum(kasus);
  return (nikah: { idSuami: IdOrang; idIstri: IdOrang }) => melibatkan(id)(nikah) && almarhum.some(satu => melibatkan(satu)(nikah));
};
const nikahBerakhir = (kasus: Kasus, id: IdOrang, milik?: IdOrang) =>
  kasus.graf.pernikahan.some(nikah => nikahDenganAlmarhum(kasus, id, milik)(nikah) && nikah.status !== 'utuh');

function pulihkanNikah(kasus: Kasus, id: IdOrang, milik: IdOrang): Kasus {
  if (!nikahBerakhir(kasus, id, milik)) return kasus;
  const pernikahan = kasus.graf.pernikahan.map(nikah => (nikahDenganAlmarhum(kasus, id, milik)(nikah) ? { ...nikah, status: 'utuh' as const } : nikah));
  return { ...kasus, graf: { ...kasus.graf, pernikahan } };
}

/** Status pernikahan `id` dengan `milik`. Tanpa pernikahan dengan `milik`: tidak berubah (pernikahan lain bukan urusan baris ini). */
function ubahStatusNikah(kasus: Kasus, id: IdOrang, milik: IdOrang, status: 'talakRajiIddah' | 'talakBain'): Kasus {
  const { pernikahan } = kasus.graf;
  const sasaran = pernikahan.findIndex(nikahDenganAlmarhum(kasus, id, milik));
  if (sasaran < 0) return kasus;
  return { ...kasus, graf: { ...kasus.graf, pernikahan: pernikahan.map((nikah, indeks) => (indeks === sasaran ? { ...nikah, status } : nikah)) } };
}
