import { describe, expect, test } from 'vitest';
import {
  bangunBank, BATAS_KUNCI_HADIR, buatKodeSoal, hashKode, labelUtama, periksaKasusBiasa, PORSI_TINGKAT, sapuKasusBiasa,
  saringKandidat, soalDariKode, terapkanKuota, type BarisBank,
} from '../index.js';

const CONTOH_BATAS = 3000;
// Dua sapuan berpotongan: awal (kunci sedikit) dan sampel dari ruang lebih dalam lewat batas lebih besar.
const sapuan = () => [...sapuKasusBiasa(CONTOH_BATAS)];

describe('penyapu biasa', () => {
  test('deterministik: dua sapuan menghasilkan daftar kode identik', () => {
    expect(sapuan().map(buatKodeSoal)).toEqual(sapuan().map(buatKodeSoal));
  });

  test('semua kasus sah, tanpa duplikat kode, dalam batas kunci hadir', () => {
    const daftar = sapuan();
    const kode = daftar.map(buatKodeSoal);
    expect(new Set(kode).size).toBe(kode.length);
    for (const kasus of daftar) {
      expect(periksaKasusBiasa(kasus)).toBeNull();
      expect(Object.keys(kasus.ahliWaris).length).toBeLessThanOrEqual(BATAS_KUNCI_HADIR);
    }
  });

  test('batas memotong tepat dan mencakup kedua pewaris pada sapuan penuh', () => {
    expect([...sapuKasusBiasa(7)]).toHaveLength(7);
    const pewaris = new Set<string>();
    for (const kasus of sapuKasusBiasa(5000)) pewaris.add(kasus.pewaris);
    expect(pewaris).toEqual(new Set(['L', 'P']));
  });
});

describe('saring dan kuota', () => {
  const { lolos, kandidat, dibuang } = saringKandidat(sapuan());

  test('semua kode lolos soalDariKode OK dan hitungan dibuang konsisten', () => {
    expect(lolos.length + Object.values(dibuang).reduce((a, b) => a + b, 0)).toBe(kandidat);
    for (const baris of lolos) {
      const soal = soalDariKode(baris.kode);
      expect(soal.ok).toBe(true);
      if (soal.ok) expect(soal.label).toEqual(baris.label);
    }
  });

  test('label utama mengikuti prioritas', () => {
    expect(labelUtama(['aul', 'aul:6>7', 'tashih', 'inkisar:1', 'bernama:muaddah'])).toBe('bernama:muaddah');
    expect(labelUtama(['aul', 'aul:6>7', 'tashih'])).toBe('aul:6>7');
    expect(labelUtama(['tashih', 'inkisar:2'])).toBe('inkisar:2');
    expect(labelUtama(['radd', 'hajb:SAUDARA_SEIBU'])).toBe('radd');
    expect(labelUtama(['hajb:SAUDARA_SEIBU', 'jumlahAhliWaris:3'])).toBe('hajb:SAUDARA_SEIBU');
    expect(labelUtama(['jumlahAhliWaris:2'])).toBe('dasar');
  });

  test('kuota deterministik, tanpa duplikat, tidak melampaui target, subhimpunan lolos', () => {
    const target = 400;
    const a = terapkanKuota(lolos, target);
    const b = terapkanKuota([...lolos].reverse(), target);
    expect(a.map(baris => baris.kode)).toEqual(b.map(baris => baris.kode));
    expect(new Set(a.map(baris => baris.kode)).size).toBe(a.length);
    expect(a.length).toBeLessThanOrEqual(target);
    const kodeLolos = new Set(lolos.map(baris => baris.kode));
    expect(a.every(baris => kodeLolos.has(baris.kode))).toBe(true);
  });

  test('kuota per kelompok tidak melampaui jatah dan porsi tingkat tidak melebihi target', () => {
    const target = 400;
    const terpilih = terapkanKuota(lolos, target);
    for (const tingkat of ['dasar', 'menengah', 'sulit'] as const) {
      const jumlah = terpilih.filter(baris => baris.tingkat === tingkat).length;
      expect(jumlah).toBeLessThanOrEqual(Math.floor(target * PORSI_TINGKAT[tingkat]));
    }
  });

  test('porsi mendekati target pada stok cukup (water-filling dan bagi rata antar label)', () => {
    const stok = (tingkat: BarisBank['tingkat'], labelUtamaBaris: string, jumlah: number): BarisBank[] =>
      Array.from({ length: jumlah }, (_, urutan) => ({
        kode: `${tingkat}-${labelUtamaBaris}-${urutan}`, label: [], tingkat, modul: [3], jumlahAhliWaris: 1, labelUtama: labelUtamaBaris, keluarga: 'biasa',
      }));
    const bahan = [
      ...stok('dasar', 'a', 500), ...stok('dasar', 'b', 10), ...stok('menengah', 'c', 900), ...stok('sulit', 'd', 900),
    ];
    const terpilih = terapkanKuota(bahan, 1000);
    const per = (tingkat: string) => terpilih.filter(baris => baris.tingkat === tingkat).length;
    expect([per('dasar'), per('menengah'), per('sulit')]).toEqual([400, 400, 200]);
    // jatah label kecil yang tak terpakai (b hanya 10) pindah ke a
    expect(terpilih.filter(baris => baris.labelUtama === 'b')).toHaveLength(10);
    expect(terpilih.filter(baris => baris.labelUtama === 'a')).toHaveLength(390);
  });

  test('pemilihan tersebar, bukan N pertama urutan sapuan', () => {
    const dasar = lolos.filter(baris => baris.tingkat === 'dasar');
    const terpilih = new Set(terapkanKuota(lolos, 100).filter(baris => baris.tingkat === 'dasar').map(baris => baris.kode));
    const urutanPertama = dasar.slice(0, terpilih.size).map(baris => baris.kode);
    expect(urutanPertama.filter(kode => terpilih.has(kode)).length).toBeLessThan(terpilih.size);
  });

  test('hashKode stabil', () => {
    expect(hashKode('G1-B-2000000002000040')).toBe(hashKode('G1-B-2000000002000040'));
    expect(hashKode('a')).not.toBe(hashKode('b'));
  });
});

describe('pembangun mengalir', () => {
  test.each([[400], [100_000]])('hasil sama dengan saringKandidat + terapkanKuota (target %i)', target => {
    const mengalir = bangunBank(sapuan, target);
    const { lolos, kandidat, dibuang } = saringKandidat(sapuan());
    const acuan = terapkanKuota(lolos, target);
    expect(mengalir.kandidat).toBe(kandidat);
    expect(mengalir.jumlahLolos).toBe(lolos.length);
    expect(mengalir.dibuang).toEqual(dibuang);
    expect(mengalir.terpilih).toEqual(acuan);
  });
});
