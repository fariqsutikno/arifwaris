import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { kasusBaru, type Kasus } from '../kasus';
import { LangkahPewaris } from '../layar/wizard/LangkahPewaris';

const props = () => ({
  saatPilih: vi.fn(), saatGantiDanKosongkan: vi.fn(), saatUbahNama: vi.fn(), saatUbahTahun: vi.fn(), saatPilihPintu: vi.fn(),
});
const tampil = (kasus: Kasus) => { const p = props(); render(<LangkahPewaris kasus={kasus} {...p} />); return p; };

describe('LangkahPewaris kasus nyata (spec kanvas 4)', () => {
  it('menampilkan tahun wafat dan pertanyaan pintu tanpa bawaan', () => {
    tampil(kasusBaru('L'));
    expect(screen.getByLabelText(/Kira-kira tahun berapa/)).toBeTruthy();
    const grup = screen.getByRole('radiogroup', { name: /hartanya sudah dibagi/ });
    expect(grup).toBeTruthy();
    const pilihan = screen.getAllByRole('radio').filter(r => grup.contains(r));
    expect(pilihan).toHaveLength(4);
    expect(pilihan.every(r => r.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  it('memilih jawaban pintu memanggil saatPilihPintu', () => {
    const p = tampil(kasusBaru('L'));
    fireEvent.click(screen.getByRole('radio', { name: /Belum, sudah bertahun-tahun/ }));
    expect(p.saatPilihPintu).toHaveBeenCalledWith('lama');
  });

  it('mengetik tahun memanggil saatUbahTahun; mengosongkan memberi undefined; huruf diabaikan', () => {
    const p = tampil(kasusBaru('L'));
    const isian = screen.getByLabelText(/Kira-kira tahun berapa/);
    fireEvent.change(isian, { target: { value: '1975' } });
    expect(p.saatUbahTahun).toHaveBeenLastCalledWith({ tahun: 1975, kiraKira: false });
    fireEvent.change(isian, { target: { value: '19a7' } });
    expect((isian as HTMLInputElement).value).toBe('197');
    fireEvent.change(isian, { target: { value: '' } });
    expect(p.saatUbahTahun).toHaveBeenLastCalledWith(undefined);
  });

  it('"Sudah pernah dibagi" menampilkan pesan batas', () => {
    tampil({ ...kasusBaru('L'), pintu: 'sudah' });
    expect(screen.getByText(/belum bisa menghitungnya otomatis/)).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Sudah pernah dibagi/ }).getAttribute('aria-checked')).toBe('true');
  });

  it('latihan tidak menampilkan keduanya', () => {
    tampil(kasusBaru('L', 'latihan'));
    expect(screen.queryByLabelText(/Kira-kira tahun berapa/)).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: /hartanya sudah dibagi/ })).toBeNull();
  });
});
