import { describe, expect, test } from 'vitest';
import { RUJUKAN, uraiTautan } from '../index.js';

// Baris tanpa token sah bila alasannya tertulis di kolom Sumber/Kutipan atau jenisnya [KH]:
// Lahim, Ithraa, dan Tashil tidak ada di Shamela; keputusan desain dan ta'lil bukan dalil.
const ALASAN_TANPA_TOKEN = /Lahim|Ithraa|Keputusan desain|Penjelasan fuqaha/;

describe('setiap baris rujukan punya token atau alasan tertulis', () => {
  test('tanpa token ⇒ KH, atau alasan tertulis (Lahim/Ithraa/keputusan desain/ta\'lil)', () => {
    const tanpaDasar = RUJUKAN.filter(rujukan =>
      uraiTautan(`${rujukan.sumber} ${rujukan.kutipan}`).length === 0
      && !rujukan.daftarJenis.includes('KH')
      && !ALASAN_TANPA_TOKEN.test(rujukan.sumber));
    expect(tanpaDasar.map(rujukan => rujukan.kode)).toEqual([]);
  });

  test('baris yang mengaku dari Shamela/hadits/ayat (jenis Q, H, A, IJ, RDH) tidak boleh hanya beralasan Lahim', () => {
    const hanyaLahim = RUJUKAN.filter(rujukan =>
      rujukan.daftarJenis.some(jenis => jenis !== 'KH')
      && uraiTautan(`${rujukan.sumber} ${rujukan.kutipan}`).length === 0);
    expect(hanyaLahim.map(rujukan => rujukan.kode)).toEqual([]);
  });
});
