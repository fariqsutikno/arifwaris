import { describe, expect, test } from 'vitest';
import type { HasilKolom, IsianTabel, TabelSoal } from '@waris/latihan';
import { isianDenganKolomDibuka, kolomSasaran, penandaXp, predikatDari, semuaKolomTabel } from '../tanggaBantuan';

const kolomHasil = (idKolom: string, status: HasilKolom['status']): HasilKolom => ({ idKolom, idJudul: idKolom, status, sel: [] });
const tabel = {
  kolom: [
    { id: 'bagian', idJudul: 'bagian', jenis: 'pilih' }, { id: 'asal', idJudul: 'asalMasalah', jenis: 'bulat', kepala: 24n },
    { id: 'terkunci', idJudul: 'x', jenis: 'bulat', kepala: 1n, terkunci: true },
  ],
  baris: [{ id: 'a', nama: 'A', kunci: { bagian: '1/8', asal: '3', terkunci: '1' }, kelompok: {} }, { id: 'b', nama: 'B', kunci: { bagian: 'Ashabah', asal: '21' }, kelompok: {} }],
  pengali: { kunci: { m1: 2n }, kolomJamiah: 'm1' },
} as unknown as TabelSoal;

describe('kolomSasaran', () => {
  test('kolom pertama yang belum benar; yang dibuka dilewati', () => {
    const hasil = [kolomHasil('bagian', 'benar'), kolomHasil('asal', 'salah'), kolomHasil('pengali', 'belumLengkap')];
    expect(kolomSasaran(hasil, new Set())).toBe('asal');
    expect(kolomSasaran(hasil, new Set(['asal']))).toBe('pengali');
    expect(kolomSasaran(hasil, new Set(['asal', 'pengali']))).toBeNull();
  });
});

describe('isianDenganKolomDibuka', () => {
  const isian: IsianTabel = { kepala: {}, sel: { a: { bagian: 'Terhalang' } } };
  test('tanpa kolom dibuka → isian yang sama', () => expect(isianDenganKolomDibuka(tabel, isian, new Set())).toBe(isian));
  test('kolom pilihan dan bulat berkepala diisi kunci; kolom lain dan isian asli utuh', () => {
    const hasil = isianDenganKolomDibuka(tabel, isian, new Set(['bagian', 'asal']));
    expect(hasil.sel.a).toEqual({ bagian: '1/8', asal: '3' });
    expect(hasil.sel.b).toEqual({ bagian: 'Ashabah', asal: '21' });
    expect(hasil.kepala).toEqual({ asal: '24' });
    expect(isian.sel.a).toEqual({ bagian: 'Terhalang' });
  });
  test('baris pengali diisi dari kunci pengali', () => expect(isianDenganKolomDibuka(tabel, isian, new Set(['pengali'])).pengali).toEqual({ m1: '2' }));
});

test('semuaKolomTabel melewati kolom terkunci dan menambah pengali', () => expect(semuaKolomTabel(tabel)).toEqual(['bagian', 'asal', 'pengali']));

describe('predikat dan penanda XP', () => {
  test('dibuka mengalahkan petunjuk', () => {
    expect(predikatDari({ petunjuk: true, dibuka: true })).toBe('dibuka');
    expect(predikatDari({ petunjuk: true, dibuka: false })).toBe('petunjuk');
    expect(predikatDari({ petunjuk: false, dibuka: false })).toBe('mandiri');
  });
  test('bonus utuh, lepas karena petunjuk atau salah > 3, hangus, atau sudah pernah benar', () => {
    const awal = { xpMasihAda: true, xpHangus: false, petunjuk: false, salah: 3 };
    expect(penandaXp(20, awal)).toEqual({ jenis: 'bonus', dasar: 12, bonus: 8 });
    expect(penandaXp(20, { ...awal, salah: 4 })).toEqual({ jenis: 'bonusLepas', dasar: 12 });
    expect(penandaXp(20, { ...awal, petunjuk: true })).toEqual({ jenis: 'bonusLepas', dasar: 12 });
    expect(penandaXp(20, { ...awal, xpHangus: true })).toEqual({ jenis: 'hangus' });
    expect(penandaXp(20, { ...awal, xpMasihAda: false })).toBeNull();
  });
});

test('soal tanpa XP (bobot 0, soal bank) tidak memberi penanda, juga saat petunjuk dibuka', () => {
  expect(penandaXp(0, { xpMasihAda: true, xpHangus: true, petunjuk: true, salah: 0 })).toBeNull();
});
