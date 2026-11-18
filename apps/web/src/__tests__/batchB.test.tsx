// Kritik pemilik putaran 2, batch B: sebutan keturunan/pasangan di babak lanjutan, pesan kekurangan yang spesifik,
// kalimat hamil umum yang menyebut orangnya, dan pohon kecil kisah selebar kartu.
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { buatSebutSimpul } from '../checklist';
import { namaSingkat } from '../keadaanOrang';
import { kasusBaru, rapikanKeadaan, type Kasus, type Kelompok } from '../kasus';
import { daftarBagian } from '../kelompok';
import { KanvasKeluarga } from '../layar/keluarga/KanvasKeluarga';
import { BabakKisah } from '../layar/periksa/BabakKisah';
import { babakKisah } from '../kisah';
import { judulBagian, judulPendek, pesanKekurangan } from '../ringkasanBagian';
import { denganBagianTetapTerisi, tambah } from './fixtures/kanvas';

/** Almarhum lk, 2 istri, 2 anak lk; Anak lk 2 wafat sesudah almarhum, beristri satu dan beranak lk satu; ayah wafat lebih dulu, ibu hidup. */
function skenarioPemilik() {
  let k = kasusBaru('L');
  let r = tambah(k, 'PEWARIS', 'ISTRI'); k = r.kasus; const istri1 = r.id;
  r = tambah(k, 'PEWARIS', 'ISTRI'); k = r.kasus; const istri2 = r.id;
  r = tambah(k, 'PEWARIS', 'ANAK_LK'); k = r.kasus; const anak1 = r.id;
  r = tambah(k, 'PEWARIS', 'ANAK_LK'); k = r.kasus; const anak2 = r.id;
  r = tambah(k, 'PEWARIS', 'AYAH', { statusHidup: 'wafat' }); k = r.kasus; const ayah = r.id;
  r = tambah(k, 'PEWARIS', 'IBU'); k = r.kasus; const ibu = r.id;
  r = tambah(k, anak2, 'ISTRI'); k = r.kasus; const menantu = r.id;
  r = tambah(k, anak2, 'ANAK_LK', { idIbu: menantu }); k = r.kasus; const cucu = r.id;
  return { kasus: { ...k, urutanWafat: [anak2] }, istri1, istri2, anak1, anak2, ayah, ibu, menantu, cucu };
}

describe('sebutan di babak lanjutan (B1, B2)', () => {
  it('cucu disebut menurut hubungannya ke almarhum utama, bukan "Anak laki-laki 1"', () => {
    const { kasus, cucu, anak1 } = skenarioPemilik();
    expect(namaSingkat(kasus, cucu)).toBe('Cucu laki-laki');
    expect(namaSingkat(kasus, anak1)).toBe('Anak laki-laki 1');
  });

  it('dua cucu: bernomor menurut hubungan ke almarhum utama', () => {
    const { kasus, anak2 } = skenarioPemilik();
    const dua = tambah(kasus, anak2, 'ANAK_LK');
    const nama = Object.values(dua.kasus.graf.orang).filter(o => o.idAyah === anak2).map(o => namaSingkat(dua.kasus, o.id));
    expect(nama.sort()).toEqual(['Cucu laki-laki 1', 'Cucu laki-laki 2']);
  });

  it('judul bagian dan tombol lanjut: "Anak dari Anak laki-laki 2"', () => {
    const { kasus, anak2 } = skenarioPemilik();
    const bagian = daftarBagian(kasus).find(b => b.jenis === 'anak' && b.milik === anak2)!;
    expect(judulBagian(kasus, bagian)).toBe('Anak dari Anak laki-laki 2');
    expect(judulPendek(kasus, bagian)).toBe('Anak dari Anak laki-laki 2');
  });

  it('pasangan keturunan disebut "Istri/Suami {sebutan}" di pohon, bukan "Kerabat"', () => {
    const { kasus, menantu } = skenarioPemilik();
    expect(buatSebutSimpul(kasus.graf)(menantu)).toBe('Istri Anak laki-laki 2');
    const dengan = tambah(kasus, 'PEWARIS', 'ANAK_PR');
    const suami = tambah(dengan.kasus, 'PEWARIS', 'ANAK_PR');   // anak perempuan kedua, supaya sebutannya bernomor
    const grafNikah = { ...suami.kasus.graf, orang: { ...suami.kasus.graf.orang, SUAMI_X: { id: 'SUAMI_X', jenisKelamin: 'L' as const, statusHidup: 'hidup' as const, agama: 'islam' as const } },
      pernikahan: [...suami.kasus.graf.pernikahan, { idSuami: 'SUAMI_X', idIstri: dengan.id, status: 'utuh' as const }] };
    expect(buatSebutSimpul(grafNikah)('SUAMI_X')).toBe('Suami Anak perempuan 1');
  });

  it('anak yang sudah wafat tetap disebut hubungannya, bukan "Kerabat"', () => {
    const { kasus, anak1 } = skenarioPemilik();
    const wafat = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [anak1]: { ...kasus.graf.orang[anak1]!, statusHidup: 'wafat' as const } } } };
    expect(buatSebutSimpul(wafat.graf)(anak1)).toBe('Anak laki-laki');
  });
});

