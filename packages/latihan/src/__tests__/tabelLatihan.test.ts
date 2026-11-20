import { describe, expect, test } from 'vitest';
import { hitung, KONFIGURASI_BAWAAN, type GrafKeluarga, type InputEngine, type Orang } from '@waris/engine';
import fc from 'fast-check';
import { nilaiSemuaKolom, nilaiTabel, pilihJangkar, putusanLatihan, putusanUjian, susunTabelSoal, tambahAhliWaris, kasusBaru, keInputEngine, type IsianTabel, type TabelSoal } from '../index.js';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });
const masukan = (graf: GrafKeluarga): InputEngine => ({ graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n },
  konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' });

// Bab 16.1: istri 1/8, anak lk + anak pr ashabah bil ghair; tashih 8 → 24.
const graf161: GrafKeluarga = { idPewaris: 'D', pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }], orang: {
  D: orang('D', 'L', { statusHidup: 'wafat' }), W1: orang('W1', 'P'),
  S1: orang('S1', 'L', { idAyah: 'D', idIbu: 'W1' }), D1: orang('D1', 'P', { idAyah: 'D', idIbu: 'W1' }) } };

// Ayah, ibu, saudara kandung: saudara terhalang oleh ayah.
const grafTerhalang: GrafKeluarga = { idPewaris: 'D', pernikahan: [], orang: {
  D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }), A: orang('A', 'L'), I: orang('I', 'P'),
  K: orang('K', 'L', { idAyah: 'A', idIbu: 'I' }) } };

function tabelDari(graf: GrafKeluarga): TabelSoal {
  const tabel = susunTabelSoal(hitung(masukan(graf)), id => id);
  if ('status' in tabel) throw new Error(tabel.status);
  return tabel;
}
const tabel161 = tabelDari(graf161);
const isianBenar = (): IsianTabel => ({ kepala: { ashl: '8', akhir: '24' }, sel: {
  W1: { bagian: '1/8', ashl: '1', akhir: '3' }, S1: { bagian: 'Ashabah', ashl: '7', akhir: '14' }, D1: { bagian: 'Ashabah', akhir: '7' } } });

const isianKunci = (tabel: TabelSoal): IsianTabel => ({
  kepala: Object.fromEntries(tabel.kolom.filter(kolom => kolom.kepala !== undefined).map(kolom => [kolom.id, String(kolom.kepala)])),
  sel: Object.fromEntries(tabel.baris.map(baris => [baris.id, { ...baris.kunci }])),
});
const sel = (hasil: ReturnType<typeof nilaiSemuaKolom>, idKolom: string) => hasil.find(kolom => kolom.idKolom === idKolom)!.sel;

describe('nilaiSemuaKolom — hasil per sel', () => {
  test('isian = kunci: semua kolom benar, semua sel benar dan benarEcf; sel bersama sekali, kepala terakhir', () => {
    const hasil = nilaiSemuaKolom(tabel161, isianKunci(tabel161), null);
    expect(hasil.map(kolom => [kolom.idKolom, kolom.status])).toEqual([['bagian', 'benar'], ['ashl', 'benar'], ['akhir', 'benar']]);
    expect(sel(hasil, 'ashl').map(s => s.idBaris)).toEqual(['W1', 'S1', 'kepala']);
    expect(hasil.flatMap(kolom => kolom.sel).every(s => s.benar && s.benarEcf && !s.kosong)).toBe(true);
  });

  test('kolom sesudah kolom salah tetap dinilai (tanpa kebijakan berhenti)', () => {
    const isian = isianKunci(tabel161);
    isian.sel.W1!.bagian = '1/4';
    const hasil = nilaiSemuaKolom(tabel161, isian, null);
    expect(hasil.map(kolom => kolom.status)).toEqual(['salah', 'benar', 'benar']);
  });

  test('Q-matriks: tahapan dan dimensi terpasang di kolom', () => {
    expect(tabel161.kolom.map(kolom => [kolom.tahapan, kolom.dimensi])).toEqual([
      ['keputusanFikih', 'kaidah'], ['hisabDasar', 'hisab'], ['hisabDasar', 'hisab']]);
  });

  test('jangkar ikut sebagai sel benar', () => {
    const isian = isianKunci(tabel161);
    delete isian.sel.W1!.akhir;
    const hasil = nilaiSemuaKolom(tabel161, isian, { idBaris: 'W1', idKolom: 'akhir' });
    expect(sel(hasil, 'akhir').find(s => s.idBaris === 'W1')).toMatchObject({ benar: true, kosong: false });
  });
});

