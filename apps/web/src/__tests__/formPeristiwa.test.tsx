import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { Kasus } from '../kasus';
import { rapikanKeadaan } from '../kasus';
import { pengurangKeadaan, type KeadaanAplikasi } from '../keadaan';
import { KisahHarta } from '../layar/periksa/KisahHarta';
import { keluargaKarto } from './fixtures/kanvas';

let terbaru: Kasus;
function Papan({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terbaru = kasus;
  return <KisahHarta kasus={kasus} ubah={f => setKasus(f)} kirim={() => {}} />;
}
const buka = () => fireEvent.click(screen.getByRole('button', { name: /Tambah peristiwa: lahir/ }));
const pilih = (label: string, nilai: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: nilai } });
const opsi = (label: string) => within(screen.getByLabelText(label)).getAllByRole('option').map(o => (o as HTMLOptionElement).value);

describe('Tambah peristiwa', () => {
  it('form: jenis, siapa, kapan; Simpan menambah peristiwa dan baris tampil di bawah babak yang dipilih', () => {
    const { kasus, andi, sumi } = keluargaKarto();
    render(<Papan awal={kasus} />);
    buka();
    pilih('Peristiwa apa?', 'lahir'); pilih('Siapa?', andi); pilih('Terjadi sesudah siapa wafat?', sumi);
    fireEvent.click(screen.getByRole('button', { name: 'Simpan peristiwa' }));
    expect(terbaru.peristiwa).toEqual([{ jenis: 'lahir', idOrang: andi, sesudahWafat: sumi }]);
    const babakSumi = screen.getByRole('article', { name: /Mbah Sumi wafat/ });
    expect(within(babakSumi).queryByText(/Andi lahir/)).toBeNull();
    expect(screen.getByText('Andi lahir, sesudah Mbah Sumi wafat.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Simpan peristiwa' })).toBeNull();
  });

  it('nikah/cerai menanyakan pasangan; pilihan pasangan tidak memuat orang itu sendiri', () => {
    const { kasus, andi } = keluargaKarto();
    render(<Papan awal={kasus} />);
    buka();
    expect(screen.queryByLabelText('Dengan siapa?')).toBeNull();
    pilih('Peristiwa apa?', 'nikah'); pilih('Siapa?', andi);
    expect(opsi('Dengan siapa?')).not.toContain(andi);
    pilih('Peristiwa apa?', 'cerai');
    expect(screen.getByLabelText('Dengan siapa?')).toBeTruthy();
  });

  it('pilihan "sesudah siapa wafat" tidak memuat salah satu dari pasangan itu untuk nikah', () => {
    const { kasus, sumi, budi, rina } = keluargaKarto();
    render(<Papan awal={kasus} />);
    buka();
    pilih('Peristiwa apa?', 'nikah'); pilih('Siapa?', budi); pilih('Dengan siapa?', sumi);
    expect(opsi('Terjadi sesudah siapa wafat?')).toEqual(['PEWARIS']);
    pilih('Peristiwa apa?', 'lahir'); pilih('Siapa?', rina);
    expect(opsi('Terjadi sesudah siapa wafat?')).toEqual(['PEWARIS', sumi, budi]);
  });

  it('peristiwa lahir mengisi dikandungSetelahWafat lewat reducer', () => {
    const { kasus, andi, sumi } = keluargaKarto();
    const awal: KeadaanAplikasi = { layar: 'wizard', langkah: 4, kasus, tujuan: null, jenisKasus: 'nyata' };
    const sesudah = pengurangKeadaan(awal, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, peristiwa: [{ jenis: 'lahir', idOrang: andi, sesudahWafat: sumi }] }) });
    expect(sesudah.kasus!.dikandungSetelahWafat).toEqual({ [andi]: sumi });
  });

  it('peristiwa orang terhapus hilang', () => {
    const { kasus, andi, sumi } = keluargaKarto();
    const denganPeristiwa: Kasus = { ...kasus, peristiwa: [{ jenis: 'lahir', idOrang: andi, sesudahWafat: sumi }] };
    const { [andi]: _hapus, ...sisa } = denganPeristiwa.graf.orang;
    const rapi = rapikanKeadaan({ ...denganPeristiwa, graf: { ...denganPeristiwa.graf, orang: sisa } });
    render(<Papan awal={rapi} />);
    expect(screen.queryByText(/lahir, sesudah/)).toBeNull();
  });

  it('Batal menutup tanpa perubahan', () => {
    const { kasus } = keluargaKarto();
    render(<Papan awal={kasus} />);
    buka();
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(screen.queryByRole('button', { name: 'Simpan peristiwa' })).toBeNull();
    expect(terbaru.peristiwa).toBeUndefined();
  });
});
