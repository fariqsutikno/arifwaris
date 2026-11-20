import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hitung, hitungDzawilArham, hitungMunasakhat, hitungTaqdir, KONFIGURASI_BAWAAN, type GrafKeluarga, type InputEngine, type Orang } from '@waris/engine';
import { TabelLatihan } from './TabelLatihan';
import { pilihJangkar, susunTabelSoal, type PercobaanTabel, type TabelSoal } from '@waris/latihan';
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

const saatPercobaan = vi.fn(), saatLihatJawaban = vi.fn();
const percobaanKe = (n: number) => saatPercobaan.mock.calls[n]![0] as PercobaanTabel;
// Acak = 0 → jangkar = sel "Asal masalah" Istri (calon pertama): terisi 1.
const tampilkan = (tabel = tabel161, terbuka = false) =>
  render(<TabelLatihan tabel={tabel} mode="latihan" jangkar={pilihJangkar(tabel, () => 0)} terbuka={terbuka} saatPercobaan={saatPercobaan} saatLihatJawaban={saatLihatJawaban} />);
const pilih = (nama: string, nilai: string) => fireEvent.change(screen.getByRole('combobox', { name: `Bagian ${nama}` }), { target: { value: nilai } });
const ketik = (nama: string, nilai: string) => fireEvent.change(screen.getByRole('textbox', { name: nama }), { target: { value: nilai } });
const kotak = (nama: string) => screen.getByRole('textbox', { name: nama }) as HTMLInputElement;
const periksa = () => fireEvent.click(screen.getByRole('button', { name: 'Periksa' }));

function isiBenar() {
  pilih('Istri', '1/8'); pilih('Anak laki-laki', 'Ashabah'); pilih('Anak perempuan', 'Ashabah');
  ketik('Asal masalah', '8'); ketik('Asal masalah bersama', '7');
  ketik('Asal masalah akhir', '24');
  ketik('Asal masalah akhir Istri', '3'); ketik('Asal masalah akhir Anak laki-laki', '14'); ketik('Asal masalah akhir Anak perempuan', '7');
}

afterEach(() => { vi.clearAllMocks(); });

