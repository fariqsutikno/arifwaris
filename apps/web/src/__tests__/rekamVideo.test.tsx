// Rekam video sinema: menu Lainnya memulai tangkapan, memutar dari awal, dan berhenti sendiri di akhir dengan mengunduh berkas.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { Hasil } from '../layar/Hasil';

const berhenti = vi.fn(async () => new Blob(['x'], { type: 'video/webm' }));
const unduh = vi.fn();
vi.mock('../hasil/rekamVideo', () => ({
  bisaMerekam: () => true,
  mulaiRekam: vi.fn(async () => ({ berhenti })),
  unduhVideo: (...argumen: unknown[]) => unduh(...argumen),
}));

describe('rekam video', () => {
  it('mulai dari menu Lainnya, sinema diputar sampai akhir, lalu berhenti dan mengunduh', async () => {
    let kasus = kasusBaru('L');
    kasus = { ...kasus, tirkah: { kotor: 24_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
    for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_PR'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
    render(<Hasil kasus={kasus} idSesi="uji-rekam" tujuan="hitung" kirim={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Dari 1 sampai selesai/ }));
    const mode = () => screen.getByRole('dialog', { name: 'Langkah demi langkah' });
    fireEvent.click(within(mode()).getByRole('button', { name: 'Lainnya' }));
    vi.useFakeTimers();
    await act(async () => { fireEvent.click(within(mode()).getByRole('button', { name: /Rekam video/ })); await vi.advanceTimersByTimeAsync(50); });
    expect(mode().classList.contains('merekam')).toBe(true);
    // Tiap langkah menjadwalkan langkah berikutnya setelah render ulang, jadi waktu dimajukan per langkah.
    for (let langkah = 0; langkah < 80; langkah++) await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    vi.useRealTimers();
    expect(berhenti).toHaveBeenCalled();
    expect(unduh).toHaveBeenCalledWith(expect.any(Blob), 'langkah-demi-langkah.webm');
    expect(mode().classList.contains('merekam')).toBe(false);
  });
});
