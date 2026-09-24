// Tahap 2 (bab 08 [SYF], algoritma 8.6) — Kakek bersama saudara kandung/sebapak.
//   Masuk : kakek, saudara-saudaranya, dan jumlah furudh ahli waris lain.
//   Keluar: kelompok kakek + kelompok saudara, dan jejak pilihan kakek.
// Alurnya:
//   1. sisa ≤ 1/6            → kakek 1/6, saudara gugur.
//   2. pilih yang terbesar untuk kakek: muqasamah / 1/3 (tanpa furudh), atau
//      muqasamah / 1/3 sisa / 1/6 (dengan furudh). Seri → muqasamah.
//   3. ada kandung dan sebapak sekaligus → mu'addah: sebapak ikut dihitung, bagiannya ke kandung.
// Akdariyyah ditangani pemanggil (bagian.ts) karena polanya furudh khusus.

import { bandingkan, pecahan, kali, kurang, type Pecahan } from '@waris/math';
import type { PilihanJadd, IdOrang, LangkahJejak } from '../types.js';
import { adalahLakiLaki, buatKelompok, satuanRuus, type AhliWaris, type KelompokBagian, type TidakDidukung } from './model.js';

const SATU = pecahan(1n);
const SUDUS = pecahan(1n, 6n);
const NISF = pecahan(1n, 2n);
const TSULUTS = pecahan(1n, 3n);

const bobotSatuan = (daftarAhliWaris: AhliWaris[]): Record<IdOrang, bigint> => Object.fromEntries(daftarAhliWaris.map(saudara => [saudara.idOrang, satuanRuus(saudara)]));
const jenisAshabah = (daftarAhliWaris: AhliWaris[]) => (daftarAhliWaris.some(saudara => !adalahLakiLaki(saudara)) ? 'bilGhair' as const : 'binNafsi' as const);

