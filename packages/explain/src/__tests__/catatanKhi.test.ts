// Narasi catatan KHI: kerangka kalimat lewat diksi (narasi.khi.*), isi butir dari KB (packages/content).
// Ditulis sebelum implementasi. Review Focus: madzhab pilihan menentukan kalimat fikih; tanpa kode teknis;
// tanpa kalimat fatwa; padanan sebagian menyebut yang belum tersedia.
import { CATATAN_KHI, type CatatanKhi } from '@waris/content';
import { describe, expect, test } from 'vitest';
import { jelaskanCatatanKhi, type PenjelasanCatatanKhi } from '../catatanKhi.js';
import { penyusunTes } from './kamus.js';

const MADZHAB = ['syafii', 'hanbali', 'hanafi', 'maliki'] as const;
const POLA_KODE_TEKNIS = /\bKHI-\d|\bR\d{2}-\d|\bK\d{2}[a-d]?-\d|\bPA-|\bS\d{2}\b|\bF\d{2}\b|shamela:|\[(SYF|HNB|HNF|MLK)\]/;
const jelaskan = (catatan: CatatanKhi, madzhab: (typeof MADZHAB)[number]): PenjelasanCatatanKhi =>
  jelaskanCatatanKhi(catatan, { madzhab, kamus: penyusunTes().kamus });
const semuaTeks = (hasil: PenjelasanCatatanKhi): string[] =>
  [hasil.judul, hasil.pasalLabel, hasil.tingkatLabel, hasil.penanda, hasil.penutup, ...hasil.bagian.flatMap(bagian => [bagian.judul, ...bagian.butir])];
const bagianJenis = (hasil: PenjelasanCatatanKhi, jenis: string) => hasil.bagian.find(bagian => bagian.jenis === jenis);

describe('jelaskanCatatanKhi: struktur', () => {
  test.each(CATATAN_KHI.flatMap(catatan => MADZHAB.map(madzhab => [catatan.id, madzhab] as const)))('%s / %s: bunyi, fikih, penanda, penutup', (id, madzhab) => {
    const catatan = CATATAN_KHI.find(entri => entri.id === id)!;
    const hasil = jelaskan(catatan, madzhab);
    expect(hasil.penanda).toBe('Hukum positif, bukan fikih');
    expect(hasil.pasalLabel).toBe(`Pasal ${catatan.pasal} KHI`);
    expect(bagianJenis(hasil, 'bunyi')?.butir).toEqual(catatan.bunyiKhi);
    expect(bagianJenis(hasil, 'fikih')?.butir.length).toBeGreaterThan(0);
    expect(hasil.penutup).toMatch(/bukan fatwa/);
  });

  test('tingkat dipetakan ke label', () => {
    const label = (id: string) => jelaskan(CATATAN_KHI.find(entri => entri.id === id)!, 'syafii').tingkatLabel;
    expect(label('pengganti')).toBe('Berbeda dari fikih');
    expect(label('ayah')).toBe('Selaras dengan fikih');
    expect(label('saudariKandungSeayah')).toBe('KHI tidak mengatur sampai rincian; hakim merujuk fikih');
  });
});

describe('jelaskanCatatanKhi: madzhab pilihan', () => {
  const pengganti = CATATAN_KHI.find(catatan => catatan.id === 'pengganti')!;
  const ayah = CATATAN_KHI.find(catatan => catatan.id === 'ayah')!;

  test('madzhab yang punya isi memakai isinya sendiri', () => {
    const hasil = bagianJenis(jelaskan(pengganti, 'hanbali'), 'fikih')!;
    expect(hasil.judul).toBe('Menurut fikih madzhab Hanbali');
    expect(hasil.butir).toEqual(pengganti.fikih.hanbali);
    expect(bagianJenis(jelaskan(pengganti, 'syafii'), 'fikih')!.butir).toEqual(pengganti.fikih.syafii);
  });

  test('madzhab tanpa isi jatuh ke Syafi\'i dengan keterangan', () => {
    const hasil = bagianJenis(jelaskan(ayah, 'maliki'), 'fikih')!;
    expect(hasil.judul).toBe('Madzhab Maliki belum dibahas pada butir ini; berikut menurut madzhab Syafi\'i');
    expect(hasil.butir).toEqual(ayah.fikih.syafii);
  });

  test('madzhab berbeda menghasilkan kalimat fikih berbeda', () => {
    expect(bagianJenis(jelaskan(pengganti, 'hanafi'), 'fikih')!.butir).not.toEqual(bagianJenis(jelaskan(pengganti, 'maliki'), 'fikih')!.butir);
  });
});

