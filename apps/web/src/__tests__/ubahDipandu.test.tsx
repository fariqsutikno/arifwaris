import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { keadaanOrang } from '../keadaanOrang';
import type { Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { UbahDipandu } from '../layar/periksa/UbahDipandu';
import { keluargaKarto } from './fixtures/kanvas';

function Papan({ awal, kirim = () => {}, bukaBabak = () => {}, bukaPeristiwa = () => {} }:
  { awal: Kasus; kirim?: (a: Aksi) => void; bukaBabak?: (id: string) => void; bukaPeristiwa?: () => void }) {
  const [kasus, setKasus] = useState(awal);
  return <UbahDipandu kasus={kasus} ubah={f => setKasus(f)} kirim={kirim} saatBukaBabak={bukaBabak} saatBukaPeristiwa={bukaPeristiwa} />;
}
const mulai = () => fireEvent.click(screen.getByRole('button', { name: /Ubah sesuatu/ }));

describe('UbahDipandu', () => {
  it('langkah 1 empat pilihan; Keadaan → pilih orang → jawab di tempat menyimpan', () => {
    const { kasus, rina } = keluargaKarto();
    let terbaru = kasus;
    const Pembungkus = () => { const [k, setK] = useState(kasus); terbaru = k;
      return <UbahDipandu kasus={k} ubah={f => setK(f)} kirim={() => {}} saatBukaBabak={() => {}} saatBukaPeristiwa={() => {}} />; };
    render(<Pembungkus />);
    mulai();
    expect(screen.getByText('Langkah 1 dari 2 · Apa yang mau diubah?')).toBeTruthy();
    expect(['Keadaan seseorang', 'Tahun atau urutan meninggal', 'Anggota keluarga', 'Peristiwa'].every(n => screen.getByRole('button', { name: new RegExp(n) }))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Keadaan seseorang/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Rina' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Belum tahu' }));
    expect(keadaanOrang(terbaru, rina)).toBe('belumTahu');
  });

  it('Tahun atau urutan → pilih orang → saatBukaBabak dipanggil', () => {
    const { kasus, budi } = keluargaKarto();
    const buka = vi.fn();
    render(<Papan awal={kasus} bukaBabak={buka} />);
    mulai();
    fireEvent.click(screen.getByRole('button', { name: /Tahun atau urutan meninggal/ }));
    fireEvent.click(screen.getByRole('button', { name: /Budi/ }));
    expect(buka).toHaveBeenCalledWith(budi);
  });

  it('Anggota keluarga → pilih bagian → KE_LANGKAH 3 dengan fokusBagian dan dariPeriksa', () => {
    const { kasus } = keluargaKarto();
    const kirim = vi.fn();
    render(<Papan awal={kasus} kirim={kirim} />);
    mulai();
    fireEvent.click(screen.getByRole('button', { name: /Anggota keluarga/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /anak/i })[0]!);
    expect(kirim).toHaveBeenCalledWith(expect.objectContaining({ jenis: 'KE_LANGKAH', langkah: 3, dariPeriksa: true, fokusBagian: expect.any(String) }));
  });

  it('Peristiwa → saatBukaPeristiwa', () => {
    const buka = vi.fn();
    render(<Papan awal={keluargaKarto().kasus} bukaPeristiwa={buka} />);
    mulai();
    fireEvent.click(screen.getByRole('button', { name: /^Peristiwa/ }));
    expect(buka).toHaveBeenCalled();
  });

  it('Pilih yang lain kembali ke langkah 1; Tutup menutup panel', () => {
    render(<Papan awal={keluargaKarto().kasus} />);
    mulai();
    fireEvent.click(screen.getByRole('button', { name: /Keadaan seseorang/ }));
    fireEvent.click(screen.getByRole('button', { name: /Pilih yang lain/ }));
    expect(screen.getByText('Langkah 1 dari 2 · Apa yang mau diubah?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tutup/ }));
    expect(screen.getByRole('button', { name: /Ubah sesuatu/ })).toBeTruthy();
  });
});