export function jaddWalIkhwah(
  jadd: AhliWaris,
  daftarSaudara: AhliWaris[],
  jumlahFurudh: Pecahan,
  adaFaruMuannats: boolean,
): { daftarKelompok: KelompokBagian[]; jejak: LangkahJejak[] } | TidakDidukung {
  if (adaFaruMuannats && !daftarSaudara.some(adalahLakiLaki)) {
    return {
      status: 'TIDAK_DIDUKUNG',
      alasan: "Kakek bersama saudari yang menjadi ashabah ma'al ghair (ada anak/cucu pr) belum dirinci KB bab 08.",
      refs: ['R08-3'],
    };
  }

  const daftarKelompok: KelompokBagian[] = [];
  const jejak: LangkahJejak[] = [];
  const sisa = kurang(SATU, jumlahFurudh);
  const jumlahSatuan = daftarSaudara.reduce((jumlah, saudara) => jumlah + satuanRuus(saudara), 0n);

  // [R08-3] sisa ≤ 1/6: kakek 1/6 (dengan 'aul bila perlu), saudara gugur — tetap dicatat sebagai ashabah tanpa sisa.
  if (jumlahFurudh.n > 0n && bandingkan(sisa, SUDUS) <= 0) {
    daftarKelompok.push(buatKelompok('KAKEK', { [jadd.idOrang]: 1n }, { jenis: 'fardh', fardh: SUDUS }));
    jejak.push({ tahap: 'furudh', refs: ['R08-3'], jenis: 'FARDH', kelompok: 'KAKEK', fardh: SUDUS,
      alasan: { kode: 'JADD_SISA_SEDIKIT', sisa } });
    daftarKelompok.push(buatKelompok('IKHWAH', bobotSatuan(daftarSaudara), { jenis: 'ashabah', jenisAshabah: jenisAshabah(daftarSaudara) }));
    jejak.push({ tahap: 'ashabah', refs: ['R08-3'], jenis: 'ASHABAH', kelompok: 'IKHWAH', jenisAshabah: jenisAshabah(daftarSaudara) });
    return { daftarKelompok, jejak };
  }

  // [R08-2] tanpa furudh: terbaik dari muqasamah dan 1/3; [R08-3] dengan furudh: + 1/3 sisa dan 1/6.
  // Seri → muqasamah didahulukan (bab 8.2 "pilih muqasamah secara default").
  const muqasamah = kali(sisa, pecahan(2n, 2n + jumlahSatuan));
  const opsi: Array<[PilihanJadd, Pecahan]> = jumlahFurudh.n === 0n
    ? [['muqasamah', muqasamah], ['tsuluts', TSULUTS]]
    : [['muqasamah', muqasamah], ['tsulutsBaqi', kali(sisa, TSULUTS)], ['sudus', SUDUS]];
  const [pilihan, bagianKakek] = opsi.reduce((terbaik, calon) => (bandingkan(calon[1], terbaik[1]) > 0 ? calon : terbaik));
  const refs = [jumlahFurudh.n === 0n ? 'R08-2' : 'R08-3'];
  const pilihanJadd = {
    kode: 'JADD_WAL_IKHWAH' as const, sisa, opsi: opsi.map(([nama, nilai]) => ({ nama, nilai })), terpilih: pilihan,
  };

  const kandung = daftarSaudara.filter(saudara => saudara.kunci === 'SAUDARA_KANDUNG' || saudara.kunci === 'SAUDARI_KANDUNG');
  const sebapak = daftarSaudara.filter(saudara => saudara.kunci === 'SAUDARA_SEBAPAK' || saudara.kunci === 'SAUDARI_SEBAPAK');
  const muaddah = kandung.length > 0 && sebapak.length > 0;

  if (pilihan === 'muqasamah' && !muaddah) {
    // Kakek dihitung sebagai satu saudara lk dalam ashabah yang sama.
    const anggota = [jadd, ...daftarSaudara];
    daftarKelompok.push(buatKelompok('JADD_IKHWAH', bobotSatuan(anggota), { jenis: 'ashabah', jenisAshabah: jenisAshabah(daftarSaudara) }));
    jejak.push({ tahap: 'ashabah', refs, jenis: 'ASHABAH', kelompok: 'JADD_IKHWAH', jenisAshabah: jenisAshabah(daftarSaudara), pilihanJadd });
    return { daftarKelompok, jejak };
  }

  daftarKelompok.push(buatKelompok('KAKEK', { [jadd.idOrang]: 1n }, pilihan === 'sudus'
    ? { jenis: 'fardh', fardh: SUDUS }
    : { jenis: 'tetap', nilai: bagianKakek, basis: pilihan }));
  jejak.push({ tahap: 'furudh', refs, jenis: 'FARDH', kelompok: 'KAKEK', fardh: bagianKakek, alasan: pilihanJadd });

  if (!muaddah) {
    daftarKelompok.push(buatKelompok('IKHWAH', bobotSatuan(daftarSaudara), { jenis: 'ashabah', jenisAshabah: jenisAshabah(daftarSaudara) }));
    jejak.push({ tahap: 'ashabah', refs, jenis: 'ASHABAH', kelompok: 'IKHWAH', jenisAshabah: jenisAshabah(daftarSaudara) });
    return { daftarKelompok, jejak };
  }

  // [R08-4] mu'addah: sebapak ikut dihitung melawan kakek, lalu bagiannya kembali ke kandung.
  jejak.push({ tahap: 'ashabah', refs: ['R08-4'], jenis: 'KASUS_KHUSUS', nama: 'muaddah' });
  const [hanyaKandung] = kandung;
  if (kandung.length === 1 && hanyaKandung && !adalahLakiLaki(hanyaKandung)) {
    // [R08-4] saudari kandung tunggal mengambil hingga 1/2; lebihnya untuk sebapak.
    const bagianSaudara = kurang(sisa, bagianKakek);
    const bagianSaudari = bandingkan(bagianSaudara, NISF) < 0 ? bagianSaudara : NISF;
    daftarKelompok.push(buatKelompok('SAUDARI_KANDUNG', { [hanyaKandung.idOrang]: 1n }, { jenis: 'tetap', nilai: bagianSaudari, basis: 'muaddah' }));
    daftarKelompok.push(buatKelompok('IKHWAH', bobotSatuan(sebapak), { jenis: 'ashabah', jenisAshabah: jenisAshabah(sebapak) }));
    jejak.push({ tahap: 'ashabah', refs: ['R08-4'], jenis: 'ASHABAH', kelompok: 'IKHWAH', jenisAshabah: jenisAshabah(sebapak) });
    return { daftarKelompok, jejak };
  }

  const bobot = { ...bobotSatuan(kandung), ...Object.fromEntries(sebapak.map(saudara => [saudara.idOrang, 0n])) };
  daftarKelompok.push(buatKelompok('IKHWAH', bobot, { jenis: 'ashabah', jenisAshabah: jenisAshabah(kandung) }));
  jejak.push({ tahap: 'ashabah', refs: ['R08-4'], jenis: 'ASHABAH', kelompok: 'IKHWAH', jenisAshabah: jenisAshabah(kandung) });
  return { daftarKelompok, jejak };
}
