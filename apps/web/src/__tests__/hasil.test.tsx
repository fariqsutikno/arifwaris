import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import type { Tujuan } from '../preferensi';
import { Hasil } from '../layar/Hasil';

const buat = (kunci: KunciAhliWaris[], tirkah: Kasus['tirkah']): Kasus => {
  const kasus = kasusBaru('L');
  return { ...kasus, tirkah, graf: kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasus.graf) };
};
// Angka kasus ini sudah dicek lewat engine: tashih 72, ibu 12 saham = Rp 16.666.666, sisa Rp 2.
const prototipe = () => buat(['ISTRI', 'IBU', 'AYAH', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG'],
  { kotor: 110_000_000n, tajhiz: 2_000_000n, hutang: 3_000_000n, wasiat: 5_000_000n });
const c1601 = () => buat(['ISTRI', 'ANAK_LK', 'ANAK_PR'], { kotor: 24_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n });

function Uji({ awal, tujuan = 'hitung' }: { awal: Kasus; tujuan?: Tujuan }) {
  const [kasus, setKasus] = useState(awal);
  const kirim = (aksi: Aksi) => { if (aksi.jenis === 'UBAH_KASUS') setKasus(aksi.ubah); };
  return <Hasil kasus={kasus} tujuan={tujuan} kirim={kirim} />;
}
const pembagian = () => screen.getByRole('region', { name: 'Pembagian' });

describe('layar hasil', () => {
  it('pembagian per orang dan yang terhalang beserta alasannya', () => {
    render(<Uji awal={prototipe()} />);
    expect(screen.getByRole('heading', { name: 'Nah, ini pembagiannya' })).toBeTruthy();
    expect(within(pembagian()).getAllByText('Rp 16.666.666').length).toBe(2);   // ibu dan ayah
    expect(within(pembagian()).getByText(/Terhalang oleh Anak laki-laki dan Ayah/)).toBeTruthy();
  });

  it('pembulatan: kartu muncul bila tidak pas, pilihan Rp 1.000 menghitung ulang lewat engine', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(within(pembagian()).getByRole('radio', { name: /Rp 1.000/ }));
    expect(within(pembagian()).getAllByText('Rp 16.666.000').length).toBe(2);
    expect(within(pembagian()).getByText('Rp 2.000')).toBeTruthy();
  });

  it('kasus yang sudah bulat tidak menampilkan kartu pembulatan maupun selisih', () => {
    render(<Uji awal={c1601()} />);
    expect(screen.queryByText(/nggak bulat/)).toBeNull();
    expect(screen.queryByText(/Selisih/)).toBeNull();
  });

  it('ikon mata hanya menyembunyikan nominal', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sembunyikan nominal' }));
    expect(within(pembagian()).queryByText('Rp 16.666.666')).toBeNull();
    expect(within(pembagian()).getAllByText('1/6').length).toBeGreaterThan(0);
  });

  it('bentuk pecahan bisa diganti ke penyebut sama', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Atur tampilan' }));
    fireEvent.click(screen.getByRole('radio', { name: /Penyebut sama/ }));
    expect(within(pembagian()).getAllByText('12/72').length).toBeGreaterThanOrEqual(2);
    expect(within(pembagian()).queryAllByText('1/6')).toHaveLength(0);
  });

  it('mode belajar menyembunyikan semua jawaban sampai diminta', () => {
    render(<Uji awal={prototipe()} tujuan="belajar" />);
    expect(screen.queryByText('Rp 16.666.666')).toBeNull();
    expect(screen.queryByText('1/6')).toBeNull();
    expect(screen.queryByText(/Terhalang oleh/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan jawaban' }));
    expect(within(pembagian()).getAllByText('Rp 16.666.666').length).toBe(2);
  });

  it('klik orang di pohon membuka penjelasan dengan ahwal, baris kasus ini disorot', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(within(screen.getByRole('region', { name: 'Pohon keluarga' })).getByRole('button', { name: /^Ibu/ }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Kapan dapat berapa/ }));
    const baris = within(dialog).getByText('Ada anak/cucu, atau ada dua saudara atau lebih.').closest('tr')!;
    expect(baris.textContent).toMatch(/kasus ini/);
  });

  it('tabel faraidh ala kitab: asal masalah dan tashih', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tabel faraidh' }));
    const tabel = screen.getByRole('table');
    expect(within(tabel).getByText(/Asal masalah/)).toBeTruthy();
    expect(within(tabel).getByText('24', { selector: 'th small' })).toBeTruthy();
    expect(within(tabel).getByText('72', { selector: 'th small' })).toBeTruthy();
  });

  it('harta yang dibagi disusun seperti hitungan, potongan bertanda minus', () => {
    render(<Uji awal={prototipe()} />);
    const harta = screen.getByRole('button', { name: /Harta yang dibagi/ }).closest('section')!;
    fireEvent.click(screen.getByRole('button', { name: /Harta yang dibagi/ }));
    expect(within(harta).getByText('−Rp 2.000.000')).toBeTruthy();
    expect(within(harta).getAllByText('Rp 100.000.000').length).toBeGreaterThan(0);
  });

  it('langkah perhitungan: satu per satu dengan kotak "Kenapa begitu?"', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: /Pelajari langkah perhitungan/ }));
    expect(screen.getByText(/Langkah 1 dari/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Berikutnya/ }));
    expect(screen.getByText(/Langkah 2 dari/)).toBeTruthy();
    expect(screen.getAllByText('Kenapa begitu?').length).toBeGreaterThan(0);
  });

  it('kasus yang tidak didukung tampil sebagai pesan', () => {
    render(<Uji awal={kasusBaru('L')} />);
    expect(screen.getByRole('alert').textContent).toMatch(/belum bisa dihitung/);
  });
});
