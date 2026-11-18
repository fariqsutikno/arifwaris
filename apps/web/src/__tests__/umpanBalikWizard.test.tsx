// Umpan balik wizard: tambah cepat terlihat, Lanjut yang tertahan menandai isian, dan komponen yang seragam (C1, C2).
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { kasusBaru, type Kasus } from '../kasus';
import { keadaanAwal, pengurangKeadaan, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { Wizard } from '../layar/Wizard';
import { DialogKonfirmasi } from '../ui/Dialog';

beforeEach(() => { localStorage.clear(); localStorage.setItem('arif-waris:tur:wizard', '1'); });

function Papan({ kasus, langkah }: { kasus: Kasus; langkah: number }) {
  const [keadaan, setKeadaan] = useState<KeadaanAplikasi>(() => pengurangKeadaan(keadaanAwal(kasus, null), { jenis: 'KE_LANGKAH', langkah }));
  return <Wizard keadaan={keadaan} kirim={(aksi: Aksi) => setKeadaan(k => pengurangKeadaan(k, aksi))} />;
}

describe('C1-1 tambah cepat terlihat menambah', () => {
  it('tiap ketukan mengumumkan tambahan dan total terbaru, label melayang tampil', () => {
    render(<Papan kasus={{ ...kasusBaru('L'), pintu: 'baru' }} langkah={2} />);
    fireEvent.click(screen.getByRole('button', { name: '+10 jt' }));
    fireEvent.click(screen.getByRole('button', { name: '+10 jt' }));
    expect(screen.getByText('Ditambah 10 jt, sekarang Rp 20.000.000').getAttribute('aria-live')).toBe('polite');
    expect(document.querySelector('.label-melayang')!.textContent).toBe('+10 jt');
    expect(document.querySelector('.kotak-uang')!.className).toMatch(/kedip-/);
  });

  it('mengetik langsung membuang baris "sekarang" yang sudah basi', () => {
    render(<Papan kasus={{ ...kasusBaru('L'), pintu: 'baru' }} langkah={2} />);
    fireEvent.click(screen.getByRole('button', { name: '+1 jt' }));
    fireEvent.change(screen.getByLabelText('Total harta peninggalan'), { target: { value: '5' } });
    expect(screen.queryByText(/Ditambah/)).toBeNull();
  });
});

describe('C1-2/C1-3 Lanjut tertahan menandai isian', () => {
  it('Harta kosong: kotak dibingkai merah, pesan di bawahnya, fokus ke kotak, Lanjut tidak nonaktif', () => {
    render(<Papan kasus={{ ...kasusBaru('L'), pintu: 'baru' }} langkah={2} />);
    const lanjut = screen.getByRole('button', { name: /Lanjut: Keluarga/ });
    fireEvent.click(lanjut);
    const isian = screen.getByLabelText('Total harta peninggalan');
    expect(isian.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('.kotak-uang')!.className).toContain('galat');
    expect(screen.getByText(/Isi total harta, harus lebih dari Rp 0/)).toBeTruthy();
    expect(document.activeElement).toBe(isian);
    expect(lanjut.hasAttribute('disabled')).toBe(false);
  });

  it('pintu belum dijawab: pilihan ditandai dan difokuskan', () => {
    render(<Papan kasus={kasusBaru('L')} langkah={1} />);
    fireEvent.click(screen.getByRole('button', { name: /Lanjut: Harta/ }));
    const kelompok = document.querySelector('.daftar-pintu')!;
    expect(kelompok.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(kelompok);
  });
});

describe('C2 komponen seragam', () => {
  it('kewajiban memakai pil Ya/Tidak yang sama dan kartu seperti Total harta', () => {
    render(<Papan kasus={{ ...kasusBaru('L'), pintu: 'baru' }} langkah={2} />);
    expect(document.querySelector('[aria-labelledby="tanya-kewajiban"].ya-tidak')).toBeTruthy();
    expect(document.getElementById('tanya-kewajiban')!.closest('.grup-isian')).toBeTruthy();
  });

  it('dialog bahaya: Hapus merah di kanan, Batal tautan di kiri dan berfokus awal', () => {
    render(<DialogKonfirmasi bahaya judul="Hapus Budi?" labelLanjut="Hapus" saatLanjut={() => undefined} saatBatal={() => undefined}><p>x</p></DialogKonfirmasi>);
    const [batal, hapus] = Array.from(document.querySelectorAll('.aksi-konfirmasi button'));
    expect(batal!.textContent).toBe('Batal');
    expect(batal!.className).toBe('tautan-batal');
    expect(hapus!.className).toContain('aw-btn-danger');
    expect(document.activeElement).toBe(batal);
  });
});
