// Tahap 6c — piutang pewaris pada ahli waris (bab 11.4 [R11-4]): contoh KB, tiga keadaan, uji negatif, property.
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { hitung } from '../../pipeline.js';
import type { HasilEngine } from '../../types.js';
import { hitungPiutangAhliWaris, type PenghutangAhliWaris } from '../piutangAhliWaris.js';
import { ANAK, keluarga } from './helpers.js';

type Ok = Extract<HasilEngine, { status: 'OK' }>;

// Empat anak lk (S1..S4), tirkah bersih = barang + piutang; tiap anak mendapat seperempat.
function empatAnak(barang: bigint, piutang: bigint, satuan = 1n, ruleset: 'syafii' | 'hanbali' = 'syafii'): Ok {
  const masukan = keluarga({ S1: { jenisKelamin: 'L', ...ANAK }, S2: { jenisKelamin: 'L', ...ANAK }, S3: { jenisKelamin: 'L', ...ANAK }, S4: { jenisKelamin: 'L', ...ANAK } });
  const hasil = hitung({ ...masukan, ruleset, tirkah: { kotor: barang + piutang, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan } });
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  return hasil;
}
const utang = (hutangKePewaris: bigint, persetujuan?: PenghutangAhliWaris['persetujuan'] | 'kosong'): PenghutangAhliWaris[] =>
  [{ idOrang: 'S1', hutangKePewaris, ...(persetujuan === 'kosong' ? {} : { persetujuan: persetujuan ?? 'setuju' }) }];
function ok(hasil: ReturnType<typeof hitungPiutangAhliWaris>) {
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  return hasil;
}

describe('hitungPiutangAhliWaris', () => {
  test('contoh KB 11.4: barang 12 + piutang 8, S=5, H=8 → S<H: membayar 3, tidak menerima; lain 5 masing-masing', () => {
    const hasil = ok(hitungPiutangAhliWaris(empatAnak(12n, 8n), 12n, 8n, utang(8n)));
    expect(hasil.perOrang['S1']).toEqual({ bagian: 5n, hutangDipotong: 5n, uangDiterima: 0n, membayar: 3n });
    for (const id of ['S2', 'S3', 'S4']) expect(hasil.perOrang[id]!.uangDiterima).toBe(5n);
    expect(hasil.totalPembayaran).toBe(3n);
    expect(hasil.jejak).toMatchObject([{ jenis: 'PIUTANG_AHLI_WARIS', keadaan: 'kurang', refs: ['R11-4'] }]);
  });

  test('S = H: tidak menerima, tidak membayar; barang dibagi atas tiga lain (barang 12 + piutang 8, H=5)', () => {
    // piutang 8 pada dua penghutang? Satu penghutang saja: barang 15 + piutang 5 → S=5, H=5.
    const hasil = ok(hitungPiutangAhliWaris(empatAnak(15n, 5n), 15n, 5n, utang(5n)));
    expect(hasil.perOrang['S1']).toEqual({ bagian: 5n, hutangDipotong: 5n, uangDiterima: 0n, membayar: 0n });
    expect(hasil.perOrang['S2']!.uangDiterima).toBe(5n);
    expect(hasil.jejak).toMatchObject([{ keadaan: 'sama' }]);
  });

  test('S > H: bagian dikurangi H, sisa S−H dari barang (barang 16 + piutang 4, S=5, H=4 → terima 1)', () => {
    const hasil = ok(hitungPiutangAhliWaris(empatAnak(16n, 4n), 16n, 4n, utang(4n)));
    expect(hasil.perOrang['S1']).toEqual({ bagian: 5n, hutangDipotong: 4n, uangDiterima: 1n, membayar: 0n });
    expect(hasil.totalPembayaran).toBe(0n);
    expect(hasil.jejak).toMatchObject([{ keadaan: 'lebih' }]);
  });

  test('menolak mengakui / pailit: dipotong juga (sah sepihak)', () => {
    const hasil = hitungPiutangAhliWaris(empatAnak(12n, 8n), 12n, 8n, utang(8n, 'menolakAtauPailit'));
    expect(hasil.status).toBe('OK');
  });

  test('uji negatif: persetujuan kosong → PERLU_INPUT "persetujuanPiutang"', () => {
    const hasil = hitungPiutangAhliWaris(empatAnak(12n, 8n), 12n, 8n, utang(8n, 'kosong'));
    expect(hasil.status).toBe('PERLU_INPUT');
    if (hasil.status === 'PERLU_INPUT') expect(hasil.pertanyaan[0]).toMatchObject({ idOrang: 'S1', isian: 'persetujuanPiutang', alasan: 'Penghutang setuju dipotong?' });
  });

  test('uji negatif: mengakui, mampu, tidak setuju → TIDAK_DIDUKUNG [R11-4]', () => {
    const hasil = hitungPiutangAhliWaris(empatAnak(12n, 8n), 12n, 8n, utang(8n, 'mengakuiMampuTidakSetuju'));
    expect(hasil).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['R11-4'] });
  });

  test('uji negatif: ruleset non-[SYF] → TIDAK_DIDUKUNG (bab 18.4)', () => {
    const hasil = hitungPiutangAhliWaris(empatAnak(12n, 8n, 1n, 'hanbali'), 12n, 8n, utang(8n));
    expect(hasil.status).toBe('TIDAK_DIDUKUNG');
  });

  test('uji negatif: hutang negatif, orang bukan ahli waris, Σ hutang ≠ piutang → PERLU_INPUT', () => {
    const dasar = empatAnak(12n, 8n);
    expect(hitungPiutangAhliWaris(dasar, 12n, 8n, utang(-1n)).status).toBe('PERLU_INPUT');
    expect(hitungPiutangAhliWaris(dasar, 12n, 8n, [{ idOrang: 'ASING', hutangKePewaris: 8n, persetujuan: 'setuju' }]).status).toBe('PERLU_INPUT');
    expect(hitungPiutangAhliWaris(dasar, 12n, 8n, utang(7n)).status).toBe('PERLU_INPUT');
  });

  test('barang + piutang ≠ tirkah bersih hasil hitung → throw (invarian)', () => {
    expect(() => hitungPiutangAhliWaris(empatAnak(12n, 8n), 13n, 8n, utang(8n))).toThrow(/Invarian piutang/);
  });

  test('property: Σ bagian akhir (uang diterima + hutang dipotong) + sisaLainnya = tirkah awal; Σ uang = barang + pembayaran', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 5000 }), fc.integer({ min: 1, max: 5000 }), fc.constantFrom(1n, 100n),
      (barang, piutang, satuan) => {
        const hasil = empatAnak(BigInt(barang), BigInt(piutang), satuan);
        const keluaran = hitungPiutangAhliWaris(hasil, BigInt(barang), BigInt(piutang), utang(BigInt(piutang)));
        if (keluaran.status !== 'OK') return false;
        const baris = Object.values(keluaran.perOrang);
        const bagianAkhir = baris.reduce((a, b) => a + b.uangDiterima + b.hutangDipotong, 0n);
        const uang = baris.reduce((a, b) => a + b.uangDiterima, 0n);
        return bagianAkhir + keluaran.sisaLainnya === BigInt(barang + piutang) && uang + keluaran.sisaLainnya === BigInt(barang) + keluaran.totalPembayaran;
      },
    ));
  });
});
