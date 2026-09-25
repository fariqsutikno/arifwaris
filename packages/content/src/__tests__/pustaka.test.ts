import { expect, test } from 'vitest';
import { DAFTAR_AYAT, DAFTAR_KITAB, DAFTAR_SYAHID, SUMBER_KITAB, cariRujukan } from '../index.js';

test('tiap syahid ada persis di teks ayat KB dan rujukannya ada', () => {
  expect(DAFTAR_SYAHID.length).toBeGreaterThan(0);
  for (const isi of DAFTAR_SYAHID) {
    const ayat = DAFTAR_AYAT.find(ayatIni => ayatIni.surah === isi.surah && ayatIni.ayat === isi.ayat);
    expect(ayat?.teks, `${isi.surah} ${isi.ayat}: ${isi.hukum}`).toContain(isi.syahid);
    expect(cariRujukan(isi.rujukan), isi.rujukan).toBeDefined();
  }
});

test('sumber kitab menunjuk ke kitab yang ada di bab 17.2', () => {
  const judulKb = DAFTAR_KITAB.map(kitab => kitab.judul);
  for (const sumber of SUMBER_KITAB) expect(judulKb).toContain(sumber.judul);
});
