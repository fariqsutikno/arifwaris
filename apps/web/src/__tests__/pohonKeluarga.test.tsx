import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
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
