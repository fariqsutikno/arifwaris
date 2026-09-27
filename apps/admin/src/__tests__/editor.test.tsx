// Tes EditorEntri + PemilihRefs dengan repo memori: buat entri baru lewat form, galat bidang & refs wajib tampil,
// tab JSON (bolak-balik, JSON rusak), ajukan draf sendiri lalu form jadi baca-saja, dan reviewer hanya bisa membaca.
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
  await screen.findByText('Draf');
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
  await screen.findByText('Diajukan');
  expect(screen.queryByRole('button', { name: /buat draf baru/i })).toBeNull();
});

async function drafSendiri(m: Memori) {
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  return entriId;
}

test('draf sendiri: Simpan & ajukan → diajukan, form jadi baca-saja dengan alasan', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId });
  fireEvent.click(await screen.findByRole('button', { name: 'Simpan & ajukan' }));
  await screen.findByText('Diajukan');
  expect(screen.queryByRole('button', { name: 'Simpan draf' })).toBeNull();
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(true);
  expect(screen.getByText(/sedang menunggu review, jadi belum bisa diubah/)).toBeTruthy();
  expect(screen.getByText('Tersimpan dan diajukan ke antrean review.')).toBeTruthy();
});

test('reviewer membuka entri: baca-saja, tanpa tombol simpan', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId }, 'reviewer', 'u-r');
  await screen.findByText('Draf');
  expect(screen.queryByRole('button', { name: 'Simpan draf' })).toBeNull();
  expect(screen.queryByRole('button', { name: /buat draf baru/i })).toBeNull();
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(true);
});

test('Simpan & ajukan menyimpan editan form dulu: yang diajukan isi terbaru, bukan revisi lama', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId });
  await screen.findByText('Draf');
  ketik('Pertanyaan', 'Pertanyaan yang sudah diperbaiki');
  expect(screen.getByText('Ada perubahan belum disimpan')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan & ajukan' }));
  await screen.findByText('Diajukan');
  const [entri] = await m.konten.daftarEntri('faq');
  expect(entri!.revisiTerakhir?.status).toBe('diajukan');
  expect((entri!.revisiTerakhir?.isi as { pertanyaan: string }).pertanyaan).toBe('Pertanyaan yang sudah diperbaiki');
});

test('klik simpan dua kali beruntun → tombol terkunci, hanya satu entri dibuat', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  isiFormFaq();
  fireEvent.change(await screen.findByLabelText('Cari ref'), { target: { value: 'R09' } });
  fireEvent.click(await screen.findByRole('button', { name: 'R09-7' }));
  simpan();
  expect((screen.getByRole('button', { name: 'Menyimpan…' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Menyimpan…' }));
  await waitFor(async () => expect(await m.konten.daftarEntri('faq')).toHaveLength(1));
  expect(await m.konten.daftarEntri('faq')).toHaveLength(1);
});

test('draf milik penulis lain → baca-saja dengan alasan, bukan buntu tanpa pesan', async () => {
  const m = buatMemori({ refs: ['R09-7'], sesi: { userId: 'u-lain', email: 'l@x.id' }, peran: { 'u-lain': 'penulis', 'u-p': 'penulis' } });
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId });
  expect(await screen.findByText(/draf milik penulis lain/)).toBeTruthy();
  expect(screen.getByText(/revisi penulis lain/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Simpan draf' })).toBeNull();
});

test('revisi dikembalikan ke pembuatnya → langsung bisa disunting, simpan jadi draf baru', async () => {
  const m = siapkan();
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const revisi = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  await m.editorial.ajukan(revisi);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.editorial.kembalikan(revisi, 'Jawaban kurang dalil');
  m.masukSebagai(SESI_PENULIS);
  tampilkan(m, { entriId });
  await screen.findByText('Jawaban kurang dalil');
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(false);
  ketik('Pertanyaan', 'Sudah diperbaiki');
  simpan();
  await screen.findByText('Draf tersimpan.');
  const [entri] = await m.konten.daftarEntri('faq');
  expect(entri!.revisiTerakhir?.status).toBe('draf');
});

test('galat bidang → bidang pertama yang salah difokuskan', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'soal_kuis' });
  ketik('Kode soal', 'K-9');
  ketik('Bab KB', 'empat');
  simpan();
  await screen.findByText('harus bilangan bulat');
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Bab KB')));
});
