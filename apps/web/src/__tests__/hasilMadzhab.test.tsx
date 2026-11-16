import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import type { Tujuan } from '../preferensi';
import { Hasil } from '../layar/Hasil';

const tidakDidukung = vi.hoisted(() => ({ aktif: false }));
vi.mock('../jalankan', async importAsli => {
  const asli = await importAsli<typeof import('../jalankan')>();
  return { ...asli, jalankan: (kasus: Kasus) => (tidakDidukung.aktif
    ? { jenis: 'biasa', hasil: { status: 'TIDAK_DIDUKUNG', alasan: 'Alasan uji' } }
    : asli.jalankan(kasus)) };
});

// [K07-1] musyarrakah: Syafi'i tasyrik, Hanbali tanpa tasyrik.
function musyarrakah(): Kasus {
  let kasus: Kasus = { ...kasusBaru('P'), tirkah: { kotor: 90_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  for (const kunci of ['SUAMI', 'IBU', 'SAUDARA_SEIBU', 'SAUDARA_SEIBU', 'SAUDARA_KANDUNG'] as const)
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  return kasus;
}

function Uji({ awal, tujuan = 'hitung' }: { awal: Kasus; tujuan?: Tujuan }) {
  const [kasus, setKasus] = useState(awal);
  const kirim = (aksi: Aksi) => { if (aksi.jenis === 'UBAH_KASUS') setKasus(aksi.ubah); };
  return <Hasil kasus={kasus} idSesi="sesi-madzhab" tujuan={tujuan} kirim={kirim} />;
}

describe('pilihan madzhab di hasil', () => {
  it('bawaan Syafi\'i: tanpa catatan sumber dan tanpa label beda', () => {
    tidakDidukung.aktif = false;
    render(<Uji awal={musyarrakah()} />);
    expect(screen.getByText("Menurut madzhab Syafi'i")).toBeTruthy();
    expect(screen.queryByText(/nukilan Lahim dan Ithraa \(sumber/)).toBeNull();
    expect(screen.queryByText("berbeda dari Syafi'i")).toBeNull();
  });

  it('ganti madzhab lewat dialog: Hanbali tampil di hero, catatan sumber, label per orang; kembali ke Syafi\'i menghapus field', () => {
    tidakDidukung.aktif = false;
    render(<Uji awal={musyarrakah()} />);
    fireEvent.click(screen.getByRole('button', { name: 'ganti madzhab' }));
    const dialog = screen.getByRole('dialog', { name: 'Pilih madzhab' });
    expect((within(dialog).getByRole('radio', { name: /Syafi'i/ }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(within(dialog).getByRole('radio', { name: /Hanbali/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Pakai' }));
    expect(screen.queryByRole('dialog', { name: 'Pilih madzhab' })).toBeNull();
    expect(screen.getByText('Menurut madzhab Hanbali')).toBeTruthy();
    expect(screen.getByText(/Madzhab Hanbali di sini mengikuti nukilan Lahim dan Ithraa/)).toBeTruthy();
    expect(screen.getAllByText("berbeda dari Syafi'i").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'ganti madzhab' }));
    const lagi = screen.getByRole('dialog', { name: 'Pilih madzhab' });
    fireEvent.click(within(lagi).getByRole('radio', { name: /Syafi'i/ }));
    fireEvent.click(within(lagi).getByRole('button', { name: 'Pakai' }));
    expect(screen.getByText("Menurut madzhab Syafi'i")).toBeTruthy();
    expect(screen.queryByText("berbeda dari Syafi'i")).toBeNull();
  });

  it('Batal tidak mengubah madzhab', () => {
    tidakDidukung.aktif = false;
    render(<Uji awal={musyarrakah()} />);
    fireEvent.click(screen.getByRole('button', { name: 'ganti madzhab' }));
    const dialog = screen.getByRole('dialog', { name: 'Pilih madzhab' });
    fireEvent.click(within(dialog).getByRole('radio', { name: /Maliki/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Batal' }));
    expect(screen.getByText("Menurut madzhab Syafi'i")).toBeTruthy();
  });

  it('mode Belajar tidak punya tautan ganti madzhab', () => {
    tidakDidukung.aktif = false;
    render(<Uji awal={musyarrakah()} tujuan="belajar" />);
    expect(screen.queryByRole('button', { name: 'ganti madzhab' })).toBeNull();
  });

  it('TIDAK_DIDUKUNG: alasan tampil; di madzhab lain ada tautan hitung menurut Syafi\'i yang menghapus madzhab', () => {
    tidakDidukung.aktif = true;
    const { unmount } = render(<Uji awal={musyarrakah()} />);
    expect(screen.getByText('Alasan uji')).toBeTruthy();
    expect(screen.queryByRole('button', { name: "hitung menurut Syafi'i" })).toBeNull();
    unmount();
    render(<Uji awal={{ ...musyarrakah(), madzhab: 'maliki' }} />);
    fireEvent.click(screen.getByRole('button', { name: "hitung menurut Syafi'i" }));
    expect(screen.queryByRole('button', { name: "hitung menurut Syafi'i" })).toBeNull();
    tidakDidukung.aktif = false;
  });
});
