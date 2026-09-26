import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { daftarFaq } from '../konten/sumber';
import { Faq } from '../layar/belajar/Faq';

it('FAQ: semua pertanyaan tampil per kelompok, bisa dicari, dan id membuka pertanyaannya', () => {
  const pertama = daftarFaq()[0]!;
  const { container } = render(<Faq id={pertama.id} kasusSekarang={null} saatCoba={() => {}} />);
  expect(container.querySelectorAll('details').length).toBe(daftarFaq().length);
  expect((document.getElementById(`faq-${pertama.id}`) as HTMLDetailsElement).open).toBe(true);
  expect(container.querySelector('button.chip-dalil')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: /^Bagikan pertanyaan ini: / })).toHaveLength(daftarFaq().length);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'anak angkat' } });
  expect(container.querySelectorAll('details').length).toBe(1);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz tidak ada' } });
  expect(screen.getByText(/Belum ada pertanyaan yang cocok/)).toBeTruthy();
});
