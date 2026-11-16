import { describe, expect, it } from 'vitest';
import { kasusBaru, type Kasus } from '../kasus';
import { daftarBagian } from '../kelompok';
import { judulBagian, judulPendek, pertanyaanBagian, ringkasanBagian } from '../ringkasanBagian';
import { keluargaKarto } from './fixtures/kanvas';

const ambil = (kasus: Kasus, id: string) => daftarBagian(kasus).find(b => b.id === id)!;

describe('teks bagian (mockup v5)', () => {
  it('judul dan judul pendek menyebut pemilik bila bukan almarhum pertama', () => {
    const { kasus, budi } = keluargaKarto();
    const dengan: Kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, PEWARIS: { ...kasus.graf.orang.PEWARIS!, nama: 'Mbah Karto' } } } };
    expect(judulBagian(dengan, ambil(dengan, 'pasangan:PEWARIS'))).toBe('Istri Mbah Karto');
    expect(judulBagian(dengan, ambil(dengan, 'orangTua:PEWARIS'))).toBe('Orang tua Mbah Karto');
    expect(judulPendek(dengan, ambil(dengan, 'anak:PEWARIS'))).toBe('Anak');
    expect(judulPendek(dengan, ambil(dengan, `anak:${budi}`))).toBe('Anak Budi');
    expect(judulBagian(dengan, ambil(dengan, 'urutan'))).toBe('Urutan meninggal');
    expect(judulBagian(dengan, ambil(dengan, 'kamu'))).toBe('Kamu');
  });

  it('pertanyaan menyesuaikan jenis kelamin pemilik', () => {
    const laki = kasusBaru('L');
    const perempuan = kasusBaru('P');
    expect(pertanyaanBagian(laki, ambil(laki, 'pasangan:PEWARIS'))).toMatch(/punya istri\?$/);
    expect(pertanyaanBagian(perempuan, ambil(perempuan, 'pasangan:PEWARIS'))).toMatch(/punya suami\?$/);
    expect(pertanyaanBagian(laki, ambil(laki, 'anak:PEWARIS'))).toBe('Almarhum punya anak, termasuk yang sudah meninggal?');
  });
});

describe('ringkasanBagian', () => {
  it('bagian tanpa anggota yang sudah dijawab: "Tidak ada"', () => {
    const kasus: Kasus = { ...kasusBaru('L'), kelompokDijawab: { PEWARIS: ['anak'] } };
    expect(ringkasanBagian(kasus, ambil(kasus, 'anak:PEWARIS'))).toBe('Tidak ada');
  });

  it('anggota disebut dengan keadaannya: wafat (dengan tahun bila ada), belum tahu', () => {
    const { kasus, slamet, rina } = keluargaKarto();
    expect(ringkasanBagian(kasus, ambil(kasus, 'anak:PEWARIS'))).toBe('Slamet (meninggal), Budi, Rina');
    const bertahun: Kasus = { ...kasus, waktu: { [slamet]: { wafat: { tahun: 1998, kiraKira: false } } },
      graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [rina]: { ...kasus.graf.orang[rina]!, statusHidup: 'tidakDiketahui' } } } };
    expect(ringkasanBagian(bertahun, ambil(bertahun, 'anak:PEWARIS'))).toBe('Slamet (meninggal 1998), Budi, Rina (belum tahu)');
  });

  it('kamu dan urutan', () => {
    const { kasus, sumi, budi, rina } = keluargaKarto();
    expect(ringkasanBagian({ ...kasus, saya: rina }, ambil(kasus, 'kamu'))).toBe('Saya Rina');
    expect(ringkasanBagian({ ...kasus, saya: null }, ambil(kasus, 'kamu'))).toBe('Mengisi untuk orang lain');
    expect(ringkasanBagian(kasus, ambil(kasus, 'urutan'))).toBe('Mbah Sumi meninggal sebelum');
    expect(ringkasanBagian({ ...kasus, belumPasti: [{ jenis: 'urutan', a: sumi, b: budi, bersamaan: false }] }, ambil(kasus, 'urutan')))
      .toBe('Belum tahu, ditanyakan di Periksa');
  });

  it('anak bersama: sama dengan anak-anak pewaris bila semuanya anak pemilik cabang', () => {
    const { kasus, sumi } = keluargaKarto();
    expect(ringkasanBagian(kasus, ambil(kasus, `anakBersama:${sumi}`))).toBe('Sama dengan anak-anak almarhum');
  });
});
