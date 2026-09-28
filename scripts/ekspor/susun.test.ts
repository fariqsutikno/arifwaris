// scripts/ekspor/susun.test.ts
import { expect, test } from 'vitest';
import type { KontenTerbit } from '@waris/data';
import { keMarkdown, susunSnapshot, tulisBerkasKb } from './susun';

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

const rujukan = (kode: string, urutan: number, klaim: string): KontenTerbit => ({
  entriId: kode, jenis: 'rujukan', slug: kode, urutan, revisiId: `r-${kode}`, refs: [], versiTerbit: 1,
  isi: { kode, bab: Number(kode.slice(1, 3)), klaim, jenis: 'RDH', sumber: 's', kutipan: 'k' },
});
const babKb = ['# 99', '## Dasar dan Rujukan Bab Ini', '| Kode | Klaim | Jenis | Sumber | Kutipan |', '|---|---|---|---|---|', '| R99-1 | lama | RDH | s | k |', ''].join('\n');

test('berkas KB: tabel rujukan ditulis ulang menurut urutan; tanpa rujukan di database tidak menulis apa pun', () => {
  const hasil = tulisBerkasKb([rujukan('R99-2', 20, 'dua'), rujukan('R99-1', 10, 'satu')], { '99_contoh.md': babKb, 'README.md': 'x' });
  expect(Object.keys(hasil)).toEqual(['99_contoh.md']);
  expect(hasil['99_contoh.md']!.split('\n').slice(4, 6)).toEqual(['| R99-1 | satu | RDH | s | k |', '| R99-2 | dua | RDH | s | k |']);
  expect(tulisBerkasKb([faq], { '99_contoh.md': babKb })).toEqual({});
  expect(tulisBerkasKb([rujukan('R99-1', 10, 'lama')], { '99_contoh.md': babKb })).toEqual({});
  expect(susunSnapshot(1, [rujukan('R99-1', 10, 'x'), faq], []).konten.map(b => b.jenis)).toEqual(['faq']);
});
