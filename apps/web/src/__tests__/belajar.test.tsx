import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { GLOSARIUM, RUJUKAN } from '@waris/content';
import { Glosarium } from '../layar/belajar/Glosarium';
import { Rujukan } from '../layar/belajar/Rujukan';

it('glosarium menampilkan semua istilah dan bisa dicari lewat arti awam', () => {
  render(<Glosarium />);
  expect(screen.getByText(`${GLOSARIUM.length} istilah`)).toBeTruthy();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'sisa' } });
  expect(screen.getByRole('link', { name: "Ta'shib / 'Ashabah" })).toBeTruthy();
});

it('glosarium dengan id menyorot istilahnya', () => {
  render(<Glosarium id="hajb" />);
  expect(document.getElementById('istilah-hajb')?.className).toContain('terpilih');
});

it('rujukan: semua dalil tertaut per kode, detail menampilkan klaimnya', () => {
  const { container, unmount } = render(<Rujukan />);
  const tautan = [...container.querySelectorAll('a[href^="#/rujukan/R"]')].map(a => a.getAttribute('href'));
  for (const rujukan of RUJUKAN) expect(tautan).toContain(`#/rujukan/${rujukan.kode}`);
  unmount();
  render(<Rujukan kode="R09-4" />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(RUJUKAN.find(r => r.kode === 'R09-4')!.klaim);
});

it('kode rujukan tak dikenal tidak membuat halaman rusak', () => {
  render(<Rujukan kode="R99-9" />);
  expect(screen.getByRole('alert').textContent).toMatch(/R99-9/);
});
