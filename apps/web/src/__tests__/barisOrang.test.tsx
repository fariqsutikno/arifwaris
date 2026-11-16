import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { orangDenganKunci } from '../isianBagian';
import { bagianLengkap, type Bagian } from '../kelompok';
import { jawabLanjutan, pilihKeadaan } from '../keadaanBaris';
import { aturTahunWafat } from '../silsilah';
import { BarisOrang, BingungMemilih } from '../layar/keluarga/BarisOrang';
import { PenghitungOrang } from '../layar/keluarga/PenghitungOrang';
import { keluargaKarto, tambah } from './fixtures/kanvas';

const PASANGAN: Bagian = { id: 'pasangan:PEWARIS', milik: 'PEWARIS', jenis: 'pasangan' };
const ANAK: Bagian = { id: 'anak:PEWARIS', milik: 'PEWARIS', jenis: 'anak' };
const ORANG_TUA: Bagian = { id: 'orangTua:PEWARIS', milik: 'PEWARIS', jenis: 'orangTua' };

let terakhir: Kasus;
function Uji({ awal, bagian, kunci, tandaiKurang = false, disorot }: { awal: Kasus; bagian: Bagian; kunci: KunciAhliWaris; tandaiKurang?: boolean; disorot?: IdOrang }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  const ubah = (f: (k: Kasus) => Kasus) => setKasus(k => rapikanKeadaan(f(k)));
  return (
    <>
      <PenghitungOrang kasus={kasus} bagian={bagian} kunci={kunci} ubah={ubah} />
      {orangDenganKunci(kasus, bagian.milik, kunci).map(id => (
        <BarisOrang key={id} kasus={kasus} id={id} kunci={kunci} milik={bagian.milik} ubah={ubah} tandaiKurang={tandaiKurang} disorot={id === disorot} />
      ))}
      <BingungMemilih daftarKunci={[kunci]} />
    </>
  );
}
const radios = (kontainer: HTMLElement) => within(kontainer).getAllByRole('radio').map(r => r.textContent);

