// Tes EditorBlok dengan pemeriksa sebaris: isi format baru langsung terbuka sebagai Markdown, temuan tampil dengan
// nomor baris dan bahasa biasa setelah jeda ketik, tautan "Sintaks blok" membuka panelnya, isi gaya lama tidak diperiksa.
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import { KonteksRepo } from '../repo';
import { EditorBlok } from '../layar/EditorBlok';

const ALUR = '```alur\ntahap: hajb\ntanya: Siapa yang gugur?\nhasil: daftar ahli waris\n```';
const PENUTUP = '## Cek pemahaman\n\nSilakan menjawab.\n\n## Ringkasnya\n\nSingkat saja.\n';
const KASUS = (harapan: string) => `\`\`\`kasus\npewaris: L\nahli waris: ISTRI, ANAK_LK\nharta: 8\nharapan: ${harapan}\n\`\`\``;

function Uji({ awal, periksa = true }: { awal: string; periksa?: boolean }) {
  const [nilai, setNilai] = useState(awal);
  const memori = buatMemori({ refs: [], sesi: { userId: 'u', email: 'u@x.id' }, peran: { u: 'penulis' } });
  return (
    <KonteksRepo.Provider value={{ repo: memori, sesi: { userId: 'u', email: 'u@x.id' }, peran: 'penulis' }}>
      <EditorBlok label="Isi" nilai={nilai} saatUbah={setNilai} mode="blok" slug="5-1-hajb" bacaSaja={false} istilah={[]} periksa={periksa} />
    </KonteksRepo.Provider>
  );
}

test('isi format baru terbuka sebagai Markdown; angka salah dilaporkan dengan baris dan bahasa biasa', async () => {
  render(<Uji awal={`${ALUR}\n\n${KASUS('ISTRI 1, ANAK_LK 6; ashl 8')}\n\n${PENUTUP}`} />);
  expect(screen.getByRole('textbox', { name: 'Isi (Markdown)' })).toBeTruthy();
  const daftar = await screen.findByRole('list', { name: 'Temuan pemeriksa' });
  expect(daftar.textContent).toContain('Baris 7:');
  expect(daftar.textContent).toContain('Angka contoh tidak sama dengan hasil hitung. Hasil hitung: istri 1, anak laki-laki 7; penyebut akhir 8.');
  expect(screen.getByRole('status').textContent).toContain('1 galat harus diperbaiki sebelum disimpan');
});

test('memperbaiki angka menghapus temuan setelah jeda', async () => {
  render(<Uji awal={`${ALUR}\n\n${KASUS('ISTRI 1, ANAK_LK 6; ashl 8')}\n\n${PENUTUP}`} />);
  await screen.findByRole('list', { name: 'Temuan pemeriksa' });
  fireEvent.change(screen.getByRole('textbox', { name: 'Isi (Markdown)' }), { target: { value: `${ALUR}\n\n${KASUS('ISTRI 1, ANAK_LK 7; ashl 8')}\n\n${PENUTUP}` } });
  await waitFor(() => expect(screen.queryByRole('list', { name: 'Temuan pemeriksa' })).toBeNull());
  expect(screen.getByText(/Tidak ada temuan/)).toBeTruthy();
});

test('tautan Sintaks blok membuka dan menutup panel', async () => {
  render(<Uji awal={`${ALUR}\n`} />);
  fireEvent.click(screen.getByRole('button', { name: 'Sintaks blok' }));
  expect(screen.getByLabelText('Sintaks blok').textContent).toContain('cara-berpikir');
  fireEvent.click(screen.getByRole('button', { name: 'Tutup sintaks blok' }));
  expect(screen.queryByLabelText('Sintaks blok')).toBeNull();
});

test('isi gaya lama tidak diperiksa', async () => {
  render(<Uji awal={'## Masalahnya\n\nSatu paragraf.\n'} />);
  expect(await screen.findByText(/Isi gaya lama/)).toBeTruthy();
  expect(screen.queryByRole('list', { name: 'Temuan pemeriksa' })).toBeNull();
});

test('tanpa prop periksa panel tidak muncul', () => {
  render(<Uji awal={`${ALUR}\n`} periksa={false} />);
  expect(screen.queryByLabelText('Pemeriksa isi pelajaran')).toBeNull();
});
