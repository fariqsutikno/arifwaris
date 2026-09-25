import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DAFTAR_PELAJARAN, type ContohKasus } from '@waris/content';
import { jalankan } from '../jalankan';
import { ringkas } from '../hasil/ringkasan';
import { kasusDariContoh } from '../layar/belajar/contoh';
import { Belajar } from '../layar/belajar/Belajar';
import { Materi } from '../layar/belajar/Materi';
import { bacaPelajaranSelesai } from '../preferensi';

const semuaContoh = DAFTAR_PELAJARAN.flatMap(pelajaran => pelajaran.blok.flatMap((blok, urutan) =>
  blok.jenis === 'kasus' ? [[`${pelajaran.slug} #${urutan}`, blok.kasus] as [string, ContohKasus]] : []));

describe('contoh kasus di materi = hasil engine', () => {
  it('setiap pelajaran yang punya contoh ikut diuji', () => expect(semuaContoh.length).toBeGreaterThan(0));

  it.each(semuaContoh)('%s', (_nama, contoh) => {
    const kasus = kasusDariContoh(contoh);
    const tampil = jalankan(kasus);
    if (tampil.jenis !== 'biasa' || tampil.hasil.status !== 'OK') throw new Error(JSON.stringify(tampil));
    const { penerima, penyebut } = ringkas(kasus, tampil);
    const sahamPerKunci: Record<string, bigint> = {};
    for (const orang of penerima) if (orang.saham > 0n) sahamPerKunci[orang.kunci!] = (sahamPerKunci[orang.kunci!] ?? 0n) + orang.saham;
    expect(sahamPerKunci).toEqual(contoh.harapan.saham);
    expect(penyebut).toBe(contoh.harapan.ashlAkhir);
  });
});

describe('halaman belajar', () => {
  it('beranda belajar: lanjutkan pelajaran pertama, angka progres, jalur tiap modul', () => {
    render(<Belajar />);
    const lanjut = screen.getByRole('link', { name: new RegExp(DAFTAR_PELAJARAN[0]!.judul) });
    expect(lanjut.getAttribute('href')).toBe(`#/belajar/${DAFTAR_PELAJARAN[0]!.slug}`);
    expect(screen.getByLabelText(/^Progres 0%/)).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Progres' })).getAllByRole('link')).toHaveLength(3);
    expect(screen.getAllByText('Menyusul').length).toBeGreaterThan(0);
  });

  it('pelajaran dengan contoh: tabel dari engine, tautan dalil, dan selesai tersimpan', () => {
    const pelajaran = DAFTAR_PELAJARAN.find(isi => isi.blok.some(blok => blok.jenis === 'kasus'))!;
    const dicoba: unknown[] = [];
    render(<Materi slug={pelajaran.slug} kasusSekarang={null} saatCoba={kasus => dicoba.push(kasus)} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(pelajaran.judul);
    expect(document.querySelector('table.faraidh')).toBeTruthy();
    expect(document.querySelector('a.tautan-dalil[href^="#/rujukan/R"]')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Coba di kalkulator' })[0]!);
    expect(dicoba).toHaveLength(1);
    const navigasi = screen.getByRole('navigation', { name: 'Navigasi pelajaran' });
    expect(within(navigasi).getByRole('link', { name: '⌂ Beranda belajar' }).getAttribute('href')).toBe('#/belajar');
    fireEvent.click(within(navigasi).getByRole('link', { name: 'Berikutnya →' }));
    expect(bacaPelajaranSelesai().has(pelajaran.slug)).toBe(true);
    expect(within(screen.getByRole('complementary', { name: 'Daftar materi' })).getByRole('link', { current: 'page' }).textContent).toContain(pelajaran.judul);
  });

  it('cek pemahaman di materi: pilihan berhuruf, pembahasan muncul setelah memilih', () => {
    const pelajaran = DAFTAR_PELAJARAN.find(isi => isi.blok.some(blok => blok.jenis === 'kuis'))!;
    render(<Materi slug={pelajaran.slug} kasusSekarang={null} saatCoba={() => {}} />);
    const kartu = document.querySelector('fieldset.kartu-kuis') as HTMLElement;
    fireEvent.click(within(kartu).getByRole('button', { name: /^A\. / }));
    expect(within(kartu).getByRole('status').textContent).toMatch(/Benar!|Belum tepat/);
  });

  it('coba di kalkulator saat ada kasus lain: tanya dulu', () => {
    const pelajaran = DAFTAR_PELAJARAN.find(isi => isi.blok.some(blok => blok.jenis === 'kasus'))!;
    const dicoba: unknown[] = [];
    render(<Materi slug={pelajaran.slug} kasusSekarang={kasusDariContoh(semuaContoh[0]![1])} saatCoba={kasus => dicoba.push(kasus)} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Coba di kalkulator' })[0]!);
    expect(dicoba).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Hapus dan mulai baru' }));
    expect(dicoba).toHaveLength(1);
  });

  it('slug tak dikenal tidak membuat halaman rusak', () => {
    render(<Materi slug="tidak-ada" kasusSekarang={null} saatCoba={() => {}} />);
    expect(screen.getByRole('alert').textContent).toMatch(/tidak ditemukan/);
  });
});