let terakhir: Kasus;
function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <KanvasKeluarga kasus={kasus} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} tandaiKurang={false} saatSelesai={() => undefined} />;
}

describe('kartu "Anak dari Anak laki-laki 2" di kanvas (B1, B3, B4)', () => {
  const bukaKartuAnak = (awal: Kasus, anak2: string) => {
    const peta: Record<string, Kelompok[]> = { PEWARIS: ['pasangan', 'anak', 'orangTua', 'kakekNenek', 'halLain'], [anak2]: ['pasangan', 'anak'] };
    const dijawab: Kasus = { ...awal, kelompokDijawab: peta };
    return render(<Uji awal={denganBagianTetapTerisi(dijawab)} />);
  };

  it('baris cucu berlabel "Cucu laki-laki", bukan "Anak laki-laki 1"', () => {
    const { kasus, anak2, cucu } = skenarioPemilik();
    bukaKartuAnak({ ...kasus, belumDiisi: [cucu] }, anak2);
    expect(screen.getByRole('group', { name: 'Cucu laki-laki' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Anak laki-laki 1' })).toBeNull();
  });

  it('pesan kurang menyebut orangnya, bukan "masih ada yang belum diisi"', () => {
    const { kasus, anak2, cucu } = skenarioPemilik();
    const peta: Record<string, Kelompok[]> = { [anak2]: ['pasangan', 'anak'] };
    const belum: Kasus = { ...kasus, belumDiisi: [cucu], kelompokDijawab: peta };
    const bagian = daftarBagian(belum).find(b => b.jenis === 'anak' && b.milik === anak2)!;
    expect(pesanKekurangan(belum, bagian)).toBe('Keadaan Cucu laki-laki belum dipilih.');
    const ya: Kasus = { ...belum, belumDiisi: [], kelompokDijawab: {} };
    expect(pesanKekurangan(ya, bagian)).toBe('Pilihan Ya atau Tidak belum dipilih.');
  });

  it('Lanjut saat cucu belum dipilih menampilkan pesan spesifik di kaki kartu dan menandai barisnya', () => {
    const { kasus, anak2, cucu } = skenarioPemilik();
    bukaKartuAnak({ ...kasus, belumDiisi: [cucu] }, anak2);
    fireEvent.click(screen.getByRole('button', { name: /^Lanjut:/ }));
    expect(screen.getByText('Keadaan Cucu laki-laki belum dipilih.')).toBeTruthy();
    expect(document.querySelector('[aria-invalid="true"]')!.getAttribute('data-baris-orang')).toBe(cucu);
    expect(screen.queryByText('Masih ada yang belum diisi di bagian ini.')).toBeNull();
  });

  it('pertanyaan hamil umum menyebut calon yang belum punya kartu', () => {
    const { kasus, anak2, cucu } = skenarioPemilik();
    bukaKartuAnak({ ...kasus, belumDiisi: [cucu] }, anak2);
    expect(screen.getByText('Waktu Anak laki-laki 2 meninggal, apakah Istri 1 atau Istri 2 sedang hamil?')).toBeTruthy();
  });
});

describe('pohon kecil kisah harta (B5)', () => {
  it('memakai kelas simpul pohon samping, keterangan meninggal sebagai elemen sesudah nama, dan lebar kartu', () => {
    const { kasus, anak2 } = skenarioPemilik();
    const babak = babakKisah(kasus).find(b => b.idMayit === anak2)!;
    const { container } = render(<BabakKisah kasus={kasus} babak={babak} ubah={() => undefined} kirim={() => undefined} terbuka={false} saatBuka={() => undefined} saatTutup={() => undefined} />);
    expect(container.querySelector('.node-orang.orang')).toBeNull();
    const pewaris = container.querySelector('.node-orang.meninggal')!;
    expect(pewaris.querySelector('b')!.textContent).toBe('Almarhum');
    expect(pewaris.querySelector('.peran-node')!.textContent).toBe('meninggal sebelum almarhum');
    expect(container.querySelector(`[data-orang="${anak2}"]`)!.className).toContain('simpul-pemilik');
    expect(container.querySelector('.mini-pohon .pohon')).toBeTruthy();
  });

  it('pasangan keturunan dan cucu di pohon kecil memakai sebutan hubungan', () => {
    const { kasus, anak2, menantu, cucu } = skenarioPemilik();
    const babak = babakKisah(kasus).find(b => b.idMayit === anak2)!;
    const { container } = render(<BabakKisah kasus={kasus} babak={babak} ubah={() => undefined} kirim={() => undefined} terbuka={false} saatBuka={() => undefined} saatTutup={() => undefined} />);
    expect(container.querySelector(`[data-orang="${menantu}"] b`)!.textContent).toBe('Istri Anak laki-laki 2');
    expect(container.querySelector(`[data-orang="${cucu}"] b`)!.textContent).toBe('Cucu laki-laki');
    expect(container.textContent).not.toContain('Kerabat');
  });
});
