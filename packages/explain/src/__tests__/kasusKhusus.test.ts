import { hitungGharqa, hitungTaqdir, type GrafKeluarga, type InputEngine, type InputGharqa } from '@waris/engine';
import { describe, expect, test } from 'vitest';
import { grafG1 } from '../../../engine/src/__tests__/fixtures/gharqa.js';
import { TAQDIR_FIXTURES } from '../../../engine/src/__tests__/fixtures/taqdir.js';
import { jelaskanGharqa, jelaskanTaqdir, keTeksBiasa, type PenjelasanKasusKhusus } from '../index.js';
import { kamusSnapshot } from './kamus.js';

const SEJUTA = { kotor: 7_200_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

function taqdir(id: string): PenjelasanKasusKhusus {
  const fixture = TAQDIR_FIXTURES.find(butir => butir.id === id)!;
  const hasil = hitungTaqdir({ ...fixture.input, tirkah: SEJUTA });
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  return jelaskanTaqdir(hasil, fixture.input.graf, { kamus: kamusSnapshot });
}

function gharqa(ruleset: InputEngine['ruleset'], keadaan: InputGharqa['keadaan'], anggota: string[]): PenjelasanKasusKhusus {
  const dasar: InputEngine = { graf: grafG1, tirkah: SEJUTA, pembulatan: { satuan: 1n },
    konfigurasi: { kebijakanSisa: 'radd', talakBainSaatMaradh: 'qaulJadid' }, ruleset, versiKb: 'uji' };
  const hasil = hitungGharqa({ dasar, anggota, keadaan, tirkah: { ZAID: { ...SEJUTA, kotor: 1_440_000n } } });
  if (hasil.status !== 'OK' && hasil.status !== 'MAUQUF') throw new Error(hasil.status);
  return jelaskanGharqa(hasil, grafG1, keadaan, { kamus: kamusSnapshot });
}

const judul = (penjelasan: PenjelasanKasusKhusus) => penjelasan.daftarBagian.map(bagian => bagian.judul);
const teksBagian = (penjelasan: PenjelasanKasusKhusus, indeks: number) =>
  penjelasan.daftarBagian[indeks]!.daftarBab.flatMap(bab => bab.daftarBaris.map(keTeksBiasa));

describe('Penjelasan taqdir', () => {
  test('H1 [SYF]: 6 kemungkinan, mitra ashabah haml kelas D, mauquf beserta rupiah', () => {
    const penjelasan = taqdir('H1-SYF');
    expect(judul(penjelasan)).toEqual(['Ahli waris yang belum pasti', 'Semua kemungkinan', 'Yang dibagi sekarang']);
    expect(penjelasan.daftarBagian[1]!.daftarBab).toHaveLength(6);
    expect(teksBagian(penjelasan, 1)[0]).toBe('Jika janin yang dikandung ibu lahir tidak hidup:');
    expect(teksBagian(penjelasan, 2)).toEqual([
      'Ibu menerima bagian terkecilnya: 12/72 = Rp1.200.000.',
      'Saudara laki-laki kandung belum menerima apa pun: ia berbagi ashabah dengan janin yang jumlahnya tidak dibatasi, jadi bagiannya belum dapat dipastikan.',
      'Bagian janin yang dikandung ibu ditahan seluruhnya.',
      'Ditahan (mauquf): 60/72 = Rp6.000.000.',
    ]);
  });

  test('X2 [HNF]: khuntsa disebut dengan dua kemungkinan perannya; tanpa tabel kemungkinan', () => {
    const penjelasan = taqdir('X2-HNF');
    expect(judul(penjelasan)).toEqual(['Ahli waris yang belum pasti', 'Yang dibagi sekarang']);
    expect(teksBagian(penjelasan, 0)[2]).toContain('Menurut madzhab Hanafi, khuntsa (saudara laki-laki sebapak atau saudara perempuan sebapak) diberi');
    expect(teksBagian(penjelasan, 1)).toContain('Tidak ada bagian yang ditahan.');
  });

  test('X5b [MLK]: setengah-setengah — "menerima", bukan "bagian terkecilnya"', () => {
    expect(teksBagian(taqdir('X5b-MLK'), 1)[0]).toBe('Suami menerima: 21/48 = Rp3.150.000.');
  });

  test('F1: mafqud ditahan; pembuka menyebut hukum asal hidup', () => {
    const penjelasan = taqdir('F1');
    expect(teksBagian(penjelasan, 0)[1]).toContain('Hukum asalnya ia masih hidup');
    expect(teksBagian(penjelasan, 2)).toContain('Bagian saudara laki-laki sebapak kedua ditahan seluruhnya.');
  });
});

describe('Penjelasan gharqa', () => {
  test('G1 [HNB] tilad: tharif diteruskan, jami\'ah sama dengan kitab', () => {
    const penjelasan = gharqa('hanbali', 'tidakDiketahui', ['ZAID', 'AMR', 'BAKR']);
    expect(judul(penjelasan)).toEqual(['Wafat bersamaan', 'Pembagian harta masing-masing']);
    const hartaBakr = penjelasan.daftarBagian[1]!.daftarBab[2]!.daftarBaris.map(keTeksBiasa);
    expect(hartaBakr[1]).toMatch(/jami'ah menjadi 72\.$/);
  });

  test('[SYF] keadaan 3: satu bagian per urutan yang mungkin', () => {
    expect(judul(gharqa('syafii', 'terlupakan', ['ZAID', 'AMR']))).toEqual([
      'Wafat bersamaan', 'Jika urutannya almarhum → saudara laki-laki sebapak', 'Jika urutannya saudara laki-laki sebapak → almarhum',
    ]);
  });
});

describe('Penjelasan gharqa × taqdir (13.0b)', () => {
  const grafHaml: GrafKeluarga = { ...grafG1, orang: { ...grafG1.orang,
    JANIN: { id: 'JANIN', jenisKelamin: 'L' as const, statusHidup: 'dalamKandungan' as const, agama: 'islam' as const, idAyah: 'AMR', idIbu: 'AW' } } };
  const jelaskan = (ruleset: InputEngine['ruleset'], graf = grafHaml) => {
    const dasar: InputEngine = { graf, tirkah: SEJUTA, pembulatan: { satuan: 1n },
      konfigurasi: { kebijakanSisa: 'radd', talakBainSaatMaradh: 'qaulJadid' }, ruleset, versiKb: 'uji' };
    const hasil = hitungGharqa({ dasar, anggota: ['ZAID', 'AMR', 'BAKR'], keadaan: 'tidakDiketahui', tirkah: { AMR: SEJUTA } });
    if (hasil.status !== 'OK') throw new Error(hasil.status);
    return jelaskanGharqa(hasil, graf, 'tidakDiketahui', { kamus: kamusSnapshot });
  };

  test('[SYF] harta yang memuat haml menyebut bagian yang ditahan', () => {
    const teks = teksBagian(jelaskan('syafii'), 1);
    expect(teks).toContain('Bagian janin yang dikandung istri dari almarhum ditahan seluruhnya.');
    expect(teks).toContain('Ditahan (mauquf): 1260/1440 = Rp6.300.000.');
    expect(teks.some(baris => baris.includes('Kerabat'))).toBe(false);
  });

  test('[MLK] harta yang ditahan seluruhnya dijelaskan, bukan dikosongkan', () => {
    const { AD1: _a, AD2: _b, ZD: _c, ...orang } = grafHaml.orang;
    expect(teksBagian(jelaskan('maliki', { ...grafHaml, orang }), 1)).toContain(
      'Seluruh harta ini ditahan sampai janin lahir, sesuai madzhab Maliki.');
  });
});
