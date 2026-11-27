// Tes antrean soal kuis dengan repo memori: soal pilihan ganda tampil utuh tanpa kode teknis, checklist bisa dicentang
// reviewer/admin, Periksa hanya muncul bila checklist lengkap, keilmuan hanya melihat soal diperiksa dan menyetujuinya,
// dan setelah satu aksi layar pindah ke soal berikutnya.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { AntreanReview } from '../layar/AntreanReview';
import { soalKuisUji } from './contoh';

const PENULIS = { userId: 'u-p', email: 'p@x.id' };

async function siapkan() {
  const m = buatMemori({ refs: ['R04-2'], sesi: PENULIS, peran: { 'u-p': 'penulis', 'u-r': 'reviewer', 'u-k': 'keilmuan', 'u-a': 'admin' } });
  const revisi: string[] = [];
  const contoh = [
    soalKuisUji('P-04-001', { sumber: 'paket:alfa' }),
    soalKuisUji('P-04-002', { sumber: 'paket:alfa', tingkat: 'sulit' }),
    soalKuisUji('P-05-003', { sumber: 'paket:beta', bab: 5 }),
  ];
  for (const [indeks, soal] of contoh.entries()) {
    const entriId = await m.editorial.buatEntri('soal_kuis', soal.kode, indeks + 1);
    const id = await m.editorial.buatDraf(entriId, 'soal_kuis', soal, ['R04-2']);
    await m.editorial.ajukan(id);
    revisi.push(id);
  }
  return { m, revisi };
}
type Memori = Awaited<ReturnType<typeof siapkan>>['m'];

function tampilkan(m: Memori, peran: Peran, userId: string) {
  m.masukSebagai({ userId, email: `${userId}@x.id` });
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId, email: `${userId}@x.id` }, peran }}>
      <AntreanReview />
    </KonteksRepo.Provider>,
  );
}
const soalAktif = () => screen.findByRole('article');
const centangSemua = async (kartu: HTMLElement) => {
  for (const kotak of within(kartu).getAllByRole('checkbox') as HTMLInputElement[]) if (!kotak.checked) fireEvent.click(kotak);
  await waitFor(() => expect(within(kartu).getByText(/5 dari 5/)).toBeTruthy());
};

