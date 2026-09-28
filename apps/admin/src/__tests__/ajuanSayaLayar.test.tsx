// Tes layar Ajuan saya: tab berjumlah, catatan reviewer + nama, tautan Perbaiki ke editor, teks aplikasi dibuka di
// dialog, dan membuka layar menandai kabar sudah dilihat.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import { KonteksRepo } from '../repo';
import { AjuanSaya } from '../layar/AjuanSaya';
import { bacaTerakhirDibuka } from '../editor/ajuanSaya';
import { DAFTAR_FAQ_UJI } from './contoh';

test('dikembalikan & disetujui tampil di tabnya; Perbaiki menaut ke editor; teks aplikasi dibuka di dialog', async () => {
  const PENULIS = { userId: 'u1', email: 'a@x.id' };
  const m = buatMemori({ refs: ['R05-1'], sesi: PENULIS, peran: { u1: 'penulis', rev: 'reviewer' } });
  m.daftarkanPengguna({ userId: 'rev', email: 'rev@x.id', nama: 'Ustadz Fulan' });
  const faq = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const ajuanFaq = await m.editorial.buatDraf(faq, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']);
  await m.editorial.ajukan(ajuanFaq);
  await m.diksi.buatKunci('glosarium.bagikan', 'glosarium');
  const ajuanTeks = await m.diksi.buatDraf('glosarium.bagikan', 'Bagikan', null, null);
  await m.diksi.ajukan(ajuanTeks);
  m.masukSebagai({ userId: 'rev', email: 'rev@x.id' });
  await m.editorial.kembalikan(ajuanFaq, 'Lengkapi dalil');
  await m.diksi.setujui(ajuanTeks);
  m.masukSebagai(PENULIS);
  localStorage.clear();
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: PENULIS, peran: 'penulis' }}>
      <AjuanSaya />
    </KonteksRepo.Provider>,
  );
  expect(await screen.findByRole('tab', { name: 'Perlu diperbaiki (1)' })).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'Disetujui (1)' })).toBeTruthy();
  expect(screen.getByText(/Lengkapi dalil/)).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Perbaiki →' }).getAttribute('href')).toBe(`#/entri/${faq}`);
  expect(bacaTerakhirDibuka()).toBeTruthy();

  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Disetujui (1)' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Lihat →' }));
  expect(await screen.findByRole('dialog', { name: 'Sunting teks' })).toBeTruthy();
  await waitFor(() => expect((screen.getByLabelText('Bahasa Indonesia') as HTMLTextAreaElement).value).toBe('Bagikan'));
});

test('Buang perubahan ini: hanya untuk entri yang sudah tayang; ajuan hilang dari Perlu diperbaiki', async () => {
  const PENULIS = { userId: 'u1', email: 'a@x.id' };
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'adm', email: 'adm@x.id' }, peran: { adm: 'admin', u1: 'penulis', rev: 'reviewer' } });
  const tayang = await m.editorial.buatEntri('faq', 'sudah-tayang', 10);
  await m.editorial.terbitkanLangsung(await m.editorial.buatDraf(tayang, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']));
  const belum = await m.editorial.buatEntri('faq', 'belum-tayang', 20);
  m.masukSebagai(PENULIS);
  for (const entri of [tayang, belum]) await m.editorial.ajukan(await m.editorial.buatDraf(entri, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']));
  m.masukSebagai({ userId: 'rev', email: 'rev@x.id' });
  for (const revisi of await m.editorial.antreanReview()) await m.editorial.kembalikan(revisi.id, 'perbaiki');
  m.masukSebagai(PENULIS);
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: PENULIS, peran: 'penulis' }}>
      <AjuanSaya />
    </KonteksRepo.Provider>,
  );
  expect(await screen.findByRole('tab', { name: 'Perlu diperbaiki (2)' })).toBeTruthy();
  const buang = await screen.findAllByRole('button', { name: 'Buang perubahan ini' });
  expect(buang).toHaveLength(1);
  fireEvent.click(buang[0]!);
  expect(await screen.findByRole('tab', { name: 'Perlu diperbaiki (1)' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Buang perubahan ini' })).toBeNull();
});
