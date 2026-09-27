// Tes EditorEntri + PemilihRefs dengan repo memori: entri baru (simpan dulu / kirim untuk review, galat bidang & refs
// wajib), tab JSON khusus admin, entri tayang langsung disunting (tombol mati tanpa perubahan, kirim → menunggu review,
// tarik kembali), salinan kerja diperbarui bukan digandakan, admin Terbitkan langsung, alasan terkunci (draf orang
// lain, reviewer), catatan dikembalikan, dan Sampah (ajukan/batalkan, pindahkan & pulihkan).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import { keJson, type JenisKonten, type Peran } from '@waris/content';
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

function tampilkan(m: Memori, props: { entriId: string } | { jenis: JenisKonten; awal?: Record<string, string> }, peran: Peran = 'penulis', userId = 'u-p') {
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
/** Bidang blok/potongan memakai editor rich text; tes mengetik lewat mode Markdown-nya. */
function ketikMarkdown(label: string, nilai: string) {
  fireEvent.click(screen.getByRole('button', { name: `Sunting ${label} sebagai Markdown` }));
  ketik(`${label} (Markdown)`, nilai);
}
function isiFormFaq() {
  ketik('Kelompok', 'Fikih');
  ketik('Pertanyaan', 'Apa itu tirkah?');
  ketikMarkdown('Jawaban', 'Harta peninggalan.');
}
async function pilihRef(klaim = 'Cara pembagian radd') {
  fireEvent.click(await screen.findByRole('button', { name: '+ Tambah rujukan' }));
  fireEvent.change(await screen.findByLabelText('Cari: Tambah rujukan'), { target: { value: klaim } });
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(`^${klaim}`) }));
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
  tampilkan(m, { jenis: 'modul' });
  await screen.findByText('Entri baru · belum disimpan');
  ketik('Nomor modul', 'empat');
  ketik('Judul modul', 'Pengantar');
  klik('Simpan dulu');
  expect((await screen.findByRole('alert')).textContent).toMatch(/Ada bidang yang belum benar/);
  expect(screen.getByText('harus bilangan bulat')).toBeTruthy();
  expect(await m.konten.daftarEntri('modul')).toHaveLength(0);
});

test('soal kuis baru: kode diisi otomatis kode berikutnya, bab berupa pilihan judul bab KB', async () => {
  const m = siapkan();
  const lama = await m.editorial.buatEntri('soal_kuis', 'K-07', 10);
  await m.editorial.buatDraf(lama, 'soal_kuis', {
    kode: 'K-07', bab: 4, pertanyaan: [{ jenis: 'teks', teks: 'q' }], pilihan: [[{ jenis: 'teks', teks: 'a' }], [{ jenis: 'teks', teks: 'b' }]],
    indeksBenar: 0, pembahasan: [{ jenis: 'teks', teks: 'p' }],
  }, ['R09-7']);
  tampilkan(m, { jenis: 'soal_kuis' });
  await waitFor(() => expect((screen.getByLabelText('Kode soal') as HTMLInputElement).value).toBe('K-08'));
  const bab = screen.getByLabelText('Bab') as HTMLSelectElement;
  expect(bab.tagName).toBe('SELECT');
  expect([...bab.options].some(o => o.value === '9' && /^9\. /.test(o.text))).toBe(true);
});

test('entri terbit: identitas terkunci; admin bisa membuka kunci setelah konfirmasi', async () => {
  const m = buatMemori({ refs: ['R09-7'], sesi: { userId: 'u-a', email: 'a@x.id' }, peran: { 'u-a': 'admin' } });
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const revisi = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  await m.editorial.ajukan(revisi);
  await m.editorial.setujui(revisi);
  tampilkan(m, { entriId }, 'admin', 'u-a');
  await screen.findByLabelText('Pertanyaan');
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(false);
  expect((screen.getByLabelText('Alamat tautan') as HTMLInputElement).readOnly).toBe(true);
  expect(screen.getByText(/Terkunci karena sudah terbit/)).toBeTruthy();
  const tanya = vi.spyOn(window, 'confirm').mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Buka kunci' }));
  expect((screen.getByLabelText('Alamat tautan') as HTMLInputElement).readOnly).toBe(false);
  tanya.mockRestore();
});

test('entri terbit, penulis: identitas terkunci tanpa tombol Buka kunci', async () => {
  const m = siapkan();
  const { entriId } = await tayang(m);
  tampilkan(m, { entriId });
  await screen.findByLabelText('Pertanyaan');
  expect((screen.getByLabelText('Alamat tautan') as HTMLInputElement).readOnly).toBe(true);
  expect(screen.queryByRole('button', { name: 'Buka kunci' })).toBeNull();
});

