import { expect, test } from 'vitest';
import { DAFTAR_TANYA_JAWAB, bacaTanyaJawab, cariIstilah, cariRujukan, semuaPotongan } from '../index.js';

test('parser: kepala, kasus, penyelesaian berblok', () => {
  const [entri] = bacaTanyaJawab('# TJ\npengantar\n## Rumah warisan\njenis: Fatwa\nringkasan: Satu.\nsumber: MUI\n\n### Kasus\nCerita [R01-1].\n\n### Penyelesaian\n- satu\n');
  expect(entri).toMatchObject({ slug: 'rumah-warisan', judul: 'Rumah warisan', jenis: 'Fatwa', ringkasan: 'Satu.', sumber: 'MUI' });
  expect(entri!.kasus.map(blok => blok.jenis)).toEqual(['paragraf']);
  expect(entri!.penyelesaian.map(blok => blok.jenis)).toEqual(['daftar']);
});

test('isi rusak = galat', () => {
  expect(() => bacaTanyaJawab('## A\njenis: Gosip\nringkasan: x\nsumber: y\n### Kasus\na\n### Penyelesaian\nb')).toThrow(/jenis/);
  expect(() => bacaTanyaJawab('## A\njenis: Fatwa\nringkasan: x\n### Kasus\na\n### Penyelesaian\nb')).toThrow(/sumber/);
  expect(() => bacaTanyaJawab('## A\njenis: Fatwa\nringkasan: x\nsumber: y\n### Kasus\na')).toThrow(/Penyelesaian/);
});

test('tanya jawab: slug unik, rujukan & istilah valid', () => {
  expect(DAFTAR_TANYA_JAWAB.length).toBeGreaterThan(0);
  expect(new Set(DAFTAR_TANYA_JAWAB.map(entri => entri.slug)).size).toBe(DAFTAR_TANYA_JAWAB.length);
  for (const entri of DAFTAR_TANYA_JAWAB) {
    for (const isi of semuaPotongan([...entri.kasus, ...entri.penyelesaian])) {
      if (isi.jenis === 'rujukan') expect(cariRujukan(isi.kode), isi.kode).toBeDefined();
      if (isi.jenis === 'istilah') expect(cariIstilah(isi.id), isi.id).toBeDefined();
    }
  }
});
