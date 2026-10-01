import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { DialogKeadaan } from '../layar/keadaan/DialogKeadaan';

function keluarga(jumlahAnak = 1) {
  let kasus: Kasus = kasusBaru('L');
  for (let i = 0; i < jumlahAnak; i++) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  const anak = Object.values(kasus.graf.orang).filter(o => o.idAyah === 'PEWARIS').map(o => o.id);
  return { kasus, anak };
}
const pilih = (nama: RegExp) => fireEvent.click(screen.getByRole('radio', { name: nama }));
const lanjut = () => fireEvent.click(screen.getByRole('button', { name: /Lanjut|Simpan/ }));

describe('DialogKeadaan', () => {
  it('S1: sudah wafat → sesudah → belum dibagi → tersimpan di urutan', () => {
    const { kasus, anak } = keluarga();
    const selesai = vi.fn();
    render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut();
    pilih(/Sesudah/); lanjut();
    expect(screen.getByText(/sudah dihitung bagian masing-masing/)).toBeTruthy();
    pilih(/Belum dibagi/); lanjut();
    expect(selesai.mock.calls[0]![0].urutanWafat).toEqual([anak[0]]);
  });

  it('S5 dan S30', () => {
    const { kasus, anak } = keluarga();
    const selesai = vi.fn();
    const { unmount } = render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Sebelum/); lanjut();
    expect(selesai.mock.calls[0]![0].graf.orang[anak[0]!].statusHidup).toBe('wafat');
    unmount();
    render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Sesudah/); lanjut(); pilih(/Sudah dibagi/); lanjut();
    expect(selesai.mock.calls[1]![0].wafatSesudahDibagi).toEqual([anak[0]]);
  });

  it('dua almarhum: menanyakan siapa lebih dulu', () => {
    const { kasus, anak } = keluarga(2);
    const selesai = vi.fn();
    const pertama = { ...kasus, urutanWafat: [anak[0]!] };
    render(<DialogKeadaan kasus={pertama} idOrang={anak[1]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Sesudah/); lanjut(); pilih(/Belum dibagi/); lanjut();
    expect(screen.getByText(/Siapa yang wafat lebih dulu/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('radio')[0]!);   // pilihan pertama = orang baru ini
    lanjut();
    expect(selesai.mock.calls[0]![0].urutanWafat).toEqual([anak[1], anak[0]]);
  });

  it('dua almarhum, urutan tidak diketahui: tidak ditolak; urutan sementara disusun dan dicatat sebagai belum pasti', () => {
    const { kasus, anak } = keluarga(2);
    const selesai = vi.fn();
    render(<DialogKeadaan kasus={{ ...kasus, urutanWafat: [anak[0]!] }} idOrang={anak[1]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Sesudah/); lanjut(); pilih(/Belum dibagi/); lanjut();
    expect(screen.getByRole('radio', { name: 'Tidak tahu siapa yang duluan' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Wafat bersamaan' })).toBeTruthy();
    pilih(/Tidak tahu siapa yang duluan/); lanjut();
    expect(screen.queryByText(/belum bisa dihitung otomatis/)).toBeNull();
    const hasil = selesai.mock.calls[0]![0] as Kasus;
    expect(hasil.urutanWafat).toEqual([anak[0], anak[1]]);
    expect(hasil.belumPasti).toEqual([{ jenis: 'urutan', a: anak[1], b: anak[0] }]);
  });

  it('dua almarhum, bersamaan: tetap belum didukung (celah E1), tanpa menyimpan apa pun', () => {
    const { kasus, anak } = keluarga(2);
    const selesai = vi.fn();
    render(<DialogKeadaan kasus={{ ...kasus, urutanWafat: [anak[0]!] }} idOrang={anak[1]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Sesudah/); lanjut(); pilih(/Belum dibagi/); lanjut();
    pilih(/Wafat bersamaan/); lanjut();
    expect(screen.getByText(/belum bisa dihitung otomatis/)).toBeTruthy();
    expect(selesai).not.toHaveBeenCalled();
  });

  it('bersamaan: dua pertanyaan lalu harta', () => {
    const { kasus, anak } = keluarga();
    const selesai = vi.fn();
    render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Bersamaan/); lanjut();
    pilih(/Tidak pasti/); lanjut();
    pilih(/Tidak pernah ada yang tahu/); lanjut();
    lanjut();   // harta boleh kosong
    expect(selesai.mock.calls[0]![0].gharqa).toMatchObject({ keadaan: 'tidakDiketahui' });
  });

  it('menolak bersamaan bila sudah ada urutan wafat lain', () => {
    const { kasus, anak } = keluarga(2);
    const selesai = vi.fn();
    render(<DialogKeadaan kasus={{ ...kasus, urutanWafat: [anak[0]!] }} idOrang={anak[1]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Bersamaan/); lanjut();
    expect(screen.getByText(/belum bisa dihitung otomatis/)).toBeTruthy();
    expect(selesai).not.toHaveBeenCalled();
  });

  it('keadaan lain: khuntsa hanya untuk hubungan yang mungkin', () => {
    const { kasus, anak } = keluarga();
    render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={() => {}} saatBatal={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Keadaan lain/ }));
    expect(screen.getByRole('radio', { name: /Kelaminnya belum bisa ditentukan/ })).toBeTruthy();
  });

  it('batal tidak mengubah apa pun', () => {
    const { kasus, anak } = keluarga();
    const batal = vi.fn(); const selesai = vi.fn();
    render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={selesai} saatBatal={batal} />);
    pilih(/Sudah wafat/); lanjut();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(batal).toHaveBeenCalled(); expect(selesai).not.toHaveBeenCalled();
  });
});
