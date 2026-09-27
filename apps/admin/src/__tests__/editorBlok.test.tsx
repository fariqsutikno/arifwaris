// Tes EditorBlok (Tiptap): nilai awal tampil sebagai chip istilah/rujukan & kartu kasus, mode Markdown bolak-balik,
// Markdown rusak dibuka di mode Markdown dengan galat, mode baca tanpa toolbar, serta sisip video/istilah/rujukan
// lewat dialog. Nilai dicek dari Markdown yang dipancarkan (yang nanti dibaca dariNilaiForm).
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import { KonteksRepo } from '../repo';
import { EditorBlok } from '../layar/EditorBlok';
import type { ModeEditor } from '../editor/ekstensi';

const ISTILAH = [{ nilai: 'ashabah', label: 'Ashabah (ashabah)' }];
const KASUS = '```kasus\npewaris: L\nahli waris: ISTRI, ANAK_LK\nharta: 8\nharapan: ISTRI 1, ANAK_LK 7; ashl 8\n```';
let terakhir = '';

function Uji({ awal, mode = 'blok', bacaSaja = false }: { awal: string; mode?: ModeEditor; bacaSaja?: boolean }) {
  const [nilai, setNilai] = useState(awal);
  terakhir = nilai;
  const memori = buatMemori({ refs: ['R09-7', 'R10-3'], sesi: { userId: 'u', email: 'u@x.id' }, peran: { u: 'penulis' } });
  return (
    <KonteksRepo.Provider value={{ repo: memori, sesi: { userId: 'u', email: 'u@x.id' }, peran: 'penulis' }}>
      <EditorBlok label="Isi" nilai={nilai} saatUbah={setNilai} mode={mode} slug="uji" bacaSaja={bacaSaja} istilah={ISTILAH} />
    </KonteksRepo.Provider>
  );
}
const tombol = (nama: string) => screen.getByRole('button', { name: nama });
const editor = () => screen.getByRole('textbox', { name: 'Isi' });

test('nilai awal: istilah & rujukan jadi chip, kasus jadi kartu; mount tidak memancarkan perubahan', async () => {
  render(<Uji awal={`## Judul\n\nAnak jadi [[ashabah|para ashabah]] [R09-7].\n\n${KASUS}\n`} />);
  expect(editor().querySelector('h2')?.textContent).toBe('Judul');
  expect(editor().querySelector('[data-istilah="ashabah"]')?.textContent).toBe('para ashabah');
  expect(editor().querySelector('[data-rujukan="R09-7"]')?.textContent).toBe('Dalil: Cara pembagian radd');
  expect(await screen.findByText(/Contoh kasus: pewaris laki-laki/)).toBeTruthy();
  expect(terakhir).toBe(`## Judul\n\nAnak jadi [[ashabah|para ashabah]] [R09-7].\n\n${KASUS}\n`);
});

test('mode Markdown bolak-balik memuat ulang dokumen', () => {
  render(<Uji awal="Satu." />);
  fireEvent.click(tombol('Sunting Isi sebagai Markdown'));
  fireEvent.change(screen.getByLabelText('Isi (Markdown)'), { target: { value: '**Dua**' } });
  expect(terakhir).toBe('**Dua**');
  fireEvent.click(tombol('Sunting Isi sebagai teks'));
  expect(screen.queryByLabelText('Isi (Markdown)')).toBeNull();
  expect(editor().querySelector('strong')?.textContent).toBe('Dua');
});

test('Markdown rusak → langsung mode Markdown dengan galat, teks tidak hilang', () => {
  render(<Uji awal={'```video\nbukan tautan\n```'} />);
  expect((screen.getByLabelText('Isi (Markdown)') as HTMLTextAreaElement).value).toContain('bukan tautan');
  expect(screen.getByText(/blok video butuh tautan YouTube/)).toBeTruthy();
  fireEvent.click(tombol('Sunting Isi sebagai teks'));
  expect(screen.getByLabelText('Isi (Markdown)')).toBeTruthy();
});

test('mode baca: tanpa toolbar, tidak bisa disunting', () => {
  render(<Uji awal="Satu." bacaSaja />);
  expect(screen.queryByRole('button', { name: 'Tebal' })).toBeNull();
  expect(editor().getAttribute('contenteditable')).toBe('false');
});

test('mode potongan: tanpa judul/daftar/blok khusus', () => {
  render(<Uji awal="**a** b" mode="potongan" />);
  expect(tombol('Tebal')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Judul' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Sisip video' })).toBeNull();
});

test('sisip video lewat dialog; tautan salah → galat, dialog tetap terbuka', async () => {
  render(<Uji awal="Pembuka." />);
  fireEvent.click(tombol('Sisip video'));
  fireEvent.change(await screen.findByLabelText('Tautan YouTube'), { target: { value: 'https://contoh.id' } });
  fireEvent.click(tombol('Simpan blok'));
  expect(await screen.findByText(/butuh tautan YouTube/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Tautan YouTube'), { target: { value: 'https://youtu.be/abcdefghijk' } });
  fireEvent.change(screen.getByLabelText('Judul video'), { target: { value: 'Pengantar' } });
  fireEvent.click(tombol('Simpan blok'));
  await waitFor(() => expect(terakhir).toContain('```video\nhttps://www.youtube.com/watch?v=abcdefghijk\njudul: Pengantar\n```'));
  expect(terakhir).toContain('Pembuka.');
  expect(await screen.findByText('Video: Pengantar')).toBeTruthy();
});

test('sisip istilah & rujukan dari daftar', async () => {
  render(<Uji awal="Teks" mode="potongan" />);
  fireEvent.click(tombol('Sisip istilah'));
  fireEvent.click(await screen.findByRole('button', { name: 'Ashabah (ashabah)' }));
  await waitFor(() => expect(terakhir).toContain('[[ashabah|Ashabah]]'));
  fireEvent.click(tombol('Sisip rujukan'));
  fireEvent.change(await screen.findByLabelText('Cari: Sisip rujukan'), { target: { value: 'inkisar' } });
  fireEvent.click(await screen.findByRole('button', { name: /^Inkisar maksimal 4 kelompok/ }));
  await waitFor(() => expect(terakhir).toContain('[R10-3]'));
  expect(screen.queryByRole('button', { name: /Cara pembagian radd/ })).toBeNull();
});
