import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PintuLab } from '../layar/PintuLab';

describe('PintuLab (spec kanvas 3)', () => {
  it('tanpa pilihan bawaan', () => {
    render(<PintuLab saatPilih={() => undefined} />);
    const grup = screen.getByRole('radiogroup', { name: 'Mau menghitung apa?' });
    const radio = screen.getAllByRole('radio');
    expect(grup).toBeTruthy();
    expect(radio).toHaveLength(2);
    expect(radio.every(r => r.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  it('mengklik kartu memanggil saatPilih dengan jenisnya', () => {
    const saatPilih = vi.fn();
    render(<PintuLab saatPilih={saatPilih} />);
    fireEvent.click(screen.getByRole('radio', { name: /Belajar atau latihan soal/ }));
    expect(saatPilih).toHaveBeenLastCalledWith('latihan');
    fireEvent.click(screen.getByRole('radio', { name: /Kasus keluarga sungguhan/ }));
    expect(saatPilih).toHaveBeenLastCalledWith('nyata');
  });

  it('kartu menyebut bedanya: satu kalimat keterangan dan tiga butir', () => {
    render(<PintuLab saatPilih={() => undefined} />);
    expect(screen.getByText('Isi jumlah ahli waris dengan cepat, seperti di buku.')).toBeTruthy();
    expect(screen.getByText('Semua data dianggap sudah pasti')).toBeTruthy();
    expect(screen.getByText('Kami tanyakan satu per satu, termasuk yang belum kamu yakin.')).toBeTruthy();
    expect(screen.getByText('Boleh menjawab "belum tahu"')).toBeTruthy();
  });
});