describe('putusan', () => {
  test('putusanLatihan = nilaiTabel; berhenti di kolom pertama yang tidak benar', () => {
    const isian = isianKunci(tabel161);
    isian.sel.W1!.bagian = '1/4';
    expect(putusanLatihan(nilaiSemuaKolom(tabel161, isian, null))).toMatchObject({ jenis: 'salah', idKolom: 'bagian', idBarisSalah: ['W1'] });
  });

  test('putusanUjian: belumLengkap dihitung salah, semua kolom dilaporkan', () => {
    const isian = isianKunci(tabel161);
    delete isian.sel.S1!.akhir;
    isian.sel.W1!.bagian = '1/4';
    const putusan = putusanUjian(nilaiSemuaKolom(tabel161, isian, null));
    expect(putusan).toMatchObject({ benar: 1, total: 3 });
    expect(putusan.kolom.map(kolom => kolom.status)).toEqual(['salah', 'benar', 'belumLengkap']);
  });
});

describe('ECF [KH]', () => {
  // Pelajar salah di Bagian (istri 1/4, bukan 1/8) tetapi menghitung konsisten dengan pilihannya.
  const isianSalahBagian = (): IsianTabel => ({ kepala: { ashl: '4', akhir: '24' }, sel: {
    W1: { bagian: '1/4', ashl: '1', akhir: '6' }, S1: { bagian: 'Ashabah', ashl: '3', akhir: '12' }, D1: { bagian: 'Ashabah', akhir: '6' } } });

  test('salah Bagian, hitungan konsisten: Asal masalah dan akhir salah tetapi benarEcf benar', () => {
    const hasil = nilaiSemuaKolom(tabel161, isianSalahBagian(), null);
    const ashl = sel(hasil, 'ashl'), akhir = sel(hasil, 'akhir');
    expect(ashl.filter(s => s.idBaris !== 'kepala').every(s => !s.benar && s.benarEcf)).toBe(true);
    expect(akhir.every(s => s.benarEcf)).toBe(true);
    expect(akhir.filter(s => s.idBaris !== 'kepala').some(s => !s.benar)).toBe(true);
  });

  test('hitungan tidak konsisten dengan pilihannya sendiri: benarEcf salah', () => {
    const isian = isianSalahBagian();
    isian.sel.W1!.ashl = '2';
    expect(sel(nilaiSemuaKolom(tabel161, isian, null), 'ashl').find(s => s.idBaris === 'W1')).toMatchObject({ benar: false, benarEcf: false });
  });

  test("'aul dari saham pelajar: Σ saham melebihi kepala, asal masalah akhir mengikuti 'aul pelajar", () => {
    let kasus = kasusBaru('P', 'latihan');
    for (const kunci of ['SUAMI', 'IBU', 'SAUDARI_KANDUNG', 'SAUDARI_KANDUNG'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, kasus.graf.idPewaris, kunci) };
    const tabel = susunTabelSoal(hitung(keInputEngine(kasus)), id => id);
    if ('status' in tabel) throw new Error(tabel.status);
    const [suami, ibu, saudari1, saudari2] = tabel.baris.map(baris => baris.id) as [string, string, string, string];
    expect(tabel.kolom.map(kolom => kolom.kepala)).toEqual([undefined, 6n, 8n]);
    // Suami dipilih 1/4 (salah, kunci 1/2); selebihnya konsisten dengan pilihan itu: 3 + 2 + 8 = 13 > 12 → 'aul.
    const isian: IsianTabel = { kepala: { ashl: '12', akhir: '13' }, sel: {
      [suami]: { bagian: '1/4', ashl: '3', akhir: '3' }, [ibu]: { bagian: '1/6', ashl: '2', akhir: '2' },
      [saudari1]: { bagian: '2/3', ashl: '8', akhir: '4' }, [saudari2]: { bagian: '2/3', akhir: '4' } } };
    const hasil = nilaiSemuaKolom(tabel, isian, null);
    expect(sel(hasil, 'ashl').find(s => s.idBaris === suami)).toMatchObject({ benar: false, benarEcf: true });
    expect(sel(hasil, 'akhir').filter(s => s.idBaris !== 'kepala').map(s => [s.benar, s.benarEcf])).toEqual([[false, true], [false, true], [false, true], [false, true]]);
  });

  test('properti: isian = kunci → benar dan benarEcf di semua sel, untuk himpunan ahli waris acak', () => {
    const kunciPilihan = ['SUAMI', 'IBU', 'AYAH', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEIBU', 'SAUDARI_SEBAPAK', 'KAKEK', 'NENEK_DARI_IBU'] as const;
    let dicoba = 0;
    fc.assert(fc.property(fc.subarray([...kunciPilihan], { minLength: 1 }), daftar => {
      let kasus = kasusBaru('P', 'latihan');
      for (const kunci of daftar) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, kasus.graf.idPewaris, kunci) };
      const hasil = hitung(keInputEngine({ ...kasus, tirkah: { ...kasus.tirkah, kotor: 1_000n } }));
      const tabel = susunTabelSoal(hasil, id => id);
      if ('status' in tabel) return true;
      dicoba += 1;
      return nilaiSemuaKolom(tabel, isianKunci(tabel), null).flatMap(kolom => kolom.sel).every(s => s.benar && s.benarEcf);
    }), { numRuns: 200 });
    expect(dicoba).toBeGreaterThan(20);
  });
});