test('entri baru: alamat tautan dikosongkan → diisi otomatis dari pertanyaan, jadi slug entri', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  await screen.findByText('Entri baru · belum disimpan');
  isiFormFaq();
  expect((screen.getByLabelText('Alamat tautan') as HTMLInputElement).placeholder).toBe('Otomatis: apa-itu-tirkah');
  await pilihRef();
  klik('Simpan dulu');
  await waitFor(async () => {
    const [entri] = await m.konten.daftarEntri('faq');
    expect(entri!.slug).toBe('apa-itu-tirkah');
    expect((entri!.revisiTerakhir?.isi as { id: string }).id).toBe('apa-itu-tirkah');
  });
});

test('soal kuis baru: kode diisi kode berikutnya, bab berupa pilihan judul bab KB', async () => {
  const m = siapkan();
  const lama = await m.editorial.buatEntri('soal_kuis', 'K-07', 10);
  await m.editorial.buatDraf(lama, 'soal_kuis', {
    kode: 'K-07', bab: 4, pertanyaan: [{ jenis: 'teks', teks: 'q' }], pilihan: [[{ jenis: 'teks', teks: 'a' }], [{ jenis: 'teks', teks: 'b' }]],
    indeksBenar: 0, pembahasan: [{ jenis: 'teks', teks: 'p' }],
  }, ['R09-7']);
  tampilkan(m, { jenis: 'soal_kuis' });
  await waitFor(() => expect((screen.getByLabelText('Kode soal') as HTMLInputElement).value).toBe('K-08'));
  const bab = screen.getByLabelText('Bab') as HTMLSelectElement;
  expect(bab.tagName).toBe('SELECT');
  expect([...bab.options].some(o => o.value === '9' && /^9\. /.test(o.text))).toBe(true);
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
  expect((await screen.findByRole('alert')).textContent).toMatch(/jaringan putus/i);
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
  expect(screen.queryByRole('tab', { name: /Kode mentah/ })).toBeNull();
});

test('admin, tab JSON: JSON rusak → galat & tetap di JSON, perbaikan kembali ke form', async () => {
  const m = siapkan();
  const { entriId } = await drafMilik(m, SESI_ADMIN);
  tampilkan(m, { entriId }, 'admin', 'u-a');
  await screen.findByText(/Draf tersimpan/);
  ketik('Pertanyaan', 'Apa itu tirkah, ya?');
  bukaTab(/Kode mentah/);
  expect((screen.getByRole('textbox', { name: 'JSON' }) as HTMLTextAreaElement).value).toContain('"pertanyaan": "Apa itu tirkah, ya?"');
  isiJson('{ rusak');
  bukaTab(/Bahasa Indonesia/);
  expect((await screen.findByRole('alert')).textContent).toMatch(/JSON tidak sah/);
  klik('Simpan dulu');
  expect((await screen.findByRole('alert')).textContent).toMatch(/JSON tidak sah/);

  isiJson(JSON.stringify(keJson('faq', { ...DAFTAR_FAQ_UJI[0]!, pertanyaan: 'Dari JSON' })));
  bukaTab(/Bahasa Indonesia/);
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

test('entri baru dengan isian awal dari URL (?modul=3) → modul terisi', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'materi', awal: { modul: '3', bukanBidang: 'x' } });
  await waitFor(() => expect((screen.getByLabelText('Modul') as HTMLSelectElement).value).toBe('3'));
});

test('validasi langsung: galat bidang tampil begitu bidangnya ditinggalkan, sebelum Simpan', async () => {
  tampilkan(siapkan(), { jenis: 'modul' });
  await screen.findByText('Entri baru · belum disimpan');
  ketik('Nomor modul', 'empat');
  expect(screen.queryByText('harus bilangan bulat')).toBeNull();
  fireEvent.blur(screen.getByLabelText('Nomor modul'));
  expect(await screen.findByText('harus bilangan bulat')).toBeTruthy();
});

test('Kelengkapan menandai bidang wajib & rujukan; Batalkan perubahan kembali ke versi tersimpan', async () => {
  tampilkan(siapkan(), { jenis: 'faq' });
  const kelengkapan = await screen.findByRole('region', { name: 'Kelengkapan' });
  expect(kelengkapan.textContent).toMatch(/Pertanyaan.*belum diisi/);
  expect(kelengkapan.textContent).toMatch(/Rujukan dalil.*belum diisi/);
  ketik('Pertanyaan', 'Apa itu tirkah?');
  expect(kelengkapan.textContent).toMatch(/Pertanyaan: sudah benar/);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  klik('Batalkan perubahan');
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).value).toBe('');
  expect(screen.queryByRole('button', { name: 'Batalkan perubahan' })).toBeNull();
});
