import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import type { KunciAhliWaris } from '@waris/engine';
import {
  adalahKodeGenerator, bacaIdSoal, buatKodeSoal, DAFTAR_JENIS_CHECKLIST, modulSoal, soalDariKode, tingkatSoal, tulisIdSoal,
  uraiKodeSoal, URUTAN_KUNCI, type KasusBiasa,
} from '../index.js';

// Kasus acak yang sah: hanya kunci checklist, batas maksimal, pasangan sesuai jenis kelamin, minimal satu ahli waris.
const kasusBiasaSah = fc.constantFrom<'L' | 'P'>('L', 'P').chain(pewaris =>
  fc.tuple(...DAFTAR_JENIS_CHECKLIST.map(jenis => {
    const dibolehkan = !jenis.hanyaUntuk || jenis.hanyaUntuk === pewaris;
    return fc.integer({ min: 0, max: dibolehkan ? jenis.maksimal ?? 7 : 0 });
  })).map(jumlah => ({
    pewaris,
    ahliWaris: Object.fromEntries(DAFTAR_JENIS_CHECKLIST.flatMap((jenis, i) => (jumlah[i]! > 0 ? [[jenis.kunci, jumlah[i]!]] : []))),
  } satisfies KasusBiasa)),
).filter(kasus => Object.keys(kasus.ahliWaris).length > 0);

const kanonik = (kasus: KasusBiasa) => `${kasus.pewaris}:${URUTAN_KUNCI.map(kunci => kasus.ahliWaris[kunci] ?? 0).join(',')}`;

describe('kode soal G1-B', () => {
  test('urutan kunci memuat semua kunci checklist dan mu\'tiq, tanpa dobel (tata letak bit)', () => {
    expect(new Set(URUTAN_KUNCI).size).toBe(URUTAN_KUNCI.length);
    expect(URUTAN_KUNCI.length).toBe(25);
    for (const jenis of DAFTAR_JENIS_CHECKLIST) expect(URUTAN_KUNCI).toContain(jenis.kunci);
  });

  test('bolak-balik: urai(buat(k)) = k', () => {
    fc.assert(fc.property(kasusBiasaSah, kasus => {
      const hasil = uraiKodeSoal(buatKodeSoal(kasus));
      expect(hasil).toEqual({ ok: true, kasus });
    }), { numRuns: 500 });
  });

  test('deterministik dan tidak bertabrakan: kode sama ⇔ kasus sama', () => {
    fc.assert(fc.property(kasusBiasaSah, kasusBiasaSah, (satu, dua) => {
      expect(buatKodeSoal(satu)).toBe(buatKodeSoal(structuredClone(satu)));
      expect(buatKodeSoal(satu) === buatKodeSoal(dua)).toBe(kanonik(satu) === kanonik(dua));
    }), { numRuns: 500 });
  });

  test('bentuk kode: awalan, 16 huruf Crockford; kode beku untuk kasus 1 bab 16 (jangan berubah)', () => {
    const kode = buatKodeSoal({ pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_LK: 1, ANAK_PR: 1 } });
    expect(kode).toBe('G1-B-2000000002000040');
    expect(kode).toMatch(/^G1-B-[0-9A-HJKMNP-TV-Z]{16}$/);
  });

  test('buat menolak kasus tidak sah', () => {
    const tidakSah: KasusBiasa[] = [
      { pewaris: 'L', ahliWaris: {} },
      { pewaris: 'L', ahliWaris: { SUAMI: 1 } },
      { pewaris: 'P', ahliWaris: { ISTRI: 1 } },
      { pewaris: 'L', ahliWaris: { ISTRI: 5 } },
      { pewaris: 'L', ahliWaris: { AYAH: 2 } },
      { pewaris: 'L', ahliWaris: { ANAK_LK: 8 } },
      { pewaris: 'L', ahliWaris: { ANAK_LK: 1.5 } },
      { pewaris: 'L', ahliWaris: { MUTIQ: 1 } },
    ];
    for (const kasus of tidakSah) expect(() => buatKodeSoal(kasus), JSON.stringify(kasus)).toThrow();
  });

  test('urai menolak kode rusak dengan galat berkode', () => {
    const baik = buatKodeSoal({ pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_LK: 1 } });
    const muatan = baik.slice(5);
    const galat = (kode: string) => { const hasil = uraiKodeSoal(kode); return hasil.ok ? 'OK' : hasil.galat; };
    expect(galat('H-01')).toBe('BUKAN_KODE_GENERATOR');
    expect(galat('aul-radd@2#12345')).toBe('BUKAN_KODE_GENERATOR');
    expect(galat(baik.toLowerCase())).toBe('BUKAN_KODE_GENERATOR');
    expect(galat(`G1-B-${muatan.replace(/.$/, 'I')}`)).toBe('BUKAN_KODE_GENERATOR');
    expect(galat(`G2-B-${muatan}`)).toBe('VERSI_TIDAK_DIKENAL');
    expect(galat(`G1-X-${muatan}`)).toBe('KELUARGA_TIDAK_DIKENAL');
    expect(galat(`G1-B-${muatan.slice(1)}`)).toBe('MUATAN_RUSAK');
    expect(galat(`G1-B-${muatan}0`)).toBe('MUATAN_RUSAK');
    expect(galat(`G1-B-${muatan.slice(0, 15)}1`)).toBe('MUATAN_RUSAK'); // bit penutup tidak nol
    expect(galat('G1-B-0000000000000000')).toBe('KASUS_TIDAK_SAH'); // tanpa ahli waris
  });
});