describe('susunTabelSoal — soal biasa dari keluaran engine', () => {
  test('16.1: bagian, asal masalah 8, asal masalah akhir 24', () => {
    expect(tabel161.kolom.map(kolom => [kolom.id, kolom.kepala])).toEqual([['bagian', undefined], ['ashl', 8n], ['akhir', 24n]]);
    expect(tabel161.baris.map(baris => [baris.id, baris.kunci])).toEqual([
      ['W1', { bagian: '1/8', ashl: '1', akhir: '3' }],
      ['S1', { bagian: 'Ashabah', ashl: '7', akhir: '14' }],
      ['D1', { bagian: 'Ashabah', ashl: '7', akhir: '7' }],
    ]);
  });

  test('sel bersama hanya pada kelompok beranggota > 1', () => {
    const [istri, anakLk, anakPr] = tabel161.baris;
    expect(istri!.kelompok).toEqual({});
    expect(anakLk!.kelompok.ashl).toBeDefined();
    expect(anakLk!.kelompok.ashl).toBe(anakPr!.kelompok.ashl);
  });

  test('orang terhalang: kunci Bagian saja, tanpa saham', () => {
    const terhalang = tabelDari(grafTerhalang).baris.find(baris => baris.id === 'K')!;
    expect(terhalang.kunci).toEqual({ bagian: 'Terhalang' });
  });

  test('jenis lain (taqdir, hasil tak OK) → TIDAK_DIDUKUNG', () => {
    expect(susunTabelSoal({ status: 'PERLU_INPUT', pertanyaan: [] }, id => id)).toEqual({ status: 'TIDAK_DIDUKUNG' });
  });
});

