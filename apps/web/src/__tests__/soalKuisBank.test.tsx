// Panel "Soal kuis acak" di Latihan: soal kuis mesin diambil dari bank (hanya aturan yang disetujui keilmuan), dibangun ulang
// dari kode lewat kamus diksi web, tampil di kartu kuis pilihan ganda dengan pembahasan setelah menjawab, tanpa XP/rekor.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buatMemoriBank } from '@waris/data';
import { aturAkunLokal, bacaAntrean } from '../akun/antrean';
import { buatBankSampel } from '../bank/sampelDev';
import { cariSoalKuisBank } from '../bank/cariSoalKuisBank';
import { SoalKuisBank } from '../layar/belajar/SoalKuisBank';
import { bacaProgresLatihan } from '../progres';

const KODE = 'K1-0000000000004J402G';
const baris = { kode: KODE, versiGenerator: 1, keluarga: 'biasa', tingkat: 'menengah', modul: [5, 6], label: [], jumlahMayit: 1, jumlahAhliWaris: 0, bentuk: 'kuis', aturan: ['lupaAul', 'pasanganTertukar'] } as const;

beforeEach(() => { localStorage.clear(); aturAkunLokal(null); });
afterEach(cleanup);

describe('cariSoalKuisBank', () => {
  it('hanya soal yang semua aturannya disetujui; hasil dibangun dari kode dengan diksi web', async () => {
    const bank = buatMemoriBank();
    await bank.simpan([{ ...baris, aturan: [...baris.aturan], modul: [...baris.modul], label: [] }]);
    expect(await cariSoalKuisBank(bank, {}, 'b')).toBeUndefined();
    await bank.setujui('lupaAul');
    expect(await cariSoalKuisBank(bank, {}, 'b')).toBeUndefined();
    await bank.setujui('pasanganTertukar');
    const soal = (await cariSoalKuisBank(bank, { tingkat: 'menengah', modul: 5 }, 'b'))!;
    expect(soal.kode).toBe(KODE);
    expect(soal.pilihan.length).toBeGreaterThanOrEqual(3);
    expect(soal.alasanPilihan).toHaveLength(soal.pilihan.length);
    expect(await cariSoalKuisBank(bank, { tingkat: 'sulit' }, 'b')).toBeUndefined();
  });
});

describe('SoalKuisBank (panel Latihan)', () => {
  it('mulai → soal tampil; menjawab membuka pembahasan; tanpa XP, rekor, atau antrean percobaan', async () => {
    aturAkunLokal('u');
    const bank = await buatBankSampel();
    render(<SoalKuisBank muatBank={async () => bank} buatBenih={() => 'tetap'} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mulai soal kuis' }));
    const pilihan = await screen.findAllByRole('button', { name: /^[A-D]\. / });
    expect(pilihan.length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByRole('button', { name: 'Soal kuis lain' })).toBeNull();
    fireEvent.click(pilihan[0]!);
    await waitFor(() => expect(document.querySelector('.hasil-tebak')).toBeTruthy());
    expect(document.querySelector('.hasil-tebak p')?.textContent?.length).toBeGreaterThan(20);
    expect(screen.getByRole('button', { name: 'Soal kuis lain' })).toBeTruthy();
    expect(bacaProgresLatihan('kuis')).toEqual({});
    expect(bacaAntrean()).toEqual([]);
  });

  it('benih sama → soal sama; pilihan modul dan tingkat diteruskan ke bank sebagai bentuk kuis', async () => {
    const bank = await buatBankSampel();
    const cari = vi.spyOn(bank, 'cariSoal');
    render(<SoalKuisBank muatBank={async () => bank} buatBenih={() => 'b'} />);
    fireEvent.change(screen.getByLabelText('Modul'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Tingkat'), { target: { value: 'menengah' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mulai soal kuis' }));
    await screen.findAllByRole('button', { name: /^[A-D]\. / });
    expect(cari.mock.calls[0]![0]).toMatchObject({ bentuk: 'kuis', modul: 6, tingkat: 'menengah' });
  });

  it('tidak ada yang cocok dan bank tak terhubung: pesan jelas, tidak ada soal', async () => {
    const kosong = buatMemoriBank();
    const { rerender } = render(<SoalKuisBank muatBank={async () => kosong} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mulai soal kuis' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Belum ada soal kuis yang cocok/));
    rerender(<SoalKuisBank muatBank={async () => null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mulai soal kuis' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/belum bisa dijangkau/));
  });
});
