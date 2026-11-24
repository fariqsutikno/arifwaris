import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { hitung } from '@waris/engine';
import { BAB16_FIXTURES } from '@waris/engine/fixtures/bab16';
import {
  bangunIndeksKontras, konteksDariHasil, nilaiSemuaKolom, petunjukKolom, susunTabelSoal,
  type EntriKontras, type HasilOk, type IsianTabel, type TabelSoal,
} from '../index.js';

const BERKAS_KONTRAS = new URL('../kontras.json', import.meta.url);
const hasilFixture = (id: string): HasilOk => {
  const fixture = BAB16_FIXTURES.find(kandidat => kandidat.id === id)!;
  const hasil = hitung(fixture.input);
  if (hasil.status !== 'OK') throw new Error(`${id} bukan OK`);
  return hasil;
};
const indeksBaru = bangunIndeksKontras(BAB16_FIXTURES.flatMap(fixture => {
  const hasil = hitung(fixture.input);
  return hasil.status === 'OK' ? [{ id: fixture.id, hasil }] : [];
}));

// Indeks disimpan sebagai berkas supaya web tidak membawa engine + fikstur; UPDATE_KONTRAS=1 menulis ulang.
if (process.env.UPDATE_KONTRAS) writeFileSync(BERKAS_KONTRAS, `${JSON.stringify(indeksBaru, null, 1)}\n`);
const indeks: EntriKontras[] = JSON.parse(readFileSync(BERKAS_KONTRAS, 'utf8'));

const isianKunci = (tabel: TabelSoal): IsianTabel => ({
  kepala: Object.fromEntries(tabel.kolom.filter(kolom => kolom.kepala !== undefined).map(kolom => [kolom.id, String(kolom.kepala)])),
  sel: Object.fromEntries(tabel.baris.map(baris => [baris.id, { ...baris.kunci }])),
});

function soal(id: string) {
  const hasil = hasilFixture(id);
  const tabel = susunTabelSoal(hasil, orang => orang) as TabelSoal;
  return { hasil, tabel, konteks: konteksDariHasil(hasil) };
}
function petunjukUntuk(id: string, ubah: (isian: IsianTabel, tabel: TabelSoal) => void) {
  const { tabel, konteks } = soal(id);
  const isian = isianKunci(tabel);
  ubah(isian, tabel);
  const hasilKolom = nilaiSemuaKolom(tabel, isian, null).find(kolom => kolom.status !== 'benar')!;
  return petunjukKolom({ tabel, hasil: hasilKolom, isian, konteks, indeksKontras: indeks });
}

describe('indeks kontras', () => {
  test('berkas kontras.json sesuai kasus bab 16 yang dijalankan engine (UPDATE_KONTRAS=1 untuk memperbarui)', () => {
    expect(indeks).toEqual(indeksBaru);
  });
  test('Istri: 1/4 tanpa far\'u warits berpasangan dengan 1/8 dengan far\'u warits [R04-2]', () => {
    const istri = indeks.filter(entri => entri.peran === 'ISTRI');
    expect(istri.map(entri => entri.bagian)).toEqual(expect.arrayContaining(['1/4', '1/8']));
    expect(new Set(istri.map(entri => entri.fokus))).toEqual(new Set(['keturunan']));
  });
});

describe('petunjukKolom — kolom pilihan', () => {
  test('bagian pasti salah besar → besarKeliru, arah keturunan, pasangan kontras tanpa baris soal ini', () => {
    const petunjuk = petunjukUntuk('C16-01', (isian, tabel) => {
      const istri = tabel.baris.find(baris => baris.kunci.bagian === '1/8')!;
      isian.sel[istri.id]!.bagian = '1/4';
    });
    expect(petunjuk.p1).toMatchObject({ kunci: 'pilihan.besarKeliru', fokus: ['keturunan'] });
    expect(petunjuk.p2.kunci).toBe('kontras');
    expect(petunjuk.p2.parameter).toMatchObject({ peran: 'ISTRI' });
    expect([petunjuk.p2.parameter.bagianA, petunjuk.p2.parameter.bagianB].sort()).toEqual(['1/4', '1/8']);
    expect(JSON.stringify(petunjuk)).not.toContain('"nama"'); // petunjuk 2 tidak menyebut baris
  });

  test('memilih Terhalang padahal mewarisi → terhalangKeliru', () => {
    const petunjuk = petunjukUntuk('C16-01', (isian, tabel) => { isian.sel[tabel.baris[0]!.id]!.bagian = 'Terhalang'; });
    expect(petunjuk.p1.kunci).toBe('pilihan.terhalangKeliru');
  });

  test('cara mewarisi keliru: Ashabah ↔ bagian pasti', () => {
    const petunjuk = petunjukUntuk('C16-01', (isian, tabel) => {
      const istri = tabel.baris.find(baris => baris.kunci.bagian === '1/8')!;
      isian.sel[istri.id]!.bagian = 'Ashabah';
    });
    expect(petunjuk.p1.kunci).toBe('pilihan.caraKeliru');
  });

  test('peran tanpa pasangan di bab 16 → p2.materi dengan bab dari peran', () => {
    const { tabel, konteks } = soal('C16-19'); // paman terhalang oleh ashabah lebih dekat [R05-3]
    const paman = tabel.baris.find(baris => konteks.peran[baris.id]?.startsWith('PAMAN'))!;
    const isian = isianKunci(tabel);
    isian.sel[paman.id]!.bagian = 'Ashabah';
    const hasilKolom = nilaiSemuaKolom(tabel, isian, null).find(kolom => kolom.status !== 'benar')!;
    const petunjuk = petunjukKolom({ tabel, hasil: hasilKolom, isian, konteks, indeksKontras: indeks });
    expect(petunjuk.p1).toMatchObject({ kunci: 'pilihan.mewarisiKeliru' });
    expect(petunjuk.p2).toEqual({ kunci: 'materi', parameter: { bab: '5.3' } });
    expect(petunjuk.p1.fokus).toContain('lebihDekat');
  });
});

describe('petunjukKolom — kolom bilangan dan templat umum', () => {
  test('kepala asal masalah salah → ashl; sel saham salah → saham', () => {
    expect(petunjukUntuk('C16-01', (isian, tabel) => { isian.kepala.ashl = '5'; void tabel; }).p1.kunci).toBe('ashl');
    const saham = petunjukUntuk('C16-01', (isian, tabel) => { isian.sel[tabel.baris[0]!.id]!.ashl = '99'; });
    expect(saham.p1.kunci).toBe('saham');
    expect(saham.p2.parameter.nama).toBeDefined(); // bilangan boleh menyebut baris
  });

  test('kepala akhir salah tanpa tashih → jumlahSaham', () => {
    const petunjuk = petunjukUntuk('C16-03', isian => { isian.kepala.akhir = '1'; });
    expect(petunjuk.p1.kunci).toBe('jumlahSaham');
  });

  test('kotak kosong → kosong (belum lengkap)', () => {
    const { tabel, konteks } = soal('C16-01');
    const isian = isianKunci(tabel);
    delete isian.sel[tabel.baris[0]!.id]!.bagian;
    const hasilKolom = nilaiSemuaKolom(tabel, isian, null).find(kolom => kolom.status !== 'benar')!;
    expect(petunjukKolom({ tabel, hasil: hasilKolom, isian, konteks, indeksKontras: indeks }).p1.kunci).toBe('kosong');
  });
});
