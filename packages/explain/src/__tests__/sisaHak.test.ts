// Jejak sisa hak (bab 11.3 [KH]): narasi lewat diksi `narasi.sisa_hak.*`, tanpa kode rujukan di teks pengguna.
import { hitung, hitungSisaHak } from '@waris/engine';
import { describe, expect, test } from 'vitest';
import { case01 } from '../../../engine/src/__tests__/fixtures/bab16.js';
import { babSisaHak, type LangkahSisaHak } from '../sisaHak.js';
import { kamusSnapshot } from './kamus.js';
import { jelaskan, keTeksBiasa, susunLinimasa } from '../index.js';
import type { Penyusun } from '../segments.js';
import type { BabPenjelasan } from '../narasi.js';

const penyusun: Penyusun = { kamus: kamusSnapshot, bahasa: 'id' };
const JUTA = 1_000_000n;
const sebutTes = (id: string) => ({ jenis: 'teks' as const, teks: id });
const teksBab = (bab: BabPenjelasan) => [bab.judul, ...bab.daftarBaris.map(keTeksBiasa)];

// Langkah jejak SISA_HAK buatan: H1 kelebihan (menerima 30 jt, bagiannya 20 jt), M1 belum menerima.
function langkahBuatan(parsial: Partial<LangkahSisaHak> = {}): LangkahSisaHak {
  return {
    tahap: 'sisaHak', refs: ['R11-5', 'KH'], jenis: 'SISA_HAK',
    perOrang: {
      H1: { nominal: 20n * JUTA, sudahDiterima: 30n * JUTA, sisaHak: -10n * JUTA },
      M1: { nominal: 40n * JUTA, sudahDiterima: 0n, sisaHak: 40n * JUTA },
    },
    sisaKas: 90n * JUTA, sisaLainnya: 0n, kelebihan: ['H1'], kasKurang: false,
    ...parsial,
  } as LangkahSisaHak;
}

describe('babSisaHak — narasi jejak sisa_hak', () => {
  test('judul dan satu ringkasan bila tidak ada kelebihan', () => {
    const bab = babSisaHak(langkahBuatan({ kelebihan: [] }), sebutTes, penyusun);
    expect(teksBab(bab)).toEqual([
      'Sisa bagian setelah penerimaan di muka',
      'Sebagian harta sudah diterima di muka, jadi bagian tiap orang dihitung dari sisanya. Harta yang masih dibagi: Rp90.000.000.',
    ]);
  });

  test('satu baris per kelebihan, disebut dengan nama dan angka rupiah', () => {
    const bab = babSisaHak(langkahBuatan(), sebutTes, penyusun);
    expect(bab.daftarBaris.map(keTeksBiasa)[1]).toBe(
      'H1 sudah menerima Rp30.000.000, lebih dari bagiannya Rp20.000.000. Kelebihan ini perlu disepakati keluarga atau ditanyakan ke pengadilan.',
    );
    expect(bab.daftarBaris[1]!.subjek).toEqual(['H1']);
  });

  test('kas kurang menambah satu baris penjelasan di akhir', () => {
    const teks = babSisaHak(langkahBuatan({ kasKurang: true }), sebutTes, penyusun).daftarBaris.map(keTeksBiasa);
    expect(teks).toHaveLength(3);
    expect(teks[2]).toBe(
      'Harta yang tersisa tidak cukup untuk semua sisa bagian karena ada kelebihan di atas. Perlu disepakati keluarga atau ditanyakan ke pengadilan.',
    );
  });

  test('tiap baris membawa refs R11-5 dan KH', () => {
    const bab = babSisaHak(langkahBuatan({ kasKurang: true }), sebutTes, penyusun);
    expect(bab.daftarBaris.every(baris => baris.refs.join() === 'R11-5,KH')).toBe(true);
  });
});

describe('jelaskan() dan linimasa memuat bab sisa hak hanya bila jejak SISA_HAK ada', () => {
  const input = { ...case01.input, tirkah: { kotor: 100n * JUTA, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  const dasar = hitung(input);
  if (dasar.status !== 'OK') throw new Error(dasar.status);
  const [idPenerima] = Object.keys(dasar.tabel.baris[0]!.perOrang);
  const sisa = hitungSisaHak(dasar, 100n * JUTA, { [idPenerima!]: 1n * JUTA });
  if (sisa.status !== 'OK') throw new Error(sisa.status);
  const denganJejak = { ...dasar, jejak: [...dasar.jejak, ...sisa.jejak] };
  const judul = 'Sisa bagian setelah penerimaan di muka';
  const judulBab = (hasil: typeof dasar, gaya: 'cerita' | 'ringkas') =>
    jelaskan(hasil, input.graf, { gaya, kamus: kamusSnapshot }).daftarBab.map(bab => bab.judul);

  test.each(['cerita', 'ringkas'] as const)('gaya %s: bab ada bila ada jejak, tidak ada bila tidak', gaya => {
    expect(judulBab(denganJejak, gaya).some(teks => teks.endsWith(judul))).toBe(true);
    expect(judulBab(dasar, gaya).some(teks => teks.endsWith(judul))).toBe(false);
  });

  test('sisa hak muncul sebelum hasil akhir', () => {
    const urutan = judulBab(denganJejak, 'cerita');
    expect(urutan.findIndex(teks => teks.endsWith(judul))).toBe(urutan.length - 2);
  });

  test('linimasa: tahap sisaHak ada bila ada jejak, tidak ada bila tidak', () => {
    const idTahap = (hasil: typeof dasar) => susunLinimasa(hasil, input.graf, { kamus: kamusSnapshot }).tahap.map(tahap => tahap.id);
    expect(idTahap(denganJejak)).toContain('sisaHak');
    expect(idTahap(dasar)).not.toContain('sisaHak');
  });
});
