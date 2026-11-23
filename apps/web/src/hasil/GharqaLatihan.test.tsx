import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hitungGharqa, KONFIGURASI_BAWAAN, type GrafKeluarga, type InputGharqa, type Orang } from '@waris/engine';
import { susunSoalGharqa, type PercobaanTabel, type SoalGharqa } from '@waris/latihan';
import { GharqaLatihan } from './GharqaLatihan';
import { bacaIsianSoal } from '../isianSoal';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });
const wafat = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}) => orang(id, jenisKelamin, { statusHidup: 'wafat', ...lain });

// KB 13d.2: Zaid dan 'Amr wafat bersamaan; masing-masing punya ahli waris lain.
const graf: GrafKeluarga = { idPewaris: 'ZAID', pernikahan: [{ idSuami: 'AMR', idIstri: 'AW', status: 'utuh' }], orang: {
  KAKEK: wafat('KAKEK', 'L'), F: wafat('F', 'L', { idAyah: 'KAKEK' }), PAMAN: orang('PAMAN', 'L', { idAyah: 'KAKEK' }),
  MZ: orang('MZ', 'P'), MA: wafat('MA', 'P'),
  ZAID: wafat('ZAID', 'L', { idAyah: 'F', idIbu: 'MZ' }), ZD: orang('ZD', 'P', { idAyah: 'ZAID' }),
  AMR: wafat('AMR', 'L', { idAyah: 'F', idIbu: 'MA' }), AW: orang('AW', 'P'),
  AD1: orang('AD1', 'P', { idAyah: 'AMR', idIbu: 'AW' }), AD2: orang('AD2', 'P', { idAyah: 'AMR', idIbu: 'AW' }) } };
const soalDari = (keadaan: InputGharqa['keadaan']): SoalGharqa => {
  const susunan = susunSoalGharqa(hitungGharqa({ dasar: { graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' },
    anggota: ['ZAID', 'AMR'], keadaan }), id => id);
  if ('status' in susunan) throw new Error(susunan.status);
  return susunan;
};

const saatPercobaan = vi.fn(), saatLihatJawaban = vi.fn();
const tampilkan = (soal: SoalGharqa, terbuka = false, kodeSoal?: string) => render(<GharqaLatihan kodeSoal={kodeSoal} soal={soal} namaDari={id => id} jangkar={soal.harta.map(() => null)} terbuka={terbuka} saatPercobaan={saatPercobaan} saatLihatJawaban={saatLihatJawaban} />);
afterEach(() => { cleanup(); saatPercobaan.mockClear(); });

describe('GharqaLatihan', () => {
  it('keputusan salah → umpan Belum tepat, percobaan benarSemua false, tabel tidak muncul', () => {
    tampilkan(soalDari('tidakDiketahui'));
    fireEvent.click(screen.getByRole('button', { name: 'Yang terakhir mewarisi' }));
    expect(screen.getByText('Belum tepat', { exact: false })).toBeTruthy();
    expect((saatPercobaan.mock.calls[0]![0] as PercobaanTabel).benarSemua).toBe(false);
    expect(screen.queryByText('Harta ZAID')).toBeNull();
  });

  it('keputusan benar → tabel tiap harta muncul, belum ada percobaan sampai tabel diperiksa', () => {
    tampilkan(soalDari('tidakDiketahui'));
    fireEvent.click(screen.getByRole('button', { name: 'Tidak saling mewarisi' }));
    expect(screen.getByText('Harta ZAID')).toBeTruthy();
    expect(screen.getByText('Harta AMR')).toBeTruthy();
    expect(saatPercobaan).not.toHaveBeenCalled();
  });

  it('dua tabel harta: kotak Cara mengisi tabel hanya satu (ditambah satu milik langkah keputusan)', () => {
    tampilkan(soalDari('tidakDiketahui'));
    fireEvent.click(screen.getByRole('button', { name: 'Tidak saling mewarisi' }));
    expect(screen.getAllByRole('heading', { name: 'Cara mengisi' })).toHaveLength(2);
  });

  it('terlupakan [SYF]: Ditahan sampai jelas benar → satu percobaan benarSemua true, tanpa tabel', () => {
    tampilkan(soalDari('terlupakan'));
    fireEvent.click(screen.getByRole('button', { name: 'Ditahan sampai jelas' }));
    expect((saatPercobaan.mock.calls[0]![0] as PercobaanTabel).benarSemua).toBe(true);
    expect(screen.queryByText('Harta ZAID')).toBeNull();
  });
});

describe('GharqaLatihan: kiriman ke server', () => {
  it('keputusan salah dikirim sebagai gharqa tanpa harta', () => {
    tampilkan(soalDari('tidakDiketahui'));
    fireEvent.click(screen.getByRole('button', { name: 'Yang terakhir mewarisi' }));
    expect((saatPercobaan.mock.calls[0]![0] as PercobaanTabel).gharqa).toEqual({ keputusan: 'terakhirMewarisi', harta: [] });
  });
});

describe('GharqaLatihan: isian pulih saat muat ulang', () => {
  it('keputusan benar + isian tabel harta tersimpan per kode soal, lalu pulih di render berikutnya', () => {
    localStorage.clear();
    const soal = soalDari('tidakDiketahui');
    tampilkan(soal, false, 'G-01');
    fireEvent.click(screen.getByRole('button', { name: 'Tidak saling mewarisi' }));
    const kotak = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.change(kotak, { target: { value: '12' } });
    expect(bacaIsianSoal('G-01')?.gharqa?.keputusan).toBe('tidakSalingMewarisi');
    cleanup();
    tampilkan(soal, false, 'G-01');
    expect(screen.getByRole('button', { name: 'Tidak saling mewarisi' }).getAttribute('aria-pressed')).toBe('true');
    expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('12');
    expect(saatPercobaan).not.toHaveBeenCalled();
  });

  it('keputusan salah tidak disimpan', () => {
    localStorage.clear();
    tampilkan(soalDari('tidakDiketahui'), false, 'G-01');
    fireEvent.click(screen.getByRole('button', { name: 'Yang terakhir mewarisi' }));
    expect(bacaIsianSoal('G-01')).toBeNull();
  });
});
