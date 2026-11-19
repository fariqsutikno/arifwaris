// Skrip belajar kasus biasa: pola tanya → dasar → keluarga → logika → hitung → jembatan, kalimat pendek, angka sama dengan tabel engine.
import { hitung } from '@waris/engine';
import { describe, expect, it } from 'vitest';
import { BAB16_FIXTURES, case01, case05, case03, case09, case10, case13, case23, caseNominal } from '../../../engine/src/__tests__/fixtures/bab16.js';
import { susunLinimasa, type Langkah } from '../linimasa.js';
import { keTeksBiasa } from '../segments.js';
import { kamusSnapshot } from './kamus.js';

// Templat sendiri ≤ ±30 kata; sisanya ruang untuk sebutan peran bertingkat yang panjang ("anak laki-laki dari cucu laki-laki dari anak laki-laki").
const BATAS_KATA_NARASI = 55;

function langkahDari(fixture: typeof case01, idTahap: string): Langkah[] {
  const hasil = hitung(fixture.input);
  if (hasil.status !== 'OK') throw new Error('kasus tidak OK');
  return susunLinimasa(hasil, fixture.input.graf, { kamus: kamusSnapshot }).tahap.find(tahap => tahap.id === idTahap)?.langkah ?? [];
}
const jenisDari = (daftar: Langkah[]) => daftar.map(satu => satu.jenis);
const teksNarasi = (satu: Langkah) => keTeksBiasa(satu.narasi);

