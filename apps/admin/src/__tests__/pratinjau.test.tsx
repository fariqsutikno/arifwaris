// Tes Pratinjau: entri materi dengan judul diubah tampil lewat layar web sungguhan, dan snapshot asal dipulihkan
// utuh setelah unmount (Review Focus: pratinjau tidak boleh bocor ke layar lain). Jenis tanpa layar → JSON mentah.
// Tes StrictMode wajib ada: portal (main.tsx) merender di dalam <StrictMode>, yang di dev me-mount efek dua kali
// (run-cleanup-run) — pemulihan snapshot harus tetap benar walau lewat siklus ganda itu.
// Tes lewat EditorEntri (bukan <Pratinjau> langsung) memverifikasi Pratinjauan: re-render EditorEntri yang tidak
// mengubah bentuk (mis. memilih ref) tidak boleh membuat <Pratinjau> pasang-ulang & anaknya remount.
import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import { keJson } from '@waris/content';
import { cariPelajaran } from '@waris/web/sumber';
import { KonteksRepo } from '../repo';
import { EditorEntri } from '../layar/EditorEntri';
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

test('EditorEntri: re-render yang tidak mengubah bentuk (pilih ref) tidak me-remount pratinjau', async () => {
  // soal_kuis: KartuSoalKuis pegang state "sudah dijawab" sendiri (dipilih); kalau Pratinjauan membuat objek
  // `isi` baru tiap render (dariBentuk dipanggil ulang tanpa memo), <Pratinjau> pasang-ulang & anaknya remount,
  // menghapus jawaban yang sudah dipilih. Ini indikator paling langsung dari Review Focus (bentuk tidak berubah
  // → tidak boleh ada remount).
  const soalKuis = {
    kode: 'K-01', bab: 1,
    pertanyaan: [{ jenis: 'teks', teks: 'Berapa fardh istri tanpa anak?' }],
    pilihan: [[{ jenis: 'teks', teks: '1/8' }], [{ jenis: 'teks', teks: '1/4' }]],
    indeksBenar: 1,
    pembahasan: [{ jenis: 'teks', teks: 'Istri dapat 1/4 tanpa anak. [R05-1]' }],
  };
  const m = buatMemori({ refs: ['R09-7'], sesi: { userId: 'u-p', email: 'p@x.id' }, peran: { 'u-p': 'penulis' } });
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u-p', email: 'p@x.id' }, peran: 'penulis' }}>
      <EditorEntri jenis="soal_kuis" />
    </KonteksRepo.Provider>,
  );
  fireEvent.change(screen.getByLabelText('JSON'), { target: { value: JSON.stringify(keJson('soal_kuis', soalKuis as never)) } });
  fireEvent.click(screen.getByRole('button', { name: 'Pratinjau' }));
  fireEvent.click(await screen.findByRole('button', { name: /^B\. 1\/4$/ }));
  expect(screen.getByRole('status')).toBeTruthy(); // hasil-tebak tampil setelah menjawab

  // Memicu re-render EditorEntri tanpa mengubah bentuk (pilih ref, hanya mengubah state `refs`).
  fireEvent.change(await screen.findByLabelText('Cari ref'), { target: { value: 'R09' } });
  fireEvent.click(await screen.findByRole('button', { name: 'R09-7' }));

  // Kalau <Pratinjau>/<KartuSoalKuis> remount, jawaban yang sudah dipilih hilang dan hasil-tebak ikut hilang.
  expect(screen.getByRole('status')).toBeTruthy();
});

test('jenis tanpa layar (ahwal): tampil JSON berindentasi + catatan belum ada pratinjau', () => {
  const isi = { kunci: 'anak-lk-dg-anak-pr', baris: [] };
  render(<Pratinjau jenis="ahwal" slug="anak-lk-dg-anak-pr" isi={isi} saatTutup={() => {}} />);
  expect(screen.getByText(/belum ada pratinjau/)).toBeTruthy();
  expect(screen.getByText(/"kunci": "anak-lk-dg-anak-pr"/)).toBeTruthy();
});
