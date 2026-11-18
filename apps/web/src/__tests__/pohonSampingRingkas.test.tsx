import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { PanggungPohon } from '../layar/wizard/PanggungPohon';

function kasusDenganSaudara(kunci: Parameters<typeof tambahAhliWaris>[2][]): Kasus {
  const kasus = kasusBaru('L');
  return { ...kasus, graf: kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasus.graf) };
}

describe('pohon samping: saudara diringkas (B)', () => {
  const kasus = kasusDenganSaudara(['AYAH', 'IBU', 'SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARA_SEIBU']);

  it('satu simpul "Saudara: N" dengan rincian jenis yang ada; kotak saudara tidak digambar', () => {
    render(<PanggungPohon kasus={kasus} saatPilihOrang={() => undefined} />);
    expect(screen.getByText('Saudara: 4')).toBeTruthy();
    expect(screen.getByText('2 kandung, 1 seayah, 1 seibu')).toBeTruthy();
    expect(screen.queryByText(/Saudara lk kandung/)).toBeNull();
  });

  it('simpul dan tautan "Lihat pohon lengkap" membuka pohon lengkap yang memuat saudara', () => {
    render(<PanggungPohon kasus={kasus} saatPilihOrang={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Buka pohon lengkap' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Saudara lk seayah')).toBeTruthy();
    // Tanpa pratinjau (skalanya 0 di wadah tanpa lebar) dan di body (di luar konteks tumpukan bar bawah wizard).
    expect(screen.getByRole('dialog').querySelector('.pratinjau-isi')).toBeNull();
    expect(screen.getByRole('dialog').parentElement).toBe(document.body);
    fireEvent.click(screen.getByRole('button', { name: 'Tutup layar penuh' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByText('Lihat pohon lengkap'));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('tanpa saudara tidak ada simpul ringkasan', () => {
    render(<PanggungPohon kasus={kasusDenganSaudara(['AYAH', 'IBU'])} saatPilihOrang={() => undefined} />);
    expect(screen.queryByText(/^Saudara: /)).toBeNull();
  });
});
