import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Hasil } from '../layar/Hasil';
import { anggotaBagian, buatBagian } from '../kelompok';
import { kasusBaru, type Kasus, type Kelompok } from '../kasus';
import type { Aksi } from '../keadaan';
import { tambah } from './fixtures/kanvas';

function keponakanWafat() {
  const istri = tambah(kasusBaru('L'), 'PEWARIS', 'ISTRI');
  const { kasus, id } = tambah(istri.kasus, 'PEWARIS', 'KEPONAKAN_KANDUNG', { nama: 'Joko', statusHidup: 'wafat' });
  return { awal: { ...kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak', 'orangTua', 'saudara', 'jauh'] as Kelompok[] } }, joko: id };
}

let kasusTerakhir: Kasus;
function Uji({ awal, tujuan = 'hitung' }: { awal: Kasus; tujuan?: 'hitung' | 'belajar' }) {
  const [kasus, setKasus] = useState(awal);
  kasusTerakhir = kasus;
  const kirim = (aksi: Aksi) => { if (aksi.jenis === 'UBAH_KASUS') setKasus(aksi.ubah); };
  return <Hasil kasus={kasus} idSesi="s" tujuan={tujuan} kirim={kirim} />;
}
const bukaLayarPenuh = () => fireEvent.click(screen.getByRole('button', { name: 'Buka pohon keluarga layar penuh' }));

describe('jalan pintas tambah anak di pohon layar penuh', () => {
  it('tombol + muncul untuk keponakan wafat di mode hitung', () => {
    render(<Uji awal={keponakanWafat().awal} />);
    bukaLayarPenuh();
    expect(screen.getByRole('button', { name: 'Tambah anak Joko' })).toBeTruthy();
  });

  it('tanpa mode hitung (hanya baca) tombol tidak ada', () => {
    const { awal } = keponakanWafat();
    render(<Hasil kasus={awal} idSesi="s" tujuan="hitung" kirim={() => {}} hanyaBaca />);
    bukaLayarPenuh();
    expect(screen.queryByRole('button', { name: 'Tambah anak Joko' })).toBeNull();
  });

  it('Simpan tanpa kelamin memberi tahu; dengan kelamin menambah anak ke bagian "Anak Joko"', () => {
    const { awal, joko } = keponakanWafat();
    render(<Uji awal={awal} />);
    bukaLayarPenuh();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah anak Joko' }));
    const form = screen.getByRole('dialog', { name: 'Tambah anak Joko' });
    fireEvent.change(within(form).getByLabelText('Nama'), { target: { value: 'Doni' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Simpan' }));
    expect(within(form).getByText('Pilih laki-laki atau perempuan.')).toBeTruthy();
    fireEvent.click(within(form).getByRole('radio', { name: 'Laki-laki' }));
    fireEvent.click(within(form).getByRole('button', { name: 'Simpan' }));
    const anggota = anggotaBagian(kasusTerakhir, buatBagian('anak', joko));
    expect(anggota.map(id => kasusTerakhir.graf.orang[id]!.nama)).toEqual(['Doni']);
    expect(screen.queryByRole('dialog', { name: 'Tambah anak Joko' })).toBeNull();
  });
});