describe('pembaca id soal mengenali tiga bentuk tanpa tertukar', () => {
  test('kurasi, pola, generator', () => {
    const kode = buatKodeSoal({ pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_LK: 1 } });
    expect(adalahKodeGenerator(kode)).toBe(true);
    expect(bacaIdSoal(kode)).toEqual({ jenis: 'generator', kode });
    expect(tulisIdSoal(bacaIdSoal(kode)!)).toBe(kode);
    expect(bacaIdSoal('H-01')).toEqual({ jenis: 'kurasi', slug: 'H-01' });
    expect(bacaIdSoal('G-01')).toEqual({ jenis: 'kurasi', slug: 'G-01' });
    expect(bacaIdSoal('aul-radd@2#12345')).toMatchObject({ jenis: 'pola' });
  });
});

// Kasus bab 16 (satu mayit) dan padanan ['aul bab 9]; label diharapkan ditulis tangan dari KB, bukan disalin dari engine.
type Baris = { id: string; pewaris: 'L' | 'P'; ahliWaris: Partial<Record<KunciAhliWaris, number>>; label: string[] };
const KASUS_BAB16: Baris[] = [
  { id: '16-1 ashabah bil ghair + tashih tabayun', pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_LK: 1, ANAK_PR: 1 }, label: ['ashabahBilGhair', 'inkisar:1', 'tashih'] },
  { id: '16-2 umariyyah (suami)', pewaris: 'P', ahliWaris: { SUAMI: 1, AYAH: 1, IBU: 1 }, label: ['bernama:umariyyatain'] },
  { id: '16-3 umariyyah (istri)', pewaris: 'L', ahliWaris: { ISTRI: 1, AYAH: 1, IBU: 1 }, label: ['bernama:umariyyatain'] },
  { id: '16-4 kakek bukan ayah dalam umariyyah', pewaris: 'P', ahliWaris: { SUAMI: 1, KAKEK: 1, IBU: 1 }, label: [] },
  { id: '16-5 aul 6>7', pewaris: 'P', ahliWaris: { SUAMI: 1, SAUDARI_KANDUNG: 2 }, label: ['aul', 'aul:6>7'] },
  { id: '16-6 minbariyyah 24>27 (tanpa penanda di jejak)', pewaris: 'L', ahliWaris: { ISTRI: 1, AYAH: 1, IBU: 1, ANAK_PR: 2 }, label: ['aul', 'aul:24>27'] },
  { id: '16-7 umm al-furukh 6>10', pewaris: 'P', ahliWaris: { SUAMI: 1, IBU: 1, SAUDARI_SEIBU: 2, SAUDARI_KANDUNG: 2 }, label: ['aul', 'aul:6>10'] },
  { id: '16-8 takmilah + ma\'al ghair', pewaris: 'P', ahliWaris: { ANAK_PR: 1, CUCU_PR: 1, SAUDARI_KANDUNG: 1 }, label: ['ashabahMaalGhair'] },
  { id: '16-9 radd tanpa pasangan', pewaris: 'P', ahliWaris: { ANAK_PR: 1, IBU: 1 }, label: ['radd'] },
  { id: '16-10 radd dengan pasangan (tabayun)', pewaris: 'P', ahliWaris: { SUAMI: 1, ANAK_PR: 1, CUCU_PR: 1 }, label: ['radd'] },
  { id: '16-11 radd dengan pasangan (habis)', pewaris: 'L', ahliWaris: { ISTRI: 1, IBU: 1, SAUDARA_SEIBU: 2 }, label: ['radd'] },
  { id: '16-12 akdariyyah 6>9>27', pewaris: 'P', ahliWaris: { SUAMI: 1, IBU: 1, KAKEK: 1, SAUDARI_KANDUNG: 1 }, label: ['aul', 'aul:6>9', 'bernama:akdariyyah', 'inkisar:1', 'kakekSaudara', 'tashih'] },
  { id: '16-13 musyarrakah', pewaris: 'P', ahliWaris: { SUAMI: 1, IBU: 1, SAUDARA_SEIBU: 2, SAUDARA_KANDUNG: 1 }, label: ['bernama:musyarrakah', 'inkisar:1', 'tashih'] },
  { id: '16-14 jadd wal ikhwah', pewaris: 'L', ahliWaris: { ISTRI: 1, KAKEK: 1, SAUDARA_KANDUNG: 3 }, label: ['inkisar:1', 'kakekSaudara', 'tashih'] },
  { id: '16-15 mahjub tetap menghijab nuqshan', pewaris: 'L', ahliWaris: { AYAH: 1, IBU: 1, SAUDARA_KANDUNG: 2 }, label: ['hajb:SAUDARA_KANDUNG'] },
  { id: '16-16 regresi hajb (semua lk)', pewaris: 'P', ahliWaris: { SUAMI: 1, AYAH: 1, ANAK_LK: 1, CUCU_LK: 1, KAKEK: 1, SAUDARA_KANDUNG: 1, PAMAN_KANDUNG: 1 },
    label: ['hajb:CUCU_LK', 'hajb:KAKEK', 'hajb:PAMAN_KANDUNG', 'hajb:SAUDARA_KANDUNG'] },
  { id: '16-17 qarib masy\'um', pewaris: 'P', ahliWaris: { SUAMI: 1, IBU: 1, SAUDARI_KANDUNG: 1, SAUDARA_SEBAPAK: 1, SAUDARI_SEBAPAK: 1 }, label: ['ashabahBilGhair', 'aul', 'aul:6>7'] },
  { id: '16-17b pembanding', pewaris: 'P', ahliWaris: { SUAMI: 1, IBU: 1, SAUDARI_KANDUNG: 1, SAUDARI_SEBAPAK: 1 }, label: ['aul', 'aul:6>8'] },
  { id: '16-19 urutan jihah', pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_PR: 1, SAUDARA_SEBAPAK: 1, PAMAN_KANDUNG: 1 }, label: ['hajb:PAMAN_KANDUNG'] },
  { id: '16-20 ayah fardh saja', pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_LK: 1, AYAH: 1, IBU: 1 }, label: [] },
  { id: '16-21 ayah fardh + ashabah', pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_PR: 1, AYAH: 1, IBU: 1 }, label: [] },
  { id: '16-22 tashih 1 kelompok', pewaris: 'L', ahliWaris: { ISTRI: 4, SAUDARA_KANDUNG: 3 }, label: ['inkisar:1', 'tashih'] },
  { id: '16-23 tashih 2 kelompok', pewaris: 'L', ahliWaris: { NENEK_DARI_AYAH: 1, NENEK_DARI_IBU: 1, SAUDARA_SEBAPAK: 3 }, label: ['inkisar:2', 'tashih'] },
  // 'Aul bab 9 [R09-4]: 12 > 13, 15, 17 dan 6 > 8, 9.
  { id: '9-4 aul 12>13', pewaris: 'L', ahliWaris: { ISTRI: 1, IBU: 1, SAUDARI_KANDUNG: 2 }, label: ['aul', 'aul:12>13'] },
  { id: '9-4 aul 12>15', pewaris: 'L', ahliWaris: { ISTRI: 1, SAUDARI_KANDUNG: 2, SAUDARA_SEIBU: 2 }, label: ['aul', 'aul:12>15'] },
  { id: '9-4 aul 12>17', pewaris: 'L', ahliWaris: { ISTRI: 1, SAUDARI_KANDUNG: 2, SAUDARA_SEIBU: 2, IBU: 1 }, label: ['aul', 'aul:12>17'] },
  { id: '9-4 aul 6>8', pewaris: 'P', ahliWaris: { SUAMI: 1, SAUDARI_KANDUNG: 1, IBU: 1 }, label: ['aul', 'aul:6>8'] },
  { id: '9-4 aul 6>9', pewaris: 'P', ahliWaris: { SUAMI: 1, SAUDARI_KANDUNG: 2, SAUDARA_SEIBU: 2 }, label: ['aul', 'aul:6>9'] },
  // Pembanding sederhana dan kakek bersama saudara (bab 8).
  { id: 'ashabah bil ghair anak', pewaris: 'L', ahliWaris: { ANAK_LK: 1, ANAK_PR: 1 }, label: ['ashabahBilGhair'] },
  { id: 'suami + anak lk', pewaris: 'P', ahliWaris: { SUAMI: 1, ANAK_LK: 1 }, label: [] },
  { id: 'istri saja (sisa keluar, bukan radd)', pewaris: 'L', ahliWaris: { ISTRI: 1 }, label: [] },
  { id: 'ayah saja', pewaris: 'L', ahliWaris: { AYAH: 1 }, label: [] },
  { id: 'anak pr + istri radd', pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_PR: 1 }, label: ['radd'] },
  { id: 'ibu + saudari seibu radd', pewaris: 'L', ahliWaris: { IBU: 1, SAUDARI_SEIBU: 1 }, label: ['radd'] },
  { id: 'kakek + saudara kandung', pewaris: 'L', ahliWaris: { KAKEK: 1, SAUDARA_KANDUNG: 1 }, label: ['kakekSaudara'] },
  { id: 'mu\'addah', pewaris: 'L', ahliWaris: { KAKEK: 1, SAUDARA_KANDUNG: 1, SAUDARA_SEBAPAK: 1 }, label: ['bernama:muaddah', 'kakekSaudara'] },
  { id: 'anak pr + saudara kandung', pewaris: 'L', ahliWaris: { ANAK_PR: 1, SAUDARA_KANDUNG: 1 }, label: [] },
];

