// Tes EditorEntri + PemilihRefs dengan repo memori: entri baru (simpan dulu / kirim untuk review, galat bidang & refs
// wajib), tab JSON khusus admin, entri tayang langsung disunting (tombol mati tanpa perubahan, kirim → menunggu review,
// tarik kembali), salinan kerja diperbarui bukan digandakan, admin Terbitkan langsung, alasan terkunci (draf orang
// lain, reviewer), catatan dikembalikan, dan Sampah (ajukan/batalkan, pindahkan & pulihkan).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import { keJson, type Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { EditorEntri } from '../layar/EditorEntri';
import { DAFTAR_FAQ_UJI } from './contoh';

const SESI_PENULIS = { userId: 'u-p', email: 'p@x.id' };
const SESI_ADMIN = { userId: 'u-a', email: 'a@x.id' };
function siapkan() {
  const m = buatMemori({ refs: ['R09-7', 'R10-3'], sesi: SESI_PENULIS, peran: { 'u-p': 'penulis', 'u-r': 'reviewer', 'u-a': 'admin', 'u-q': 'penulis' } });
  m.daftarkanPengguna({ userId: 'u-q', email: 'q@x.id', nama: 'Fulan' });
  m.daftarkanPengguna({ userId: 'u-r', email: 'r@x.id', nama: 'Ustadz' });
  return m;
}
type Memori = ReturnType<typeof siapkan>;

afterEach(() => { vi.restoreAllMocks(); });

function tampilkan(m: Memori, props: { entriId: string } | { jenis: 'faq' | 'soal_kuis' }, peran: Peran = 'penulis', userId = 'u-p') {
  m.masukSebagai({ userId, email: `${userId}@x.id` });
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId, email: 'x@x.id' }, peran }}>
      <EditorEntri {...props} />
    </KonteksRepo.Provider>,
  );
}
const isiJson = (teks: string) => fireEvent.change(screen.getByRole('textbox', { name: 'JSON' }), { target: { value: teks } });
const bukaTab = (nama: RegExp) => fireEvent.mouseDown(screen.getByRole('tab', { name: nama }));
const ketik = (label: string, nilai: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: nilai } });
const tombol = (nama: string) => screen.getByRole('button', { name: nama }) as HTMLButtonElement;
const klik = (nama: string) => fireEvent.click(tombol(nama));
function isiFormFaq() {
  ketik('Id', 'apa-itu-tirkah');
  ketik('Kelompok', 'Fikih');
  ketik('Pertanyaan', 'Apa itu tirkah?');
  ketik('Jawaban', 'Harta peninggalan.');
}
async function pilihRef(kode = 'R09-7') {
  fireEvent.change(await screen.findByLabelText('Cari ref'), { target: { value: kode.slice(0, 3) } });
  fireEvent.click(await screen.findByRole('button', { name: kode }));
}

async function drafMilik(m: Memori, sesi = SESI_PENULIS) {
  m.masukSebagai(sesi);
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const revisi = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  return { entriId, revisi };
}
async function tayang(m: Memori) {
  const { entriId, revisi } = await drafMilik(m, SESI_ADMIN);
  await m.editorial.terbitkanLangsung(revisi);
  return { entriId, revisi };
}

test('entri baru faq: isi, pilih ref, Simpan dulu → satu entri dengan draf', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  expect(await screen.findByText('Entri baru · belum disimpan')).toBeTruthy();
  isiFormFaq();
  await pilihRef();
  klik('Simpan dulu');
  await waitFor(async () => {
    const daftar = await m.konten.daftarEntri('faq');
    expect(daftar).toHaveLength(1);
    expect(daftar[0]!.revisiTerakhir).toMatchObject({ status: 'draf', refs: ['R09-7'] });
  });
});

test('entri baru: Kirim untuk review → langsung diajukan', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  await screen.findByText('Entri baru · belum disimpan');
  isiFormFaq();
  await pilihRef();
  klik('Kirim untuk review');
  await waitFor(async () => expect(await m.editorial.antreanReview()).toHaveLength(1));
});

test('angka tidak sah → galat di bawah bidang, tidak ada entri tersimpan', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'soal_kuis' });
  await screen.findByText('Entri baru · belum disimpan');
  ketik('Kode soal', 'K-9');
  ketik('Bab KB', 'empat');
  klik('Simpan dulu');
  expect((await screen.findByRole('alert')).textContent).toMatch(/Ada bidang yang belum benar/);
  expect(screen.getByText('harus bilangan bulat')).toBeTruthy();
  expect(await m.konten.daftarEntri('soal_kuis')).toHaveLength(0);
});

