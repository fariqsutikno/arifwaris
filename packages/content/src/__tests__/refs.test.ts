import { describe, expect, test } from 'vitest';
import { AYAT, REFS, ayatRefs, dalilFor, findRef, parseAyat, parseNeedsVerification, parseRefs } from '../index.js';

describe('parseRefs — tabel "Dasar dan Rujukan"', () => {
  const md = [
    '# 99. Contoh',
    '| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |',
    '|---|---|---|---|---|',
    '| X99-9 | tabel lain, bukan rujukan | - | - | - |',
    '## Dasar dan Rujukan Bab Ini',
    '| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |',
    '|---|---|---|---|---|',
    '| R99-1 | Bagian suami | Q + RDH | An-Nisa\' 12 · RDH Bab 1 | «فللزوج نصف المال» dan «وربعه» |',
    '| R99-2 | Hikmah | — | Penjelasan fuqaha | Keterangan saja |',
  ].join('\n');

  test('hanya tabel di bagian "Dasar dan Rujukan"; jenis gabungan dipecah; teks «…» diambil', () => {
    expect(parseRefs(md, 99)).toEqual([
      { kode: 'R99-1', bab: 99, claim: 'Bagian suami', jenis: 'Q + RDH', types: ['Q', 'RDH'], source: "An-Nisa' 12 · RDH Bab 1",
        kutipan: '«فللزوج نصف المال» dan «وربعه»', arab: ['فللزوج نصف المال', 'وربعه'] },
      { kode: 'R99-2', bab: 99, claim: 'Hikmah', jenis: '—', types: [], source: 'Penjelasan fuqaha', kutipan: 'Keterangan saja', arab: [] },
    ]);
  });

  test('daftar perlu verifikasi dari bab 17.4', () => {
    const md17 = ['## 17.4 Titik yang Masih Ditandai', '| Kode | Topik | Yang dibutuhkan |', '|---|---|---|',
      '| R01-7 | Ijazah | Raudhah |', '## 17.5 Koreksi', '| R09-9 | bukan 17.4 | x |'].join('\n');
    expect(parseNeedsVerification(md17)).toEqual(['R01-7']);
  });
});

describe('rujukan KB (bab 01–14, 16)', () => {
  test('kode unik dan lengkap', () => {
    const codes = REFS.map(r => r.kode);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBe(129);
  });

  test('status dan jenis', () => {
    expect(findRef('R04-2')).toMatchObject({ bab: 4, types: ['Q', 'RDH'], status: 'verified' });
    expect(findRef('R01-7')).toMatchObject({ status: 'needsVerification' });
    expect(findRef('R09-10')).toMatchObject({ types: ['KH'] });
    expect(findRef('R01-8')).toMatchObject({ types: ['H'], dhaif: true });
  });
});

describe('dalilFor — lapis 3 per baris penjelasan', () => {
  test('dalil dengan label jenis dan teks Arab dari KB', () => {
    const [view] = dalilFor(['R04-2']).entries;
    expect(view).toMatchObject({ kode: 'R04-2', labels: ["Al-Qur'an", 'Raudhah ath-Thalibin (an-Nawawi)'], warnings: [] });
    expect(view!.arab.length).toBeGreaterThan(0);
  });

  test('peringatan: kaidah hisab, perlu verifikasi, dha\'if, bukan dalil', () => {
    const warn = (kode: string) => dalilFor([kode]).entries[0]!.warnings;
    expect(warn('R09-10')).toEqual(["Kaidah hisab (cara menghitung), bukan dalil syar'i."]);
    expect(warn('R01-7')).toEqual(['Dasar ini belum dicek ke teks aslinya (bab 17.4).']);
    expect(warn('R01-8')).toEqual(["Sanad hadits ini dha'if (lemah)."]);
    expect(warn('R05-9')).toEqual(['Keterangan tambahan, bukan dalil.']);
  });

  test('baris tanpa rujukan dan kode yang tidak ada di KB ditandai', () => {
    expect(dalilFor([])).toEqual({ entries: [], notes: ['Langkah ini belum punya rujukan di KB.'] });
    expect(dalilFor(['R99-1'])).toEqual({ entries: [], notes: ['Rujukan R99-1 belum tersedia di KB.'] });
  });
});

describe('teks ayat dari KB bab 1.2', () => {
  test('parseAyat: blok **Surah: N** diikuti kutipan >', () => {
    const md = ['**An-Nisa: 11** (anak)', '> يُوصِيكُمُ اللَّهُ', '', '**Hadits dasar**', '> bukan ayat'].join('\n');
    expect(parseAyat(md)).toEqual([{ surah: 'An-Nisa', ayat: 11, text: 'يُوصِيكُمُ اللَّهُ' }]);
  });

  test('KB memuat An-Nisa\' 11, 12, 176', () => {
    expect(AYAT.map(a => `${a.surah} ${a.ayat}`)).toEqual(['An-Nisa 11', 'An-Nisa 12', 'An-Nisa 176']);
  });

  test('ayatRefs: bagian Al-Qur\'an di kolom Sumber → daftar ayat', () => {
    expect(ayatRefs("An-Nisa' 11, 12, 176 · RDH Bab 9, muqaddimah 1")).toEqual([
      { surah: "An-Nisa'", ayat: 11 }, { surah: "An-Nisa'", ayat: 12 }, { surah: "An-Nisa'", ayat: 176 },
    ]);
    expect(ayatRefs('Al-Anfal 75; Al-Ahzab 6')).toEqual([{ surah: 'Al-Anfal', ayat: 75 }, { surah: 'Al-Ahzab', ayat: 6 }]);
  });

  test('dalilFor menampilkan teks ayat; ayat yang belum ada di KB ditandai', () => {
    const [r042] = dalilFor(['R04-2']).entries;
    expect(r042!.ayat).toEqual([{ label: "An-Nisa' 12", text: AYAT[1]!.text }]);
    const [r141] = dalilFor(['R14-1']).entries;
    expect(r141!.ayat).toEqual([{ label: 'Al-Anfal 75' }, { label: 'Al-Ahzab 6' }]);
    expect(r141!.warnings).toContain('Teks ayat Al-Anfal 75, Al-Ahzab 6 belum ada di KB.');
    expect(dalilFor(['R09-1']).entries[0]!.ayat).toEqual([]);   // bukan dalil Al-Qur'an
  });
});
