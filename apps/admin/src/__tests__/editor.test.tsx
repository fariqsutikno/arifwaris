// Tes EditorEntri + PemilihRefs dengan repo memori: buat entri baru lewat form, galat bidang & refs wajib tampil,
// tab JSON (bolak-balik, JSON rusak), ajukan draf sendiri lalu form jadi baca-saja, reviewer hanya bisa membaca,
// entri terbit langsung bisa disunting (simpan = draf baru), dan hapus (lewat pengajuan / langsung bila belum terbit).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import { keJson, type Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { EditorEntri } from '../layar/EditorEntri';
import { DAFTAR_FAQ_UJI } from './contoh';

const SESI_PENULIS = { userId: 'u-p', email: 'p@x.id' };
const siapkan = () => buatMemori({ refs: ['R09-7', 'R10-3'], sesi: SESI_PENULIS, peran: { 'u-p': 'penulis', 'u-r': 'reviewer' } });
type Memori = ReturnType<typeof siapkan>;

function tampilkan(m: Memori, props: { entriId: string } | { jenis: 'faq' | 'soal_kuis' }, peran: Peran = 'penulis', userId = 'u-p') {
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId, email: 'x@x.id' }, peran }}>
      <EditorEntri {...props} />
    </KonteksRepo.Provider>,
  );
}
const isiJson = (teks: string) => fireEvent.change(screen.getByRole('textbox', { name: 'JSON' }), { target: { value: teks } });
const bukaTab = (nama: 'Form' | 'JSON') => fireEvent.mouseDown(screen.getByRole('tab', { name: nama }));
const ketik = (label: string, nilai: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: nilai } });
function isiFormFaq() {
  ketik('Id', 'apa-itu-tirkah');
  ketik('Kelompok', 'Fikih');
  ketik('Pertanyaan', 'Apa itu tirkah?');
  ketik('Jawaban', 'Harta peninggalan.');
}
const simpan = () => fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }));

test('entri baru faq: isi, pilih ref, simpan → satu entri draf', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  isiFormFaq();
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

test('angka tidak sah → galat di bawah bidang, tidak ada entri tersimpan', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'soal_kuis' });
  ketik('Kode soal', 'K-9');
  ketik('Bab KB', 'empat');
  simpan();
  expect((await screen.findByRole('alert')).textContent).toMatch(/Ada bidang yang belum benar/);
  expect(screen.getByText('harus bilangan bulat')).toBeTruthy();
  expect(await m.konten.daftarEntri('soal_kuis')).toHaveLength(0);
});

test('tab JSON: memuat isi form, JSON rusak → galat & tetap di JSON, perbaikan kembali ke form', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId });
  await screen.findByText('Status: draf');
  ketik('Pertanyaan', 'Apa itu tirkah, ya?');
  bukaTab('JSON');
  expect((screen.getByRole('textbox', { name: 'JSON' }) as HTMLTextAreaElement).value).toContain('"pertanyaan": "Apa itu tirkah, ya?"');

  isiJson('{ rusak');
  bukaTab('Form');
  expect((await screen.findByRole('alert')).textContent).toMatch(/JSON tidak sah/);
  expect((screen.getByRole('textbox', { name: 'JSON' }) as HTMLTextAreaElement).value).toBe('{ rusak');
  simpan();
  expect((await screen.findByRole('alert')).textContent).toMatch(/JSON tidak sah/);

  isiJson(JSON.stringify(keJson('faq', { ...DAFTAR_FAQ_UJI[0]!, pertanyaan: 'Dari JSON' })));
  bukaTab('Form');
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).value).toBe('Dari JSON');
  simpan();
  await waitFor(async () => {
    const [entri] = await m.konten.daftarEntri('faq');
    expect((entri!.revisiTerakhir?.isi as { pertanyaan: string }).pertanyaan).toBe('Dari JSON');
  });
});

test('jenis fikih tanpa ref → galat repo tampil', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  isiFormFaq();
  simpan();
  expect((await screen.findByRole('alert')).textContent).toMatch(/wajib punya minimal satu ref/);
  expect(await m.konten.daftarEntri('faq')).toHaveLength(0);

  fireEvent.change(screen.getByLabelText('Cari ref'), { target: { value: 'R09' } });
  fireEvent.click(await screen.findByRole('button', { name: 'R09-7' }));
  simpan();
  await waitFor(async () => {
    const daftar = await m.konten.daftarEntri('faq');
    expect(daftar).toHaveLength(1);
    expect(daftar[0]!.revisiTerakhir?.status).toBe('draf');
  });
});