describe('nilaiTabel — aturan B6', () => {
  test('semua benar → benar, tanpa bentuk terkecil', () => {
    expect(nilaiTabel(tabel161, isianBenar(), null)).toEqual({ jenis: 'benar', bentukTerkecil: [] });
  });

  test('kolom Bagian belum lengkap → berhenti di kolom itu', () => {
    const isian = isianBenar();
    delete isian.sel.W1!.bagian;
    expect(nilaiTabel(tabel161, isian, null)).toMatchObject({ jenis: 'belumLengkap', idKolom: 'bagian', idBarisKosong: ['W1'] });
  });

  test('salah di Bagian → kolom sesudahnya tidak diperiksa', () => {
    const isian = isianBenar();
    isian.sel.W1!.bagian = '1/4';
    isian.kepala.ashl = '';
    expect(nilaiTabel(tabel161, isian, null)).toMatchObject({ jenis: 'salah', idKolom: 'bagian', idBarisSalah: ['W1'] });
  });

  test('kepala kosong → belum lengkap', () => {
    const isian = isianBenar();
    isian.kepala.ashl = '';
    expect(nilaiTabel(tabel161, isian, null)).toMatchObject({ jenis: 'belumLengkap', idKolom: 'ashl', kepalaKosong: true });
  });

  test('sebanding diterima: asal masalah 16 dengan saham 2 dan 14 bersama; bentuk terkecil dilaporkan', () => {
    const isian = isianBenar();
    isian.kepala.ashl = '16';
    isian.sel.W1!.ashl = '2';
    isian.sel.S1!.ashl = '14';
    const hasil = nilaiTabel(tabel161, isian, null);
    expect(hasil).toEqual({ jenis: 'benar', bentukTerkecil: [{ idKolom: 'ashl', idJudul: 'asalMasalah', diisi: 16n, terkecil: 8n }] });
  });

  test('kepala bukan kelipatan kunci → kepala salah', () => {
    const isian = isianBenar();
    isian.kepala.akhir = '30';
    expect(nilaiTabel(tabel161, isian, null)).toMatchObject({ jenis: 'salah', idKolom: 'akhir', kepalaSalah: true });
  });

  test('sel bersama dinilai sekali: baris kedua kelompok tidak perlu diisi di kolom bersama', () => {
    const isian = isianBenar();
    isian.sel.D1 = { bagian: 'Ashabah', akhir: '7' };
    expect(nilaiTabel(tabel161, isian, null).jenis).toBe('benar');
  });

  test('saham salah → sel itu ditandai', () => {
    const isian = isianBenar();
    isian.sel.D1!.akhir = '8';
    expect(nilaiTabel(tabel161, isian, null)).toMatchObject({ jenis: 'salah', idKolom: 'akhir', idBarisSalah: ['D1'], kepalaSalah: false });
  });

  test('angka Arab-Hindi dibaca sebagai Latin', () => {
    const isian = isianBenar();
    isian.sel.W1!.akhir = '٣';
    expect(nilaiTabel(tabel161, isian, null).jenis).toBe('benar');
  });

  test('jangkar: selnya dianggap terisi, dan kepala kolomnya harus persis kunci', () => {
    const jangkar = { idBaris: 'W1', idKolom: 'akhir' };
    const isian = isianBenar();
    delete isian.sel.W1!.akhir;
    expect(nilaiTabel(tabel161, isian, jangkar).jenis).toBe('benar');
    isian.kepala.akhir = '48';
    isian.sel.S1!.akhir = '28';
    isian.sel.D1!.akhir = '14';
    expect(nilaiTabel(tabel161, isian, jangkar)).toMatchObject({ jenis: 'salah', idKolom: 'akhir', kepalaSalah: true });
  });
});

describe('pilihJangkar', () => {
  test('hanya sel saham berkunci, bukan bersama, bukan kolom pilihan', () => {
    const semua = new Set<string>();
    for (let indeks = 0; indeks < 20; indeks += 1) {
      const jangkar = pilihJangkar(tabel161, () => indeks / 20)!;
      semua.add(`${jangkar.idBaris}|${jangkar.idKolom}`);
    }
    // Calon: istri@ashl, istri@akhir, anak lk@akhir, anak pr@akhir (ashl anak = bersama).
    expect([...semua].sort()).toEqual(['D1|akhir', 'S1|akhir', 'W1|akhir', 'W1|ashl']);
  });

  test('deterministik untuk acak yang sama; batas atas acak = 1 tetap sah', () => {
    expect(pilihJangkar(tabel161, () => 0)).toEqual({ idBaris: 'W1', idKolom: 'ashl' });
    expect(pilihJangkar(tabel161, () => 1)).toEqual({ idBaris: 'D1', idKolom: 'akhir' });
  });

  test('tanpa calon → null', () => {
    expect(pilihJangkar({ kolom: [], baris: [] }, () => 0.5)).toBeNull();
  });
});
