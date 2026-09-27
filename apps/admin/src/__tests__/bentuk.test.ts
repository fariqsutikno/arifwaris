// Tes bentuk editor hibrida: bolak-balik isi ↔ BentukEditor untuk materi (Markdown blok) dan soal hitung (bigint),
// plus JSON rusak & gagal Zod dikembalikan sebagai galat, bukan throw.
import { expect, test } from 'vitest';
import { tulisBlok } from '@waris/content';
import { keBentuk, dariBentuk } from '../editor/bentuk';
import { PELAJARAN_UJI, SOAL_HITUNG_UJI } from './contoh';

test('materi bolak-balik lewat Markdown blok', () => {
  const bentuk = keBentuk('materi', PELAJARAN_UJI);
  expect(bentuk.blok).toBe(tulisBlok(PELAJARAN_UJI.blok));
  expect(bentuk.json).not.toContain('"blok"');
  expect(dariBentuk('materi', PELAJARAN_UJI.slug, bentuk)).toEqual({ ok: true, isi: PELAJARAN_UJI });
});
test('soal hitung (bigint) bolak-balik', () => {
  expect(dariBentuk('soal_hitung', SOAL_HITUNG_UJI.kode, keBentuk('soal_hitung', SOAL_HITUNG_UJI)))
    .toEqual({ ok: true, isi: SOAL_HITUNG_UJI });
});
test('JSON rusak → galat, bukan throw', () => {
  const bentuk = { ...keBentuk('soal_hitung', SOAL_HITUNG_UJI), json: '{ rusak' };
  expect(dariBentuk('soal_hitung', 'x', bentuk)).toMatchObject({ ok: false, galat: expect.stringMatching(/^JSON tidak sah/) });
});
test('gagal Zod → galat berjalur', () => {
  const bentuk = keBentuk('soal_hitung', SOAL_HITUNG_UJI);
  const r = dariBentuk('soal_hitung', 'x', { ...bentuk, teks: { ...bentuk.teks, kode: 5 as unknown as string } });
  expect(r.ok).toBe(false);
});
