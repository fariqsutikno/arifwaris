import { pecahan } from '@waris/math';
import { describe, expect, test } from 'vitest';
import * as bab16 from '../../__tests__/fixtures/bab16.js';
import { hitung } from '../../pipeline.js';
import type { InputEngine, HasilEngine, LangkahJejak } from '../../types.js';
import { hitungAshl } from '../ashl.js';
import { klasifikasikanMasalah } from '../klasifikasi.js';
import { buatKelompok } from '../model.js';
import { terapkanTashih } from '../tashih.js';
import { hitungTirkah } from '../tirkah.js';
import { ANAK, KANDUNG, SEBAPAK, keluarga } from './helpers.js';

type Ok = Extract<HasilEngine, { status: 'OK' }>;

function ok(input: InputEngine): Ok {
  const hasil = hitung(input);
  if (hasil.status !== 'OK') throw new Error(`${hasil.status}: ${JSON.stringify(hasil)}`);
  return hasil;
}

const daftarLangkah = <K extends LangkahJejak['jenis']>(input: InputEngine, jenis: K) =>
  ok(input).jejak.filter((s): s is Extract<LangkahJejak, { jenis: K }> => s.jenis === jenis);

const compares = (input: InputEngine, tujuan: string) =>
  daftarLangkah(input, 'PERBANDINGAN_NISAB').filter(s => s.tujuan === tujuan)
    .map(({ a, b, hubungan, fpb, hasil }) => ({ a, b, hubungan, fpb, hasil }));

describe('tahap 0 — tirkah [R01-1] [R01-4]', () => {
  test('uji nominal bab 16: wasiat dipotong ke 1/3 sisa setelah hutang', () => {
    const { bersih, jejak } = hitungTirkah(bab16.caseNominal.input.tirkah);
    expect(bersih).toBe(80_000_000n);
    expect(jejak).toMatchObject({
      jenis: 'TIRKAH', kotor: 150_000_000n, tajhiz: 5_000_000n, hutang: 25_000_000n,
      wasiatDiminta: 50_000_000n, wasiatBatas: 40_000_000n, wasiatDipakai: 40_000_000n, wasiatButuhIjazah: 10_000_000n,
    });
  });

  test('bab 1.5: hutang ≥ tirkah → tidak ada pembagian', () => {
    expect(hitungTirkah({ kotor: 10n, tajhiz: 2n, hutang: 20n, wasiat: 5n }).bersih).toBe(0n);
  });
});

describe('tahap 3 — ashlul mas\'alah [R09-1] [R10-1]', () => {
  test('setiap pasangan penyebut dibandingkan dengan nisab arba\'', () => {
    // Minbariyyah: 1/8, 1/6, 1/6, 2/3 → 8 vs 6 tawafuq → 24; 24 vs 3 tadakhul → 24.
    expect(compares(bab16.case06.input, 'ashl')).toEqual([
      { a: 8n, b: 6n, hubungan: 'tawafuq', fpb: 2n, hasil: 24n },
      { a: 24n, b: 3n, hubungan: 'tadakhul', fpb: 3n, hasil: 24n },
    ]);
    expect(compares(bab16.case02.input, 'ashl')).toEqual([{ a: 2n, b: 6n, hubungan: 'tadakhul', fpb: 2n, hasil: 6n }]);
    expect(compares(bab16.case04.input, 'ashl')).toEqual([{ a: 2n, b: 3n, hubungan: 'tabayun', fpb: 1n, hasil: 6n }]);
  });

  test('[R09-2] semua ashabah → ashl = jumlah ru\'us', () => {
    expect(hitungAshl([buatKelompok('ASHABAH', { S1: 2n, D1: 1n }, { jenis: 'ashabah', jenisAshabah: 'bilGhair' })]).ashl).toBe(3n);
  });
});

