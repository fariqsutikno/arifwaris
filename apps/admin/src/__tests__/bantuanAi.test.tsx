// Tes bantuan AI di portal dengan repo memori berjawaban tiruan: rapikan (Terima mengganti teks), draf kuis (mengisi form,
// ditandai dibantu AI, admin pun wajib lewat review), saran kelengkapan, dan reviewer tanpa tautan AI.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori, type HasilAi, type PermintaanAi } from '@waris/data';
import type { JenisKonten, Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { EditorEntri } from '../layar/EditorEntri';

const permintaan: PermintaanAi[] = [];
function jawab(p: PermintaanAi): HasilAi {
  permintaan.push(p);
  if (p.fitur === 'rapikan') return { fitur: 'rapikan', teks: 'Enam bagian pasti dan siapa yang mendapatkannya.' };
  if (p.fitur === 'saran') return { fitur: 'saran', saran: ['Tambahkan contoh kasus.'] };
  return { fitur: 'drafKuis', draf: {
    pertanyaan: 'Berapa bagian istri bila suami tidak punya anak?', pilihan: ['1/8', '1/4', '1/2', '1/6'], indeksBenar: 1,
    alasanPilihan: ['Bila ada anak.', 'Benar.', 'Itu suami.', 'Itu ibu.'], pembahasan: 'Istri 1/4 tanpa anak [R04-2].', rujukan: ['R04-2'],
  } };
}

function tampilkan(jenis: JenisKonten, peran: Peran) {
  const sesi = { userId: 'u', email: 'u@x.id' };
  const m = buatMemori({ refs: ['R04-2'], sesi, peran: { u: peran }, ai: jawab });
  render(<KonteksRepo.Provider value={{ repo: m, sesi, peran }}><EditorEntri jenis={jenis} /></KonteksRepo.Provider>);
  return m;
}

test('rapikan: hasil tampil sebagai perbandingan, Terima mengganti isi bidang', async () => {
  tampilkan('modul', 'penulis');
  fireEvent.change(await screen.findByLabelText(/Ringkasan/), { target: { value: 'enam bagian pasti dan siapa yg dapat' } });
  fireEvent.click(screen.getByRole('button', { name: 'Rapikan dengan AI' }));
  expect(await screen.findByRole('dialog', { name: 'Hasil rapikan AI' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Terima' }));
  await waitFor(() => expect((screen.getByLabelText(/Ringkasan/) as HTMLTextAreaElement).value).toBe('Enam bagian pasti dan siapa yang mendapatkannya.'));
  expect(permintaan.at(-1)).toEqual({ fitur: 'rapikan', teks: 'enam bagian pasti dan siapa yg dapat' });
});

test('draf kuis: dasar hukum bab dikirim, form terisi, ditandai AI, admin hanya bisa kirim untuk review', async () => {
  const m = tampilkan('soal_kuis', 'admin');
  fireEvent.click(await screen.findByRole('button', { name: 'Buat draf dengan AI' }));
  const dialog = await screen.findByRole('dialog', { name: 'Buat draf soal dengan AI' });
  fireEvent.change(within(dialog).getByLabelText('Bab'), { target: { value: '4' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Buat draf' }));
  expect(await screen.findByText('Dibantu AI · perlu dicek')).toBeTruthy();
  const kuis = permintaan.at(-1) as Extract<PermintaanAi, { fitur: 'drafKuis' }>;
  expect(kuis.bab).toBe(4);
  expect(kuis.rujukan.every(r => r.kode.startsWith('R04-'))).toBe(true);
  expect(screen.queryByRole('button', { name: 'Terbitkan sekarang' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Kirim untuk review' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Ya, kirim' }));
  await waitFor(async () => expect(await m.editorial.antreanReview()).toMatchObject([{ refs: ['R04-2'], isi: { dibantuAi: true, indeksBenar: 1 } }]));
});

test('saran kelengkapan tampil di panel Info materi/FAQ', async () => {
  tampilkan('faq', 'penulis');
  expect(await screen.findByRole('heading', { name: 'Saran AI' })).toBeTruthy();
});

test('reviewer: tidak ada tautan AI', async () => {
  tampilkan('soal_kuis', 'reviewer');
  await screen.findByRole('heading', { name: /Soal kuis baru/ });
  expect(screen.queryByRole('button', { name: 'Buat draf dengan AI' })).toBeNull();
});
