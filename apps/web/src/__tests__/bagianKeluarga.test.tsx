import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { kasusBaru, rapikanKeadaan, type Kasus, type Kelompok } from '../kasus';
import { KanvasKeluarga } from '../layar/keluarga/KanvasKeluarga';
import { denganBagianTetapTerisi, keluargaBudi, keluargaKarto } from './fixtures/kanvas';

let terakhir: Kasus;
function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <KanvasKeluarga kasus={kasus} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} tandaiKurang={false} saatSelesai={() => undefined} />;
}
const dijawab = (kasus: Kasus, peta: Record<string, Kelompok[]>): Kasus => ({ ...kasus, kelompokDijawab: peta });
const judulAktif = () => screen.getByRole('heading', { level: 2 }).textContent;
const klik = (nama: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nama }));
const radio = (nama: string) => fireEvent.click(screen.getByRole('radio', { name: nama }));

describe('isi bagian keluarga (spec kanvas 5.2)', () => {
  it('pasangan laki-laki: Berapa istri? maksimal 4; perempuan: satu suami', () => {
    const { unmount } = render(<Uji awal={kasusBaru('L')} />);
    radio('Ya');
    expect(screen.getByText('Berapa istri?')).toBeTruthy();
    for (let i = 0; i < 4; i++) klik('Tambah Istri');
    expect(document.querySelectorAll('[data-baris-orang]')).toHaveLength(4);
    klik('Tambah Istri');
    expect(document.querySelectorAll('[data-baris-orang]')).toHaveLength(4);
    expect(screen.getByText(/maksimal 4/)).toBeTruthy();
    unmount();
    render(<Uji awal={kasusBaru('P')} />);
    radio('Ya');
    expect(screen.queryByText('Berapa istri?')).toBeNull();
    expect(document.querySelectorAll('[data-baris-orang]')).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'Suami' })).toBeTruthy();
  });

  it('anak: penghitung Laki-laki dan Perempuan; PertanyaanHamil muncul', () => {
    render(<Uji awal={dijawab(kasusBaru('L'), { PEWARIS: ['pasangan'] })} />);
    expect(judulAktif()).toBe('Almarhum punya anak? Hitung juga yang sudah wafat.');
    radio('Ya');
    expect(screen.getByText('Laki-laki')).toBeTruthy();
    expect(screen.getByText('Perempuan')).toBeTruthy();
    klik('Tambah Anak laki-laki');
    expect(screen.getByRole('group', { name: 'Anak laki-laki 1' })).toBeTruthy();
    expect(document.querySelector('[aria-labelledby]')).toBeTruthy();
    expect(screen.getByText(/hamil|kandungan/i)).toBeTruthy();
  });

  it('orang tua: baris tetap Ayah dan Ibu tanpa Ya/Tidak; bagian dijawab setelah keduanya punya keadaan', () => {
    render(<Uji awal={dijawab(kasusBaru('L'), { PEWARIS: ['pasangan', 'anak'] })} />);
    expect(judulAktif()).toBe('Orang tua almarhum');
    expect(screen.queryByRole('radio', { name: 'Tidak' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Ayah' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Ibu' })).toBeTruthy();
    fireEvent.click(within(screen.getByRole('group', { name: 'Ayah' })).getByRole('radio', { name: 'Masih hidup' }));
    expect(screen.queryByText('Bagian ini sudah lengkap.')).toBeNull();
    fireEvent.click(within(screen.getByRole('group', { name: 'Ibu' })).getByRole('radio', { name: 'Masih hidup' }));
    expect(screen.getByText('Bagian ini sudah lengkap.')).toBeTruthy();
    expect(terakhir.kelompokDijawab?.PEWARIS).toContain('orangTua');
  });

  it('baris tetap tidak punya Hapus: posisinya selalu ada, keadaannya yang diubah (review P3)', () => {
    render(<Uji awal={dijawab(kasusBaru('L'), { PEWARIS: ['pasangan', 'anak'] })} />);
    fireEvent.click(within(screen.getByRole('group', { name: 'Ayah' })).getByRole('radio', { name: 'Masih hidup' }));
    expect(screen.queryByRole('button', { name: /^Hapus / })).toBeNull();
  });

  it('kakek-nenek hanya baris yang berpengaruh (ayah wafat → kakek dari ayah)', () => {
    const { kasus } = keluargaBudi();
    const awal = dijawab(kasus, { PEWARIS: ['pasangan', 'anak', 'orangTua'] });
    render(<Uji awal={awal} />);
    expect(judulAktif()).toMatch(/kakek atau neneknya/);
    expect(screen.getByRole('group', { name: 'Kakek (dari ayah)' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: /Nenek/i })).toBeNull();
  });

  const detailsDengan = (judul: string) => screen.getByText(judul).closest('details')!;
  const keAnakPewarisKarto = () => {
    const { kasus, ...isi } = keluargaKarto();
    render(<Uji awal={dijawab(kasus, { PEWARIS: ['pasangan', 'anak'] })} />);
    klik('Ubah Anak almarhum');
    return isi;
  };

  it('saudara tidak dirender bila ada anak laki-laki; Details "Kenapa kakak atau adik … tidak ditanyakan?" ada', () => {
    keAnakPewarisKarto();
    expect(judulAktif()).toBe('Almarhum punya anak? Hitung juga yang sudah wafat.');
    expect(document.querySelector('.langkah-bagian')!.textContent).not.toContain('Kakak atau adik');
    expect(screen.getByText('Kenapa kakak atau adik almarhum tidak ditanyakan?')).toBeTruthy();
  });

  it('Tetap isi kerabat lain menambahkan bagian saudara', () => {
    keAnakPewarisKarto();
    fireEvent.click(within(detailsDengan('Kenapa kakak atau adik almarhum tidak ditanyakan?')).getByRole('button', { name: 'Tetap isi kerabat lain' }));
    expect(document.querySelector('.langkah-bagian')!.textContent).toContain('Kakak atau adik');
  });

  it('anak dari orang yang wafat sebelum tampil Details dan Tetap isi membuka anak:{Y}', () => {
    const { slamet } = keAnakPewarisKarto();
    const judul = 'Kenapa anak-anak Slamet tidak ditanyakan?';
    fireEvent.click(within(detailsDengan(judul)).getByRole('button', { name: 'Tetap isi kerabat lain' }));
    expect(slamet).toBeTruthy();
    expect(document.querySelector('.langkah-bagian')!.textContent).toContain('Anak Slamet');
  });

  it('anak bersama: Ya semuanya mencatat dijawab; Tidak semua menampilkan centang anak', () => {
    const { kasus, sumi, rina } = keluargaKarto();
    render(<Uji awal={denganBagianTetapTerisi(dijawab(kasus, { PEWARIS: ['pasangan', 'anak', 'orangTua', 'kakekNenek', 'halLain'] }))} />);
    expect(judulAktif()).toBe('Apakah Slamet, Budi, Rina juga anak Mbah Sumi?');
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    radio('Ya, semuanya');
    expect(terakhir.kelompokDijawab?.[sumi]).toContain('anakBersama');
    radio('Tidak semua');
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Rina' }));
    expect(terakhir.graf.orang[rina]!.idIbu).toBeUndefined();
  });

  it('Tambah dengan nama hubungan membuka DialogTambahHubungan dan menambah orang bukan ahli waris tanpa mengubah bagian yang sudah lengkap', () => {
    keAnakPewarisKarto();
    fireEvent.click(within(detailsDengan('Kenapa kakak atau adik almarhum tidak ditanyakan?')).getByRole('button', { name: 'Tetap isi kerabat lain' }));
    const lengkapSebelum = () => [...document.querySelectorAll('.langkah-bagian li.selesai')].map(li => li.textContent);
    const sebelum = lengkapSebelum();
    fireEvent.click(within(detailsDengan('Kenapa kakak atau adik almarhum tidak ditanyakan?')).getByRole('button', { name: 'Tambah dengan nama hubungan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mertua' }));
    const dialog = screen.getByRole('alertdialog');
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'Pak Haji' } });
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Laki-laki' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }));
    expect(Object.values(terakhir.graf.orang).some(orang => orang.nama === 'Pak Haji')).toBe(true);
    expect(lengkapSebelum()).toEqual(sebelum);
  });
});
