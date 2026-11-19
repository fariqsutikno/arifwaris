// Penjelasan per orang (modal): Dasar → Di keluarga ini → Hitungan, dari jejak dan tabel engine.
import { hitung } from '@waris/engine';
import { describe, expect, it } from 'vitest';
import { BAB16_FIXTURES, case01, case12, caseNominal } from '../../../engine/src/__tests__/fixtures/bab16.js';
import { jelaskanOrang } from '../orang.js';
import { keTeksBiasa, type Potongan } from '../segments.js';
import { kamusSnapshot } from './kamus.js';

const teks = (potongan: Potongan[]) => potongan.map(satu => satu.teks).join('');

function penjelasanKelompok(fixture: typeof case01, kunciPeran: string) {
  const hasil = hitung(fixture.input);
  if (hasil.status !== 'OK') throw new Error('kasus tidak OK');
  const id = Object.keys(hasil.statusOrang).find(kunci => {
    const status = hasil.statusOrang[kunci]!;
    return 'peran' in status && status.peran.kunci === kunciPeran;
  })!;
  return jelaskanOrang(hasil, fixture.input.graf, id, { kamus: kamusSnapshot });
}

describe('jelaskanOrang', () => {
  it('C16-01 istri: pertanyaan judul, dasar 1/4 vs 1/8, sebab, rantai angka 1/8 → 3/24', () => {
    const istri = penjelasanKelompok(case01, 'ISTRI')!;
    expect(teks(istri.pertanyaan)).toBe('Kenapa 1/8, bukan 1/4?');
    expect(istri.dasar.map(keTeksBiasa).join(' ')).toContain('1/4 bila');
    expect(istri.keluarga.map(keTeksBiasa).join(' ')).toContain('istri mendapat 1/8, bukan 1/4');
    expect(istri.hitungan.map(baris => `${baris.label}: ${teks(baris.isi)}`)).toEqual([
      'Memotong harta: 8 ÷ 8 = 1 kotak untuk istri',
      'Tashih: 1 × 3 = 3; bagian orang ini 3',
      'Bagian: 3 dari 24 potong',
    ]);
  });

  it('C16-01 anak laki-laki: sisa, bagian akhir 14 dari 24', () => {
    const anak = penjelasanKelompok(case01, 'ANAK_LK')!;
    expect(teks(anak.pertanyaan)).toBe('Kenapa mendapat sisa?');
    expect(anak.hitungan.map(baris => teks(baris.isi)).at(-1)).toBe('14 dari 24 potong');
  });

  it('C16-12 akdariyyah: kakek dan saudari mendapat langkah masing-masing, pertanyaan umum', () => {
    const kakek = penjelasanKelompok(case12, 'KAKEK')!;
    const saudari = penjelasanKelompok(case12, 'SAUDARI_KANDUNG')!;
    expect(teks(kakek.pertanyaan)).toBe('Kenapa bagiannya begini?');
    expect(kakek.keluarga.map(keTeksBiasa).join(' ')).toContain('diberi 1/6');
    expect(saudari.keluarga.map(keTeksBiasa).join(' ')).toContain('diberi 1/2');
    expect(kakek.dasar.map(keTeksBiasa).join(' ')).toContain("al-Akdariyyah");
  });

  it('kasus bernominal: baris rupiah di ujung hitungan', () => {
    const istri = penjelasanKelompok(caseNominal, 'ISTRI')!;
    expect(istri.hitungan.at(-1)!.label).toBe('Rupiah');
    expect(teks(istri.hitungan.at(-1)!.isi)).toContain('3/24 × Rp80.000.000 =');
  });

  it('semua kasus bab 16: tidak pernah melempar; bila ada hasil, pertanyaan dan keluarga terisi', () => {
    for (const fixture of BAB16_FIXTURES) {
      const hasil = hitung(fixture.input);
      if (hasil.status !== 'OK' || hasil.tabel.baris.length === 0) continue;
      for (const id of Object.keys(hasil.statusOrang)) {
        const penjelasan = jelaskanOrang(hasil, fixture.input.graf, id, { kamus: kamusSnapshot });
        if (!penjelasan) continue;
        expect(penjelasan.pertanyaan.length, `${fixture.id} ${id}`).toBeGreaterThan(0);
        expect(penjelasan.keluarga.length, `${fixture.id} ${id}`).toBeGreaterThan(0);
      }
    }
  });
});
