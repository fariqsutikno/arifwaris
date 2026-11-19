// Linimasa dzawil arham: tidak melempar untuk semua fixture, pola tanya → dasar → tanzil → bagi → turun → hasil.
import { hitungDzawilArham } from '@waris/engine';
import { describe, expect, it } from 'vitest';
import { DZAWIL_ARHAM_FIXTURES } from '../../../engine/src/__tests__/fixtures/dzawilArham.js';
import { susunLinimasa } from '../linimasa.js';
import { keTeksBiasa } from '../segments.js';
import { kamusSnapshot } from './kamus.js';

function linimasaDari(id: string) {
  const { input } = DZAWIL_ARHAM_FIXTURES.find(fixture => fixture.id === id)!;
  const hasil = hitungDzawilArham(input);
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  return susunLinimasa(hasil, input.graf, { kamus: kamusSnapshot });
}

describe('linimasa dzawil arham', () => {
  it('semua fixture OK: tahap dzawilArham dibuka pertanyaan lalu dasar, ditutup tahap hasil beringkasan', () => {
    let jumlah = 0;
    for (const fixture of DZAWIL_ARHAM_FIXTURES) {
      const hasil = hitungDzawilArham(fixture.input);
      if (hasil.status !== 'OK') continue;
      jumlah++;
      const linimasa = susunLinimasa(hasil, fixture.input.graf, { kamus: kamusSnapshot });
      const tahap = linimasa.tahap.find(satu => satu.id === 'dzawilArham')!;
      expect(tahap, fixture.id).toBeDefined();
      expect(tahap.langkah[0]!.jenis, fixture.id).toBe('tanya');
      expect(tahap.langkah.some(langkah => langkah.jenis === 'dasar'), fixture.id).toBe(true);
      expect(linimasa.tahap.at(-1)!.id, fixture.id).toBe('hasil');
      expect(linimasa.tabel).toEqual([]);
    }
    expect(jumlah).toBeGreaterThan(5);
  });

  it('DA-01 (khalah dan \'ammah): tanzil, bagi di antara perantara, lalu diturunkan', () => {
    const tahap = linimasaDari('DA-01').tahap.find(satu => satu.id === 'dzawilArham')!;
    const teks = tahap.langkah.map(langkah => keTeksBiasa(langkah.narasi)).join(' ');
    expect(teks).toContain('ditempatkan sebagai ibu, naik 1 tingkat');
    expect(teks).toContain('Para perantara dihitung seperti ahli waris biasa: ibu 1 dan ayah 2. Jumlahnya 3 bagian');
    expect(teks).toContain('Bagian ayah, 2 dari 3, diteruskan kepada kerabat kedua');
    expect(teks).toContain('kerabat yang bukan penerima bagian pasti');
    expect(tahap.langkah.map(langkah => langkah.jenis)).toContain('jembatan');
  });
});
