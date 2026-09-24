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

it('munasakhat: ahli waris mayit kedua dinamai sesuai perannya, pecahan disederhanakan', async () => {
  const { hitungIsian } = await import('../checklist');
  let kasus = kasusBaru('P');
  kasus = { ...kasus, graf: ['SUAMI', 'IBU', 'SAUDARA_KANDUNG'].reduce((g, kunci) => tambahAhliWaris(g, 'PEWARIS', kunci as never), kasus.graf) };
  const [idSuami] = hitungIsian(kasus.graf, 'PEWARIS').SUAMI!;
  kasus = { ...kasus, urutanWafat: [idSuami!], graf: ['ANAK_LK', 'ANAK_PR'].reduce((g, kunci) => tambahAhliWaris(g, idSuami!, kunci as never), kasus.graf) };
  render(<Hasil kasus={kasus} kirim={vi.fn()} />);
  expect(screen.getByText('Anak laki-laki')).toBeTruthy();
  expect(screen.queryByText(/^Kerabat/)).toBeNull();
  expect(screen.getAllByText('1/3').length).toBeGreaterThan(0);
});

it('total yang dibagi memakai batas wasiat 1/3 dari engine, kelebihannya dicatat', () => {
  const kasus = kasusIstriAnak();
  render(<Hasil kasus={{ ...kasus, tirkah: { ...kasus.tirkah, kotor: 90_000_000n, wasiat: 60_000_000n } }} kirim={vi.fn()} />);
  expect(screen.getByText('Rp 60.000.000')).toBeTruthy();
  expect(screen.getByText(/ijazah/)).toBeTruthy();
});

it('munasakhat: yang terhalang di mayit berikutnya ikut ditampilkan', async () => {
  const { hitungIsian } = await import('../checklist');
  let kasus = kasusBaru('P');
  kasus = { ...kasus, graf: ['SUAMI', 'IBU'].reduce((g, kunci) => tambahAhliWaris(g, 'PEWARIS', kunci as never), kasus.graf) };
  const [idSuami] = hitungIsian(kasus.graf, 'PEWARIS').SUAMI!;
  kasus = { ...kasus, urutanWafat: [idSuami!], graf: ['ANAK_LK', 'SAUDARA_KANDUNG'].reduce((g, kunci) => tambahAhliWaris(g, idSuami!, kunci as never), kasus.graf) };
  render(<Hasil kasus={kasus} kirim={vi.fn()} />);
  expect(screen.getByText('Saudara lk kandung')).toBeTruthy();
});
