import { describe, expect, it } from 'vitest';
import type { KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris, tambahKerabatLain } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { jalankan } from '../jalankan';
import { adaTidakPas, pecahanTeks, persenTeks, ringkas } from '../hasil/ringkasan';

const buat = (kunci: KunciAhliWaris[], tirkah: Kasus['tirkah']): Kasus => {
  const kasus = kasusBaru('L');
  return { ...kasus, tirkah, graf: kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasus.graf) };
};
// Kasus prototipe (angka sudah dicek lewat engine): harta 110 jt − 2 − 3 − 5 = 100 jt.
const prototipe = () => buat(['ISTRI', 'IBU', 'AYAH', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG'],
  { kotor: 110_000_000n, tajhiz: 2_000_000n, hutang: 3_000_000n, wasiat: 5_000_000n });

describe('ringkas', () => {
  const kasus = prototipe();
  const hasil = ringkas(kasus, jalankan(kasus));

  it('penerima dengan saham dari tashih 72 dan nominal engine', () => {
    expect(hasil.penyebut).toBe(72n);
    const ibu = hasil.penerima.find(orang => orang.kunci === 'IBU')!;
    expect(ibu).toMatchObject({ saham: 12n, nominal: 16_666_666n, kelompok: 'leluhur', nama: 'Ibu' });
    expect(hasil.penerima.map(orang => orang.saham).reduce((a, b) => a + b, 0n)).toBe(72n);
  });

  it('yang terhalang beserta penghalangnya', () => {
    expect(hasil.terhalang).toHaveLength(1);
    expect(hasil.terhalang[0]!.alasan).toMatch(/Anak laki-laki/);
    expect(hasil.terhalang[0]!.alasan).toMatch(/Ayah/);
  });

  it('rincian harta dari jejak TIRKAH', () => {
    expect(hasil.tirkah).toMatchObject({ kotor: 110_000_000n, wasiatDipakai: 5_000_000n, bersih: 100_000_000n });
  });

  it('tentang kasus: kelas, asal masalah dan nisbahnya, tashih', () => {
    expect(hasil.tentang.kelas).toBe('adilah');
    expect(hasil.tentang.ashl).toMatchObject({ nilai: 24n, hubungan: 'tawafuq' });
    expect(hasil.tentang.tashih).toMatchObject({ dari: 24n, jadi: 72n, hubungan: 'tabayun' });
  });
});

it('pecahan dua bentuk dan persen', () => {
  expect(pecahanTeks(12n, 72n, 'sederhana')).toBe('1/6');
  expect(pecahanTeks(12n, 72n, 'sama')).toBe('12/72');
  expect(persenTeks(12n, 72n)).toBe('16,67%');
  expect(persenTeks(9n, 72n)).toBe('12,5%');
});

it('ada tidak pas: hanya bila pembagian dengan pembulatan Rp 1 menyisakan sisa', () => {
  expect(adaTidakPas(prototipe())).toBe(true);
  expect(adaTidakPas(buat(['ISTRI', 'ANAK_LK', 'ANAK_PR'], { kotor: 24_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n }))).toBe(false);
  // Angka tidak kelipatan ribuan tapi habis dibagi tanpa sisa: tidak perlu ditawari pembulatan.
  expect(adaTidakPas(buat(['ISTRI', 'ANAK_LK'], { kotor: 8_000_008n, tajhiz: 0n, hutang: 0n, wasiat: 0n }))).toBe(false);
});

it('kerabat dzawil arham yang dicatat muncul sebagai tidak mewarisi, dengan alasannya', () => {
  const kasus = buat(['ANAK_LK'], { kotor: 1_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n });
  const denganKakek = { ...kasus, graf: tambahKerabatLain(kasus.graf, 'PEWARIS', 'KAKEK_DARI_IBU') };
  const hasil = ringkas(denganKakek, jalankan(denganKakek));
  expect(hasil.bukanAhliWaris).toHaveLength(1);
  expect(hasil.bukanAhliWaris[0]).toMatchObject({ nama: 'Kakek dari pihak ibu (ayahnya ibu pewaris)' });
  expect(hasil.bukanAhliWaris[0]!.alasan).toMatch(/dzawil arham/);
});
