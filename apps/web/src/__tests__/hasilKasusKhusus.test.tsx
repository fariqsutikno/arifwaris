import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { jalankan } from '@waris/latihan';
import { terapkanKeadaan } from '../keadaanOrang';
import { Hasil } from '../layar/Hasil';

function dengan(ubah: (k: Kasus, anak: string) => Kasus): Kasus {
  let kasus: Kasus = { ...kasusBaru('L'), tirkah: { kotor: 1_200_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  return ubah(kasus, Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id);
}

const janin = (k: Kasus): Kasus => ({ ...k, graf: { ...k.graf, orang: { ...k.graf.orang,
  J: { id: 'J', jenisKelamin: 'L', idAyah: 'PEWARIS', idIbu: Object.values(k.graf.orang).find(o => o.jenisKelamin === 'P')!.id, statusHidup: 'dalamKandungan', agama: 'islam' } } } });
const bersamaan = (keadaan: 'serentak' | 'terlupakan') => dengan((k, anak) => terapkanKeadaan(k, anak, { jenis: 'bersamaan', keadaan, tirkah: { kotor: 300_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } }));

describe('hasil kasus khusus (kerangka Hasil v6)', () => {
  it('taqdir (hilang): status sebagian ditahan, ubin uang ditahan, kelompok ditahan, tabel kemungkinan', () => {
    const kasus = dengan((k, anak) => terapkanKeadaan(k, anak, { jenis: 'hilang' }));
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getAllByText('Sebagian ditahan').length).toBeGreaterThan(0);
    expect(screen.getByRole('region', { name: /Uang ditahan/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /^Ditahan/ })).toBeTruthy();
    expect(screen.getByText(/menunggu kabar/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tabel kemungkinan' })).toBeTruthy();
    expect(screen.getAllByText(/masih hidup|sudah wafat/).length).toBeGreaterThan(0);
  });
  it('haml [SYF]: anak lk yang berbagi ashabah dengan janin belum menerima apa pun (KB 13a.4)', () => {
    const kasus = dengan(k => janin(k));
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getAllByText(/berbagi sisa dengan bayi/).length).toBeGreaterThan(0);
    expect(screen.getByText(/menunggu bayi lahir/)).toBeTruthy();
  });
  it('gharqa serentak: tidak saling mewarisi, total dengan rincian per harta, tabel per harta', () => {
    render(<Hasil kasus={bersamaan('serentak')} idSesi="s" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getByText(/tidak saling mewarisi/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tabel per harta' })).toBeTruthy();
    expect(screen.getAllByRole('columnheader', { name: /^Harta / }).length).toBe(2);
    expect(screen.getAllByText(/ dari /).length).toBeGreaterThan(0);
  });
  it('gharqa terlupakan [SYF]: semua ditahan, dua kemungkinan urutan', () => {
    render(<Hasil kasus={bersamaan('terlupakan')} idSesi="s" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Semua harta ditahan dulu' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /2 kemungkinan urutan/ })).toBeTruthy();
    expect(screen.getAllByText(/wafat lebih dulu/).length).toBeGreaterThan(1);
  });
  it('menunggu: ditunda, kelompok menunggu bayi lahir, tautan bagi sekarang mengubah pilihanJanin', () => {
    const kirim = vi.fn();
    const kasus = dengan(k => ({ ...janin(k), pilihanJanin: 'tunggu' }));
    expect(jalankan(kasus).jenis).toBe('menunggu');
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={kirim} />);
    expect(screen.getByRole('heading', { name: 'Pembagian menunggu bayi lahir' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /^Menunggu bayi lahir/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Bagi sekarang, sebagian ditahan/ }));
    const aksi = kirim.mock.calls.find(([a]) => a.jenis === 'UBAH_KASUS')![0];
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

  const jalankanLangkah = (kasus: Kasus, idSesi: string) => {
    render(<Hasil kasus={kasus} idSesi={idSesi} tujuan="hitung" kirim={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Dari 1 sampai selesai/ }));
    const mode = () => screen.getByRole('dialog', { name: 'Langkah demi langkah' });
    for (let klik = 0; klik < 200 && !within(mode()).queryByRole('button', { name: 'Selesai' }); klik++) fireEvent.click(within(mode()).getByRole('button', { name: /Lanjut/ }));
    return mode();
  };
  it('langkah demi langkah: taqdir (hilang) punya meja kemungkinan dan kotak dengan bagian ditahan', () => {
    const mode = jalankanLangkah(dengan((k, anak) => terapkanKeadaan(k, anak, { jenis: 'hilang' })), 's-ldl-taqdir');
    expect(mode.querySelector('table')).toBeNull();
    expect(mode.querySelector('.kt.ditahan, .kt .ditahan')).toBeTruthy();
    fireEvent.click(within(mode).getByRole('button', { name: 'Selesai' }));
    expect(screen.queryByRole('dialog', { name: 'Langkah demi langkah' })).toBeNull();
  });
  it('langkah demi langkah: gharqa serentak berjalan sampai Selesai', () => {
    const mode = jalankanLangkah(bersamaan('serentak'), 's-ldl-gharqa');
    expect(mode.querySelector('.kotak-harta')).toBeTruthy();
    fireEvent.click(within(mode).getByRole('button', { name: 'Selesai' }));
  });
});