describe('jelaskanCatatanKhi: praktik PA, yang belum tersedia, jalan keluar', () => {
  test('pegangan lebih dulu, catatan diberi awalan', () => {
    const pengganti = CATATAN_KHI.find(catatan => catatan.id === 'pengganti')!;
    const butir = bagianJenis(jelaskan(pengganti, 'syafii'), 'praktik')!.butir;
    const pegangan = pengganti.praktikPa.filter(entri => entri.peran === 'pegangan').map(entri => entri.teks);
    const catatan = pengganti.praktikPa.filter(entri => entri.peran === 'catatan').map(entri => `Catatan: ${entri.teks}`);
    expect(butir).toEqual([...pegangan, ...catatan]);
  });

  test('bagian praktik, belum tersedia, jalan keluar, peringatan hanya ada bila ada isinya', () => {
    for (const catatan of CATATAN_KHI) {
      const hasil = jelaskan(catatan, 'syafii');
      expect(Boolean(bagianJenis(hasil, 'praktik')), `${catatan.id} praktik`).toBe(catatan.praktikPa.length > 0);
      expect(Boolean(bagianJenis(hasil, 'belum')), `${catatan.id} belum`).toBe(catatan.belumTersedia.length > 0);
      expect(Boolean(bagianJenis(hasil, 'jalan')), `${catatan.id} jalan`).toBe(catatan.jalanKeluar.length > 0);
      expect(Boolean(bagianJenis(hasil, 'peringatan')), `${catatan.id} peringatan`).toBe(catatan.peringatan !== undefined);
    }
  });

  test('padanan sebagian menyebut yang belum tersedia', () => {
    for (const catatan of CATATAN_KHI.filter(entri => entri.padananFikih === 'sebagian')) {
      expect(bagianJenis(jelaskan(catatan, 'syafii'), 'belum')?.butir, catatan.id).toEqual(catatan.belumTersedia);
    }
  });

  test('jalan keluar berupa kalimat dari diksi untuk setiap id', () => {
    const wasiat = CATATAN_KHI.find(catatan => catatan.id === 'wasiatWajibah')!;
    const butir = bagianJenis(jelaskan(wasiat, 'syafii'), 'jalan')!.butir;
    expect(butir).toHaveLength(wasiat.jalanKeluar.length);
    expect(butir[0]).toBe('Pewaris berwasiat secara sukarela, paling banyak sepertiga, untuk yang bukan ahli waris.');
  });
});

describe('jelaskanCatatanKhi: kualitas teks', () => {
  test('tanpa kode teknis, angka persen, atau bahasa perintah/fatwa kepada pengguna', () => {
    for (const catatan of CATATAN_KHI) {
      for (const madzhab of MADZHAB) {
        for (const teks of semuaTeks(jelaskan(catatan, madzhab))) {
          expect(teks, `${catatan.id}/${madzhab}: ${teks}`).not.toMatch(POLA_KODE_TEKNIS);
          expect(teks, `${catatan.id}/${madzhab}: ${teks}`).not.toMatch(/%|\bRp\b/);
          expect(teks, `${catatan.id}/${madzhab}: ${teks}`).not.toMatch(/\bAnda (harus|wajib)\b|\bsebaiknya Anda\b|\bhukumnya bagi Anda\b/i);
        }
      }
    }
  });

  test('murni: dua kali panggil menghasilkan hasil sama', () => {
    const catatan = CATATAN_KHI[0]!;
    expect(jelaskan(catatan, 'hanbali')).toEqual(jelaskan(catatan, 'hanbali'));
  });
});