describe('skrip belajar kasus biasa', () => {
  it('C16-01: tiap tahap berpola pertanyaan, dasar, keluarga, logika, hitungan, jembatan', () => {
    expect(jenisDari(langkahDari(case01, 'ahliWaris'))).toEqual(['peta', 'tanya', 'keluarga']);
    expect(jenisDari(langkahDari(case01, 'bagian'))).toEqual(['dasar', 'dasar', 'keluarga', 'keluarga', 'jembatan']);
    expect(jenisDari(langkahDari(case01, 'ashl'))).toEqual(['logika', 'hitung', 'hitung', 'hitung']);
    expect(jenisDari(langkahDari(case01, 'penyesuaian'))).toEqual(['tanya', 'hitung']);
    expect(jenisDari(langkahDari(case01, 'tashih'))).toEqual(['keluarga', 'keluarga', 'logika', 'logika', 'logika', 'hitung', 'hitung', 'jembatan']);
    expect(jenisDari(langkahDari(case01, 'hasil'))).toEqual(['hitung', 'hitung', 'hitung', 'ringkas']);
  });

  it('C16-01: angka tashih sama dengan tabel (21 potong, 14 dan 7, jumlah 24)', () => {
    const teks = langkahDari(case01, 'tashih').map(teksNarasi).join(' ');
    expect(teks).toContain('8 × 3 = 24 potong');
    expect(teks).toContain('anak laki-laki 14 potong dan anak perempuan 7 potong');
    expect(teks).toContain('Jumlahnya 24');
  });

  it("C16-05 ('aul): jembatan penyebut beda, lalu tahap 'aul: pertanyaan, alasan bersama, potong ulang, contoh", () => {
    expect(teksNarasi(langkahDari(case05, 'bagian').at(-1)!)).toContain('belum bisa dijumlahkan');
    expect(jenisDari(langkahDari(case05, 'penyesuaian'))).toEqual(['tanya', 'hitung', 'tanya', 'logika', 'logika', 'logika', 'hitung']);
    expect(langkahDari(case05, 'penyesuaian').map(teksNarasi).join(' ')).toContain('7 kotak');
    expect(jenisDari(langkahDari(case05, 'tashih'))).toEqual(['tanya', 'hitung', 'hitung', 'jembatan']);
  });

  it('C16-09 (radd tanpa pasangan): sisa ditanyakan, dasar radd, lalu dipotong ulang', () => {
    expect(jenisDari(langkahDari(case09, 'penyesuaian'))).toEqual(['tanya', 'hitung', 'tanya', 'dasar', 'keluarga', 'logika', 'hitung']);
    expect(teksNarasi(langkahDari(case09, 'penyesuaian').at(-1)!)).toContain('dari 4 kotak');
  });

  it('C16-10 (radd dengan pasangan): pasangan dikunci, sisa dibagi, hasil 16 potong', () => {
    const teks = langkahDari(case10, 'penyesuaian').map(teksNarasi).join(' ');
    expect(teks).toContain('tidak ikut radd');
    expect(teks).toContain('harta menjadi 16 potong');
    expect(teks).toContain('dari 16 kotak');
  });

  it('harta dengan potongan: tanya, dasar, pengurangan berurutan, hasil bersih', () => {
    const harta = langkahDari(caseNominal, 'harta');
    expect(jenisDari(harta)).toEqual(['peta', 'tanya', 'dasar', 'hitung', 'hitung', 'keluarga', 'hitung', 'keluarga']);
    const teks = harta.map(teksNarasi).join(' ');
    expect(teks).toContain('Harta Rp150.000.000 dikurangi biaya jenazah Rp5.000.000, tersisa Rp145.000.000');
    expect(teks).toContain('melebihi batas 1/3');
    expect(teks).toContain('Jadi yang dibagi kepada ahli waris: Rp80.000.000');
  });

  it('C16-23 (tashih dua kelompok): pengali bersama dicari, tiap kelompok dibagi', () => {
    const teks = langkahDari(case23, 'tashih').map(teksNarasi).join(' ');
    expect(teks).toContain('pengali bersama');
    expect(teks).toContain('habis dibagi');
  });

  it("C16-03 ('Umariyyatain): dasar kasus khusus, 1/3 sisa, dan ayah mengambil sisa karena TIDAK ada yang lebih dekat", () => {
    const bagian = langkahDari(case03, 'bagian');
    const teks = bagian.map(teksNarasi).join(' ');
    expect(teks).toContain("Ini disebut al-'Umariyyatain");
    expect(teks).toContain('Setelah istri mengambil 1/4, ibu mendapat 1/3 dari sisa itu, yaitu 1/4 dari seluruh harta');
    expect(teks).toContain('karena tidak ada anak laki-laki atau cucu laki-laki dari anak laki-laki');
    expect(bagian.every(satu => satu.jenis)).toBe(true);
  });

  it('C16-13 (musyarrakah): ibu turun karena dua saudara, lalu dasar musyarrakah dan bagian rata', () => {
    const teks = langkahDari(case13, 'bagian').map(teksNarasi).join(' ');
    expect(teks).toContain('punya dua saudara atau lebih');
    expect(teks).toContain('Ini disebut al-Musyarrakah');
    expect(teks).toContain('sama rata per orang');
  });

  it('kasus bernominal: ada langkah rupiah per orang dan pembukanya menyebut rupiah', () => {
    const hasil = langkahDari(caseNominal, 'hasil');
    expect(hasil.some(satu => teksNarasi(satu).includes('potong: Rp'))).toBe(true);
    expect(teksNarasi(langkahDari(caseNominal, 'harta')[0]!)).toContain('tiga hal');
  });

  it('semua kasus bab 16: tiap langkah berskrip pendek, bertanya hanya dengan tanda tanya, papan terisi', () => {
    for (const fixture of BAB16_FIXTURES) {
      const hasil = hitung(fixture.input);
      if (hasil.status !== 'OK' || hasil.tabel.baris.length === 0) continue;
      const linimasa = susunLinimasa(hasil, fixture.input.graf, { kamus: kamusSnapshot });
      for (const satu of linimasa.tahap.flatMap(tahap => tahap.langkah).filter(langkahIni => langkahIni.jenis)) {
        const narasi = teksNarasi(satu);
        expect(narasi.split(/\s+/).length, `${fixture.id}: ${narasi}`).toBeLessThanOrEqual(BATAS_KATA_NARASI);
        expect(keTeksBiasa(satu.papan).length, `${fixture.id}: papan kosong`).toBeGreaterThan(0);
        if (satu.jenis === 'tanya') expect(narasi, fixture.id).toMatch(/\?/);
      }
    }
  });
});