test('menampilkan soal utuh: pilihan, kunci, alasan, pembahasan, rujukan manusiawi, tanpa kode teknis', async () => {
  const { m } = await siapkan();
  tampilkan(m, 'reviewer', 'u-r');
  const kartu = await soalAktif();
  expect(within(kartu).getByText('Berapa bagian suami bila pewaris punya anak?')).toBeTruthy();
  expect(within(kartu).getAllByRole('listitem').length).toBeGreaterThanOrEqual(3);
  expect(within(kartu).getAllByText('Jawaban benar')).toHaveLength(1);
  expect(within(kartu).getByText(/Benar, ada anak\./)).toBeTruthy();
  expect(within(kartu).getByText(/far'u waris/)).toBeTruthy();
  expect(within(kartu).getByText('Rujukan')).toBeTruthy();
  expect(kartu.textContent).not.toMatch(/R04-2|"pertanyaan"|indeksBenar/);
  expect(screen.getByText('Soal 1 dari 3')).toBeTruthy();
});

test('Periksa tidak ada sebelum checklist lengkap (pesan sisa butir), muncul setelah 5 butir; pindah ke soal berikutnya', async () => {
  const { m, revisi } = await siapkan();
  tampilkan(m, 'reviewer', 'u-r');
  const kartu = await soalAktif();
  expect(within(kartu).queryByRole('button', { name: 'Periksa' })).toBeNull();
  expect(within(kartu).getByText('Centang 5 butir lagi di checklist sebelum memeriksa.')).toBeTruthy();
  const kotak = within(kartu).getAllByRole('checkbox');
  expect(kotak).toHaveLength(5);
  fireEvent.click(kotak[0]!);
  await waitFor(() => expect(within(kartu).getByText('Centang 4 butir lagi di checklist sebelum memeriksa.')).toBeTruthy());
  await centangSemua(kartu);
  expect(await m.editorial.daftarCeklis(revisi[0]!)).toEqual([1, 2, 3, 4, 5]);
  fireEvent.click(within(kartu).getByRole('button', { name: 'Periksa' }));
  await waitFor(async () => expect(await m.konten.daftarRevisi((await m.konten.daftarEntri('soal_kuis'))[0]!.entriId)).toMatchObject([{ status: 'diperiksa' }]));
  await screen.findByText('Soal 1 dari 2');
  expect(within(await soalAktif()).getByText(/Soal P-04-002/)).toBeTruthy();
});

test('alur dua tahap: reviewer memeriksa, keilmuan hanya melihat yang diperiksa dan menyetujui → terbit', async () => {
  const { m, revisi } = await siapkan();
  tampilkan(m, 'reviewer', 'u-r');
  await centangSemua(await soalAktif());
  fireEvent.click(await screen.findByRole('button', { name: 'Periksa' }));
  await screen.findByText('Soal 1 dari 2');
  expect((await m.editorial.antreanReview()).map(r => r.status)).toEqual(['diperiksa', 'diajukan', 'diajukan']);
  document.body.innerHTML = '';

  tampilkan(m, 'keilmuan', 'u-k');
  const kartu = await soalAktif();
  expect(screen.getByText('Soal 1 dari 1')).toBeTruthy();
  expect(within(kartu).getByText('Soal P-04-001')).toBeTruthy();
  expect(within(kartu).queryByRole('checkbox')).toBeNull();
  expect(within(kartu).queryByRole('button', { name: 'Periksa' })).toBeNull();
  expect(screen.queryByLabelText('Status')).toBeNull();
  fireEvent.click(within(kartu).getByRole('button', { name: 'Setujui' }));
  await waitFor(() => expect(screen.queryByRole('article')).toBeNull());
  expect((await m.konten.bacaTerbit({ jenis: 'soal_kuis' })).map(t => t.revisiId)).toEqual([revisi[0]]);
});

test('reviewer tidak melihat tombol Setujui pada soal diajukan; Kembalikan wajib catatan', async () => {
  const { m } = await siapkan();
  tampilkan(m, 'reviewer', 'u-r');
  const kartu = await soalAktif();
  expect(within(kartu).queryByRole('button', { name: 'Setujui' })).toBeNull();
  fireEvent.click(within(kartu).getByRole('button', { name: 'Kembalikan' }));
  fireEvent.change(within(kartu).getByLabelText('Apa yang perlu diperbaiki?'), { target: { value: 'pengecoh B lemah' } });
  fireEvent.click(within(kartu).getByRole('button', { name: 'Kirim pengembalian' }));
  await screen.findByText('Soal 1 dari 2');
  expect((await m.editorial.antreanReview()).map(r => r.status)).toEqual(['diajukan', 'diajukan']);
});

test('saring per bab, tingkat, paket, status', async () => {
  const { m } = await siapkan();
  tampilkan(m, 'admin', 'u-a');
  await soalAktif();
  expect(screen.getByText('3 dari 3')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Paket'), { target: { value: 'beta' } });
  expect(screen.getByText('1 dari 3')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Paket'), { target: { value: 'alfa' } });
  fireEvent.change(screen.getByLabelText('Tingkat'), { target: { value: 'sulit' } });
  expect(screen.getByText('1 dari 3')).toBeTruthy();
  expect(screen.getByText('Soal P-04-002')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Tingkat'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Bab'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Paket'), { target: { value: '' } });
  expect(screen.getByText('1 dari 3')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'diperiksa' } });
  expect(screen.getByText(/Tidak ada soal yang cocok/)).toBeTruthy();
});
