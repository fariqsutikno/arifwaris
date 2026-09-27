import { expect, test } from 'vitest';
import { pesanGalat } from '../pesanGalat';

test('pola yang dikenal diterjemahkan jadi kalimat yang bisa ditindaklanjuti', () => {
  expect(pesanGalat(new Error('faq wajib punya minimal satu ref'))).toMatch(/minimal satu rujukan/);
  expect(pesanGalat(new Error('ref tidak ada di KB: R99-1'))).toBe('Ada rujukan yang tidak dikenal. Pilih rujukan dari daftar.');
  expect(pesanGalat(new Error('duplicate key value violates unique constraint "entri_konten_jenis_slug_key"'))).toMatch(/sudah dipakai entri lain/);
  expect(pesanGalat(new TypeError('Failed to fetch'))).toMatch(/Tidak tersambung/);
  expect(pesanGalat({ message: 'JWT expired', code: 'PGRST301' })).toMatch(/Sesi Anda sudah habis/);
  expect(pesanGalat(new Error('akun belum pernah masuk: a@x.id'))).toMatch(/Akun a@x\.id belum pernah masuk ke portal/);
});

test('pesan lain: UUID dibuang, huruf pertama besar', () => {
  expect(pesanGalat(new Error('entri 3fa2b1c0-1234-4abc-8def-0123456789ab tidak ditemukan'))).toBe('Entri tidak ditemukan');
  expect(pesanGalat('')).toBe('Terjadi galat yang tidak dikenal.');
});
