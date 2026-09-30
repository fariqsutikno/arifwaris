import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { jalankan } from '../jalankan';
import { terapkanKeadaan } from '../keadaanOrang';
import { Hasil } from '../layar/Hasil';

function dengan(ubah: (k: Kasus, anak: string) => Kasus): Kasus {
  let kasus: Kasus = { ...kasusBaru('L'), tirkah: { kotor: 1_200_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  return ubah(kasus, Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id);
}

describe('hasil kasus khusus', () => {
  it('taqdir (hilang): pembagian sekarang + amplop titipan + kalau terbukti', () => {
    const kasus = dengan((k, anak) => terapkanKeadaan(k, anak, { jenis: 'hilang' }));
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getByText(/Amplop titipan/)).toBeTruthy();
    expect(screen.getByText(/menunggu kabar/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Kalau terbukti/ }));
    expect(screen.getAllByText(/masih hidup|sudah wafat/).length).toBeGreaterThan(0);
  });
  it('gharqa: dua kartu harta dan kalimat tidak saling mewarisi', () => {
    const kasus = dengan((k, anak) => terapkanKeadaan(k, anak, { jenis: 'bersamaan', keadaan: 'serentak', tirkah: { kotor: 300_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } }));
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getByText(/tidak saling mewarisi/)).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: /^Harta / }).length).toBe(2);
  });
  it('menunggu: kartu + tautan hitung sekarang mengubah pilihanJanin', () => {
    const kirim = vi.fn();
    const kasus = dengan(k => ({ ...k, pilihanJanin: 'tunggu', graf: { ...k.graf, orang: { ...k.graf.orang,
      J: { id: 'J', jenisKelamin: 'L', idAyah: 'PEWARIS', statusHidup: 'dalamKandungan', agama: 'islam' } } } }));
    expect(jalankan(kasus).jenis).toBe('menunggu');
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={kirim} />);
    fireEvent.click(screen.getByRole('button', { name: /Hitung sekarang saja/ }));
    const aksi = kirim.mock.calls[0]![0];
    expect(aksi.jenis).toBe('UBAH_KASUS');
    expect(aksi.ubah(kasus).pilihanJanin).toBe('hitungSekarang');
  });
  it('PERLU_INPUT batas kemungkinan: daftar orang, bukan pesan teknis', () => {
    // 9 orang hilang → 2⁹ = 512 > 256
    const kasus = dengan(k => {
      let hasil = k;
      for (let i = 0; i < 9; i++) hasil = { ...hasil, graf: tambahAhliWaris(hasil.graf, 'PEWARIS', 'ANAK_PR') };
      for (const o of Object.values(hasil.graf.orang).filter(o => o.idAyah === 'PEWARIS')) hasil = terapkanKeadaan(hasil, o.id, { jenis: 'hilang' });
      return hasil;
    });
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getByText(/Terlalu banyak yang belum pasti/)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Pastikan/ }).length).toBeGreaterThan(0);
  });
});
