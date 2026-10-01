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

it("rujukan Al-Qur'an: memilih hukum menyorot syahidnya; tab Arti/Tafsir yang kosong tidak dirender", async () => {
  const { daftarSyahid } = await import('../konten/sumber');
  const { container } = render(<Rujukan kategori="quran" />);
  const pertama = daftarSyahid()[0]!;
  expect(container.querySelector('mark.syahid')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: pertama.hukum }));
  expect(container.querySelector('mark.syahid')?.textContent).toBe(pertama.syahid);
  expect(screen.queryByRole('tab', { name: 'Arti' })).toBeNull();
  expect(screen.queryByText(/belum diisi/)).toBeNull();
});

it('kitab: aksi baca dan situs sumber berupa tautan/teks, bukan tombol', () => {
  render(<Rujukan kategori="kitab" />);
  expect(screen.queryAllByRole('button', { name: /Baca di sini|Situs sumber/ })).toHaveLength(0);
});

it('rujukan sunnah: status hadits tampil sebagai label', () => {
  const { container } = render(<Rujukan kategori="sunnah" />);
  expect(container.querySelectorAll('.label-status').length).toBeGreaterThan(0);
});

it('rujukan: kategori memakai baris tab (tanpa sidebar); filter bab menyempitkan dalil', () => {
  const { container } = render(<Rujukan kategori="sunnah" />);
  const baris = screen.getByRole('navigation', { name: 'Kategori dalil' });
  expect(baris.querySelector('[aria-current="page"]')?.textContent).toMatch(/Sunnah/);
  expect(container.querySelector('.modul-sidebar')).toBeNull();
  const dalil = RUJUKAN.filter(isi => isi.daftarJenis.includes('H'));
  const bab = [...new Set(dalil.map(isi => isi.bab))].sort((a, b) => a - b);
  const tautan = () => container.querySelectorAll('a[href^="#/rujukan/R"]').length;
  expect(tautan()).toBe(dalil.length);
  fireEvent.click(screen.getByRole('button', { name: `Bab ${bab[0]}` }));
  expect(tautan()).toBe(dalil.filter(isi => isi.bab === bab[0]).length);
  fireEvent.click(screen.getByRole('button', { name: 'Semua bab' }));
  expect(tautan()).toBe(dalil.length);
});

it('detail dalil: "Dipakai di" memuat bab dalil, label status, dan hukum syahid yang bersandar', async () => {
  const { daftarSyahid } = await import('../konten/sumber');
  const syahid = daftarSyahid().find(isi => RUJUKAN.some(dalil => dalil.kode === isi.rujukan))!;
  const dalil = RUJUKAN.find(isi => isi.kode === syahid.rujukan)!;
  render(<Rujukan kode={dalil.kode} />);
  expect(screen.getByText('Dipakai di')).toBeTruthy();
  expect(screen.getByText(syahid.hukum)).toBeTruthy();
  const perluVerifikasi = RUJUKAN.find(isi => isi.status === 'perluVerifikasi');
  if (perluVerifikasi) {
    render(<Rujukan kode={perluVerifikasi.kode} />);
    expect(screen.getAllByText('perlu verifikasi').length).toBeGreaterThan(0);
  }
});

it('penampil kitab: nomor tak ada → pesan; kitab berberkas → bilah atas dan iframe', async () => {
  const { DAFTAR_KITAB } = await import('@waris/content');
  const { sumberKitab } = await import('../konten/sumber');
  const { unmount } = render(<Rujukan kategori="kitab" kitab="999" />);
  expect(screen.getByRole('alert')).toBeTruthy();
  unmount();
  const nomor = DAFTAR_KITAB.findIndex(kitab => sumberKitab().some(isi => isi.judul === kitab.judul && isi.pdf));
  if (nomor < 0) return;
  const { container } = render(<Rujukan kategori="kitab" kitab={String(nomor)} />);
  expect(container.querySelector('.bilah-penampil')).toBeTruthy();
  expect(container.querySelector('iframe.penampil-kitab')).toBeTruthy();
});
