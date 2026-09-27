// Tes EditorEntri + PemilihRefs dengan repo memori: buat entri baru lewat form, galat bidang & refs wajib tampil,
// tab JSON (bolak-balik, JSON rusak), ajukan draf sendiri lalu form jadi baca-saja, dan reviewer hanya bisa membaca.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import { keJson, type JenisKonten, type Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { EditorEntri } from '../layar/EditorEntri';
import { DAFTAR_FAQ_UJI } from './contoh';

const SESI_PENULIS = { userId: 'u-p', email: 'p@x.id' };
const siapkan = () => buatMemori({ refs: ['R09-7', 'R10-3'], sesi: SESI_PENULIS, peran: { 'u-p': 'penulis', 'u-r': 'reviewer' } });
type Memori = ReturnType<typeof siapkan>;

function tampilkan(m: Memori, props: { entriId: string } | { jenis: JenisKonten }, peran: Peran = 'penulis', userId = 'u-p') {
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId, email: 'x@x.id' }, peran }}>
      <EditorEntri {...props} />
    </KonteksRepo.Provider>,
  );
}
const isiJson = (teks: string) => fireEvent.change(screen.getByRole('textbox', { name: 'JSON' }), { target: { value: teks } });
const bukaTab = (nama: 'Isi' | 'JSON') => fireEvent.mouseDown(screen.getByRole('tab', { name: nama }));
const ketik = (label: string, nilai: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: nilai } });
async function isiFormFaq() {
  await screen.findByLabelText('Pertanyaan');
  ketik('Kelompok', 'Fikih');
  ketik('Pertanyaan', 'Apa itu tirkah?');
  ketik('Jawaban', 'Harta peninggalan.');
}
const simpan = () => fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }));

test('entri baru faq: isi, pilih ref, simpan → satu entri draf', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  await isiFormFaq();
  fireEvent.change(await screen.findByLabelText('Cari ref'), { target: { value: 'R09' } });
  fireEvent.click(await screen.findByRole('button', { name: 'R09-7' }));
  expect(screen.getByRole('button', { name: 'Hapus R09-7' })).toBeTruthy();
  simpan();
  await waitFor(async () => {
    const daftar = await m.konten.daftarEntri('faq');
    expect(daftar).toHaveLength(1);
    expect(daftar[0]!.revisiTerakhir?.status).toBe('draf');
    expect(daftar[0]!.revisiTerakhir?.refs).toEqual(['R09-7']);
    // alamat (id) dikosongkan → otomatis dari pertanyaan, dan slug entri = id itu
    expect(daftar[0]!.slug).toBe('apa-itu-tirkah');
    expect((daftar[0]!.revisiTerakhir?.isi as { id: string }).id).toBe('apa-itu-tirkah');
  });
});

test('angka tidak sah → galat di bawah bidang, tidak ada entri tersimpan', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'modul' });
  fireEvent.change(await screen.findByLabelText('Nomor modul'), { target: { value: 'empat' } });
  ketik('Judul', 'Pengantar');
  simpan();
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
  const bab = screen.getByLabelText('Bab KB') as HTMLSelectElement;
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
  fireEvent.click(await screen.findByRole('button', { name: /buat draf baru/i }));
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(false);
  expect((screen.getByLabelText('Alamat tautan') as HTMLInputElement).readOnly).toBe(true);
  expect(screen.getByText(/Terkunci karena sudah terbit/)).toBeTruthy();
  const tanya = vi.spyOn(window, 'confirm').mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Buka kunci' }));
  expect((screen.getByLabelText('Alamat tautan') as HTMLInputElement).readOnly).toBe(false);
  tanya.mockRestore();
});

test('tab JSON: memuat isi form, JSON rusak → galat & tetap di JSON, perbaikan kembali ke form', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId });
  await screen.findAllByText('Draf');
  ketik('Pertanyaan', 'Apa itu tirkah, ya?');
  bukaTab('JSON');
  expect((screen.getByRole('textbox', { name: 'JSON' }) as HTMLTextAreaElement).value).toContain('"pertanyaan": "Apa itu tirkah, ya?"');

  isiJson('{ rusak');
  bukaTab('Isi');
  expect((await screen.findByRole('alert')).textContent).toMatch(/JSON tidak sah/);
  expect((screen.getByRole('textbox', { name: 'JSON' }) as HTMLTextAreaElement).value).toBe('{ rusak');
  simpan();
  expect((await screen.findByRole('alert')).textContent).toMatch(/JSON tidak sah/);

  isiJson(JSON.stringify(keJson('faq', { ...DAFTAR_FAQ_UJI[0]!, pertanyaan: 'Dari JSON' })));
  bukaTab('Isi');
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
  await isiFormFaq();
  simpan();
  expect((await screen.findByRole('alert')).textContent).toMatch(/minimal satu rujukan/);
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
  await isiFormFaq();
  fireEvent.change(await screen.findByLabelText('Cari ref'), { target: { value: 'R09' } });
  fireEvent.click(await screen.findByRole('button', { name: 'R09-7' }));
  simpan();
  expect((await screen.findByRole('alert')).textContent).toMatch(/Jaringan putus/);
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
  await screen.findAllByText('Diajukan');
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
  await screen.findAllByText('Diajukan');
  expect(screen.queryByRole('button', { name: 'Simpan draf' })).toBeNull();
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(true);
  expect(screen.getByText(/sedang menunggu review, jadi belum bisa diubah/)).toBeTruthy();
  expect(screen.getByText('Tersimpan dan diajukan ke antrean review.')).toBeTruthy();
});

test('reviewer membuka entri: baca-saja, tanpa tombol simpan', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId }, 'reviewer', 'u-r');
  await screen.findAllByText('Draf');
  expect(screen.queryByRole('button', { name: 'Simpan draf' })).toBeNull();
  expect(screen.queryByRole('button', { name: /buat draf baru/i })).toBeNull();
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).readOnly).toBe(true);
});

test('Simpan & ajukan menyimpan editan form dulu: yang diajukan isi terbaru, bukan revisi lama', async () => {
  const m = siapkan();
  const entriId = await drafSendiri(m);
  tampilkan(m, { entriId });
  await screen.findAllByText('Draf');
  ketik('Pertanyaan', 'Pertanyaan yang sudah diperbaiki');
  expect(screen.getByText('Ada perubahan belum disimpan')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan & ajukan' }));
  await screen.findAllByText('Diajukan');
  const [entri] = await m.konten.daftarEntri('faq');
  expect(entri!.revisiTerakhir?.status).toBe('diajukan');
  expect((entri!.revisiTerakhir?.isi as { pertanyaan: string }).pertanyaan).toBe('Pertanyaan yang sudah diperbaiki');
});

test('klik simpan dua kali beruntun → tombol terkunci, hanya satu entri dibuat', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'faq' });
  await isiFormFaq();
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
  expect(screen.getAllByText(/oleh penulis lain/).length).toBeGreaterThan(0);
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

test('galat bidang → bidang pertama yang salah difokuskan (juga di panel Info)', async () => {
  const m = siapkan();
  tampilkan(m, { jenis: 'modul' });
  fireEvent.change(await screen.findByLabelText('Nomor modul'), { target: { value: 'empat' } });
  ketik('Judul', 'Pengantar');
  simpan();
  await screen.findByText('harus bilangan bulat');
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Nomor modul')));
});
