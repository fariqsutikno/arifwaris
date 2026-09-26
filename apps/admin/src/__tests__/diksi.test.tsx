// Tes EditorDiksi: saringDiksi untuk tiap filter (Arab kosong, belum terbit, cari), tabel dikelompokkan per
// halaman, alur "Simpan & ajukan" (buatDraf lalu ajukan), dan sel baca-saja untuk peran reviewer.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import type { RingkasanKunciDiksi } from '@waris/data';
import { KonteksRepo } from '../repo';
import { EditorDiksi, saringDiksi } from '../layar/EditorDiksi';

function kunci(sisa: Partial<RingkasanKunciDiksi> & Pick<RingkasanKunciDiksi, 'kunci' | 'halaman'>): RingkasanKunciDiksi {
  return { terbit: null, revisiTerakhir: null, ...sisa };
}

test('saringDiksi: halaman', () => {
  const daftar = [kunci({ kunci: 'a.b', halaman: 'p1' }), kunci({ kunci: 'c.d', halaman: 'p2' })];
  expect(saringDiksi(daftar, { halaman: 'p1' }).map(k => k.kunci)).toEqual(['a.b']);
});

test('saringDiksi: arKosong (terbit.ar null/kosong)', () => {
  const kosong = kunci({ kunci: 'a.b', halaman: 'p1', terbit: { kunci: 'a.b', halaman: 'p1', id: 'x', ar: null, versiTerbit: 1 } });
  const isi = kunci({ kunci: 'c.d', halaman: 'p1', terbit: { kunci: 'c.d', halaman: 'p1', id: 'y', ar: 'ar', versiTerbit: 1 } });
  const belumTerbit = kunci({ kunci: 'e.f', halaman: 'p1' });
  expect(saringDiksi([kosong, isi, belumTerbit], { arKosong: true }).map(k => k.kunci)).toEqual(['a.b', 'e.f']);
});

test('saringDiksi: belumTerbit (terbit null, atau revisi terakhir bukan disetujui)', () => {
  const belumPernah = kunci({ kunci: 'a.b', halaman: 'p1' });
  const sudahTerbit = kunci({
    kunci: 'c.d', halaman: 'p1',
    terbit: { kunci: 'c.d', halaman: 'p1', id: 'y', ar: 'ar', versiTerbit: 1 },
    revisiTerakhir: { id: 'r1', kunci: 'c.d', idTeks: 'y', arTeks: 'ar', catatan: null, status: 'disetujui', dibuatOleh: 'u1', diperiksaOleh: 'u1', catatanReview: null, dibuatPada: '' },
  });
  const terbitTapiAdaDrafBaru = kunci({
    kunci: 'e.f', halaman: 'p1',
    terbit: { kunci: 'e.f', halaman: 'p1', id: 'y', ar: 'ar', versiTerbit: 1 },
    revisiTerakhir: { id: 'r2', kunci: 'e.f', idTeks: 'y2', arTeks: 'ar2', catatan: null, status: 'diajukan', dibuatOleh: 'u1', diperiksaOleh: null, catatanReview: null, dibuatPada: '' },
  });
  const hasil = saringDiksi([belumPernah, sudahTerbit, terbitTapiAdaDrafBaru], { belumTerbit: true }).map(k => k.kunci);
  expect(hasil).toEqual(['a.b', 'e.f']);
});

test('saringDiksi: cari mencocokkan kunci atau teks id', () => {
  const a = kunci({ kunci: 'halaman1.judul', halaman: 'p1', terbit: { kunci: 'halaman1.judul', halaman: 'p1', id: 'Judul Halaman', ar: null, versiTerbit: 1 } });
  const b = kunci({ kunci: 'lain.tombol', halaman: 'p1', terbit: { kunci: 'lain.tombol', halaman: 'p1', id: 'Simpan', ar: null, versiTerbit: 1 } });
  expect(saringDiksi([a, b], { cari: 'judul' }).map(k => k.kunci)).toEqual(['halaman1.judul']);
  expect(saringDiksi([a, b], { cari: 'lain' }).map(k => k.kunci)).toEqual(['lain.tombol']);
});

async function siapkanDuaKunci() {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'penulis@x.id' }, peran: { u1: 'penulis' } });
  await m.diksi.buatKunci('halaman1.judul', 'halaman1');
  await m.diksi.buatKunci('halaman2.judul', 'halaman2');
  return m;
}

function render_(repo: Awaited<ReturnType<typeof siapkanDuaKunci>>, peran: 'penulis' | 'admin' | 'reviewer' = 'penulis') {
  return render(
    <KonteksRepo.Provider value={{ repo, sesi: { userId: 'u1', email: 'penulis@x.id' }, peran }}>
      <EditorDiksi />
    </KonteksRepo.Provider>,
  );
}

test('tabel dikelompokkan per halaman', async () => {
  const m = await siapkanDuaKunci();
  render_(m);
  await screen.findByText('halaman1.judul');
  expect(screen.getAllByText('halaman1').length).toBeGreaterThan(0);
  expect(screen.getAllByText('halaman2').length).toBeGreaterThan(0);
  const tabel = screen.getAllByRole('table');
  expect(tabel).toHaveLength(2);
  expect(within(tabel[0]!).getByText('halaman1.judul')).toBeTruthy();
});

test('penulis: ubah Arab lalu "Simpan & ajukan" membuat revisi diajukan dengan idTeks lama + arTeks baru', async () => {
  const m = await siapkanDuaKunci();
  render_(m);
  await screen.findByText('halaman1.judul');

  const inputArab = screen.getByLabelText('Arab halaman1.judul') as HTMLInputElement;
  expect(inputArab.getAttribute('dir')).toBe('rtl');
  fireEvent.change(inputArab, { target: { value: 'عنوان' } });

  const tombol = within(inputArab.closest('tr')!).getByRole('button', { name: /simpan.*ajukan/i });
  fireEvent.click(tombol);

  await screen.findByText('diajukan');
  const revisi = await m.diksi.daftarRevisi('halaman1.judul');
  expect(revisi).toHaveLength(1);
  expect(revisi[0]!.status).toBe('diajukan');
  expect(revisi[0]!.idTeks).toBe(''); // idTeks lama (belum pernah terbit) tetap dipertahankan
  expect(revisi[0]!.arTeks).toBe('عنوان');
});

test('reviewer: sel baca-saja, tanpa tombol simpan', async () => {
  const m = await siapkanDuaKunci();
  render_(m, 'reviewer');
  await screen.findByText('halaman1.judul');
  expect(screen.queryByLabelText('Arab halaman1.judul')).toBeNull();
  expect(screen.queryByRole('button', { name: /simpan.*ajukan/i })).toBeNull();
});