test('jenis fikih tanpa ref → galat repo tampil', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  await screen.findByText('Entri baru · belum disimpan');
  isiFormFaq();
  klik('Simpan dulu');
  expect((await screen.findByRole('alert')).textContent).toMatch(/wajib punya minimal satu ref/);
  expect(await m.konten.daftarEntri('faq')).toHaveLength(0);
  await pilihRef();
  klik('Simpan dulu');
  await waitFor(async () => expect(await m.konten.daftarEntri('faq')).toHaveLength(1));
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
  await screen.findByText('Entri baru · belum disimpan');
  isiFormFaq();
  await pilihRef();
  klik('Simpan dulu');
  expect((await screen.findByRole('alert')).textContent).toMatch(/jaringan putus/);
  klik('Simpan dulu');
  await waitFor(async () => {
    const daftar = await m.konten.daftarEntri('faq');
    expect(daftar).toHaveLength(1);
    expect(daftar[0]!.revisiTerakhir?.status).toBe('draf');
  });
});

test('tab JSON tidak tampil untuk penulis', async () => {
  const m = siapkan();
  const { entriId } = await drafMilik(m);
  tampilkan(m, { entriId });
  await screen.findByText(/Draf tersimpan/);
  expect(screen.queryByRole('tab', { name: /JSON/ })).toBeNull();
});

test('admin, tab JSON: JSON rusak → galat & tetap di JSON, perbaikan kembali ke form', async () => {
  const m = siapkan();
  const { entriId } = await drafMilik(m, SESI_ADMIN);
  tampilkan(m, { entriId }, 'admin', 'u-a');
  await screen.findByText(/Draf tersimpan/);
  ketik('Pertanyaan', 'Apa itu tirkah, ya?');
  bukaTab(/JSON/);
  expect((screen.getByRole('textbox', { name: 'JSON' }) as HTMLTextAreaElement).value).toContain('"pertanyaan": "Apa itu tirkah, ya?"');
  isiJson('{ rusak');
  bukaTab(/Form/);
  expect((await screen.findByRole('alert')).textContent).toMatch(/JSON tidak sah/);
  klik('Simpan dulu');
  expect((await screen.findByRole('alert')).textContent).toMatch(/JSON tidak sah/);

  isiJson(JSON.stringify(keJson('faq', { ...DAFTAR_FAQ_UJI[0]!, pertanyaan: 'Dari JSON' })));
  bukaTab(/Form/);
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).value).toBe('Dari JSON');
  klik('Simpan dulu');
  await waitFor(async () => {
    const [entri] = await m.konten.daftarEntri('faq');
    expect((entri!.revisiTerakhir?.isi as { pertanyaan: string }).pertanyaan).toBe('Dari JSON');
  });
});

test('entri tayang: langsung disunting; tombol mati tanpa perubahan; kirim → menunggu review, versi tayang tetap; tarik kembali', async () => {
  const m = siapkan();
  const { entriId, revisi } = await tayang(m);
  tampilkan(m, { entriId });
  await screen.findByText(/Tayang di web/);
  expect(screen.getByText(/Belum ada perubahan/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /buat draf baru/i })).toBeNull();
  expect(tombol('Kirim untuk review').disabled).toBe(true);
  expect(tombol('Simpan dulu').disabled).toBe(true);

  ketik('Pertanyaan', 'Apa itu tirkah, ya?');
  expect(screen.getByText('Ada perubahan yang belum disimpan')).toBeTruthy();
  klik('Kirim untuk review');
  await screen.findByText('Perubahan dari Anda menunggu review');
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(true);
  expect((await m.konten.bacaTerbit({ jenis: 'faq' }))[0]!.revisiId).toBe(revisi);

  klik('Tarik kembali');
  await screen.findByText(/Draf tersimpan · belum dikirim/);
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).value).toBe('Apa itu tirkah, ya?');
  expect(await m.editorial.antreanReview()).toEqual([]);
});

