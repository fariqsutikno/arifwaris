import { describe, expect, test } from 'vitest';
import { bacaBlok, bacaPotongan } from '../index.js';

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

  test('blok video (berbagai bentuk tautan YouTube) dan kuis', () => {
    for (const tautan of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3', 'https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ']) {
      expect(bacaBlok('v', `\`\`\`video\n${tautan}\njudul: Uji\n\`\`\``)).toEqual([{ jenis: 'video', idYoutube: 'dQw4w9WgXcQ', judul: 'Uji' }]);
    }
    expect(() => bacaBlok('v', '```video\nhttps://example.com\n```')).toThrow(/YouTube/);
    expect(bacaBlok('k', '```kuis\nK-01, K-02\nK-03\n```')).toEqual([{ jenis: 'kuis', daftarKode: ['K-01', 'K-02', 'K-03'] }]);
  });

  test('blok kasus rusak = galat, bukan diam-diam', () => {
    expect(() => bacaBlok('x', '```kasus\npewaris: X\n```')).toThrow(/pewaris/);
  });
});

test('tabel: | di dalam [[tautan|teks]] tidak memecah sel', () => {
  const [tabel] = bacaBlok('uji', '| A | B |\n|---|---|\n| [[bi-nafsihi|Bi nafsihi]] | x |');
  expect(tabel?.jenis === 'tabel' && tabel.baris[0]!.length).toBe(2);
});
