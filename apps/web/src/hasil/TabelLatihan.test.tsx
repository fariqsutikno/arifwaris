import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hitung, KONFIGURASI_BAWAAN, type GrafKeluarga, type InputEngine, type Orang } from '@waris/engine';
import { TabelLatihan } from './TabelLatihan';
import { susunTabelSoal, type TabelSoal } from '@waris/latihan';
import { namaOrang } from '../format';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });
const tabelDari = (graf: GrafKeluarga): TabelSoal => {
  const masukan: InputEngine = { graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' };
  const hasil = hitung(masukan);
  const tabel = hasil.status === 'OK' ? susunTabelSoal(hasil, id => namaOrang(graf, hasil.statusOrang, id)) : { status: 'TIDAK_DIDUKUNG' as const };
  if ('status' in tabel) throw new Error(tabel.status);
  return tabel;
};
// Bab 16.1: istri 1/8, anak lk + anak pr ashabah; 8 → 24.
const tabel161 = tabelDari({ idPewaris: 'D', pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }], orang: {
  D: orang('D', 'L', { statusHidup: 'wafat' }), W1: orang('W1', 'P'),
  S1: orang('S1', 'L', { idAyah: 'D', idIbu: 'W1' }), D1: orang('D1', 'P', { idAyah: 'D', idIbu: 'W1' }) } });
const tabelTerhalang = tabelDari({ idPewaris: 'D', pernikahan: [], orang: {
  D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }), A: orang('A', 'L'), I: orang('I', 'P'),
  K: orang('K', 'L', { idAyah: 'A', idIbu: 'I' }) } });

const saatMencoba = vi.fn(), saatBenar = vi.fn(), saatLihatJawaban = vi.fn();
const tampilkan = (tabel = tabel161, terbuka = false) =>
  render(<TabelLatihan tabel={tabel} terbuka={terbuka} saatMencoba={saatMencoba} saatBenar={saatBenar} saatLihatJawaban={saatLihatJawaban} />);
const pilih = (nama: string, nilai: string) => fireEvent.change(screen.getByRole('combobox', { name: `Bagian ${nama}` }), { target: { value: nilai } });
const ketik = (nama: string, nilai: string) => fireEvent.change(screen.getByRole('textbox', { name: nama }), { target: { value: nilai } });
const kotak = (nama: string) => screen.getByRole('textbox', { name: nama }) as HTMLInputElement;
const periksa = () => fireEvent.click(screen.getByRole('button', { name: 'Periksa' }));

// Math.random = 0 → jangkar = sel "Asal masalah" Istri (calon pertama): terisi 1.
function isiBenar() {
  pilih('Istri', '1/8'); pilih('Anak laki-laki', 'Ashabah'); pilih('Anak perempuan', 'Ashabah');
  ketik('Asal masalah', '8'); ketik('Asal masalah bersama', '7');
  ketik('Asal masalah akhir', '24');
  ketik('Asal masalah akhir Istri', '3'); ketik('Asal masalah akhir Anak laki-laki', '14'); ketik('Asal masalah akhir Anak perempuan', '7');
}

beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0); });
afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