describe('TabelLatihan — soal biasa', () => {
  it('isi → Periksa → Benar semua; XP dan percobaan dilaporkan; isian terkunci', () => {
    tampilkan();
    isiBenar();
    periksa();
    expect(screen.getByText('Benar semua.')).toBeTruthy();
    expect(saatPercobaan).toHaveBeenCalledTimes(1);
    expect(percobaanKe(0)).toMatchObject({ mode: 'latihan', aksi: 'periksa', benarSemua: true, jangkar: { idBaris: 'W1', idKolom: 'ashl' } });
    expect(percobaanKe(0).hasilKolom.every(kolom => kolom.status === 'benar')).toBe(true);
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
    expect(percobaanKe(0).benarSemua).toBe(true);
  });

  it('salah berhenti di kolom pertama yang salah; sel keliru ditandai; XP tidak diberikan', () => {
    tampilkan();
    isiBenar();
    pilih('Istri', '1/4');
    periksa();
    expect(screen.getByText('Mulai salah di kolom "Bagian". Kolom sesudahnya belum diperiksa.')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Bagian Istri' }).closest('td')!.classList.contains('keliru')).toBe(true);
    expect(saatPercobaan).toHaveBeenCalledTimes(1);
    expect(percobaanKe(0).benarSemua).toBe(false);
    expect(percobaanKe(0).hasilKolom.map(kolom => kolom.status)).toEqual(['salah', 'benar', 'benar']); // semua kolom dinilai, bukan berhenti
  });

  it('kolom belum lengkap: umpan kuning dan bukan percobaan', () => {
    tampilkan();
    periksa();
    expect(screen.getByText('Kolom "Bagian" belum lengkap.')).toBeTruthy();
    expect(saatPercobaan).not.toHaveBeenCalled();
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

  it('Lihat jawaban mengirim isian terakhir ke kartu induk', () => {
    tampilkan();
    pilih('Istri', '1/8');
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    expect(saatLihatJawaban.mock.calls[0]![0]).toMatchObject({ sel: { W1: { bagian: '1/8' } } });
  });

  it('jangkar dari prop tidak berubah saat Kosongkan: percobaan sesudahnya membawa jangkar yang sama', () => {
    tampilkan();
    isiBenar();
    pilih('Istri', '1/4');
    periksa();
    fireEvent.click(screen.getByRole('button', { name: 'Kosongkan' }));
    pilih('Istri', '1/4');
    ketik('Asal masalah', '8'); ketik('Asal masalah akhir', '24');
    pilih('Anak laki-laki', 'Ashabah'); pilih('Anak perempuan', 'Ashabah'); ketik('Asal masalah bersama', '7');
    ketik('Asal masalah akhir Istri', '3'); ketik('Asal masalah akhir Anak laki-laki', '14'); ketik('Asal masalah akhir Anak perempuan', '7');
    periksa();
    expect(saatPercobaan).toHaveBeenCalledTimes(2);
    expect(percobaanKe(1).jangkar).toEqual(percobaanKe(0).jangkar);
  });

  it('jawaban terbuka: kunci tampil, isian berbeda dicoret, Periksa hilang, umpan abu', () => {
    const { rerender } = tampilkan();
    pilih('Istri', '1/4');
    ketik('Asal masalah', '8');
    rerender(<TabelLatihan tabel={tabel161} mode="latihan" jangkar={pilihJangkar(tabel161, () => 0)} terbuka saatPercobaan={saatPercobaan} saatLihatJawaban={saatLihatJawaban} />);
    expect(screen.getByText('Jawaban dibuka. Isianmu yang berbeda dicoret. Soal ini tidak memberi XP.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Periksa' })).toBeNull();
    const barisIstri = screen.getByText('Istri', { selector: 'th' }).closest('tr')!;
    expect(within(barisIstri).getByText('1/4').tagName).toBe('S');
    expect(barisIstri.textContent).toContain('1/8');
    expect(screen.getByText('24')).toBeTruthy();
    expect(saatPercobaan).not.toHaveBeenCalled();
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

// KB 12.6 contoh 2: anak pr (B) wafat sebelum harta dibagi; mas'alah 1 = 24 (terkunci), mas'alah 2 = 3; pengali 3 dan 7; jami'ah 72.
describe('TabelLatihan — munasakhat', () => {
  const graf: GrafKeluarga = { idPewaris: 'D', pernikahan: [{ idSuami: 'D', idIstri: 'W', status: 'utuh' }], orang: {
    D: orang('D', 'L', { statusHidup: 'wafat' }), W: orang('W', 'P'),
    S: orang('S', 'L', { idAyah: 'D', idIbu: 'W' }), B: orang('B', 'P', { idAyah: 'D', idIbu: 'W' }) } };
  const hasil = hitungMunasakhat({ urutanWafat: ['B'], dasar: { graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n },
    pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' } });
  const susunan = susunTabelSoal(hasil, id => id);
  if ('status' in susunan) throw new Error(susunan.status);
  const tampilkanMunasakhat = () => render(<TabelLatihan tabel={susunan} namaDari={id => id} mode="latihan" jangkar={null} terbuka={false} saatPercobaan={saatPercobaan} saatLihatJawaban={saatLihatJawaban} />);
  const isi = (pengaliKedua: string) => {
    fireEvent.change(screen.getByRole('combobox', { name: 'Bagian · B W' }), { target: { value: '1/3' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Bagian · B S' }), { target: { value: 'Ashabah' } });
    ketik("Mas'alah 2 (B)", '3'); ketik("Mas'alah 2 (B) W", '1'); ketik("Mas'alah 2 (B) S", '2');
    ketik("Jami'ah", '72'); ketik("Jami'ah W", '16'); ketik("Jami'ah S", '56');
    ketik("Pengali Mas'alah 1 (D)", '3'); ketik("Pengali Mas'alah 2 (B)", pengaliKedua);
  };

  it('Mas\'alah 1 terkunci terisi; baris Pengali ada di kepala tabel; kotak pengali tidak ada untuk Jami\'ah', () => {
    tampilkanMunasakhat();
    expect(screen.getByText('24')).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: 'Pengali' })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: "Pengali Jami'ah" })).toBeNull();
  });

  it('isi benar (pengali 3 dan 7) → Benar semua', () => {
    tampilkanMunasakhat();
    isi('7'); periksa();
    expect(screen.getByText('Benar semua.')).toBeTruthy();
  });

  it('pengali salah → umpan khusus baris Pengali, bukan nama kolom', () => {
    tampilkanMunasakhat();
    isi('6'); periksa();
    expect(screen.getByText('Baris Pengali belum tepat.')).toBeTruthy();
  });
});

// KB 14.6 baris 1: anak pr saudara lk kandung / seibu / sebapak.
describe('TabelLatihan — dzawil arham (tanzil)', () => {
  const penghubung = { statusHidup: 'wafat' as const, penghubung: true };
  const graf: GrafKeluarga = { idPewaris: 'D', pernikahan: [], orang: {
    D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }), F1: orang('F1', 'L', penghubung), M1: orang('M1', 'P', penghubung),
    FX: orang('FX', 'L', penghubung), MX: orang('MX', 'P', penghubung),
    SK: orang('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }), SI: orang('SI', 'L', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    SB: orang('SB', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'MX' }),
    A1: orang('A1', 'P', { idAyah: 'SK' }), A2: orang('A2', 'P', { idAyah: 'SI' }), A3: orang('A3', 'P', { idAyah: 'SB' }) } };
  const hasil = hitungDzawilArham({ graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' });
  const susunan = susunTabelSoal(hasil, id => id);
  if ('status' in susunan) throw new Error(susunan.status);
  const pilihKe = (nama: string, kolom: string, nilai: string) => fireEvent.change(screen.getByRole('combobox', { name: `${kolom} ${nama}` }), { target: { value: nilai } });

  it('pilihan Didudukkan sebagai berasal dari soal; isi benar → Benar semua (sebapak Terhalang: saham otomatis 0)', () => {
    render(<TabelLatihan tabel={susunan} mode="latihan" jangkar={null} terbuka={false} saatPercobaan={saatPercobaan} saatLihatJawaban={saatLihatJawaban} />);
    const kotakKursi = screen.getByRole('combobox', { name: 'Didudukkan sebagai A1' });
    expect(within(kotakKursi).getAllByRole('option').map(opsi => (opsi as HTMLOptionElement).value).sort()).toEqual(['', 'SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARA_SEIBU']);
    pilihKe('A1', 'Didudukkan sebagai', 'SAUDARA_KANDUNG'); pilihKe('A2', 'Didudukkan sebagai', 'SAUDARA_SEIBU'); pilihKe('A3', 'Didudukkan sebagai', 'SAUDARA_SEBAPAK');
    pilihKe('A1', 'Bagian perantara', 'Ashabah'); pilihKe('A2', 'Bagian perantara', '1/6'); pilihKe('A3', 'Bagian perantara', 'Terhalang');
    ketik('Asal masalah', '6'); ketik('Asal masalah A1', '5'); ketik('Asal masalah A2', '1');
    periksa();
    expect(screen.getByText('Benar semua.')).toBeTruthy();
  });
});

// KB 13b.6 F1: ibu, saudara kandung, saudara kandung lain yang hilang (mafqud).
describe('TabelLatihan — mafqud', () => {
  const graf: GrafKeluarga = { idPewaris: 'D', pernikahan: [], orang: {
    D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }), A: orang('A', 'L', { statusHidup: 'wafat' }), I: orang('I', 'P'), W: orang('W', 'P', { statusHidup: 'wafat' }),
    S: orang('S', 'L', { idAyah: 'A', idIbu: 'W' }), Q: orang('Q', 'L', { idAyah: 'A', idIbu: 'W', statusHidup: 'mafqud' }) } };
  const hasil = hitungTaqdir({ graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' });
  const susunan = susunTabelSoal(hasil, id => id);
  if ('status' in susunan) throw new Error(susunan.status);
  const tampilkanMafqud = () => render(<TabelLatihan tabel={susunan} namaDari={id => id} mode="latihan" jangkar={null} terbuka={false} saatPercobaan={saatPercobaan} saatLihatJawaban={saatLihatJawaban} />);

  it('judul kolom mengikuti mockup; baris Ditahan (mauquf) dan Pengali ada', () => {
    tampilkanMafqud();
    for (const judul of ['Bagian · ia hidup', 'Ia hidup', 'Bagian · ia wafat', 'Ia wafat', "Jami'ah · diberikan sekarang"]) expect(screen.getByText(judul)).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: 'Ditahan (mauquf)' })).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: 'Pengali' })).toBeTruthy();
  });

  it('isi benar → Benar semua', () => {
    tampilkanMafqud();
    const pilihBagian = (judul: string, nama: string, nilai: string) => fireEvent.change(screen.getByRole('combobox', { name: `${judul} ${nama}` }), { target: { value: nilai } });
    pilihBagian('Bagian · ia hidup', 'I', '1/6'); pilihBagian('Bagian · ia hidup', 'S', 'Ashabah'); pilihBagian('Bagian · ia hidup', 'Q', 'Ashabah');
    pilihBagian('Bagian · ia wafat', 'I', '1/3'); pilihBagian('Bagian · ia wafat', 'S', 'Ashabah');
    ketik('Ia hidup', '12'); ketik('Ia hidup I', '2'); ketik('Ia hidup S', '5'); ketik('Ia hidup Q', '5');
    ketik('Ia wafat', '3'); ketik('Ia wafat I', '1'); ketik('Ia wafat S', '2');
    ketik("Jami'ah · diberikan sekarang", '12'); ketik("Jami'ah · diberikan sekarang I", '2'); ketik("Jami'ah · diberikan sekarang S", '5');
    ketik("Jami'ah · diberikan sekarang Ditahan (mauquf)", '5');
    ketik('Pengali Ia hidup', '1'); ketik('Pengali Ia wafat', '4');
    periksa();
    expect(screen.getByText('Benar semua.')).toBeTruthy();
  });
});
