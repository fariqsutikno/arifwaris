// Tes Pratinjau: entri materi dengan judul diubah tampil lewat layar web sungguhan, dan snapshot asal dipulihkan
// utuh setelah unmount (Review Focus: pratinjau tidak boleh bocor ke layar lain). Jenis tanpa layar → JSON mentah.
// Tes StrictMode wajib ada: portal (main.tsx) merender di dalam <StrictMode>, yang di dev me-mount efek dua kali
// (run-cleanup-run) — pemulihan snapshot harus tetap benar walau lewat siklus ganda itu.
import { StrictMode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { cariPelajaran } from '@waris/web/sumber';
import { Pratinjau } from '../layar/Pratinjau';
import { PELAJARAN_UJI } from './contoh';

afterEach(cleanup);

test('pratinjau materi: judul diubah tampil, snapshot asal pulih setelah tutup', () => {
  const judulAsal = PELAJARAN_UJI.judul;
  const pelajaranDiubah = { ...PELAJARAN_UJI, judul: 'JUDUL PRATINJAU' };
  const { unmount } = render(
    <Pratinjau jenis="materi" slug={PELAJARAN_UJI.slug} isi={pelajaranDiubah} saatTutup={() => {}} />,
  );
  expect(screen.getByRole('heading', { name: 'JUDUL PRATINJAU' })).toBeTruthy();
  unmount();
  expect(cariPelajaran(PELAJARAN_UJI.slug)?.judul).toBe(judulAsal);
});

test('pratinjau materi di StrictMode: judul tampil, snapshot asal tetap pulih setelah tutup', () => {
  const judulAsal = PELAJARAN_UJI.judul;
  const pelajaranDiubah = { ...PELAJARAN_UJI, judul: 'JUDUL PRATINJAU' };
  const { unmount } = render(
    <StrictMode>
      <Pratinjau jenis="materi" slug={PELAJARAN_UJI.slug} isi={pelajaranDiubah} saatTutup={() => {}} />
    </StrictMode>,
  );
  expect(screen.getByRole('heading', { name: 'JUDUL PRATINJAU' })).toBeTruthy();
  unmount();
  expect(cariPelajaran(PELAJARAN_UJI.slug)?.judul).toBe(judulAsal);
});

test('jenis tanpa layar (ahwal): tampil JSON berindentasi + catatan belum ada pratinjau', () => {
  const isi = { kunci: 'anak-lk-dg-anak-pr', baris: [] };
  render(<Pratinjau jenis="ahwal" slug="anak-lk-dg-anak-pr" isi={isi} saatTutup={() => {}} />);
  expect(screen.getByText(/belum ada pratinjau/)).toBeTruthy();
  expect(screen.getByText(/"kunci": "anak-lk-dg-anak-pr"/)).toBeTruthy();
});
