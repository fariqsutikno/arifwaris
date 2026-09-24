import { describe, expect, test } from 'vitest';
import { GLOSSARY, findTerm, parseGlossary, slug } from '../index.js';

describe('slug istilah', () => {
  test('huruf kecil, tanpa apostrof, spasi jadi tanda hubung', () => {
    expect(slug("Ashlul mas'alah")).toBe('ashlul-masalah');
    expect(slug("'Aul")).toBe('aul');
    expect(slug("Jam' min al-ikhwah")).toBe('jam-min-al-ikhwah');
    expect(slug("Juz' as-sahm")).toBe('juz-as-sahm');
  });
});

describe('parseGlossary', () => {
  const md = [
    '| Istilah | Arab | Makna | Arti awam |',
    '|--------|------|------|-----------|',
    "| Ta'shib / 'Ashabah | التعصيب / العصبة | Mewarisi tanpa bagian tertentu | Mengambil sisa. |",
    '| Wafq | الوفق | Hasil bagi dengan FPB |  |',
  ].join('\n');

  test('baris dengan "/" = sinonim; kolom arti awam opsional', () => {
    expect(parseGlossary(md)).toEqual([
      { id: 'tashib', aliases: ['tashib', 'ashabah'], istilah: "Ta'shib / 'Ashabah", arab: 'التعصيب / العصبة',
        makna: 'Mewarisi tanpa bagian tertentu', artiAwam: 'Mengambil sisa.' },
      { id: 'wafq', aliases: ['wafq'], istilah: 'Wafq', arab: 'الوفق', makna: 'Hasil bagi dengan FPB' },
    ]);
  });
});

describe('glosarium KB bab 15', () => {
  test('istilah untuk tooltip tersedia, termasuk lewat sinonim', () => {
    expect(findTerm('tadakhul')?.artiAwam).toMatch(/habis dibagi/);
    expect(findTerm('ashabah')?.istilah).toBe("Ta'shib / 'Ashabah");
    expect(findTerm('tidak-ada')).toBeUndefined();
  });

  test('setiap alias unik', () => {
    const aliases = GLOSSARY.flatMap(e => e.aliases);
    expect(new Set(aliases).size).toBe(aliases.length);
  });
});
