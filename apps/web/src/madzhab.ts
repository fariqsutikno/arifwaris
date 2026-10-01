// Madzhab di UI: nama, sumber, dan perbandingan hasil antar-madzhab. Fungsi murni; semua angka dari engine (jalankan) tanpa
// aturan fikih di sini. Perbandingan hanya untuk kasus yang punya satu pembagian pasti (biasa/munasakhat): kasus berupa
// kemungkinan (janin, hilang, kelamin ganda, wafat bersamaan) tidak dibandingkan karena bentuk hasilnya berbeda.
// Madzhab yang gerbang engine tolak (token aturan belum dikaji, KB 18.4) tampil jujur sebagai "belum dikaji", tanpa angka.

import { DAFTAR_RULESET, type IdOrang, type Ruleset } from '@waris/engine';
import { cariTitikKhilaf } from '@waris/content';
import { cobaRingkas } from './hasil/ringkasan';
import { jalankan, type HasilTampil } from './jalankan';
import type { Kasus } from './kasus';
import { t } from './terjemah';

export const madzhabKasus = (kasus: Kasus): Ruleset => kasus.ruleset ?? 'syafii';

// Tiap madzhab memanggil t dengan kunci literal supaya tes diksi menangkapnya.
export function namaMadzhab(ruleset: Ruleset): string {
  switch (ruleset) {
    case 'syafii': return t('hitung.madzhab.syafii');
    case 'hanbali': return t('hitung.madzhab.hanbali');
    case 'hanafi': return t('hitung.madzhab.hanafi');
    case 'maliki': return t('hitung.madzhab.maliki');
  }
}

/** Status sumber (PRODUCT: sumber bertingkat harus jujur): hanya Syafi'i yang diperiksa sampai teks primer. */
export const sumberMadzhab = (ruleset: Ruleset): string => (ruleset === 'syafii' ? t('hitung.madzhab.sumber_syafii') : t('hitung.madzhab.sumber_lain'));

export type KondisiMadzhab = 'ok' | 'belumDikaji' | 'perluInput' | 'lain';

export interface HasilMadzhab {
  ruleset: Ruleset;
  kondisi: KondisiMadzhab;
  /** Nominal per orang yang menerima (kosong bila kondisi bukan 'ok'). */
  bagian: Record<IdOrang, bigint>;
  /** Titik matriks khilaf yang disentuh hasil ini (jejak KHILAF_MADZHAB). */
  kodeKhilaf: string[];
}

export interface TitikBeda { kode: string; titik: string; posisi: Record<Ruleset, string> }

export interface Perbandingan {
  sekarang: Ruleset;
  hasil: HasilMadzhab[];
  /** Orang yang menerima di salah satu madzhab, urut: yang menerima menurut madzhab sekarang dulu. */
  orang: Array<{ id: IdOrang; nama: string }>;
  /** Orang yang nominalnya berbeda di salah satu madzhab yang bisa dihitung. */
  baris: Set<IdOrang>;
  /** Ada yang berbeda atau tidak bisa dihitung: hanya saat itu tautan "Bandingkan pendapat lain" tampil. */
  beda: boolean;
  titik: TitikBeda[];
}

function kodeKhilafDari(tampil: HasilTampil): string[] {
  const jejak = tampil.jenis === 'biasa' && tampil.hasil.status === 'OK' ? tampil.hasil.jejak
    : tampil.jenis === 'munasakhat' && tampil.hasil.status === 'OK' ? tampil.hasil.daftarLangkah.flatMap(langkah => langkah.hasil.jejak) : [];
  return [...new Set(jejak.flatMap(langkah => (langkah.jenis === 'KHILAF_MADZHAB' ? [langkah.kode] : [])))];
}

function hitungSatu(kasus: Kasus, ruleset: Ruleset): { hasil: HasilMadzhab; nama: Record<IdOrang, string> } {
  const tampil = jalankan({ ...kasus, ruleset });
  const ringkasan = cobaRingkas(kasus, tampil);
  const status = 'hasil' in tampil ? tampil.hasil.status : 'GALAT';
  const kondisi: KondisiMadzhab = ringkasan ? 'ok' : status === 'TIDAK_DIDUKUNG' ? 'belumDikaji' : status === 'PERLU_INPUT' ? 'perluInput' : 'lain';
  const bagian: Record<IdOrang, bigint> = {};
  const nama: Record<IdOrang, string> = {};
  for (const orang of ringkasan?.penerima ?? []) { bagian[orang.id] = orang.nominal; nama[orang.id] = orang.nama; }
  return { hasil: { ruleset, kondisi, bagian, kodeKhilaf: kodeKhilafDari(tampil) }, nama };
}

export function bandingkanMadzhab(kasus: Kasus): Perbandingan {
  const sekarang = madzhabKasus(kasus);
  const dihitung = DAFTAR_RULESET.map(ruleset => hitungSatu(kasus, ruleset));
  const hasil = dihitung.map(({ hasil: satu }) => satu);
  const nama = Object.assign({}, ...[...dihitung].reverse().map(({ nama: namaIni }) => namaIni)) as Record<IdOrang, string>;
  const acuan = hasil.find(satu => satu.ruleset === sekarang)!;
  const urutan = [...Object.keys(acuan.bagian), ...hasil.flatMap(satu => Object.keys(satu.bagian))];
  const orang = [...new Set(urutan)].map(id => ({ id, nama: nama[id] ?? id }));
  const baris = new Set<IdOrang>();
  for (const satu of hasil) {
    if (satu.ruleset === sekarang || satu.kondisi !== 'ok') continue;
    for (const { id } of orang) if ((satu.bagian[id] ?? 0n) !== (acuan.bagian[id] ?? 0n)) baris.add(id);
  }
  const lainBelumBisa = hasil.some(satu => satu.ruleset !== sekarang && satu.kondisi !== 'ok');
  const kode = [...new Set(hasil.flatMap(satu => satu.kodeKhilaf))];
  const titik = kode.flatMap((k): TitikBeda[] => {
    const isi = cariTitikKhilaf(k);
    return isi ? [{ kode: k, titik: isi.titik, posisi: isi.sel }] : [];
  });
  return { sekarang, hasil, orang, baris, beda: acuan.kondisi === 'ok' && (baris.size > 0 || lainBelumBisa), titik };
}

/** Sel matriks 18.2 untuk awam: notasi "= [SYF]" dibaca "Sama dengan Syafi'i" dan tautan arsip internal dibuang; kutipan dan kitabnya tetap. */
export const bersihkanSel = (sel: string): string => sel
  .replace(/^=\s*\[SYF\]\s*[—-]\s*/, `${t('hitung.madzhab.sama_syafii')} — `)
  .replace(/\s*·\s*(?:shamela:[\w/.:-]+\s*)+/g, '')
  .replace(/\s+\)/g, ')')
  .trim();

/** Kasus dengan madzhab lain; Syafi'i (bawaan) tidak ditulis ke Kasus supaya berkas lama dan baru tetap sama. */
export function aturMadzhab(kasus: Kasus, ruleset: Ruleset): Kasus {
  const { ruleset: _lama, ...tanpa } = kasus;
  return ruleset === 'syafii' ? tanpa : { ...tanpa, ruleset };
}