describe('tahap 4 — klasifikasi, \'aul, radd [R09-3] [R09-7]', () => {
  test('\'aul 24 → 27', () => {
    expect(daftarLangkah(bab16.case06.input, 'KELAS_MASALAH')).toMatchObject([{ kelas: 'ailah', jumlahSaham: 27n, ashl: 24n }]);
    expect(daftarLangkah(bab16.case06.input, 'AUL')).toMatchObject([{ dari: 24n, menjadi: 27n }]);
  });

  test('[R09-4] \'aul di luar 6→7..10, 12→13/15/17, 24→27 = pelanggaran invarian', () => {
    const fardh = (d: bigint, n = 1n) => ({ jenis: 'fardh' as const, fardh: pecahan(n, d) });
    const masalah = hitungAshl([
      buatKelompok('A', { a: 1n }, fardh(8n)), buatKelompok('B', { b: 1n }, fardh(3n, 2n)), buatKelompok('C', { c: 1n }, fardh(3n, 2n)),
    ]);
    expect(() => klasifikasikanMasalah(masalah, bab16.case01.input.konfigurasi, false)).toThrow(/R09-4/);
  });

  test('raddA: ashl diganti jumlah saham ahli radd', () => {
    expect(daftarLangkah(bab16.case09.input, 'KELAS_MASALAH')).toMatchObject([{ kelas: 'raddA', jumlahSaham: 4n, ashl: 6n }]);
    expect(daftarLangkah(bab16.case09.input, 'RADD')).toMatchObject([{ raddiyyah: { ashl: 4n }, hasil: 4n }]);
  });

  test('raddB: zawjiyyah vs raddiyyah — tabayun (kasus 10) dan habis (kasus 11)', () => {
    expect(daftarLangkah(bab16.case10.input, 'RADD')).toMatchObject([{
      zawjiyyah: { ashl: 4n, sahamPasangan: 1n, sisa: 3n }, raddiyyah: { ashl: 4n }, hasil: 16n,
    }]);
    expect(compares(bab16.case10.input, 'raddVsSisa')).toEqual([{ a: 3n, b: 4n, hubungan: 'tabayun', fpb: 1n, hasil: 16n }]);
    expect(compares(bab16.case11.input, 'raddVsSisa')).toEqual([{ a: 3n, b: 3n, hubungan: 'habis', fpb: 3n, hasil: 4n }]);
  });

  test('hanya pasangan: fardh penuh, sisa keluar ke baitul mal, tetap dihitung [R09-9] [R02-1]', () => {
    const hanyaIstri = keluarga({ W1: { jenisKelamin: 'P' } }, [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }]);
    const hasil = hitung(hanyaIstri);
    if (hasil.status !== 'OK') throw new Error(hasil.status);
    expect(hasil.sisaKeluar).toMatchObject({ tujuan: 'baitulMal', saham: 3n });
    expect(hasil.tabel.baris[0]!.perOrang['W1']!.saham).toBe(1n);
    expect(hasil.tabel.totalKolom).toEqual({ ashl: 4n });
    const bersih = hasil.jejak.find(langkah => langkah.jenis === 'TIRKAH')!;
    const total = hasil.tabel.baris[0]!.perOrang['W1']!.nominal + hasil.sisaKeluar!.nominal + hasil.pembulatan.sisaPembulatan;
    expect(total).toBe((bersih as { bersih: bigint }).bersih);
    expect(hasil.jejak).toContainEqual(expect.objectContaining({ jenis: 'SISA_KELUAR', tujuan: 'baitulMal', refs: ['R09-9', 'R02-1'] }));
  });

  test('hanya pasangan + dzawil arham hidup: sisa ke dzawil arham [R14-3]', () => {
    const denganKakekDariIbu = keluarga({ W1: { jenisKelamin: 'P' }, MGF: { jenisKelamin: 'L' } }, [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }]);
    expect(hitung(denganKakekDariIbu)).toMatchObject({ status: 'OK', sisaKeluar: { tujuan: 'dzawilArham', saham: 3n } });
  });

  test('kebijakanSisa baitulMal belum didukung', () => {
    const input = { ...bab16.case09.input, konfigurasi: { ...bab16.case09.input.konfigurasi, kebijakanSisa: 'baitulMal' as const } };
    expect(hitung(input)).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['R09-8'] });
  });
});

