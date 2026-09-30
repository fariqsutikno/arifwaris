// Narasi dzawil arham: sisa keluar hanya menyebut pasangan, dan orang yang terhalang mani' tetap disebut.
import { hitungDzawilArham } from '@waris/engine';
import { expect, test } from 'vitest';
import { DZAWIL_ARHAM_FIXTURES } from '../../../engine/src/__tests__/fixtures/dzawilArham.js';
import { jelaskan, keTeksBiasa } from '../index.js';
import { kamusSnapshot } from './kamus.js';

function teksCerita(id: string, bahasa: 'id' | 'ar' = 'id'): string[] {
  const { input } = DZAWIL_ARHAM_FIXTURES.find(fixture => fixture.id === id)!;
  const hasil = hitungDzawilArham(input);
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  return jelaskan(hasil, input.graf, { bahasa, gaya: 'cerita', kamus: kamusSnapshot }).daftarBab.flatMap(bab => bab.daftarBaris.map(keTeksBiasa));
}

test('DA-08: baris sisa keluar hanya menyebut suami sebagai penerima fardh, bukan kerabat', () => {
  const [baris] = teksCerita('DA-08');
  expect(baris).toMatch(/^Dari 2 bagian, suami mendapat 1\./);
  expect(baris).not.toMatch(/kerabat mendapat/);
  expect(teksCerita('DA-08', 'ar')[0]).not.toMatch(/قريب/);
});

test('DA-14: dzawil arham yang terhalang mani (beda agama) disebut beserta sebabnya', () => {
  const teks = teksCerita('DA-14');
  expect(teks.filter(baris => baris.includes('berbeda agama'))).toHaveLength(1);
  expect(teks.join('\n')).toMatch(/Kerabat pertama tidak mendapat warisan karena berbeda agama/);
  expect(teksCerita('DA-14', 'ar').join('\n')).toContain('اختلاف الدين');
});
