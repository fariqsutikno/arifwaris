import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { aturTahunWafat } from '../silsilah';
import type { Kasus } from '../kasus';
import { KisahHarta } from '../layar/periksa/KisahHarta';
import { keluargaKarto } from './fixtures/kanvas';

const tahun = (nilai: number) => ({ tahun: nilai, kiraKira: false });
function Papan({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  return <KisahHarta kasus={kasus} ubah={f => setKasus(f)} kirim={() => {}} />;
}
const kartoBertahun = () => {
  const dasar = keluargaKarto();
  return { ...dasar, kasus: aturTahunWafat(aturTahunWafat(dasar.kasus, 'PEWARIS', tahun(1990)), dasar.budi, tahun(2013)) };
};
const babak = (nama: RegExp) => screen.getByRole('article', { name: nama });

describe('KisahHarta', () => {
  it('tiga babak dengan tahun besar; babak tanpa tahun berlabel "Lalu", bukan "?"', () => {
    render(<Papan awal={kartoBertahun().kasus} />);
    expect(screen.getAllByRole('article').filter(a => a.className.includes('babak') && !a.className.includes('kini'))).toHaveLength(3);
    expect(within(babak(/Mbah Sumi wafat/)).getByText('Lalu')).toBeTruthy();
    expect(within(babak(/Budi wafat/)).getByText('2013')).toBeTruthy();
    expect(screen.queryByText(/^\?|\? ·/)).toBeNull();
  });

  it('kematian sebelum pemilik: label urutan kecil "Lebih dulu dari" (dengan tahun bila ada) dan satu kalimat', () => {
    const { kasus, slamet } = kartoBertahun();
    const { unmount } = render(<Papan awal={kasus} />);
    expect(screen.getAllByText(/^Lebih dulu dari /).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Slamet meninggal.')).toHaveLength(1);
    unmount();
    render(<Papan awal={aturTahunWafat(kasus, slamet, tahun(1980))} />);
    expect(screen.getByText(/^1980, lebih dulu dari /)).toBeTruthy();
  });

  it('jeda: "N tahun kemudian" bila dua tahun ada, selain itu "Beberapa waktu kemudian"; tiap jeda membawa benang harta', () => {
    const { kasus, sumi } = kartoBertahun();
    const { unmount } = render(<Papan awal={kasus} />);
    expect(screen.getAllByText(/Beberapa waktu kemudian/)).toHaveLength(2);
    expect(screen.getAllByText(/Harta .* masih belum dibagi/)).toHaveLength(3);
    unmount();
    render(<Papan awal={aturTahunWafat(kasus, sumi, tahun(2000))} />);
    expect(screen.getAllByText(/10 tahun kemudian/)).toHaveLength(1);
    expect(screen.getAllByText(/13 tahun kemudian/)).toHaveLength(1);
  });

  it('babak Budi menyebut Dewi dan anak-anaknya; Mbah Sumi "sudah lebih dulu tiada"', () => {
    render(<Papan awal={kartoBertahun().kasus} />);
    const teks = within(babak(/Budi wafat/)).getByTestId('narasi').textContent!;
    expect(teks).toContain('Dewi');
    expect(teks).toContain('Andi');
    expect(teks).toContain('Mbah Sumi sudah lebih dulu tiada.');
  });

  it('kisah tidak menyebut angka bagian atau "mendapat"', () => {
    const { container } = render(<Papan awal={kartoBertahun().kasus} />);
    const tanpaTahun = container.textContent!.replace(/\d{4}|\d+ tahun/g, '');
    expect(tanpaTahun).not.toMatch(/\d+\/\d+|Rp|mendapat|\d/);
  });

  it('pohon kecil babak Budi: Mbah Sumi berlatar abu dengan keterangan "meninggal lebih dulu", bukan dicoret', () => {
    render(<Papan awal={kartoBertahun().kasus} />);
    const simpul = within(babak(/Budi wafat/)).getByRole('group', { name: /Mbah Sumi/ });
    expect(simpul.className).toContain('meninggal');
    expect(simpul.textContent).toContain('meninggal lebih dulu');
  });

  it('pohon kecil memakai sebutan dari sudut almarhum walau "saya" dipilih, tanpa "-mu"', () => {
    const { kasus, andi } = kartoBertahun();
    render(<Papan awal={{ ...kasus, saya: andi }} />);
    const nama = within(babak(/Budi wafat/)).getAllByRole('group').map(simpul => simpul.getAttribute('aria-label')!);
    expect(nama.filter(isi => /mu\b/.test(isi))).toEqual([]);
  });

  it('saya = Andi: babak menyebut "ayahmu" untuk Budi', () => {
    const { kasus, andi } = kartoBertahun();
    render(<Papan awal={{ ...kasus, saya: andi }} />);
    expect(within(babak(/Karto|Almarhum/)).getByTestId('narasi').textContent).toContain('ayahmu');
  });

  it('saya = Andi: kalimat yang diawali sebutan "-mu" tetap berhuruf besar', () => {
    const { kasus, andi } = kartoBertahun();
    render(<Papan awal={{ ...kasus, saya: andi }} />);
    const teks = within(babak(/Budi wafat/)).getByTestId('narasi').textContent!;
    expect(teks).toContain('Nenekmu (Mbah Sumi) sudah lebih dulu tiada.');
    expect(teks).not.toMatch(/\. [a-z]/);
  });

  it('Ubah di babak → pilihan; Tahun → IsianTahun mengubah tahun; Selesai menutup', () => {
    render(<Papan awal={kartoBertahun().kasus} />);
    const budi = babak(/Budi wafat/);
    fireEvent.click(within(budi).getByRole('button', { name: /Ubah/ }));
    expect(within(budi).getByText('Apa yang keliru di babak ini?')).toBeTruthy();
    fireEvent.click(within(budi).getByRole('button', { name: /Tahun wafat Budi/ }));
    fireEvent.change(within(budi).getByLabelText(/Tahun wafat Budi/), { target: { value: '2020' } });
    expect(within(budi).getByText('2020', { selector: '.tahun-besar' })).toBeTruthy();
    fireEvent.click(within(budi).getByRole('button', { name: 'Selesai' }));
    expect(within(budi).queryByText('Apa yang keliru di babak ini?')).toBeNull();
  });

  it('urutan bertahun tidak bisa digeser; tanpa tahun bisa', () => {
    const { kasus, sumi } = kartoBertahun();
    const { unmount } = render(<Papan awal={aturTahunWafat(kasus, sumi, tahun(1995))} />);
    const budi = babak(/Budi wafat/);
    fireEvent.click(within(budi).getByRole('button', { name: /Ubah/ }));
    fireEvent.click(within(budi).getByRole('button', { name: /Urutan: Budi/ }));
    expect(within(budi).getByText('Urutannya mengikuti tahun wafat. Ubah tahunnya bila keliru.')).toBeTruthy();
    expect(within(budi).queryByRole('button', { name: /Lebih dulu/ })).toBeNull();
    unmount();
    render(<Papan awal={kasus} />);
    const budiLagi = babak(/Budi wafat/);
    fireEvent.click(within(budiLagi).getByRole('button', { name: /Ubah/ }));
    fireEvent.click(within(budiLagi).getByRole('button', { name: /Urutan: Budi/ }));
    expect(within(budiLagi).getByRole('button', { name: /Lebih dulu/ })).toBeTruthy();
  });
});