describe('BarisOrang dan PenghitungOrang (spec kanvas 5.3, 5.4)', () => {
  it('+ menambah baris tanpa keadaan terpilih; Lanjut-nya tertahan (Review Focus 1)', () => {
    const { rerender } = render(<Uji awal={kasusBaru('L')} bagian={PASANGAN} kunci="ISTRI" />);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Istri' }));
    const baris = document.querySelector('[data-baris-orang]') as HTMLElement;
    expect(within(baris).queryAllByRole('radio', { checked: true })).toHaveLength(0);
    expect(bagianLengkap(terakhir, PASANGAN)).toBe(false);
    rerender(<Uji awal={terakhir} bagian={PASANGAN} kunci="ISTRI" tandaiKurang />);
    const ditandai = document.querySelector('[data-baris-orang]') as HTMLElement;
    expect(ditandai.getAttribute('aria-invalid')).toBe('true');
    expect(within(ditandai).getByText('Pilih keadaannya.')).toBeTruthy();
  });

  it('pilihan keadaan (C4-1): tiga pil untuk Ayah dan Istri; tanpa Lainnya, Hilang tanpa kabar, atau Sudah bercerai', () => {
    const { kasus, ayah } = keluargaKarto();
    const { unmount } = render(<Uji awal={kasus} bagian={ORANG_TUA} kunci="AYAH" />);
    expect(radios(document.getElementById(`baris-${ayah}`)!.querySelector('[role=radiogroup]') as HTMLElement))
      .toEqual(['Masih hidup', 'Sudah meninggal', 'Belum tahu']);
    unmount();
    render(<Uji awal={kasus} bagian={PASANGAN} kunci="ISTRI" />);
    const baris = document.querySelector('[data-baris-orang]') as HTMLElement;
    expect(radios(baris.querySelector('[role=radiogroup]') as HTMLElement)).toEqual(['Masih hidup', 'Sudah meninggal', 'Belum tahu']);
    for (const nama of ['Lainnya', 'Hilang tanpa kabar', 'Sudah bercerai']) expect(within(baris).queryByRole('radio', { name: nama })).toBeNull();
  });

  it('orang yang ditandai hilang atau cerai dari pertanyaan lanjutan: kartunya menyebut tempat mengubahnya', () => {
    let { kasus, id } = tambah(kasusBaru('L'), 'PEWARIS', 'ISTRI');
    kasus = pilihKeadaan(kasus, id, 'bercerai', 'PEWARIS');
    kasus = jawabLanjutan(kasus, id, 'PEWARIS', { jenis: 'iddah', selesai: false });
    render(<Uji awal={kasus} bagian={PASANGAN} kunci="ISTRI" />);
    const baris = document.querySelector('[data-baris-orang]') as HTMLElement;
    expect(within(baris).queryAllByRole('radio', { checked: true })).toHaveLength(0);
    expect(within(baris).getByText(/Ditandai sudah dicerai almarhum/)).toBeTruthy();
  });

  it('Sudah wafat: dua tahun menampilkan "Berarti sebelum"; tanpa tahun menampilkan pilihan Sebelum/Sesudah; tahun hanya lewat tautan "Ingat tahunnya?"', () => {
    let kasus = kasusBaru('L');
    kasus = aturTahunWafat(kasus, 'PEWARIS', { tahun: 1975, kiraKira: false });
    const { unmount } = render(<Uji awal={kasus} bagian={ANAK} kunci="ANAK_LK" />);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
    const baris = () => document.querySelector('[data-baris-orang]') as HTMLElement;
    fireEvent.click(within(baris()).getByRole('radio', { name: 'Sudah meninggal' }));
    expect(within(baris()).getByRole('radio', { name: 'Sebelum' })).toBeTruthy();
    expect(within(baris()).queryByLabelText('Tahun meninggalnya', { exact: false })).toBeNull();
    fireEvent.click(within(baris()).getByRole('button', { name: 'Ingat tahunnya?' }));
    fireEvent.change(within(baris()).getByLabelText('Tahun meninggalnya', { exact: false }), { target: { value: '1970' } });
    expect(within(baris()).queryByRole('button', { name: 'Ingat tahunnya?' })).toBeNull();
    expect(within(baris()).getByText('Berarti sebelum almarhum meninggal (1975).')).toBeTruthy();
    expect(within(baris()).queryByRole('radio', { name: 'Sebelum' })).toBeNull();
    unmount();
    render(<Uji awal={kasusBaru('L')} bagian={ANAK} kunci="ANAK_LK" />);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
    fireEvent.click(within(baris()).getByRole('radio', { name: 'Sudah meninggal' }));
    fireEvent.click(within(baris()).getByRole('radio', { name: 'Sesudah' }));
    expect(bagianLengkap(terakhir, ANAK)).toBe(true);
    expect(terakhir.belumDiisi).toBeUndefined();
    expect(terakhir.urutanWafat).toHaveLength(1);
  });

  it('− tanpa baris kosong menampilkan pesan dan tidak menghapus orang berisi', () => {
    render(<Uji awal={kasusBaru('L')} bagian={ANAK} kunci="ANAK_LK" />);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
    fireEvent.click(within(document.querySelector('[data-baris-orang]') as HTMLElement).getByRole('radio', { name: 'Masih hidup' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kurangi Anak laki-laki' }));
    expect(screen.getByText('Orang yang sudah diisi dihapus lewat "Hapus" di barisnya.')).toBeTruthy();
    expect(document.querySelectorAll('[data-baris-orang]')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kurangi Anak laki-laki' }));
    expect(document.querySelectorAll('[data-baris-orang]')).toHaveLength(1);   // baris kosong terakhir dibuang
  });

  it('Hapus membuka konfirmasi yang menyebut keluarga yang ikut terhapus', () => {
    const { kasus, budi } = keluargaKarto();
    render(<Uji awal={kasus} bagian={ANAK} kunci="ANAK_LK" />);
    fireEvent.click(within(document.getElementById(`baris-${budi}`)!).getByRole('button', { name: 'Hapus Budi' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('Budi');
    expect(dialog.textContent).toContain('Dewi');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Batal' }));
    expect(terakhir.graf.orang[budi]).toBeDefined();
  });

  it('Belum tahu menampilkan catatan muncul lagi di Periksa', () => {
    render(<Uji awal={kasusBaru('L')} bagian={ANAK} kunci="ANAK_LK" />);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Belum tahu' }));
    expect(screen.getByText(/muncul lagi di Periksa/)).toBeTruthy();
  });

  it('aksi pada baris = ikon + teks terlihat; tidak ada menu ⋯', () => {
    const { kasus } = keluargaKarto();
    const { container } = render(<Uji awal={kasus} bagian={ANAK} kunci="ANAK_LK" />);
    const hapus = screen.getAllByRole('button', { name: /^Hapus / })[0]!;
    expect(hapus.textContent).toBe('Hapus');
    expect(hapus.querySelector('svg')).toBeTruthy();
    expect(container.textContent).not.toContain('⋯');
    expect(container.querySelector('[aria-haspopup]')).toBeNull();
  });

  it('Bingung memilih? memuat arti tiga pil; khuntsa hanya untuk peran yang bisa', () => {
    const { unmount } = render(<BingungMemilih daftarKunci={['AYAH', 'IBU']} />);
    const ringkas = document.querySelector('details')!.textContent!;
    for (const kata of ['Masih hidup', 'Sudah meninggal', 'Belum tahu']) expect(ringkas).toContain(kata);
    for (const kata of ['Hilang tanpa kabar', 'Sudah bercerai', 'Lainnya', 'Kelaminnya belum jelas']) expect(ringkas).not.toContain(kata);
    unmount();
    render(<BingungMemilih daftarKunci={['ANAK_LK']} />);
    expect(document.querySelector('details')!.textContent).toContain('Kelaminnya belum jelas');
  });

  it('baris disorot dapat digulir ke dalam pandangan: punya data-baris-orang dan kelas sorot', () => {
    const { kasus, budi } = keluargaKarto();
    render(<Uji awal={kasus} bagian={ANAK} kunci="ANAK_LK" disorot={budi} />);
    const baris = document.getElementById(`baris-${budi}`)!;
    expect(baris.getAttribute('data-baris-orang')).toBe(budi);
    expect(baris.className).toContain('sorot-baris');
  });
});

describe('tahun wafat yang diketik menentukan keadaan (review K1)', () => {
  const tahunDiisi = (baris: HTMLElement, nilai: string) => {
    fireEvent.click(within(baris).getByRole('button', { name: 'Ingat tahunnya?' }));
    fireEvent.change(within(baris).getByLabelText('Tahun meninggalnya', { exact: false }), { target: { value: nilai } });
  };
  const barisAnak = () => document.querySelector('[data-baris-orang]') as HTMLElement;
  const almarhum1990 = aturTahunWafat(kasusBaru('L'), 'PEWARIS', { tahun: 1990, kiraKira: false });

  it('Wafat lalu tahun 2000 (almarhum 1990): wafat sesudah dan masuk urutanWafat', () => {
    render(<Uji awal={almarhum1990} bagian={ANAK} kunci="ANAK_LK" />);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
    fireEvent.click(within(barisAnak()).getByRole('radio', { name: 'Sudah meninggal' }));
    tahunDiisi(barisAnak(), '2000');
    expect(terakhir.urutanWafat).toHaveLength(1);
    expect(terakhir.belumDiisi).toBeUndefined();
  });

  it('memilih Sebelum lalu mengetik 2000 memindahkan ke sesudah', () => {
    render(<Uji awal={almarhum1990} bagian={ANAK} kunci="ANAK_LK" />);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
    fireEvent.click(within(barisAnak()).getByRole('radio', { name: 'Sudah meninggal' }));
    fireEvent.click(within(barisAnak()).getByRole('radio', { name: 'Sebelum' }));
    expect(terakhir.urutanWafat).toHaveLength(0);
    tahunDiisi(barisAnak(), '2000');
    expect(terakhir.urutanWafat).toHaveLength(1);
  });
});

describe('sebutan -mu di baris (rencana 4, tugas 7)', () => {
  it('saya = Andi: baris Budi menampilkan "ayahmu"', () => {
    const { kasus, andi, budi } = keluargaKarto();
    render(<BarisOrang kasus={{ ...kasus, saya: andi }} id={budi} kunci="ANAK_LK" milik="PEWARIS" ubah={() => {}} tandaiKurang={false} disorot={false} />);
    expect(document.querySelector('.peran')!.textContent).toMatch(/· ayahmu/);
  });
});