test('salinan kerja: Simpan dulu memperbarui draf yang sama, tidak menggandakan', async () => {
  const m = siapkan();
  const { entriId } = await drafMilik(m);
  tampilkan(m, { entriId });
  await screen.findByText(/Draf tersimpan · belum dikirim/);
  ketik('Pertanyaan', 'Versi dua');
  klik('Simpan dulu');
  await screen.findByText(/Draf tersimpan pukul/);
  expect(await m.konten.daftarRevisi(entriId)).toHaveLength(1);
  expect(tombol('Kirim untuk review').disabled).toBe(false);
});

test('admin: Terbitkan → langsung tayang tanpa antrean', async () => {
  const m = siapkan();
  const { entriId } = await tayang(m);
  tampilkan(m, { entriId }, 'admin', 'u-a');
  await screen.findByText(/Tayang di web/);
  expect(screen.queryByRole('button', { name: 'Kirim untuk review' })).toBeNull();
  ketik('Pertanyaan', 'Langsung terbit');
  klik('Terbitkan');
  await waitFor(async () => expect(((await m.konten.bacaTerbit({ jenis: 'faq' }))[0]!.isi as { pertanyaan: string }).pertanyaan).toBe('Langsung terbit'));
  expect(await m.editorial.antreanReview()).toEqual([]);
});

test('draf orang lain → terkunci dengan nama penyuntingnya', async () => {
  const m = siapkan();
  const { entriId } = await drafMilik(m, { userId: 'u-q', email: 'q@x.id' });
  tampilkan(m, { entriId });
  await screen.findByText('Sedang disunting oleh Fulan (belum dikirim).');
  expect(screen.queryByRole('button', { name: 'Simpan dulu' })).toBeNull();
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(true);
});

test('reviewer: baca-saja dengan alasan, tanpa tombol simpan atau Sampah', async () => {
  const m = siapkan();
  const { entriId } = await tayang(m);
  tampilkan(m, { entriId }, 'reviewer', 'u-r');
  await screen.findByText(/Reviewer hanya membaca/);
  expect(screen.queryByRole('button', { name: /Simpan|Kirim|Sampah/ })).toBeNull();
});

test('dikembalikan: catatan reviewer tampil, perbaikan langsung bisa dikirim lagi', async () => {
  const m = siapkan();
  const { entriId, revisi } = await drafMilik(m);
  await m.editorial.ajukan(revisi);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.editorial.kembalikan(revisi, 'perbaiki ejaan');
  tampilkan(m, { entriId });
  await screen.findByText('Dikembalikan oleh Ustadz');
  expect(screen.getByText(/perbaiki ejaan · Perbaiki di bawah/)).toBeTruthy();
  ketik('Pertanyaan', 'Sudah diperbaiki');
  klik('Kirim untuk review');
  await screen.findByText('Perubahan dari Anda menunggu review');
});

test('Sampah entri tayang (penulis): ajukan dengan alasan, lalu batalkan', async () => {
  const m = siapkan();
  const { entriId } = await tayang(m);
  vi.spyOn(window, 'prompt').mockReturnValue('duplikat');
  tampilkan(m, { entriId });
  fireEvent.click(await screen.findByRole('button', { name: 'Ajukan ke Sampah' }));
  await screen.findByText('Pemindahan ke Sampah diajukan oleh Anda · menunggu review');
  expect(await m.konten.bacaTerbit({ jenis: 'faq' })).toHaveLength(1);
  expect((await m.konten.daftarJejak(entriId)).map(j => [j.aksi, j.catatan])).toEqual([['buang_diajukan', 'duplikat']]);
  klik('Batalkan pengajuan');
  await screen.findByText(/Belum ada perubahan/);
  expect(screen.getByRole('button', { name: 'Ajukan ke Sampah' })).toBeTruthy();
});

test('Sampah entri belum tayang: batal prompt tidak berbuat apa-apa; pindahkan (baca-saja) lalu pulihkan', async () => {
  const m = siapkan();
  const { entriId } = await drafMilik(m);
  const prompt = vi.spyOn(window, 'prompt').mockReturnValue(null);
  tampilkan(m, { entriId });
  fireEvent.click(await screen.findByRole('button', { name: 'Pindahkan ke Sampah' }));
  expect((await m.konten.daftarEntri('faq'))[0]!.dibuang).toBe(false);

  prompt.mockReturnValue('');
  klik('Pindahkan ke Sampah');
  await screen.findByText('Di Sampah · belum pernah tayang di web');
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(true);
  expect(await m.konten.daftarRevisi(entriId)).toHaveLength(1);
  klik('Pulihkan');
  await screen.findByText(/Draf tersimpan · belum dikirim/);
});