describe('TabelLatihan — soal biasa', () => {
  it('isi → Periksa → Benar semua; XP dan percobaan dilaporkan; isian terkunci', () => {
    tampilkan();
    isiBenar();
    periksa();
    expect(screen.getByText('Benar semua.')).toBeTruthy();
    expect(saatMencoba).toHaveBeenCalledTimes(1);
    expect(saatBenar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Periksa' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Lihat jawaban' })).toBeNull();
  });

  it('kelipatan sebanding benar + keterangan bentuk terkecil', () => {
    tampilkan();
    pilih('Istri', '1/8'); pilih('Anak laki-laki', 'Ashabah'); pilih('Anak perempuan', 'Ashabah');
    ketik('Asal masalah', '8'); ketik('Asal masalah bersama', '7');
    ketik('Asal masalah akhir', '48');
    ketik('Asal masalah akhir Istri', '6'); ketik('Asal masalah akhir Anak laki-laki', '28'); ketik('Asal masalah akhir Anak perempuan', '14');
    periksa();
    expect(screen.getByText('Benar semua. Bentuk terkecil: Asal masalah akhir 48 (terkecilnya 24).')).toBeTruthy();
    expect(saatBenar).toHaveBeenCalled();
  });

  it('salah berhenti di kolom pertama yang salah; sel keliru ditandai; XP tidak diberikan', () => {
    tampilkan();
    isiBenar();
    pilih('Istri', '1/4');
    periksa();
    expect(screen.getByText('Mulai salah di kolom "Bagian". Kolom sesudahnya belum diperiksa.')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Bagian Istri' }).closest('td')!.classList.contains('keliru')).toBe(true);
    expect(saatMencoba).toHaveBeenCalledTimes(1);
    expect(saatBenar).not.toHaveBeenCalled();
  });

  it('kolom belum lengkap: umpan kuning dan bukan percobaan', () => {
    tampilkan();
    periksa();
    expect(screen.getByText('Kolom "Bagian" belum lengkap.')).toBeTruthy();
    expect(saatMencoba).not.toHaveBeenCalled();
  });

  it('Kosongkan setelah salah mengosongkan kotak dan menghapus umpan', () => {
    tampilkan();
    isiBenar();
    pilih('Istri', '1/4');
    periksa();
    fireEvent.click(screen.getByRole('button', { name: 'Kosongkan' }));
    expect(screen.queryByText(/Mulai salah/)).toBeNull();
    expect(kotak('Asal masalah').value).toBe('');
    expect((screen.getByRole('combobox', { name: 'Bagian Istri' }) as HTMLSelectElement).value).toBe('');
    expect(screen.getByText('1')).toBeTruthy(); // jangkar tetap terisi
  });

  it('Lihat jawaban memanggil dialog tahan milik kartu induk', () => {
    tampilkan();
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    expect(saatLihatJawaban).toHaveBeenCalledTimes(1);
  });

  it('jawaban terbuka: kunci tampil, isian berbeda dicoret, Periksa hilang, umpan abu', () => {
    const { rerender } = tampilkan();
    pilih('Istri', '1/4');
    ketik('Asal masalah', '8');
    rerender(<TabelLatihan tabel={tabel161} terbuka saatMencoba={saatMencoba} saatBenar={saatBenar} saatLihatJawaban={saatLihatJawaban} />);
    expect(screen.getByText('Jawaban dibuka. Isianmu yang berbeda dicoret. Soal ini tidak memberi XP.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Periksa' })).toBeNull();
    const barisIstri = screen.getByText('Istri', { selector: 'th' }).closest('tr')!;
    expect(within(barisIstri).getByText('1/4').tagName).toBe('S');
    expect(barisIstri.textContent).toContain('1/8');
    expect(screen.getByText('24')).toBeTruthy();
    expect(saatBenar).not.toHaveBeenCalled();
  });

  it('kotak angka menolak / , ½ 1/8 dengan keterangan; ٢٤ menjadi 24', () => {
    tampilkan();
    const kepala = kotak('Asal masalah');
    expect(screen.queryByText(/hanya menerima bilangan bulat/)).toBeNull();
    for (const ditolak of ['/', ',', '½', '1/8']) {
      fireEvent.change(kepala, { target: { value: ditolak } });
      expect(kepala.value).toBe('');
    }
    expect(screen.getByRole('status').textContent).toBe('Kotak ini hanya menerima bilangan bulat. Pecahan dipilih di kolom Bagian.');
    fireEvent.change(kepala, { target: { value: '٢٤' } });
    expect(kepala.value).toBe('24');
    fireEvent.change(kepala, { target: { value: '24/' } });
    expect(kepala.value).toBe('24');
  });

  it('sel bersama muncul saat Ashabah dipilih untuk baris sekelompok, tidak sebelumnya, tidak bila pilihannya berbeda', () => {
    tampilkan();
    const sebelum = () => [...document.querySelectorAll('td[rowspan]')].length;
    expect(sebelum()).toBe(0);
    expect(screen.queryByText('bersama')).toBeNull();
    pilih('Anak laki-laki', 'Ashabah');
    expect(sebelum()).toBe(0);
    pilih('Anak perempuan', '1/2');
    expect(sebelum()).toBe(0);
    pilih('Anak perempuan', 'Ashabah');
    const gabung = document.querySelector('td[rowspan="2"]')!;
    expect(gabung).toBeTruthy();
    expect(gabung.textContent).toContain('bersama');
    expect(gabung.classList.contains('baru-gabung')).toBe(true);
  });

  it('Terhalang → saham 0 otomatis dan tak bisa diisi', () => {
    tampilkan(tabelTerhalang);
    const baris = () => screen.getByText('Kakak/adik laki-laki kandung', { selector: 'th' }).closest('tr')!;
    expect(within(baris()).queryByText('0')).toBeNull();
    pilih('Kakak/adik laki-laki kandung', 'Terhalang');
    expect(within(baris()).getAllByText('0')).toHaveLength(2);
    expect(within(baris()).queryAllByRole('textbox')).toHaveLength(0);
  });
});
