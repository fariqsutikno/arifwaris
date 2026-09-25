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

let aksiTerakhir: Aksi | null = null;
function Uji({ awal, tujuan = 'hitung', saatDikerjakan }: { awal: Kasus; tujuan?: Tujuan; saatDikerjakan?: () => void }) {
  const [kasus, setKasus] = useState(awal);
  const kirim = (aksi: Aksi) => { aksiTerakhir = aksi; if (aksi.jenis === 'UBAH_KASUS') setKasus(aksi.ubah); };
  return <Hasil kasus={kasus} tujuan={tujuan} kirim={kirim} saatDikerjakan={saatDikerjakan} />;
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
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    expect(within(pembagian()).getAllByText('Rp 16.666.666').length).toBe(2);
  });

  it('mode belajar: tebakan salah ditolak; benar membuka jawaban dan dihitung dikerjakan', () => {
    let dikerjakan = 0;
    render(<Uji awal={c1601()} tujuan="belajar" saatDikerjakan={() => { dikerjakan++; }} />);
    const isi = (nama: RegExp, nilai: string) => fireEvent.change(within(pembagian()).getByRole('textbox', { name: nama }), { target: { value: nilai } });
    isi(/Istri/, '1/4'); isi(/Anak laki-laki/, '7/12'); isi(/Anak perempuan/, '7/24');
    fireEvent.click(screen.getByRole('button', { name: 'Jawab' }));
    expect(screen.getByRole('alert').textContent).toMatch(/masih salah.*2 dari 3/);
    expect(dikerjakan).toBe(0);
    isi(/Istri/, '3/24');
    fireEvent.click(screen.getByRole('button', { name: 'Jawab' }));
    expect(dikerjakan).toBe(1);
    expect(screen.queryByRole('button', { name: 'Jawab' })).toBeNull();
  });

  it('mode belajar: lihat jawaban tanpa pernah mencoba tidak dihitung; setelah mencoba dihitung', () => {
    let dikerjakan = 0;
    const { unmount } = render(<Uji awal={c1601()} tujuan="belajar" saatDikerjakan={() => { dikerjakan++; }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    expect(dikerjakan).toBe(0);
    unmount();
    render(<Uji awal={c1601()} tujuan="belajar" saatDikerjakan={() => { dikerjakan++; }} />);
    for (const kotak of within(pembagian()).getAllByRole('textbox')) fireEvent.change(kotak, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Jawab' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    expect(dikerjakan).toBe(1);
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

  it('klik baris di tabel faraidh juga membuka penjelasan orang itu', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tabel faraidh' }));
    fireEvent.click(within(screen.getByRole('table')).getByText('Ibu').closest('tr')!);
    expect(within(screen.getByRole('dialog')).getByRole('heading', { name: 'Ibu' })).toBeTruthy();
  });

  it('harta yang dibagi disusun seperti hitungan, potongan bertanda minus, tanpa bar komposisi', () => {
    render(<Uji awal={prototipe()} />);
    const harta = screen.getByRole('button', { name: /Harta yang dibagi/ }).closest('section')!;
    fireEvent.click(screen.getByRole('button', { name: /Harta yang dibagi/ }));
    expect(within(harta).getByText('−Rp 2.000.000')).toBeTruthy();
    expect(within(harta).getAllByText('Rp 100.000.000').length).toBeGreaterThan(0);
    expect(harta.querySelector('.alir')).toBeNull();
  });

  it('ubah harta cepat dari layar hasil: pratinjau, lalu simpan; hutang dan wasiat tidak berubah', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: /Harta yang dibagi/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ubah harta' }));
    const dialog = screen.getByRole('dialog', { name: 'Ubah harta peninggalan' });
    fireEvent.change(within(dialog).getByLabelText('Harta peninggalan'), { target: { value: '210000000' } });
    expect(within(dialog).getByText('Rp 200.000.000')).toBeTruthy();   // 210 − 2 − 3 − 5
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }));
    expect(within(pembagian()).getByText('Rp 25.000.000')).toBeTruthy();   // istri 1/8 × 200 jt
  });

  it('batal ubah harta mengembalikan nilai semula', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: /Harta yang dibagi/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ubah harta' }));
    fireEvent.change(screen.getByLabelText('Harta peninggalan'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(within(pembagian()).getByText('Rp 12.500.000')).toBeTruthy();
  });

  it('dari modal orang: Ubah jumlah membuka modal − n + khusus jenis itu', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(within(pembagian()).getByRole('button', { name: /Anak perempuan/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ubah jumlah' }));
    const modal = screen.getByRole('dialog', { name: /Ubah jumlah Anak perempuan/ });
    fireEvent.click(within(modal).getByRole('button', { name: 'Tambah Anak perempuan' }));
    expect(within(pembagian()).getAllByText(/^Anak perempuan/).length).toBe(2);
    fireEvent.click(within(modal).getByRole('button', { name: 'Kurangi Anak perempuan' }));
    fireEvent.click(within(modal).getByRole('button', { name: 'Kurangi Anak perempuan' }));
    expect(within(pembagian()).queryByText(/^Anak perempuan/)).toBeNull();
  });

  it('modal orang: kenapa segitu hanya tentang dia, pengaruhnya ke orang lain dipisah', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(within(pembagian()).getByRole('button', { name: /^Anak laki-laki/ }));
    const dialog = screen.getByRole('dialog');
    const kenapa = dialog.querySelector('.kenapa-utama')!;
    expect(kenapa.textContent).toMatch(/sisa/);
    expect(kenapa.textContent).not.toMatch(/Istri mendapat/);
    expect(within(dialog).getByText('Ahli waris lain yang terdampak')).toBeTruthy();
    expect(within(dialog).getByText('Cara menghitungnya')).toBeTruthy();
  });

  it('hanya istri: hasil tetap tampil, sisa ke dzawil arham / baitul mal', () => {
    render(<Uji awal={buat(['ISTRI'], { kotor: 4_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n })} />);
    expect(within(pembagian()).getByText(/Sisa: dzawil arham \/ baitul mal/)).toBeTruthy();
    expect(within(pembagian()).getByText('Rp 3.000.000')).toBeTruthy();
  });

  it('pintasan "Ubah ahli waris" membuka langkah ahli waris', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ubah ahli waris' }));
    expect(aksiTerakhir).toEqual({ jenis: 'KE_LANGKAH', langkah: 4 });
  });

  it('istilah di tabel faraidh punya tooltip', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tabel faraidh' }));
    fireEvent.focus(within(screen.getByRole('table')).getByText('Tashih'));
    expect(screen.getByRole('tooltip').textContent).toMatch(/pembagi/);
  });

  it('"Ubah data" membuka wizard dari langkah pertama', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Ubah data/ }).at(-1)!);
    expect(aksiTerakhir).toEqual({ jenis: 'KE_LANGKAH', langkah: 1 });
  });

  it('langkah perhitungan: satu per satu dengan kotak "Kenapa begitu?"', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: /Pelajari langkah perhitungan/ }));
    expect(screen.getByText(/Langkah 1 dari/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Berikutnya/ }));
    expect(screen.getByText(/Langkah 2 dari/)).toBeTruthy();
    expect(screen.queryByText(/langkah kelar/)).toBeNull();
    expect(screen.getAllByText('Kenapa begitu?').length).toBeGreaterThan(0);
  });

  it('kasus yang tidak didukung tampil sebagai pesan', () => {
    render(<Uji awal={kasusBaru('L')} />);
    expect(screen.getByRole('alert').textContent).toMatch(/belum bisa dihitung/);
  });
});
