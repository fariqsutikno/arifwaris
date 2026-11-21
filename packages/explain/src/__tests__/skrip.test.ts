// Skrip belajar kasus biasa: pola tanya → dasar → keluarga → logika → hitung → jembatan, kalimat pendek, angka sama dengan tabel engine.
import { hitung, type Ruleset } from '@waris/engine';
import { describe, expect, it } from 'vitest';
import { KASUS_KAKEK } from './kasusKakek.js';
import { KASUS_MADZHAB } from '../../../engine/src/__tests__/fixtures/madzhab.js';
import { BAB16_FIXTURES, input as inputBab16, p as orangBab16, case01, case05, case03, case08, case09, case10, case12, case13, case14, case23, caseNeg1, caseNeg2, caseNominal } from '../../../engine/src/__tests__/fixtures/bab16.js';
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

  it('C16-12 (akdariyyah): dasar kasus khusus, kakek 1/6, saudari 1/2, gabungan dibagi 2 : 1', () => {
    const bagian = langkahDari(case12, 'bagian');
    const teks = bagian.map(teksNarasi).join(' ');
    expect(teks).toContain("Ini disebut al-Akdariyyah");
    expect(teks).toContain('Kakek diberi 1/6.');
    expect(teks).toContain('1/6 + 1/2 = 2/3');
    expect(teks).toContain('dua kali bagian saudari');
    expect(bagian.every(satu => satu.jenis)).toBe(true);
  });

  it('C16-14 (kakek bersama saudara): dasar pilihan terbaik, pilihan dengan nilainya, yang terbesar dipilih', () => {
    const teks = langkahDari(case14, 'bagian').map(teksNarasi).join(' ');
    expect(teks).toContain('paling menguntungkannya');
    expect(teks).toContain('(muqasamah) = 3/16');
    expect(teks).toContain('Yang terbesar sepertiga sisa, yaitu 1/4');
    expect(teks).toContain('karena tidak ada anak laki-laki');
  });

  it("C16-08 (takmilah dan ma'a al-ghair): dasar pelengkap 2/3 dan saudari mengambil sisa", () => {
    const bagian = langkahDari(case08, 'bagian');
    const teks = bagian.map(teksNarasi).join(' ');
    expect(teks).toContain('sebagai pelengkap, supaya bagian mereka genap 2/3');
    expect(teks).toContain('mengambil sisa harta setelah bagian pasti dibagikan');
    expect(bagian.every(satu => satu.jenis)).toBe(true);
  });

  it('C16-23: nenek tanpa ibu punya dasar 1/6 dan alasan "tidak ada ibu"', () => {
    const teks = langkahDari(case23, 'bagian').map(teksNarasi).join(' ');
    expect(teks).toContain('Nenek mendapat 1/6 bila tidak ada ibu');
    expect(teks).toContain('tidak ada ibu, jadi');
  });

  it('mani\': pembunuh dan beda agama dijelaskan, lalu tinggal yang mewarisi', () => {
    for (const fixture of [caseNeg1, caseNeg2]) {
      const ahliWaris = langkahDari(fixture, 'ahliWaris');
      const teks = ahliWaris.map(teksNarasi).join(' ');
      expect(teks, fixture.id).toMatch(/membunuh|berbeda agama dengan/);
      expect(teks, fixture.id).toContain('jadi tidak mendapat warisan');
      expect(ahliWaris.every(satu => satu.jenis), fixture.id).toBe(true);
    }
  });

  it('khilaf madzhab: kalimat "Menurut madzhab …" masuk tahap siapa mewarisi, semua kasus overlay tidak melempar', () => {
    let jumlahKhilaf = 0;
    for (const kasus of KASUS_MADZHAB) {
      for (const ruleset of Object.keys(kasus.harapan) as Ruleset[]) {
        const masukan = { ...inputBab16(kasus.graf), ruleset };
        const hasil = hitung(masukan);
        if (hasil.status !== 'OK') continue;
        const linimasa = susunLinimasa(hasil, masukan.graf, { kamus: kamusSnapshot });
        if (!hasil.jejak.some(satu => satu.jenis === 'KHILAF_MADZHAB')) continue;
        jumlahKhilaf++;
        const teks = linimasa.tahap.find(tahap => tahap.id === 'ahliWaris')!.langkah.map(teksNarasi).join(' ');
        expect(teks, `${kasus.id} ${ruleset}`).toContain('Menurut madzhab');
      }
    }
    expect(jumlahKhilaf).toBeGreaterThan(0);
  });

  it('hanya suami yang mewarisi: sisa keluar dijelaskan, bukan di-radd', () => {
    const graf = { idPewaris: 'D', orang: { D: orangBab16('D', 'P', { statusHidup: 'wafat' }), H1: orangBab16('H1', 'L') }, pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' as const }] };
    const hasil = hitung(inputBab16(graf));
    if (hasil.status !== 'OK') throw new Error('kasus tidak OK');
    const linimasa = susunLinimasa(hasil, graf, { kamus: kamusSnapshot });
    const penyesuaian = linimasa.tahap.find(tahap => tahap.id === 'penyesuaian')!.langkah;
    expect(jenisDari(penyesuaian)).toEqual(['tanya', 'hitung', 'tanya', 'dasar', 'keluarga', 'hitung']);
    expect(penyesuaian.map(teksNarasi).join(' ')).toContain('suami atau istri tidak menerima radd');
    expect(linimasa.tahap.find(tahap => tahap.id === 'hasil')!.langkah.map(teksNarasi).join(' ')).toContain('Sisa: 1 bagian (1/2)');
  });

  it("tiga jalur kakek: muqasamah dengan arti, sisa sedikit (saudara tidak mendapat), mu'addah (sebapak dikembalikan)", () => {
    const teksKasus = (id: string) => {
      const kasus = KASUS_KAKEK.find(satu => satu.id === id)!;
      const hasil = hitung(kasus.input);
      if (hasil.status !== 'OK') throw new Error(hasil.status);
      const bagian = susunLinimasa(hasil, kasus.input.graf, { kamus: kamusSnapshot }).tahap.find(tahap => tahap.id === 'bagian')!.langkah;
      expect(bagian.every(satu => satu.jenis), id).toBe(true);
      return bagian.map(teksNarasi).join(' ');
    };
    const muqasamah = teksKasus('KK-1');
    expect(muqasamah).toContain('Muqasamah artinya kakek dihitung seperti satu saudara laki-laki');
    expect(muqasamah).toContain('(muqasamah) = 1/2');
    const sisaSedikit = teksKasus('KK-2');
    expect(sisaSedikit).toContain('sisa harta tinggal 1/6');
    expect(sisaSedikit).toContain('Sisa harta sudah habis, jadi saudara laki-laki kandung tidak mendapat bagian');
    expect(sisaSedikit).not.toContain('mengambil seluruh sisa');
    const muaddah = teksKasus('KK-3');
    expect(muaddah).toContain("Ini disebut al-Mu'addah");
    expect(muaddah).toContain('Saudara laki-laki kandung mengambil sisa harta, sedangkan saudara laki-laki sebapak tidak mendapat bagian');
  });

  it('semua ahli waris ashabah (KK-4): harta dipotong menurut jatah, tanpa pecahan untuk disamakan', () => {
    const kasus = KASUS_KAKEK.find(satu => satu.id === 'KK-4')!;
    const hasil = hitung(kasus.input);
    if (hasil.status !== 'OK') throw new Error(hasil.status);
    const ashl = susunLinimasa(hasil, kasus.input.graf, { kamus: kamusSnapshot }).tahap.find(tahap => tahap.id === 'ashl')!.langkah;
    expect(jenisDari(ashl)).toEqual(['logika', 'hitung', 'hitung']);
    const teks = ashl.map(teksNarasi).join(' ');
    expect(teks).toContain('laki-laki 2 jatah, perempuan 1 jatah');
    expect(teks).toContain('Totalnya 5 jatah');
    expect(teks).toContain('Angka 5 ini disebut asal masalah');
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