test('buatDraf gagal setelah buatEntri → simpan ulang memakai entri yang sama', async () => {
  const m = siapkan();
  const buatDrafAsli = m.editorial.buatDraf;
  let gagalSekali = true;
  m.editorial.buatDraf = async (...a) => {
    if (gagalSekali) { gagalSekali = false; throw new Error('jaringan putus'); }
    return buatDrafAsli(...a);
  };
  tampilkan(m, { jenis: 'faq' });
  isiFormFaq();
  fireEvent.change(await screen.findByLabelText('Cari ref'), { target: { value: 'R09' } });
  fireEvent.click(await screen.findByRole('button', { name: 'R09-7' }));
  simpan();
  expect((await screen.findByRole('alert')).textContent).toMatch(/jaringan putus/);
  simpan();
  await waitFor(async () => {
    const daftar = await m.konten.daftarEntri('faq');
    expect(daftar).toHaveLength(1);
    expect(daftar[0]!.revisiTerakhir?.status).toBe('draf');
  });
});

test('terbit + revisi diajukan: status diajukan tampil, tanpa "Buat draf baru"', async () => {
  const m = buatMemori({ refs: ['R09-7'], sesi: { userId: 'u-a', email: 'a@x.id' }, peran: { 'u-a': 'admin' } });
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const pertama = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  await m.editorial.ajukan(pertama);
  await m.editorial.setujui(pertama);
  const kedua = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[1]!, ['R09-7']);
  await m.editorial.ajukan(kedua);
  tampilkan(m, { entriId }, 'penulis', 'u-p');
  await screen.findByText('Status: diajukan');
  expect(screen.queryByRole('button', { name: /buat draf baru/i })).toBeNull();
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
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(true);
});

test('reviewer membuka entri: baca-saja, tanpa tombol simpan', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId }, 'reviewer', 'u-r');
  await screen.findByText('Status: draf');
  expect(screen.queryByRole('button', { name: 'Simpan draf' })).toBeNull();
  expect(screen.queryByRole('button', { name: /buat draf baru/i })).toBeNull();
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(true);
});

async function terbitOlehAdmin(m: Memori) {
  m.aturPeranLangsung('u-a', 'admin');
  m.masukSebagai({ userId: 'u-a', email: 'a@x.id' });
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const revisi = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  await m.editorial.ajukan(revisi);
  await m.editorial.setujui(revisi);
  m.masukSebagai(SESI_PENULIS);
  return { entriId, revisi };
}

test('entri terbit: langsung bisa disunting, simpan → draf baru, versi terbit tetap', async () => {
  const m = siapkan();
  const { entriId, revisi } = await terbitOlehAdmin(m);
  tampilkan(m, { entriId });
  await screen.findByText(/versi terbit tetap tampil di web/);
  expect(screen.queryByRole('button', { name: /buat draf baru/i })).toBeNull();
  ketik('Pertanyaan', 'Apa itu tirkah, ya?');
  simpan();
  await screen.findByText('Status: draf');
  const [entri] = await m.konten.daftarEntri('faq');
  expect(entri).toMatchObject({ revisiTerbitId: revisi, revisiTerakhir: { status: 'draf', dibuatOleh: 'u-p' } });
  expect((await m.konten.bacaTerbit({ jenis: 'faq' }))[0]!.isi).toMatchObject({ pertanyaan: DAFTAR_FAQ_UJI[0]!.pertanyaan });
  expect(screen.getByRole('button', { name: 'Ajukan' })).toBeTruthy();
});

test('entri terbit: Ajukan hapus → penghapusan diajukan, entri tetap terbit', async () => {
  const m = siapkan();
  const { entriId } = await terbitOlehAdmin(m);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  tampilkan(m, { entriId });
  fireEvent.click(await screen.findByRole('button', { name: 'Ajukan hapus' }));
  await screen.findByText(/penghapusan diajukan/);
  expect(screen.queryByRole('button', { name: 'Ajukan hapus' })).toBeNull();
  expect(await m.editorial.antreanReview()).toMatchObject([{ hapus: true, status: 'diajukan' }]);
  expect(await m.konten.bacaTerbit({ jenis: 'faq' })).toHaveLength(1);
});

test('entri belum terbit: Hapus entri → terhapus langsung', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  tampilkan(m, { entriId });
  fireEvent.click(await screen.findByRole('button', { name: 'Hapus entri' }));
  await waitFor(async () => expect(await m.konten.daftarEntri('faq')).toEqual([]));
  expect(location.hash).toBe('#/menu/faq/faq');
});

test('reviewer tidak melihat tombol hapus', async () => {
  const m = siapkan();
  const { entriId } = await terbitOlehAdmin(m);
  tampilkan(m, { entriId }, 'reviewer', 'u-r');
  await screen.findByText('Status: disetujui');
  expect(screen.queryByRole('button', { name: /hapus/i })).toBeNull();
});
