import { expect, it } from 'vitest';
import { GALAT_TAUTAN_DIPAKAI } from '../antarmuka.js';
import { buatMemori } from '../index.js';
import { buatMemoriPengguna } from '../memori/pengguna.js';

const pengaturan = { slug: 'kasus-a', akses: 'email' as const, email: ['Teman@Tes.local'] };

it('slug unik antar kasus, boleh dipakai ulang setelah berhenti', async () => {
  const bersama = buatMemori();
  const { bagikan } = buatMemoriPengguna(bersama);
  bersama.masukSebagai({ userId: 'p1', email: 'p1@tes.local' });
  await bagikan.simpan('r1', pengaturan, { a: 1 });
  await expect(bagikan.simpan('r2', pengaturan, {})).rejects.toThrow(GALAT_TAUTAN_DIPAKAI);
  await bagikan.simpan('r1', { ...pengaturan, slug: 'kasus-b' }, { a: 1 });
  await bagikan.simpan('r2', pengaturan, { a: 2 });
  await bagikan.berhenti('r2');
  expect(await bagikan.bacaPengaturan('r2')).toBeNull();
});

it('akses email: anon diminta masuk, email terdaftar boleh, lain ditolak; privat tidak bocor', async () => {
  const bersama = buatMemori();
  const { bagikan } = buatMemoriPengguna(bersama);
  bersama.masukSebagai({ userId: 'p1', email: 'p1@tes.local' });
  await bagikan.simpan('r1', pengaturan, { a: 1 });
  await bagikan.simpan('r2', { slug: 'pribadi', akses: 'privat', email: [] }, {});
  bersama.masukSebagai(null);
  expect(await bagikan.baca('kasus-a')).toEqual({ status: 'perlu_masuk' });
  bersama.masukSebagai({ userId: 'teman', email: 'teman@tes.local' });
  expect(await bagikan.baca('kasus-a')).toMatchObject({ status: 'ok', milikSendiri: false });
  expect(await bagikan.baca('pribadi')).toEqual({ status: 'tidak_ada' });
  bersama.masukSebagai({ userId: 'asing', email: 'asing@tes.local' });
  expect(await bagikan.baca('kasus-a')).toEqual({ status: 'tidak_boleh' });
});
