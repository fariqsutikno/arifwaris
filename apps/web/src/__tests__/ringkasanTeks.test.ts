import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { jalankan } from '../jalankan';
import { kasusBaru, type Kasus } from '../kasus';
import { terapkanKeadaan } from '../keadaanOrang';
import { ringkas } from '../hasil/ringkasan';
import { susunTeksRingkasan } from '../hasil/ringkasanTeks';

const dengan = (kunci: Parameters<typeof tambahAhliWaris>[2][], tirkah: Kasus['tirkah']): Kasus => {
  const kasus = kasusBaru('L');
  return { ...kasus, tirkah, graf: kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasus.graf) };
};
const teks = (kasus: Kasus, sembunyiNominal = false) =>
  susunTeksRingkasan(ringkas(kasus, jalankan(kasus)), kasus, { sembunyiNominal, bentuk: 'sederhana' });

const biasa = () => dengan(['ISTRI', 'ANAK_LK', 'ANAK_PR'], { kotor: 240_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n });

describe('teks ringkasan untuk grup keluarga', () => {
  it('kasus biasa: judul, harta, satu baris tiap penerima, penutup', () => {
    expect(teks(biasa())).toMatchInlineSnapshot(`
      "Pembagian waris almarhum (madzhab Syafi'i)
      Harta yang dibagi: Rp 240.000.000

      • Istri: 1/8 = Rp 30.000.000
      • Anak laki-laki: 7/12 = Rp 140.000.000
      • Anak perempuan: 7/24 = Rp 70.000.000

      Alasan tiap bagian: buka tautan hasil. Mohon dicek ulang ke ustadz."
    `);
  });
  it('nominal tersembunyi: tanpa rupiah sama sekali', () => {
    expect(teks(biasa(), true)).toMatchInlineSnapshot(`
      "Pembagian waris almarhum (madzhab Syafi'i)
      Nominal disembunyikan

      • Istri: 1/8
      • Anak laki-laki: 7/12
      • Anak perempuan: 7/24

      Alasan tiap bagian: buka tautan hasil. Mohon dicek ulang ke ustadz."
    `);
  });
  it('kasus ditahan: baris Ditahan sesudah daftar penerima', () => {
    let kasus = dengan(['ISTRI', 'ANAK_LK', 'ANAK_LK'], { kotor: 1_200_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n });
    const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    kasus = terapkanKeadaan(kasus, anak, { jenis: 'hilang' });
    expect(teks(kasus)).toMatchInlineSnapshot(`
      "Pembagian waris almarhum (madzhab Syafi'i)
      Harta yang dibagi: Rp 1.200.000

      • Istri: 1/8 = Rp 150.000
      • Anak laki-laki 2: 7/16 = Rp 525.000
      Ditahan: Rp 525.000

      Alasan tiap bagian: buka tautan hasil. Mohon dicek ulang ke ustadz."
    `);
  });
});
