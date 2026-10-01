import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { selesaikanJalur } from '../hubunganPohon';
import { PASANGAN_LAIN } from '../kerabatPohon';
import { PohonKeluarga } from '../layar/wizard/PohonKeluarga';

const kasusAnak = (): Kasus => { const k = kasusBaru('L'); return { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') }; };

describe('PohonKeluarga: menu orang', () => {
  it('mengetuk kotak membuka menu berisi aksi dasar; Esc menutup dan fokus kembali ke kotak', () => {
    render(<PohonKeluarga kasus={kasusAnak()} ubah={() => {}} />);
    const kotak = screen.getAllByRole('button', { name: /Buka menu/ })[0]!;
    kotak.focus();
    fireEvent.click(kotak);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /\+ Anak/ })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: /\+ Saudara/ })).toBeTruthy();
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(kotak);
  });
  it('pewaris tidak punya Hapus', () => {
    render(<PohonKeluarga kasus={kasusAnak()} ubah={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Buka menu/ })[0]!);
    expect(within(screen.getByRole('menu')).queryByRole('menuitem', { name: /Hapus/ })).toBeNull();
  });
  it('anak punya Ubah dan Hapus', () => {
    render(<PohonKeluarga kasus={kasusAnak()} ubah={() => {}} />);
    const tombol = screen.getAllByRole('button', { name: /Buka menu/ });
    fireEvent.click(tombol[tombol.length - 1]!);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /Ubah/ })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: /Hapus/ })).toBeTruthy();
  });
});

function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  (globalThis as { __kasus?: Kasus }).__kasus = kasus;
  return <PohonKeluarga kasus={kasus} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} />;
}
const kasusTerakhir = () => (globalThis as { __kasus?: Kasus }).__kasus!;
const bukaMenuPewaris = () => fireEvent.click(screen.getAllByRole('button', { name: /Buka menu/ })[0]!);
const pilihMenu = (nama: RegExp) => fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: nama }));

describe('PohonKeluarga: dialog', () => {
  it('+ Anak: pilih laki-laki, isi nama, simpan → anak bernama masuk graf', () => {
    render(<Uji awal={kasusBaru('L')} />);
    bukaMenuPewaris(); pilihMenu(/\+ Anak/);
    fireEvent.click(screen.getByRole('radio', { name: 'Laki-laki' }));
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Budi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(Object.values(kasusTerakhir().graf.orang).some(o => o.nama === 'Budi' && o.idAyah === 'PEWARIS')).toBe(true);
  });
  it('+ Anak tanpa memilih jenis kelamin: Simpan nonaktif', () => {
    render(<Uji awal={kasusBaru('L')} />);
    bukaMenuPewaris(); pilihMenu(/\+ Anak/);
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('+ Pasangan tanpa pertanyaan tambahan: langsung bisa Simpan', () => {
    render(<Uji awal={kasusBaru('L')} />);
    bukaMenuPewaris(); pilihMenu(/\+ Pasangan/);
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(kasusTerakhir().graf.pernikahan).toHaveLength(1);
  });
  it('dua istri: + Anak menanyakan pasangan dan Simpan menunggu jawaban', () => {
    let k = kasusBaru('L');
    k = { ...k, graf: tambahAhliWaris(tambahAhliWaris(k.graf, 'PEWARIS', 'ISTRI'), 'PEWARIS', 'ISTRI') };
    render(<Uji awal={k} />);
    bukaMenuPewaris(); pilihMenu(/\+ Anak/);
    fireEvent.click(screen.getByRole('radio', { name: 'Laki-laki' }));
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Pasangan lain, tidak dicatat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(Object.values(kasusTerakhir().graf.orang).filter(o => o.idAyah === 'PEWARIS' && !o.idIbu)).toHaveLength(1);
    void PASANGAN_LAIN;
  });
  it('Hapus anak yang punya cucu menyebut bahwa ia tetap sebagai penghubung', () => {
    let k = kasusBaru('L');
    k = { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') };
    const anak = Object.values(k.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    k = { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'CUCU_LK', { idInduk: anak }) };
    render(<Uji awal={k} />);
    const tombol = screen.getAllByRole('button', { name: /Buka menu/ });
    fireEvent.click(tombol.find(t => /Anak|anak/.test(t.getAttribute('aria-label') ?? ''))!);
    pilihMenu(/Hapus/);
    expect(screen.getByRole('alertdialog').textContent).toMatch(/tetap ada sebagai orang yang sudah wafat/);
  });
  it('Hapus menjalankan rapikanKeadaan: id yang hilang tidak tersisa di urutan wafat', () => {
    let k = kasusBaru('L');
    k = { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') };
    const anak = Object.values(k.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    k = { ...k, urutanWafat: [anak], graf: { ...k.graf, orang: { ...k.graf.orang, [anak]: { ...k.graf.orang[anak]!, statusHidup: 'hidup' } } } };
    render(<Uji awal={k} />);
    const tombol = screen.getAllByRole('button', { name: /Buka menu/ });
    fireEvent.click(tombol[tombol.length - 1]!);
    pilihMenu(/Hapus/);
    fireEvent.click(screen.getByRole('button', { name: /Hapus/ }));
    expect(kasusTerakhir().graf.orang[anak]).toBeUndefined();
    expect(kasusTerakhir().urutanWafat).toEqual([]);
  });
});

describe('PohonKeluarga: nama hubungan', () => {
  it('Tambah mertua: pilih Mertua, Ayah, beri nama, simpan; nama wajib', () => {
    let k = kasusBaru('L');
    k = { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ISTRI') };
    render(<Uji awal={k} />);
    fireEvent.click(screen.getByRole('button', { name: /Tambah mertua, menantu, ipar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Mertua' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Laki-laki' }));
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/^Nama/), { target: { value: '   ' } });
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/^Nama/), { target: { value: 'Pak Harjo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(Object.values(kasusTerakhir().graf.orang).some(o => o.nama === 'Pak Harjo')).toBe(true);
  });
  it('Menantu tanpa anak: pesan "Tambahkan anaknya dulu", tanpa perubahan graf', () => {
    render(<Uji awal={kasusBaru('L')} />);
    fireEvent.click(screen.getByRole('button', { name: /Tambah mertua, menantu, ipar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Menantu' }));
    expect(screen.getByText(/Tambahkan anaknya dulu/)).toBeTruthy();
  });
  it('kata "kerabat" tidak muncul di menu, tautan, atau dialog', () => {
    render(<Uji awal={kasusBaru('L')} />);
    expect(document.body.textContent).not.toMatch(/kerabat/i);
  });
});

describe('PohonKeluarga: sebutan di kotak', () => {
  it('orang tanpa peran di daftar ± (mertua) tampil dengan namanya saja, tanpa "(Kerabat)"', () => {
    let k = kasusBaru('L');
    k = { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ISTRI') };
    const hasil = selesaikanJalur(k.graf, 'PEWARIS', 'mertua', { jenisKelamin: 'L', nama: 'Pak Harjo' });
    if (!('graf' in hasil)) throw new Error(JSON.stringify(hasil));
    render(<Uji awal={{ ...k, graf: hasil.graf }} />);
    expect(screen.getByRole('button', { name: /Buka menu Pak Harjo$/ })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/kerabat/i);
  });
});
