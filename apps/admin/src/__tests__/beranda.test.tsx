// Tes Beranda: angka ringkasan, "Lanjutkan pekerjaan" dengan catatan review, tombol buat baru disembunyikan untuk reviewer.
import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { Beranda } from '../layar/Beranda';
import { DAFTAR_FAQ_UJI, SOAL_HITUNG_UJI } from './contoh';

async function pasang(peranSaya: Peran) {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'penulis', rev: 'reviewer' } });
  const faq = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const drafFaq = await m.editorial.buatDraf(faq, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']);
  await m.editorial.ajukan(drafFaq);
  const soal = await m.editorial.buatEntri('soal_hitung', 'h-01', 10);
  await m.editorial.buatDraf(soal, 'soal_hitung', SOAL_HITUNG_UJI, ['R05-1']);
  m.masukSebagai({ userId: 'rev', email: 'rev@x.id' });
  await m.editorial.kembalikan(drafFaq, 'Lengkapi dalil');
  m.masukSebagai({ userId: 'u1', email: 'a@x.id' });
  m.aturPeranLangsung('u1', peranSaya);
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'a@x.id' }, peran: peranSaya }}>
      <Beranda />
    </KonteksRepo.Provider>,
  );
}

test('penulis: angka, lanjutkan pekerjaan dengan catatan, tombol buat baru', async () => {
  await pasang('penulis');
  const angka = await screen.findByRole('region', { name: 'Ringkasan' });
  expect(within(angka).getByText('Draf saya').parentElement!.textContent).toContain('1');
  expect(within(angka).getByText('Dikembalikan ke saya').parentElement!.textContent).toContain('1');
  const lanjut = screen.getByRole('region', { name: 'Lanjutkan pekerjaan' });
  expect(within(lanjut).getByText('Lengkapi dalil')).toBeTruthy();
  expect(within(lanjut).getByRole('link', { name: /Apa itu tirkah\?/ })).toBeTruthy();
  expect(screen.getByRole('link', { name: '+ Materi' }).getAttribute('href')).toBe('#/baru/materi');
});

test('reviewer: tanpa tombol buat baru', async () => {
  await pasang('reviewer');
  await screen.findByRole('region', { name: 'Ringkasan' });
  expect(screen.queryByRole('link', { name: '+ Materi' })).toBeNull();
});

test('admin: lanjutkan pekerjaan, menunggu review, dan buat baru tampil bersamaan; penulis tanpa daftar review', async () => {
  await pasang('admin');
  expect(await screen.findByRole('region', { name: 'Lanjutkan pekerjaan' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Menunggu review' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Buat baru' })).toBeTruthy();
});

test('penulis: tanpa daftar menunggu review', async () => {
  await pasang('penulis');
  await screen.findByRole('region', { name: 'Lanjutkan pekerjaan' });
  expect(screen.queryByRole('region', { name: 'Menunggu review' })).toBeNull();
});
