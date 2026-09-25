import { describe, expect, test } from 'vitest';
import { GLOSARIUM, cariIstilah, bacaGlosarium, slug } from '../index.js';

describe('slug istilah', () => {
  test('huruf kecil, tanpa apostrof, spasi jadi tanda hubung', () => {
    expect(slug("Ashlul mas'alah")).toBe('ashlul-masalah');
    expect(slug("'Aul")).toBe('aul');
    expect(slug("Jam' min al-ikhwah")).toBe('jam-min-al-ikhwah');
    expect(slug("Juz' as-sahm")).toBe('juz-as-sahm');
  });
});

describe('parseGlossary', () => {
  const teksBab = [
    '| Istilah | Arab | Makna | Arti awam |',
    '|--------|------|------|-----------|',
    "| Ta'shib / 'Ashabah | التعصيب / العصبة | Mewarisi tanpa bagian tertentu | Mengambil sisa. |",
    '| Wafq | الوفق | Hasil bagi dengan FPB |  |',
  ].join('\n');

  test('baris dengan "/" = sinonim; kolom arti awam opsional', () => {
    expect(bacaGlosarium(teksBab)).toEqual([
      { id: 'tashib', sinonim: ['tashib', 'ashabah'], istilah: "Ta'shib / 'Ashabah", arab: 'التعصيب / العصبة',
        makna: 'Mewarisi tanpa bagian tertentu', artiAwam: 'Mengambil sisa.' },
      { id: 'wafq', sinonim: ['wafq'], istilah: 'Wafq', arab: 'الوفق', makna: 'Hasil bagi dengan FPB' },
    ]);
  });
});

describe('glosarium KB bab 15', () => {
  test('istilah untuk tooltip tersedia, termasuk lewat sinonim', () => {
    expect(cariIstilah('tadakhul')?.artiAwam).toMatch(/habis dibagi/);
    expect(cariIstilah('ashabah')?.istilah).toBe("Ta'shib / 'Ashabah");
    expect(cariIstilah('tidak-ada')).toBeUndefined();
  });

  test('kolom Contoh terbaca dan selalu menyebut kasus uji bab 16', () => {
    expect(cariIstilah('aul')?.contoh).toMatch(/Kasus 16\.5/);
    for (const entri of GLOSARIUM.filter(isi => isi.contoh)) expect(entri.contoh).toMatch(/16\.(M?\d+)/);
  });

  test('setiap sinonimIni unik', () => {
    const sinonim = GLOSARIUM.flatMap(e => e.sinonim);
    expect(new Set(sinonim).size).toBe(sinonim.length);
  });
});
