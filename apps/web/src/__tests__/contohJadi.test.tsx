// F3 mode contoh jadi: blok kasus materi menautkan ke #/lab/contoh/<slug>/<indeks>; layar itu memakai Hasil hanya-baca
// dengan kasus dari konten, tanpa tebakan, dan tidak menyentuh kasus pengguna di penyimpanan lokal.
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ContohJadi } from '../layar/belajar/ContohJadi';
import { Materi } from '../layar/belajar/Materi';
import { kasusBaru, keJson, muatLokal, simpanLokal } from '../kasus';
import { bacaRiwayat } from '../riwayat';
import { bacaRute, tautanContoh, tautanInduk } from '../rute';

const SLUG = 'pratinjau-5-1-hajb';

beforeEach(() => localStorage.clear());

describe('alamat contoh', () => {
  it('tautan dan bacaan rute bolak-balik, indeks ngawur = -1', () => {
    expect(bacaRute(tautanContoh('5-1-hajb', 3))).toEqual({ halaman: 'contoh', slug: '5-1-hajb', indeks: 3 });
    expect(bacaRute('#/lab/contoh/5-1-hajb/abc')).toEqual({ halaman: 'contoh', slug: '5-1-hajb', indeks: -1 });
    expect(tautanInduk(bacaRute(tautanContoh('5-1-hajb', 3)))).toBe('#/belajar/5-1-hajb');
  });
});

describe('blok kasus di pelajaran', () => {
  it('menautkan ke contoh jadi, bukan tombol yang menimpa kasus pengguna', () => {
    render(<Materi slug={SLUG} />);
    const tautan = screen.getAllByRole('link', { name: 'Lihat langkah lengkapnya di Lab' });
    expect(tautan[0]!.getAttribute('href')).toMatch(new RegExp(`^#/lab/contoh/${SLUG}/\\d+$`));
    expect(screen.queryByRole('button', { name: 'Buka di Hitung' })).toBeNull();
  });
});

describe('layar contoh jadi', () => {
  const indeksKasus = () => {
    render(<Materi slug={SLUG} />);
    const href = screen.getAllByRole('link', { name: 'Lihat langkah lengkapnya di Lab' })[0]!.getAttribute('href')!;
    document.body.innerHTML = '';
    return Number(href.split('/').at(-1));
  };

  it('Hasil lengkap tanpa tebakan, pita kembali ke pelajaran, kasus pengguna tidak berubah', () => {
    const milikPengguna = kasusBaru('L');
    simpanLokal(milikPengguna);
    const sebelum = keJson(muatLokal()!);
    const riwayatSebelum = bacaRiwayat().length;

    const { container } = render(<ContohJadi slug={SLUG} indeks={indeksKasus()} />);
    expect(container.querySelector('table.faraidh')).not.toBeNull();
    expect(container.querySelector('.mode-belajar')).toBeNull();
    expect(container.querySelector('table.faraidh input')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(container.querySelector('.isi-hero .lok-hero')?.textContent).toMatch(/^Contoh dari pelajaran 5\.1, bagian \d+/);
    expect(screen.getByRole('link', { name: 'Kembali ke pelajaran' }).getAttribute('href')).toBe(`#/belajar/${SLUG}`);

    expect(keJson(muatLokal()!)).toBe(sebelum);
    expect(bacaRiwayat()).toHaveLength(riwayatSebelum);
  });

  it.each([['slug salah', 'tidak-ada', 0], ['indeks bukan kasus', SLUG, 0], ['indeks di luar', SLUG, 9999], ['indeks ngawur', SLUG, -1]])('%s: pesan tidak ditemukan + tautan kembali', (_nama, slug, indeks) => {
    render(<ContohJadi slug={slug} indeks={indeks} />);
    expect(screen.getByRole('alert').textContent).toMatch(/tidak ditemukan/);
    expect(screen.getByRole('link', { name: /Belajar/ }).getAttribute('href')).toBe('#/belajar');
  });
});
