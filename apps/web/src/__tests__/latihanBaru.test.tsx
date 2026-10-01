import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type SoalHitung } from '@waris/content';
import { daftarSoalHitung } from '../konten/sumber';
import { Latihan } from '../layar/belajar/Latihan';
import { judulTopik, perBab, soalPaket } from '../layar/belajar/KuisKonsep';
import { catatLatihan, simpanSkorPaket } from '../progres';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const tampilkan = (tab: 'hitung' | 'kuis', saatKerjakan: (soal: SoalHitung) => void = () => {}) =>
  render(<Latihan tab={tab} kasusSekarang={null} saatKerjakan={saatKerjakan} />);

describe('Soal acak', () => {
  it('Acak soal menampilkan pratinjau; Kerjakan membuka soal itu', () => {
    const dikerjakan: SoalHitung[] = [];
    tampilkan('hitung', soal => dikerjakan.push(soal));
    const panel = within(screen.getByRole('region', { name: 'Soal acak' }));
    expect(panel.queryByRole('button', { name: 'Kerjakan' })).toBeNull();
    fireEvent.click(panel.getByRole('button', { name: 'Acak soal' }));
    fireEvent.click(panel.getByRole('button', { name: 'Kerjakan' }));
    expect(dikerjakan).toHaveLength(1);
    expect(daftarSoalHitung().map(soal => soal.kode)).toContain(dikerjakan[0]!.kode);
  });

  it('dropdown multi-pilih: mengosongkan bab mematikan tombol dan memberi tahu', () => {
    tampilkan('hitung');
    const panel = within(screen.getByRole('region', { name: 'Soal acak' }));
    fireEvent.click(panel.getByRole('button', { name: /Semua bab/ }));
    fireEvent.click(panel.getByRole('button', { name: 'Kosongkan pilihan' }));
    expect(panel.getByText('Pilih minimal satu bab dan satu tingkat.')).toBeTruthy();
    expect(panel.getByRole('button', { name: 'Acak soal' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(panel.getByRole('checkbox', { name: judulTopik(perBab(daftarSoalHitung())[0]![0]) }));
    expect(panel.getByRole('button', { name: 'Acak soal' }).hasAttribute('disabled')).toBe(false);
  });
});

describe('daftar soal hitung', () => {
  it('hanya bab dengan soal berikutnya yang terbuka; mencari membuka bab yang cocok dan menyembunyikan yang lain', () => {
    const [pertama, kedua] = daftarSoalHitung() as [SoalHitung, SoalHitung];
    catatLatihan('hitung', pertama.kode, true, null);
    tampilkan('hitung');
    const kepalaBab = screen.getAllByRole('button', { expanded: true }).filter(tombol => tombol.className === 'kepala-bab');
    expect(kepalaBab).toHaveLength(1);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: kedua.judul } });
    expect(screen.getByText(kedua.judul)).toBeTruthy();
    expect(screen.getAllByRole('button', { expanded: true }).filter(tombol => tombol.className === 'kepala-bab')).toHaveLength(1);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tidak-ada-soal-begini-xyz' } });
    expect(screen.getByText('Tidak ada soal yang cocok.')).toBeTruthy();
  });
});

describe('papan kuis', () => {
  it('menampilkan nilai terbaik dan predikatnya; belum dicoba diberi tahu terus terang', () => {
    simpanSkorPaket('bab-1', '4/5');
    tampilkan('kuis');
    const baris = screen.getByRole('link', { name: judulTopik(1) }).closest('li')!;
    expect(baris.textContent).toContain('80');
    expect(baris.textContent).toContain('Baik');
    expect(baris.textContent).toContain('Butuh 90% untuk Sangat baik');
    expect(screen.getAllByText('Belum dicoba').length).toBeGreaterThan(0);
  });

  it('hasil sesi menampilkan nilai terbaik; mengulang dengan nilai lebih buruk tidak menurunkannya', () => {
    const daftar = soalPaket('bab-1');
    simpanSkorPaket('bab-1', `${daftar.length}/${daftar.length}`);
    render(<Latihan tab="kuis" paket="bab-1" kasusSekarang={null} saatKerjakan={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mulai kuis' }));
    daftar.forEach(soal => {
      const salah = 'ABCD'[(soal.indeksBenar + 1) % soal.pilihan.length]!;
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${salah}\\. `) }));
      fireEvent.click(screen.getByRole('button', { name: /Soal berikutnya|Lihat hasil/ }));
    });
    expect(screen.getByText(/Nilai terbaikmu: 100% \(Sangat baik\)/)).toBeTruthy();
    expect(screen.getByText(/Belum melampaui nilai terbaikmu/)).toBeTruthy();
  });
});

describe('ulangi yang salah', () => {
  it('memuat hanya soal yang salah, dan tidak mengubah rekor paket', () => {
    const daftar = soalPaket('bab-1');
    render(<Latihan tab="kuis" paket="bab-1" kasusSekarang={null} saatKerjakan={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mulai kuis' }));
    daftar.forEach(soal => {
      const salah = 'ABCD'[(soal.indeksBenar + 1) % soal.pilihan.length]!;
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${salah}\\. `) }));
      fireEvent.click(screen.getByRole('button', { name: /Soal berikutnya|Lihat hasil/ }));
    });
    const rekorSebelum = localStorage.getItem('arif-waris:rekor-paket');
    fireEvent.click(screen.getByRole('button', { name: 'Ulangi yang salah' }));
    expect(screen.getByText(`Soal 1 dari ${daftar.length}`)).toBeTruthy();
    daftar.forEach(soal => {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${'ABCD'[soal.indeksBenar]}\\. `) }));
      fireEvent.click(screen.getByRole('button', { name: /Soal berikutnya|Lihat hasil/ }));
    });
    expect(screen.getByText(/Nilai terbaik paket tidak berubah/)).toBeTruthy();
    expect(localStorage.getItem('arif-waris:rekor-paket')).toBe(rekorSebelum);
    expect(screen.queryByRole('button', { name: 'Ulangi yang salah' })).toBeNull();
  });
});
