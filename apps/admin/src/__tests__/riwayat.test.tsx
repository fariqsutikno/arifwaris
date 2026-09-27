// Tes RiwayatRevisi (linimasa) dengan repo memori: entri faq dengan dua revisi disetujui reviewer (r1 lalu r2).
// Kalimat manusia memakai nama tim; reviewer bisa menayangkan lagi revisi disetujui yang bukan versi tayang (confirm
// → saatBerubah); penulis tidak. Catatan review tampil. Kejadian Sampah (alasan, pemulihan) ikut di linimasa, dan
// penanda hapus yang dibuang langsung tidak ditulis dua kali.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori, type RingkasanRevisi } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { kalimatRevisi, RiwayatRevisi, susunLinimasa } from '../layar/RiwayatRevisi';
import { DAFTAR_FAQ_UJI } from './contoh';

async function siapkan() {
  const m = buatMemori({ refs: ['R09-7'], sesi: { userId: 'u-p', email: 'p@x.id' }, peran: { 'u-p': 'penulis', 'u-r': 'reviewer', 'u-a': 'admin' } });
  m.daftarkanPengguna({ userId: 'u-p', email: 'penulis@x.id', nama: 'Aisyah' });
  m.daftarkanPengguna({ userId: 'u-r', email: 'r@x.id', nama: 'Ustadz' });
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const r1 = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  await m.editorial.ajukan(r1);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.editorial.setujui(r1);
  m.masukSebagai({ userId: 'u-p', email: 'p@x.id' });
  const r2 = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[1]!, ['R09-7']);
  await m.editorial.ajukan(r2);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.editorial.setujui(r2);
  return { m, entriId, r1, r2 };
}
type Memori = Awaited<ReturnType<typeof siapkan>>['m'];

function tampilkan(m: Memori, entriId: string, revisiTerbitId: string | null, peran: Peran = 'reviewer', userId = 'u-r', saatBerubah = () => {}) {
  m.masukSebagai({ userId, email: `${userId}@x.id` });
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId, email: 'x@x.id' }, peran }}>
      <RiwayatRevisi entriId={entriId} jenis="faq" revisiTerbitId={revisiTerbitId} saatBerubah={saatBerubah} />
    </KonteksRepo.Provider>,
  );
}

test('reviewer: kalimat bernama, r2 berlabel Tayang, r1 bisa ditayangkan lagi', async () => {
  const { m, entriId, r1, r2 } = await siapkan();
  const saatBerubah = vi.fn();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  tampilkan(m, entriId, r2, 'reviewer', 'u-r', saatBerubah);
  const barisR2 = await screen.findByLabelText(`revisi ${r2.slice(0, 8)}`);
  await within(barisR2).findByText(/Anda menyetujui perubahan dari Aisyah/);
  expect(within(barisR2).getByText('Tayang')).toBeTruthy();
  expect(within(barisR2).queryByRole('button', { name: 'Tayangkan lagi' })).toBeNull();
  const barisR1 = screen.getByLabelText(`revisi ${r1.slice(0, 8)}`);
  fireEvent.click(within(barisR1).getByRole('button', { name: 'Tayangkan lagi' }));
  await waitFor(() => expect(saatBerubah).toHaveBeenCalled());
  expect(window.confirm).toHaveBeenCalled();
});

test('penulis: tombol Tayangkan lagi tidak tampil', async () => {
  const { m, entriId, r2 } = await siapkan();
  tampilkan(m, entriId, r2, 'penulis', 'u-p');
  await screen.findAllByRole('article');
  expect(screen.queryByRole('button', { name: 'Tayangkan lagi' })).toBeNull();
});

test('catatan review tampil', async () => {
  const m = buatMemori({ refs: ['R09-7'], sesi: { userId: 'u-p', email: 'p@x.id' }, peran: { 'u-p': 'penulis', 'u-r': 'reviewer' } });
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const r1 = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  await m.editorial.ajukan(r1);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.editorial.kembalikan(r1, 'perbaiki ejaan');
  tampilkan(m, entriId, null);
  expect(await screen.findByText(/perbaiki ejaan/)).toBeTruthy();
});

test('Sampah di linimasa: alasan & pemulihan tercatat; penanda hapus admin tidak ditulis dua kali; tanpa Tayangkan lagi saat di Sampah', async () => {
  const { m, entriId } = await siapkan();
  m.masukSebagai({ userId: 'u-a', email: 'a@x.id' });
  await m.editorial.buangEntri(entriId, 'duplikat');
  const [entri] = await m.konten.daftarEntri('faq');
  tampilkan(m, entriId, entri!.revisiTerbitId, 'admin', 'u-a');
  expect(await screen.findByText(/Anda memindahkan entri ke Sampah/)).toBeTruthy();
  expect(screen.getByText('Alasan: duplikat')).toBeTruthy();
  expect(screen.queryByText(/menyetujui pemindahan ke Sampah/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Tayangkan lagi' })).toBeNull();
});

test('kalimatRevisi & susunLinimasa: terbit langsung, tarik pengajuan Sampah, urutan terbaru di atas', () => {
  const nama = (id: string) => id.toUpperCase();
  const dasar = { entriId: 'e', refs: [] as string[], isi: {}, catatanReview: null, diperiksaOleh: null, diperiksaPada: null, hapus: false };
  const r = (sisa: Partial<RingkasanRevisi> & Pick<RingkasanRevisi, 'id' | 'status' | 'dibuatOleh' | 'dibuatPada'>): RingkasanRevisi => ({ ...dasar, ...sisa });
  expect(kalimatRevisi(r({ id: '1', status: 'disetujui', dibuatOleh: 'a', diperiksaOleh: 'a', dibuatPada: 't' }), nama)).toBe('A menerbitkan perubahan');
  expect(kalimatRevisi(r({ id: '2', status: 'dikembalikan', hapus: true, dibuatOleh: 'p', catatanReview: 'pengajuan ditarik kembali', dibuatPada: 't' }), nama))
    .toBe('P membatalkan pengajuan ke Sampah');
  const urut = susunLinimasa(
    [r({ id: '1', status: 'draf', dibuatOleh: 'a', dibuatPada: '2026-01-01T00:00:01Z' }), r({ id: '2', status: 'diajukan', hapus: true, dibuatOleh: 'a', dibuatPada: '2026-01-01T00:00:03Z' })],
    [{ id: 'j', entriId: 'e', aksi: 'buang_diajukan', pelaku: 'a', pada: '2026-01-01T00:00:02Z', catatan: null }],
  );
  expect(urut.map(b => (b.jenis === 'revisi' ? b.revisi.id : b.jejak.id))).toEqual(['j', '1']);
});
