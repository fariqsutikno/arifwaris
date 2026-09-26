// scripts/ekspor/susun.test.ts
import { expect, test } from 'vitest';
import type { KontenTerbit } from '@waris/data';
import { keMarkdown, susunSnapshot } from './susun';

const faq: KontenTerbit = { entriId: 'e1', jenis: 'faq', slug: 'b', urutan: 1, revisiId: 'r1', refs: ['R01-1'], versiTerbit: 1,
  isi: { id: 'b', kelompok: 'Fikih', pertanyaan: 'Apa itu tirkah?', jawaban: [{ jenis: 'paragraf', isi: [{ jenis: 'teks', teks: 'Harta.' }] }] } };
const soal: KontenTerbit = { entriId: 'e2', jenis: 'soal_hitung', slug: 'H-01', urutan: 0, revisiId: 'r2', refs: ['R09-7'], versiTerbit: 2,
  isi: { kode: 'H-01', bab: 4, tingkat: 'dasar', judul: 'J', topik: 't', sumber: 's',
    kasus: { pewaris: 'L', ahliWaris: ['ISTRI'], harta: 120_000_000n, harapan: { saham: { ISTRI: 1n }, ashlAkhir: 4n } } } };

test('snapshot: urut jenis, urutan, slug; bigint jadi string digit', () => {
  const snap = susunSnapshot(7, [soal, faq], [{ kunci: 'u.b', halaman: 'u', id: 'B', ar: null, versiTerbit: 1 }, { kunci: 'u.a', halaman: 'u', id: 'A', ar: null, versiTerbit: 1 }]);
  expect(snap.versi).toBe(7);
  expect(snap.konten.map(b => b.jenis)).toEqual(['faq', 'soal_hitung']);
  expect((snap.konten[1]!.isi as { kasus: { harta: unknown } }).kasus.harta).toBe('120000000');
  expect(snap.diksi.map(d => d.kunci)).toEqual(['u.a', 'u.b']);
});

test('markdown: satu berkas per jenis, blok ditulis Markdown, refs tercantum', () => {
  const md = keMarkdown([faq, soal]);
  expect(Object.keys(md).sort()).toEqual(['faq.md', 'soal_hitung.md']);
  expect(md['faq.md']).toContain('## Apa itu tirkah?');
  expect(md['faq.md']).toContain('Harta.');
  expect(md['faq.md']).toContain('R01-1');
  expect(md['soal_hitung.md']).toContain('"harta": "120000000"');
});
