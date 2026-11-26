import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SoalHitung } from '@waris/content';
import { buatMemoriBank } from '@waris/data';
import { kasusDariSoal, REVISI_SOAL_BANK } from '@waris/latihan';
import { antre, aturAkunLokal, bacaAntrean } from '../akun/antrean';
import { pulihDariSoal } from '../Aplikasi';
import { buatBankSampel, KODE_SAMPEL_DEV } from '../bank/sampelDev';
import { cariSoal, revisiIdSoal } from '../bank/soalBank';
import { Hasil } from '../layar/Hasil';
import { SoalBank } from '../layar/belajar/SoalBank';
import { bacaPercobaan } from '../percobaan';

const KODE_BIASA = 'G1-B-000000000004J180';
const KODE_MUNASAKHAT = 'G1-M-0000000000004G0AG8A32000';
const KODE_TANPA_TABEL = 'G1-B-0000000000000040';

beforeEach(() => { localStorage.clear(); aturAkunLokal(null); });
afterEach(cleanup);

describe('soal bank dari kode', () => {
  it('cariSoal: kode generator → soal siap kerja (berkas, judul dari susunan keluarga); kode tak dikenal atau tanpa tabel → undefined', () => {
    const soal = cariSoal(KODE_BIASA)!;
    expect(soal).toMatchObject({ kode: KODE_BIASA, kasus: { bentuk: 'berkas' } });
    expect(soal.judul).not.toBe('');
    expect(['dasar', 'menengah', 'sulit']).toContain(soal.tingkat);
    expect(cariSoal('G1-B-ZZZ')).toBeUndefined();
    expect(cariSoal(KODE_TANPA_TABEL)).toBeUndefined();
    expect(cariSoal('H-01')).toMatchObject({ kode: 'H-01' });
  });

  it('revisiIdSoal: soal bank memakai penanda bank, soal kurasi revisinya', () => {
    expect(revisiIdSoal(KODE_BIASA)).toBe(REVISI_SOAL_BANK);
  });

  it('alamat #/latihan/soal/<kode> bisa dipulihkan tanpa basis data (muat ulang)', () => {
    const pulih = pulihDariSoal(`#/latihan/soal/${encodeURIComponent(KODE_MUNASAKHAT)}`, null);
    expect(pulih?.soal.kode).toBe(KODE_MUNASAKHAT);
    expect(pulih?.pembahasan).toBe(false);
    expect(pulih?.keadaan.kasus?.urutanWafat.length).toBeGreaterThan(0);
  });
});

describe('percobaan dan XP soal bank', () => {
  const tampilkan = (kode: string) => {
    const soal = cariSoal(kode)!;
    return render(<Hasil kasus={kasusDariSoal(soal.kasus)} idSesi="sesi" tujuan="belajar" kirim={() => undefined}
      soal={{ id: soal.kode, revisiId: revisiIdSoal(soal.kode), bobotXp: 20 }} />);
  };

  it.each([KODE_BIASA, KODE_MUNASAKHAT])('%s tampil sebagai tabel isian dan tercatat sebagai percobaan berkode generator', async kode => {
    tampilkan(kode);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/tabel/i);
    await waitFor(() => expect(bacaPercobaan().some(kejadian => kejadian.soalId === kode && kejadian.aksi === 'buka')).toBe(true));
    expect(bacaPercobaan().find(kejadian => kejadian.soalId === kode)).toMatchObject({ revisiSoal: REVISI_SOAL_BANK });
  });

  it('percobaan soal bank tidak masuk antrean ke server (belum menerima soal bank); soal kurasi tetap', () => {
    aturAkunLokal('u');
    const dasar = { idSesiSoal: 's', revisiSoal: 'r', jenisSoal: 'biasa', mode: 'latihan', konteks: { jenis: 'mandiri' }, aksi: 'periksa', isian: null, jangkar: null, hasilKolom: null, benarSemua: false,
      dimulaiPada: '2026-11-27T00:00:00.000Z', versi: { engine: 'x', ruleset: 'syafii', madzhab: 'bawaan', kunci: '' } } as const;
    antre({ tabel: 'percobaan', baris: { ...dasar, id: 'a', soalId: KODE_BIASA } });
    antre({ tabel: 'percobaan', baris: { ...dasar, id: 'b', soalId: 'H-01' } });
    expect(bacaAntrean().map(entri => (entri as { baris: { id: string } }).baris.id)).toEqual(['b']);
  });
});

describe('panel Soal acak dari bank', () => {
  const dikerjakan = () => vi.fn<(soal: SoalHitung) => void>();

  it('memulai soal dari bank (repo memori berisi sampel); benih sama → soal sama', async () => {
    const bank = await buatBankSampel();
    const saatKerjakan = dikerjakan();
    render(<SoalBank kasusSekarang={null} saatKerjakan={saatKerjakan} muatBank={async () => bank} buatBenih={() => 'benih-tetap'} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mulai soal' }));
    await waitFor(() => expect(saatKerjakan).toHaveBeenCalledTimes(1));
    const pertama = saatKerjakan.mock.calls[0]![0];
    expect(KODE_SAMPEL_DEV).toContain(pertama.kode);
    fireEvent.click(screen.getByRole('button', { name: 'Mulai soal' }));
    await waitFor(() => expect(saatKerjakan).toHaveBeenCalledTimes(2));
    expect(saatKerjakan.mock.calls[1]![0].kode).toBe(pertama.kode);
  });

  it('pilihan modul menyaring pencarian', async () => {
    const bank = buatMemoriBank();
    const cariSpy = vi.spyOn(bank, 'cariSoal');
    await bank.simpan([]);
    const saatKerjakan = dikerjakan();
    render(<SoalBank kasusSekarang={null} saatKerjakan={saatKerjakan} muatBank={async () => bank} buatBenih={() => 'b'} />);
    fireEvent.change(screen.getByLabelText('Modul'), { target: { value: '11' } });
    fireEvent.change(screen.getByLabelText('Tingkat'), { target: { value: 'sulit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mulai soal' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Belum ada soal yang cocok/));
    expect(cariSpy.mock.calls[0]![0]).toMatchObject({ modul: 11, tingkat: 'sulit', label: { tanpa: ['dzawilArham'] } });
    expect(saatKerjakan).not.toHaveBeenCalled();
  });

  it('bank tak terhubung (null atau galat): pesan jelas, tidak ada soal dibuka', async () => {
    const saatKerjakan = dikerjakan();
    const { rerender } = render(<SoalBank kasusSekarang={null} saatKerjakan={saatKerjakan} muatBank={async () => null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mulai soal' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/belum bisa dijangkau/));
    rerender(<SoalBank kasusSekarang={null} saatKerjakan={saatKerjakan} muatBank={async () => { throw new Error('jaringan'); }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mulai soal' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/belum bisa dijangkau/));
    expect(saatKerjakan).not.toHaveBeenCalled();
  });

  it('kode di bank yang tak bisa dinilai dilewati; bila semuanya begitu → tidak ada yang cocok', async () => {
    const bank = buatMemoriBank();
    await bank.simpan([{ kode: KODE_TANPA_TABEL, versiGenerator: 1, keluarga: 'biasa', tingkat: 'dasar', modul: [3], label: [], jumlahMayit: 1, jumlahAhliWaris: 1 }]);
    const saatKerjakan = dikerjakan();
    render(<SoalBank kasusSekarang={null} saatKerjakan={saatKerjakan} muatBank={async () => bank} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mulai soal' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Belum ada soal yang cocok/));
    expect(saatKerjakan).not.toHaveBeenCalled();
  });
});
