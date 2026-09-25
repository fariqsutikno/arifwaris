import { describe, expect, test } from 'vitest';
import { DAFTAR_MODUL, DAFTAR_PELAJARAN, bacaBlok, bacaPelajaran, bacaPotongan, cariIstilah, cariRujukan, semuaPotongan } from '../index.js';

describe('parser materi', () => {
  test('potongan sebaris: tebal, miring, istilah, rujukan', () => {
    expect(bacaPotongan('Istri **1/8** *(tsumun)* [[fardh|bagian]] [R04-2].')).toEqual([
      { jenis: 'teks', teks: 'Istri ' }, { jenis: 'tebal', teks: '1/8' }, { jenis: 'teks', teks: ' ' },
      { jenis: 'miring', teks: '(tsumun)' }, { jenis: 'teks', teks: ' ' }, { jenis: 'istilah', id: 'fardh', teks: 'bagian' },
      { jenis: 'teks', teks: ' ' }, { jenis: 'rujukan', kode: 'R04-2' }, { jenis: 'teks', teks: '.' },
    ]);
  });

  test('blok: judul, paragraf bersambung, daftar, catatan, tabel, kasus', () => {
    const blok = bacaBlok('uji', [
      '## Judul', 'baris satu', 'baris dua', '', '1. a', '   sambungan', '2. b', '> catat', '> lanjut',
      '| A | B |', '|---|---|', '| 1 | 2 |', '```kasus', 'pewaris: L', 'ahli waris: ISTRI, 2 ANAK_PR',
      'harta: 1.000', 'harapan: ISTRI 3, ANAK_PR 16; ashl 24', '```',
    ].join('\n'));
    expect(blok.map(isi => isi.jenis)).toEqual(['judul', 'paragraf', 'daftar', 'catatan', 'tabel', 'kasus']);
    expect(blok[1]).toEqual({ jenis: 'paragraf', isi: [{ jenis: 'teks', teks: 'baris satu baris dua' }] });
    expect(blok[2]).toEqual({ jenis: 'daftar', berurut: true, butir: [[{ jenis: 'teks', teks: 'a sambungan' }], [{ jenis: 'teks', teks: 'b' }]] });
    expect(blok[3]).toEqual({ jenis: 'catatan', isi: [{ jenis: 'teks', teks: 'catat lanjut' }] });
    expect(blok[5]).toEqual({ jenis: 'kasus', kasus: {
      pewaris: 'L', ahliWaris: ['ISTRI', 'ANAK_PR', 'ANAK_PR'], harta: 1000n, harapan: { saham: { ISTRI: 3n, ANAK_PR: 16n }, ashlAkhir: 24n },
    } });
  });

  test('frontmatter atau blok kasus rusak = galat, bukan diam-diam', () => {
    expect(() => bacaPelajaran('x', 'tanpa frontmatter')).toThrow(/frontmatter/);
    expect(() => bacaPelajaran('x', '---\njudul: A\nmodul: 1\nurutan: 1\n---\nisi')).toThrow(/tujuan/);
    expect(() => bacaBlok('x', '```kasus\npewaris: X\n```')).toThrow(/pewaris/);
  });
});

describe('materi di docs/materi', () => {
  test('modul dan pelajaran terbaca, berurutan, slug unik', () => {
    expect(DAFTAR_MODUL.map(modul => modul.nomor)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(DAFTAR_PELAJARAN.length).toBeGreaterThan(0);
    expect(new Set(DAFTAR_PELAJARAN.map(pelajaran => pelajaran.slug)).size).toBe(DAFTAR_PELAJARAN.length);
    for (const pelajaran of DAFTAR_PELAJARAN) expect(DAFTAR_MODUL.map(modul => modul.nomor)).toContain(pelajaran.modul);
  });

  test('tidak ada paragraf yang diawali spasi (sisa butir daftar yang terputus)', () => {
    for (const pelajaran of DAFTAR_PELAJARAN) {
      for (const blok of pelajaran.blok) {
        if (blok.jenis === 'paragraf' && blok.isi[0]?.jenis === 'teks') expect(blok.isi[0].teks, pelajaran.slug).not.toMatch(/^\s/);
      }
    }
  });

  test.each(DAFTAR_PELAJARAN.map(pelajaran => [pelajaran.slug, pelajaran] as const))('%s: rujukan ada di KB, istilah ada di glosarium', (_slug, pelajaran) => {
    for (const potongan of semuaPotongan(pelajaran)) {
      if (potongan.jenis === 'rujukan') expect(cariRujukan(potongan.kode), potongan.kode).toBeDefined();
      if (potongan.jenis === 'istilah') expect(cariIstilah(potongan.id), potongan.id).toBeDefined();
    }
  });
});
