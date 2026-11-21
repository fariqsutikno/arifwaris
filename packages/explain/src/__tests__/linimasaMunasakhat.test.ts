// Linimasa munasakhat: urutan tahap, satu babak tabel per mayit, kotak jami'ah pas, nama lintas mayit.
import { hitungMunasakhat, type InputMunasakhat } from '@waris/engine';
import { describe, expect, it } from 'vitest';
import { M2, M7, M8, M9, SISA_KELUAR_MAYIT_KEDUA } from '../../../engine/src/__tests__/fixtures/munasakhat.js';
import { susunLinimasaMunasakhat } from '../linimasaMunasakhat.js';
import { keTeksBiasa } from '../segments.js';
import { kamusSnapshot } from './kamus.js';

function linimasaDari(input: InputMunasakhat) {
  const hasil = hitungMunasakhat(input);
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  return { hasil, linimasa: susunLinimasaMunasakhat(hasil, input.dasar.graf, { kamus: kamusSnapshot }) };
}

describe('skrip munasakhat', () => {
  it('M2: pembukaan bertanya, ada dasar munasakhat, sambungan menyebut pembagi baru, hasil akhir ditutup ringkasan', () => {
    const { linimasa } = linimasaDari(M2.input);
    const jenis = (id: string) => linimasa.tahap.find(tahap => tahap.id === id)!.langkah.map(langkah => langkah.jenis);
    const teks = (id: string) => linimasa.tahap.find(tahap => tahap.id === id)!.langkah.map(langkah => keTeksBiasa(langkah.narasi)).join(' ');
    expect(jenis('berantai')).toEqual(['tanya', 'dasar', 'logika', 'keluarga', 'jembatan']);
    expect(teks('berantai')).toContain('Ini disebut munasakhat');
    expect(jenis('menyambung')[0]).toBe('tanya');
    expect(jenis('menyambung').at(-1)).toBe('jembatan');
    expect(teks('menyambung')).toContain('menjadi 72');
    expect(jenis('hasilAkhir')[0]).toBe('tanya');
    expect(jenis('hasilAkhir').at(-1)).toBe('ringkas');
    expect(teks('hasilAkhir')).toContain('istri 2/9 dan anak laki-laki 7/9');
  });
});

describe('susunLinimasaMunasakhat', () => {
  for (const [nama, input] of [['M2', M2.input], ['M7', M7.input], ['M8', M8.input], ['M9', M9.input], ['sisa keluar mayit kedua', SISA_KELUAR_MAYIT_KEDUA]] as const) {
    it(`${nama}: pembukaan, babak tiap mayit, penyambungan, hasil akhir`, () => {
      const { hasil, linimasa } = linimasaDari(input);
      expect(linimasa.tahap[0]!.id).toBe('berantai');
      expect(linimasa.tahap.at(-1)!.id).toBe('hasilAkhir');
      expect(linimasa.tabel).toHaveLength(hasil.daftarLangkah.length);
      // Tiap babak punya tahapnya sendiri, berurutan.
      const babak = linimasa.tahap.flatMap(tahap => (tahap.babak === undefined ? [] : [tahap.babak]));
      expect(babak).toEqual([...babak].sort((a, b) => a - b));
      expect(new Set(babak).size).toBe(hasil.daftarLangkah.length);
      expect(linimasa.tahap.filter(tahap => tahap.id === 'menyambung').length).toBe(hasil.daftarLangkah.length - 1);
      // Kotak jami'ah: Σ isi = jumlah × potong, dan kotak hasil akhir berpenyebut jami'ah.
      const kotak = linimasa.tahap.flatMap(tahap => tahap.langkah.flatMap(langkah => (langkah.visual?.jenis === 'kotak' && ['menyambung', 'hasilAkhir'].includes(tahap.id) ? [langkah.visual] : [])));
      for (const satu of kotak) expect(satu.isi.reduce((total, isi) => total + isi.jumlah, 0n)).toBe(satu.jumlah * satu.potong);
      const akhir = linimasa.tahap.at(-1)!.langkah[0]!.visual;
      expect(akhir).toMatchObject({ jenis: 'kotak' });
      if (akhir?.jenis === 'kotak') expect(akhir.jumlah * akhir.potong).toBe(hasil.ikhtishar.jamiah);
      // Setiap id di kotak punya sebutan.
      for (const satu of kotak) for (const isi of satu.isi) expect(linimasa.nama![isi.anggota[0]!], isi.anggota[0]).toBeTruthy();
    });
  }

  it('M2: baris hitung per orang membawa hitungan berlabel (label = orang, isi = rumus)', () => {
    const { linimasa } = linimasaDari(M2.input);
    const hitungan = linimasa.tahap.flatMap(tahap => tahap.langkah).flatMap(langkah => (langkah.hitungan ? [langkah.hitungan] : []));
    expect(hitungan.length).toBeGreaterThan(0);
    expect(hitungan.every(satu => satu.label.length > 0 && satu.isi.length > 0)).toBe(true);
  });
});
