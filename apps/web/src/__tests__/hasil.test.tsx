import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { Hasil } from '../layar/Hasil';

const kasusIstriAnak = () => {
  const kasus = kasusBaru('L');
  const graf = ['ISTRI', 'ANAK_LK', 'ANAK_PR'].reduce((g, kunci) => tambahAhliWaris(g, 'PEWARIS', kunci as never), kasus.graf);
  return { ...kasus, graf, tirkah: { ...kasus.tirkah, kotor: 24_000_000n } };
};

it('menampilkan nominal tiap ahli waris dan selisih pembulatan', () => {
  render(<Hasil kasus={kasusIstriAnak()} kirim={vi.fn()} />);
  expect(screen.getByText('Rp 3.000.000')).toBeTruthy();   // istri 3/24
  expect(screen.getByText('Rp 14.000.000')).toBeTruthy();  // anak lk 14/24
  expect(screen.getByText(/Selisih pembulatan/)).toBeTruthy();
  expect(screen.getByText('Kok bisa gini?')).toBeTruthy();
});

it('TIDAK_DIDUKUNG tampil sebagai kartu peringatan, bukan tabel', () => {
  render(<Hasil kasus={kasusBaru('L')} kirim={vi.fn()} />);   // tanpa ahli waris → baitul mal
  expect(screen.getByRole('alert').textContent).toMatch(/belum (bisa|didukung)/i);
});