describe('label dari jejak engine untuk kasus bab 16', () => {
  test('jumlah kasus uji', () => expect(KASUS_BAB16.length).toBeGreaterThanOrEqual(30));

  for (const baris of KASUS_BAB16) {
    test(baris.id, () => {
      const soal = soalDariKode(buatKodeSoal(baris));
      if (!soal.ok) throw new Error(`soal tidak terbangun: ${soal.galat}`);
      const jumlah = Object.values(baris.ahliWaris).reduce((a, b) => a + b, 0);
      expect(soal.label).toContain(`jumlahAhliWaris:${jumlah}`);
      expect(soal.label.filter(token => !token.startsWith('jumlahAhliWaris:'))).toEqual([...baris.label].sort());
      expect(soal.label).toEqual([...soal.label].sort());
      expect(soal.kasus.jenisKasus).toBe('latihan');
    });
  }
});

describe('tingkat dan modul', () => {
  test('tingkat: tiap cabang aturan (keputusan pemilik 2026-11-26)', () => {
    // dasar: fardh/ashabah/hajb, boleh tashih ringan (1 kelompok)
    expect(tingkatSoal(['hajb:SAUDARA_KANDUNG', 'jumlahAhliWaris:4'])).toBe('dasar');
    expect(tingkatSoal(['jumlahAhliWaris:2'])).toBe('dasar');
    expect(tingkatSoal(['tashih', 'inkisar:1'])).toBe('dasar');
    // menengah: satu kaidah, tashih >= 2 kelompok, kakek-saudara, bil/ma'al ghair
    expect(tingkatSoal(['aul', 'aul:6>7'])).toBe('menengah');
    expect(tingkatSoal(['radd'])).toBe('menengah');
    expect(tingkatSoal(['tashih', 'inkisar:2'])).toBe('menengah');
    expect(tingkatSoal(['kakekSaudara'])).toBe('menengah');
    expect(tingkatSoal(['ashabahBilGhair'])).toBe('menengah');
    expect(tingkatSoal(['ashabahMaalGhair'])).toBe('menengah');
    expect(tingkatSoal(['ashabahBilGhair', 'tashih', 'inkisar:1'])).toBe('menengah');
    // sulit: dua kaidah hisab, inkisar >= 3, atau kasus bernama
    expect(tingkatSoal(['aul', 'aul:6>9', 'tashih', 'inkisar:1'])).toBe('sulit');
    expect(tingkatSoal(['radd', 'tashih', 'inkisar:1'])).toBe('sulit');
    expect(tingkatSoal(['tashih', 'inkisar:3'])).toBe('sulit');
    expect(tingkatSoal(['bernama:umariyyatain'])).toBe('sulit');
    expect(tingkatSoal(['bernama:muaddah', 'kakekSaudara'])).toBe('sulit');
  });

  test('modul: label → modul kurikulum, urut; tanpa kaidah lanjutan → bagian pasti dan ashabah', () => {
    expect(modulSoal(['aul', 'aul:6>7'])).toEqual([6]);
    expect(modulSoal(['tashih', 'inkisar:1'])).toEqual([7]);
    expect(modulSoal(['aul', 'tashih', 'bernama:akdariyyah', 'kakekSaudara'])).toEqual([6, 7, 10]);
    expect(modulSoal(['hajb:KAKEK'])).toEqual([5]);
    expect(modulSoal(['jumlahAhliWaris:3'])).toEqual([3, 4]);
  });

  test('setiap kasus bab 16 mendapat tingkat dan modul', () => {
    const akdariyyah = soalDariKode(buatKodeSoal(KASUS_BAB16.find(baris => baris.id.startsWith('16-12'))!));
    expect(akdariyyah).toMatchObject({ ok: true, tingkat: 'sulit', modul: [6, 7, 10] });
  });
});

describe('soalDariKode', () => {
  test('galat uraian diteruskan; kasus yang tak bisa dibangun → TIDAK_DIDUKUNG', () => {
    expect(soalDariKode('H-01')).toEqual({ ok: false, galat: 'BUKAN_KODE_GENERATOR' });
    expect(soalDariKode('G9-B-0000000000000000')).toEqual({ ok: false, galat: 'VERSI_TIDAK_DIKENAL' });
  });

  test('kasus sah acak selalu terbangun atau ditolak dengan galat, tidak pernah melempar', () => {
    fc.assert(fc.property(kasusBiasaSah, kasus => {
      const hasil = soalDariKode(buatKodeSoal(kasus));
      if (hasil.ok) {
        expect(hasil.label.some(token => token.startsWith('jumlahAhliWaris:'))).toBe(true);
        expect(hasil.modul.length).toBeGreaterThan(0);
      } else expect(hasil.galat).toBe('TIDAK_DIDUKUNG');
    }), { numRuns: 150 });
  });
});
