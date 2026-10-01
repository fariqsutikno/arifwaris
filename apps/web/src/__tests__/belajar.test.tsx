import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { RUJUKAN } from '@waris/content';
import { glosarium } from '../konten/sumber';
import { Glosarium } from '../layar/belajar/Glosarium';
import { KATEGORI_RUJUKAN, Rujukan } from '../layar/rujukan/Rujukan';

it('glosarium menampilkan semua istilah dan bisa dicari lewat arti awam', () => {
  render(<Glosarium />);
  expect(screen.getByText(`${glosarium().length} istilah`)).toBeTruthy();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'sisa' } });
  expect(screen.getByRole('link', { name: "Ta'shib / 'Ashabah" })).toBeTruthy();
});

it('glosarium dengan id menyorot istilahnya', () => {
  render(<Glosarium id="hajb" />);
  expect(document.getElementById('istilah-hajb')?.className).toContain('terpilih');
});

it('rujukan: tiap dalil KB bisa dicapai dari salah satu kategori; detail menampilkan klaimnya', () => {
  const tautan = new Set<string>();
  for (const kategori of KATEGORI_RUJUKAN) {
    const { container, unmount } = render(<Rujukan kategori={kategori} />);
    container.querySelectorAll('a[href^="#/rujukan/R"]').forEach(a => tautan.add(a.getAttribute('href')!));
    unmount();
  }
  for (const rujukan of RUJUKAN) expect(tautan, rujukan.kode).toContain(`#/rujukan/${rujukan.kode}`);
  render(<Rujukan kode="R09-4" />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(RUJUKAN.find(r => r.kode === 'R09-4')!.klaim);
});

it('rujukan tanpa kategori membuka Awal: ubin tiap kategori dan kolom cari', () => {
  render(<Rujukan />);
  expect(screen.getByRole('searchbox', { name: 'Cari dalil, surah, atau kitab' })).toBeTruthy();
  for (const kategori of KATEGORI_RUJUKAN) expect(document.querySelector(`a[href="#/rujukan/${kategori}"]`), kategori).toBeTruthy();
});

it('rujukan: kata cari menampilkan hasil bertaut; tanpa hasil → pesan', () => {
  render(<Rujukan />);
  const kolom = screen.getByRole('searchbox');
  fireEvent.change(kolom, { target: { value: 'zzqqxx' } });
  expect(screen.getByText('Tidak ada yang cocok. Coba kata lain.')).toBeTruthy();
  fireEvent.change(kolom, { target: { value: RUJUKAN[0]!.klaim.slice(0, 12) } });
  expect(document.querySelector(`a[href="#/rujukan/${RUJUKAN[0]!.kode}"]`)).toBeTruthy();
});

it('rujukan: kategori tak dikenal jatuh ke Awal', () => {
  render(<Rujukan kategori="entah" />);
  expect(screen.getByRole('searchbox')).toBeTruthy();
});

it('kode rujukan tak dikenal tidak membuat halaman rusak', () => {
  render(<Rujukan kode="R99-9" />);
  expect(screen.getByRole('alert').textContent).toMatch(/R99-9/);
});

it("rujukan Al-Qur'an: memilih hukum menyorot syahidnya di teks ayat; arti & tafsir berupa placeholder jujur", async () => {
  const { daftarSyahid } = await import('../konten/sumber');
  const { container } = render(<Rujukan kategori="quran" />);
  const pertama = daftarSyahid()[0]!;
  expect(container.querySelector('mark.syahid')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: pertama.hukum }));
  expect(container.querySelector('mark.syahid')?.textContent).toBe(pertama.syahid);
  fireEvent.click(screen.getAllByRole('tab', { name: 'Arti' })[0]!);
  expect(screen.getByText(/Arti ayat ini belum diisi/)).toBeTruthy();
});

it('kitab tanpa sumber: tombol baca nonaktif dengan label, bukan tombol mati', () => {
  render(<Rujukan kategori="kitab" />);
  for (const tombol of screen.getAllByRole('button', { name: /belum tersedia/ })) expect((tombol as HTMLButtonElement).disabled).toBe(true);
});
