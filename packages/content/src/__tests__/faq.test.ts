import { expect, test } from 'vitest';
import { DAFTAR_FAQ, bacaFaq, cariIstilah, cariRujukan, semuaPotongan } from '../index.js';

test('parser: kelompok, pertanyaan, jawaban berblok', () => {
  const [entri] = bacaFaq('# FAQ\npengantar\n## Fikih\n### Apa itu tirkah?\nHarta peninggalan [R01-1].\n\n- satu\n');
  expect(entri).toMatchObject({ id: 'apa-itu-tirkah', kelompok: 'Fikih', pertanyaan: 'Apa itu tirkah?' });
  expect(entri!.jawaban.map(blok => blok.jenis)).toEqual(['paragraf', 'daftar']);
});

test('FAQ: id unik, rujukan & istilah valid, jawaban fikih selalu berujukan', () => {
  expect(DAFTAR_FAQ.length).toBeGreaterThan(0);
  expect(new Set(DAFTAR_FAQ.map(entri => entri.id)).size).toBe(DAFTAR_FAQ.length);
  for (const entri of DAFTAR_FAQ) {
    const potongan = semuaPotongan(entri.jawaban);
    for (const isi of potongan) {
      if (isi.jenis === 'rujukan') expect(cariRujukan(isi.kode), isi.kode).toBeDefined();
      if (isi.jenis === 'istilah') expect(cariIstilah(isi.id), isi.id).toBeDefined();
    }
    if (entri.kelompok === 'Fikih') expect(potongan.some(isi => isi.jenis === 'rujukan'), entri.pertanyaan).toBe(true);
  }
});
