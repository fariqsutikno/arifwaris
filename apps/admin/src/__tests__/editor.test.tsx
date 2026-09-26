// Tes EditorEntri + PemilihRefs dengan repo memori: buat entri baru, galat JSON rusak & refs wajib tampil,
// ajukan draf sendiri lalu form jadi baca-saja, dan reviewer hanya bisa membaca.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import { keJson, type Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { EditorEntri } from '../layar/EditorEntri';
import { DAFTAR_FAQ_UJI } from './contoh';

const SESI_PENULIS = { userId: 'u-p', email: 'p@x.id' };
const siapkan = () => buatMemori({ refs: ['R09-7', 'R10-3'], sesi: SESI_PENULIS, peran: { 'u-p': 'penulis', 'u-r': 'reviewer' } });
type Memori = ReturnType<typeof siapkan>;

function tampilkan(m: Memori, props: { entriId: string } | { jenis: 'faq' }, peran: Peran = 'penulis', userId = 'u-p') {
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId, email: 'x@x.id' }, peran }}>
      <EditorEntri {...props} />
    </KonteksRepo.Provider>,
  );
}
const isiJson = (teks: string) => fireEvent.change(screen.getByLabelText('JSON'), { target: { value: teks } });
const simpan = () => fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }));

test('entri baru faq: isi, pilih ref, simpan → satu entri draf', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  isiJson(JSON.stringify(keJson('faq', DAFTAR_FAQ_UJI[0]!)));
  fireEvent.change(await screen.findByLabelText('Cari ref'), { target: { value: 'R09' } });
  fireEvent.click(await screen.findByRole('button', { name: 'R09-7' }));
  expect(screen.getByRole('button', { name: 'Hapus R09-7' })).toBeTruthy();
  simpan();
  await waitFor(async () => {
    const daftar = await m.konten.daftarEntri('faq');
    expect(daftar).toHaveLength(1);
    expect(daftar[0]!.revisiTerakhir?.status).toBe('draf');
    expect(daftar[0]!.revisiTerakhir?.refs).toEqual(['R09-7']);
  });
});

test('JSON rusak → pesan tampil, tidak ada entri tersimpan', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  isiJson('{ rusak');
  simpan();
  expect((await screen.findByRole('alert')).textContent).toMatch(/JSON tidak sah/);
  expect(await m.konten.daftarEntri('faq')).toHaveLength(0);
});

test('jenis fikih tanpa ref → galat repo tampil', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  isiJson(JSON.stringify(keJson('faq', DAFTAR_FAQ_UJI[0]!)));
  simpan();
  expect((await screen.findByRole('alert')).textContent).toMatch(/wajib punya minimal satu ref/);
});

async function drafSendiri(m: Memori) {
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  return entriId;
}

test('draf sendiri: Ajukan → diajukan, form jadi baca-saja', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId });
  fireEvent.click(await screen.findByRole('button', { name: 'Ajukan' }));
  await screen.findByText('Status: diajukan');
  expect(screen.queryByRole('button', { name: 'Simpan draf' })).toBeNull();
  expect((screen.getByLabelText('JSON') as HTMLTextAreaElement).readOnly).toBe(true);
});

test('reviewer membuka entri: baca-saja, tanpa tombol simpan', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId }, 'reviewer', 'u-r');
  await screen.findByText('Status: draf');
  expect(screen.queryByRole('button', { name: 'Simpan draf' })).toBeNull();
  expect(screen.queryByRole('button', { name: /buat draf baru/i })).toBeNull();
  expect((screen.getByLabelText('JSON') as HTMLTextAreaElement).readOnly).toBe(true);
});
