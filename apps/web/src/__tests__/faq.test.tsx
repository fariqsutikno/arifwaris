import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { DAFTAR_FAQ } from '@waris/content';
import { Faq } from '../layar/belajar/Faq';

it('FAQ: semua pertanyaan tampil per kelompok, bisa dicari, dan id membuka pertanyaannya', () => {
  const pertama = DAFTAR_FAQ[0]!;
  const { container } = render(<Faq id={pertama.id} kasusSekarang={null} saatCoba={() => {}} />);
  expect(container.querySelectorAll('details').length).toBe(DAFTAR_FAQ.length);
  expect((document.getElementById(`faq-${pertama.id}`) as HTMLDetailsElement).open).toBe(true);
  expect(container.querySelector('a.tautan-dalil[href^="#/rujukan/R"]')).toBeTruthy();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'anak angkat' } });
  expect(container.querySelectorAll('details').length).toBe(1);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz tidak ada' } });
  expect(screen.getByText(/Belum ada pertanyaan yang cocok/)).toBeTruthy();
});