describe('tahap 5 — tashih [R10-2] [R10-3]', () => {
  test('inkisar: saham vs ru\'us hanya habis/tawafuq/tabayun (bab 10.3)', () => {
    // 4 istri, 3 saudara: istri 1 vs 4 → tabayun; saudara 3 vs 3 → habis.
    expect(compares(bab16.case22.input, 'inkisar')).toEqual([
      { a: 1n, b: 4n, hubungan: 'tabayun', fpb: 1n, hasil: 4n },
      { a: 3n, b: 3n, hubungan: 'habis', fpb: 3n, hasil: 1n },
    ]);
    expect(daftarLangkah(bab16.case22.input, 'TASHIH')).toMatchObject([{ dasar: 4n, juzSahm: 4n, hasil: 16n }]);
  });

  test('dua kelompok inkisar: simpanan dibandingkan dengan nisab arba\' → juz\' as-sahm', () => {
    expect(compares(bab16.case23.input, 'juzSahm')).toEqual([{ a: 2n, b: 3n, hubungan: 'tabayun', fpb: 1n, hasil: 6n }]);
    expect(daftarLangkah(bab16.case23.input, 'TASHIH')).toMatchObject([{ dasar: 6n, juzSahm: 6n, hasil: 36n }]);
  });

  test('akdariyyah: \'aul 9 lalu tashih 27', () => {
    expect(daftarLangkah(bab16.case12.input, 'AUL')).toMatchObject([{ dari: 6n, menjadi: 9n }]);
    expect(daftarLangkah(bab16.case12.input, 'TASHIH')).toMatchObject([{ dasar: 9n, juzSahm: 3n, hasil: 27n }]);
  });

  test('[R10-3] inkisar > 4 kelompok = pelanggaran invarian', () => {
    const daftarKelompok = ['A', 'B', 'C', 'D', 'E'].map(id =>
      buatKelompok(id, { [`${id}1`]: 1n, [`${id}2`]: 1n }, { jenis: 'fardh', fardh: pecahan(1n, 5n) }));
    const saham = Object.fromEntries(daftarKelompok.map(g => [g.id, 1n]));
    expect(() => terapkanTashih(daftarKelompok, saham, 5n)).toThrow(/R10-3/);
  });
});

describe('tabel mas\'alah', () => {
  test('kolom dinamis dan total', () => {
    expect(ok(bab16.case01.input).tabel).toMatchObject({
      kolom: ['fardh', 'ashl', 'tashih', 'perOrang', 'nominal'], totalKolom: { ashl: 8n, tashih: 24n },
    });
    expect(ok(bab16.case05.input).tabel).toMatchObject({
      kolom: ['fardh', 'ashl', 'aul', 'perOrang', 'nominal'], totalKolom: { ashl: 6n, aul: 7n },
    });
    expect(ok(bab16.case10.input).tabel.totalKolom).toEqual({ ashl: 12n, radd: 16n });
  });

  test('kelompok 2:1 punya bagian per orang berbeda', () => {
    const barisTabel = ok(bab16.case01.input).tabel.baris.find(r => r.kelompok === 'ASHABAH');
    expect(barisTabel?.sel).toMatchObject({ ashl: 7n, tashih: 21n });
    expect(barisTabel?.perOrang).toEqual({ S1: { saham: 14n, nominal: 0n }, D1: { saham: 7n, nominal: 0n } });
  });
});

describe('end-to-end bab 08 [SYF]', () => {
  const sahamDari = (input: InputEngine) => {
    const hasil = ok(input);
    const out: Record<string, bigint> = {};
    for (const barisTabel of hasil.tabel.baris) for (const [id, { saham }] of Object.entries(barisTabel.perOrang)) out[id] = saham;
    return out;
  };
  const kakek = { PGF: { jenisKelamin: 'L' } } as const;

  test('muqasamah: kakek + 1 saudara → 2 : kakek 1, saudara 1', () => {
    expect(sahamDari(keluarga({ ...kakek, AK1: { jenisKelamin: 'L', ...KANDUNG } }))).toEqual({ PGF: 1n, AK1: 1n });
  });

  test('[R08-4] mu\'addah: kakek, saudara kandung, saudara sebapak → 3 : 1, 2, 0', () => {
    expect(sahamDari(keluarga({ ...kakek, AK1: { jenisKelamin: 'L', ...KANDUNG }, AB1: { jenisKelamin: 'L', ...SEBAPAK } })))
      .toEqual({ PGF: 1n, AK1: 2n, AB1: 0n });
  });

  test('[R08-4] kakek, saudari kandung, saudara sebapak → 10 : 4, 5, 1', () => {
    expect(sahamDari(keluarga({ ...kakek, UK1: { jenisKelamin: 'P', ...KANDUNG }, AB1: { jenisKelamin: 'L', ...SEBAPAK } })))
      .toEqual({ PGF: 4n, UK1: 5n, AB1: 1n });
  });

  test('[R08-3] sisa ≤ 1/6: kakek 1/6 dengan \'aul, saudara gugur → 27', () => {
    const input = keluarga({
      ...kakek, M: { jenisKelamin: 'P' }, B1: { jenisKelamin: 'P', ...ANAK }, B2: { jenisKelamin: 'P', ...ANAK }, W1: { jenisKelamin: 'P' },
      AK1: { jenisKelamin: 'L', ...KANDUNG },
    }, [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }]);
    expect(sahamDari(input)).toEqual({ W1: 3n, B1: 8n, B2: 8n, M: 4n, PGF: 4n, AK1: 0n });
    expect(daftarLangkah(input, 'AUL')).toMatchObject([{ dari: 24n, menjadi: 27n }]);
  });
});
