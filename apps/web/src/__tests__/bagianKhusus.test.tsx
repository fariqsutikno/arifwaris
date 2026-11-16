import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { IdOrang } from '@waris/engine';
import { aturTahunWafat } from '../silsilah';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { bagianLengkap, daftarBagian, type Bagian } from '../kelompok';
import { BagianHalLain } from '../layar/keluarga/BagianHalLain';
import { BagianKamu } from '../layar/keluarga/BagianKamu';
import { BagianUrutan } from '../layar/keluarga/BagianUrutan';
import { BarisOrang } from '../layar/keluarga/BarisOrang';
import { keluargaKarto } from './fixtures/kanvas';

let terakhir: Kasus;
type Komponen = typeof BagianUrutan;
function Uji({ awal, bagian, Isi }: { awal: Kasus; bagian: Bagian; Isi: Komponen }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <Isi kasus={kasus} bagian={bagian} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} />;
}
const ambil = (kasus: Kasus, id: string) => daftarBagian(kasus).find(b => b.id === id)!;
const radio = (nama: string | RegExp) => fireEvent.click(screen.getByRole('radio', { name: nama }));

/** Karto: Budi wafat 1998, tahun Mbah Sumi kosong, jadi urutan keduanya harus ditanyakan. */
const kartoBertahun = () => {
  const { kasus, budi, sumi } = keluargaKarto();
  return { kasus: aturTahunWafat(kasus, budi, { tahun: 1998, kiraKira: false }), budi, sumi };
};

describe('BagianUrutan (spec kanvas 5.6)', () => {
  it('pertanyaan berpasangan menyebut A dan B; Sebelum menyelesaikan dan bagian lengkap', () => {
    const { kasus } = kartoBertahun();
    render(<Uji awal={kasus} bagian={ambil(kasus, 'urutan')} Isi={BagianUrutan} />);
    expect(screen.getByText('Mbah Sumi wafat sebelum atau sesudah Budi?')).toBeTruthy();
    expect(bagianLengkap(kasus, ambil(kasus, 'urutan'))).toBe(false);
    radio('Sebelum Budi');
    expect(bagianLengkap(terakhir, ambil(terakhir, 'urutan'))).toBe(true);
    expect(terakhir.urutanWafat[0]).toBe(kasus.urutanWafat[0]);
  });

  it('Belum tahu menyimpan belumPasti dan bagian selesai', () => {
    const { kasus } = kartoBertahun();
    render(<Uji awal={kasus} bagian={ambil(kasus, 'urutan')} Isi={BagianUrutan} />);
    radio(/^Belum tahu/);
    expect(terakhir.belumPasti?.some(hal => hal.jenis === 'urutan')).toBe(true);
    expect(bagianLengkap(terakhir, ambil(terakhir, 'urutan'))).toBe(true);
  });

  it('Bersamaan membuka dialog serentak (alur gharqa; antar-almarhum lanjutan ditolak dengan jujur)', () => {
    const { kasus } = kartoBertahun();
    render(<Uji awal={kasus} bagian={ambil(kasus, 'urutan')} Isi={BagianUrutan} />);
    radio('Bersamaan, atau tidak tahu');
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Keadaan ini belum bisa dihitung otomatis')).toBeTruthy();
  });

  it('tidak dirender bila semua bertahun atau tidak berpengaruh', () => {
    const { kasus, sumi } = kartoBertahun();
    const semua = aturTahunWafat(kasus, sumi, { tahun: 1990, kiraKira: false });
    const { container } = render(<Uji awal={semua} bagian={ambil(semua, 'urutan')} Isi={BagianUrutan} />);
    expect(container.textContent).toBe('');
  });
});

describe('BagianKamu (spec kanvas 5.8)', () => {
  it('tanpa bawaan; memilih orang menaruh lencana kamu di barisnya; "orang lain" menyimpan null dan bagian lengkap', () => {
    const { kasus, rina } = keluargaKarto();
    const kamu = ambil(kasus, 'kamu');
    function Papan() {
      const [k, setK] = useState(kasus);
      terakhir = k;
      return <><BagianKamu kasus={k} bagian={kamu} ubah={f => setK(x => rapikanKeadaan(f(x)))} />
        <BarisOrang kasus={k} id={rina} kunci="ANAK_PR" milik="PEWARIS" ubah={() => undefined} tandaiKurang={false} disorot={false} /></>;
    }
    const { container } = render(<Papan />);
    const pilihanKamu = () => within(container.querySelector<HTMLElement>('.pilihan-urutan')!);
    expect(pilihanKamu().queryAllByRole('radio', { checked: true })).toHaveLength(0);
    expect(bagianLengkap(kasus, kamu)).toBe(false);
    radio('Saya anak perempuan almarhum (Rina)');
    expect(terakhir.saya).toBe(rina);
    expect(within(document.getElementById(`baris-${rina}`)!).getByText('kamu')).toBeTruthy();
    radio('Saya bukan ahli waris, hanya membantu mengisi');
    expect(terakhir.saya).toBeNull();
    expect(bagianLengkap(terakhir, kamu)).toBe(true);
  });
});

describe('BagianHalLain (spec kanvas 5.2)', () => {
  it('tanpa bawaan; Tidak membersihkan; Ada menampilkan centang hanya anggota keluarga milik', () => {
    const { kasus, rina, dewi } = keluargaKarto();
    const bagian = ambil(kasus, 'halLain:PEWARIS');
    render(<Uji awal={kasus} bagian={bagian} Isi={BagianHalLain} />);
    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(0);
    radio('Ada');
    expect(screen.getAllByRole('checkbox', { name: 'Rina' })).toHaveLength(2);   // satu per kelompok
    expect(screen.queryByRole('checkbox', { name: 'Dewi' })).toBeNull();           // menantu bukan keluarga milik
    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Rina' })[0]!);
    expect(terakhir.graf.orang[rina]!.agama).toBe('nonIslam');
    radio('Tidak ada');
    expect(terakhir.graf.orang[rina]!.agama).toBe('islam');
    expect(terakhir.kelompokDijawab?.PEWARIS).toContain('halLain');
    expect(dewi).toBeTruthy();
  });
});
