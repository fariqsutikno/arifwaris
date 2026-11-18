import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { LatihanAhliWaris } from '../layar/latihan/LatihanAhliWaris';

beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); });

function Papan({ awal = kasusBaru('L', 'latihan'), fokus }: { awal?: Kasus; fokus?: string }) {
  const [kasus, setKasus] = useState<Kasus>(awal);
  return <LatihanAhliWaris kasus={kasus} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} {...(fokus ? { fokus } : {})} />;
}
const tambah = (label: string) => fireEvent.click(screen.getAllByRole('button', { name: `Tambah ${label}` })[0]!);
const chip = (nama: RegExp) => screen.getByRole('button', { name: nama });

describe('LatihanAhliWaris (kartu per mayit)', () => {
  it('awal: satu kartu "Mayit pertama", baris jumlah tampil, tanpa daftar urutan', () => {
    render(<Papan />);
    expect(screen.getByRole('heading', { name: /Mayit pertama/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Tambah / }).length).toBeGreaterThan(0);
    expect(screen.queryByText('Urutan wafat (munasakhat)')).toBeNull();
  });

  it('tandai anak laki-laki: kartu "Mayit ke-2" muncul, chip aria-pressed', () => {
    render(<Papan />);
    tambah('Anak laki-laki');
    fireEvent.click(chip(/^Anak laki-laki/));
    expect(screen.getByRole('heading', { name: /Mayit ke-2/ })).toBeTruthy();
    expect(chip(/^Anak laki-laki/).getAttribute('aria-pressed')).toBe('true');
  });

  it('dua mayit lanjutan: daftar urutan tampil; naikkan menukar urutan', () => {
    render(<Papan />);
    tambah('Anak laki-laki'); tambah('Anak perempuan');
    fireEvent.click(chip(/^Anak laki-laki/));
    fireEvent.click(chip(/^Anak perempuan/));
    const urutan = screen.getByRole('list', { name: 'Urutan wafat (munasakhat)' });
    const sebelum = within(urutan).getAllByRole('listitem').map(li => li.textContent);
    fireEvent.click(within(urutan).getAllByRole('button', { name: /^Naikkan/ })[1]!);
    const sesudah = within(screen.getByRole('list', { name: 'Urutan wafat (munasakhat)' })).getAllByRole('listitem').map(li => li.textContent);
    expect(sesudah[0]).toContain(sebelum[1]!.replace(/Naikkan.*$/, '').trim().slice(0, 8));
    expect(sesudah).not.toEqual(sebelum);
  });

  it('lepas tanda meminta konfirmasi bila kartunya sudah berisi; Batal tidak mengubah apa pun', () => {
    render(<Papan />);
    tambah('Anak laki-laki');
    fireEvent.click(chip(/^Anak laki-laki/));
    const kartu2 = screen.getByRole('heading', { name: /Mayit ke-2/ }).closest('section')!;
    fireEvent.click(within(kartu2).getAllByRole('button', { name: /^Tambah Istri/ })[0]!);
    fireEvent.click(within(screen.getByRole('heading', { name: /Mayit pertama/ }).closest('section')!).getByRole('button', { name: /^Anak laki-laki/ }));   // lepas tanda
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('heading', { name: /Mayit ke-2/ })).toBeTruthy();
  });

  it('lepas tanda pada kartu kosong langsung melepas, tanpa dialog', () => {
    render(<Papan />);
    tambah('Anak laki-laki');
    fireEvent.click(chip(/^Anak laki-laki/));
    fireEvent.click(chip(/^Anak laki-laki/));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.queryByRole('heading', { name: /Mayit ke-2/ })).toBeNull();
  });

  it('kartu fokus digulir dan menerima fokus', () => {
    render(<Papan fokus="PEWARIS" />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('mayit-PEWARIS');
  });

  it('chip berupa tombol berlabel', () => {
    render(<Papan />);
    tambah('Anak laki-laki');
    expect(chip(/^Anak laki-laki/).tagName).toBe('BUTTON');
  });
});

describe('Hal lain per kartu (status khusus)', () => {
  const bukaHalLain = (kartu: HTMLElement) => fireEvent.click(within(kartu).getByText('Hal lain'));

  it('tertutup bawaannya; dibuka menampilkan tiap orang di kartu dengan keadaannya', () => {
    render(<Papan />);
    tambah('Anak laki-laki');
    const kartu = screen.getByRole('heading', { name: /Mayit pertama/ }).closest('section')!;
    expect(within(kartu).queryByText('masih hidup')).toBeNull();
    bukaHalLain(kartu);
    expect(within(kartu).getByText('masih hidup')).toBeTruthy();
  });

  it('menandai hilang lewat dialog keadaan; status tampil di daftar', () => {
    render(<Papan />);
    tambah('Anak laki-laki');
    const kartu = screen.getByRole('heading', { name: /Mayit pertama/ }).closest('section')!;
    bukaHalLain(kartu);
    fireEvent.click(within(kartu).getByRole('button', { name: /masih hidup$/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Hilang/ }));
    fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Belum ada/ }));
    fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
    expect(within(kartu).getByText('hilang')).toBeTruthy();
  });
});
