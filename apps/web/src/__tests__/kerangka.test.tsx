import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, keJson } from '../kasus';
import { Aplikasi } from '../Aplikasi';

beforeEach(() => { localStorage.clear(); localStorage.setItem('arif-waris:tur:wizard', '1'); });

const denganIstri = () => { const k = kasusBaru('L'); return { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ISTRI') }; };

const mulai = (tujuan: 'Hitung kasus' | 'Belajar' = 'Hitung kasus') => {
  render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: new RegExp(tujuan) }));
};

it('beranda menanyakan tujuan lalu membuka langkah pewaris tanpa pilihan bawaan', () => {
  mulai();
  expect(screen.getByRole('heading', { name: /laki-laki atau perempuan/i })).toBeTruthy();
  expect(screen.getByRole('radio', { name: /Laki-laki/ }).getAttribute('aria-checked')).toBe('false');
  expect(screen.getByRole('radio', { name: /Perempuan/ }).getAttribute('aria-checked')).toBe('false');
});

it('tombol lanjut nonaktif dengan alasan tertulis', () => {
  mulai();
  const lanjut = screen.getByRole('button', { name: /Lanjut: Harta/ });
  expect(lanjut.hasAttribute('disabled')).toBe(true);
  expect(screen.getByText(/Pilih dulu jenis kelamin/)).toBeTruthy();
  fireEvent.click(screen.getByRole('radio', { name: /Perempuan/ }));
  expect(screen.getByRole('button', { name: /Lanjut: Harta/ }).hasAttribute('disabled')).toBe(false);
});

it('stepper tidak bisa membuka langkah yang belum boleh', () => {
  mulai();
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  const ahliWaris = screen.getByRole('button', { name: /Ahli waris/ });
  expect(ahliWaris.hasAttribute('disabled')).toBe(true);
});

it('ulangi dari awal meminta konfirmasi di halaman', () => {
  mulai();
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Ulangi dari awal' }));
  expect(screen.getByRole('alertdialog')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Simpan file dulu/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(screen.getByRole('heading', { name: /laki-laki atau perempuan/i })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ulangi dari awal' }));
  fireEvent.click(screen.getByRole('button', { name: /Hapus dan mulai baru/ }));
  expect(screen.getByText(/Mau pakai buat apa/)).toBeTruthy();
});

it('ringkasan kasus di samping langkah ikut terisi', () => {
  mulai();
  fireEvent.click(screen.getByRole('radio', { name: /Perempuan/ }));
  const ringkasan = screen.getByRole('complementary', { name: 'Ringkasan kasus' });
  expect(ringkasan.textContent).toMatch(/Perempuan/);
  expect(ringkasan.textContent).toMatch(/Belum ada/);
});

it('header tidak punya tombol simpan', () => {
  mulai();
  expect(screen.queryByRole('banner')?.textContent ?? '').not.toMatch(/Simpan file/);
});

describe('temuan review akhir', () => {
  const isiKasus = () => {
    mulai();
    fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  };

  it('setelah "Hapus dan mulai baru", kasus lama tidak ditawarkan lagi', () => {
    isiKasus();
    fireEvent.click(screen.getByRole('button', { name: 'Ulangi dari awal' }));
    fireEvent.click(screen.getByRole('button', { name: /Hapus dan mulai baru/ }));
    expect(screen.queryByRole('button', { name: /Lanjutkan kasus terakhir/ })).toBeNull();
  });

  it('memilih tujuan saat ada kasus tersimpan meminta konfirmasi dulu', () => {
    isiKasus();
    fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
    fireEvent.click(screen.getByRole('button', { name: /Hitung kasus/ }));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(screen.getByRole('button', { name: /Lanjutkan kasus terakhir/ })).toBeTruthy();
  });

  it('dialog konfirmasi memfokuskan Batal dan tertutup dengan Esc', () => {
    isiKasus();
    fireEvent.click(screen.getByRole('button', { name: 'Ulangi dari awal' }));
    expect(document.activeElement?.textContent).toBe('Batal');
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});

it('ganti jenis kelamin setelah ada ahli waris: minta konfirmasi, lalu ahli waris dikosongkan, harta tetap', () => {
  localStorage.setItem('arif-waris:kasus', keJson({ ...denganIstri(), tirkah: { kotor: 5n, tajhiz: 0n, hutang: 0n, wasiat: 0n } }));
  render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: /Lanjutkan kasus terakhir/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Perempuan/ }));
  const dialog = screen.getByRole('alertdialog');
  expect(dialog.textContent).toMatch(/ahli waris/);
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
  expect(screen.getByRole('radio', { name: /Laki-laki/ }).getAttribute('aria-checked')).toBe('true');
  fireEvent.click(screen.getByRole('radio', { name: /Perempuan/ }));
  fireEvent.click(screen.getByRole('button', { name: /Ganti dan kosongkan/ }));
  expect(screen.getByRole('radio', { name: /Perempuan/ }).getAttribute('aria-checked')).toBe('true');
  const ringkasan = screen.getByRole('complementary', { name: 'Ringkasan kasus' });
  expect(ringkasan.textContent).toMatch(/Belum ada/);
  expect(ringkasan.textContent).toMatch(/Rp 5/);
});

it('ringkasan kasus tanpa kotak centang (tidak terlihat seperti yang bisa dicentang)', () => {
  mulai();
  fireEvent.click(screen.getByRole('radio', { name: /Perempuan/ }));
  const ringkasan = screen.getByRole('complementary', { name: 'Ringkasan kasus' });
  expect(ringkasan.querySelector('.tanda-ringkas')).toBeNull();
  expect(ringkasan.textContent).not.toMatch(/✓/);
});
