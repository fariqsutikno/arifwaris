// Linimasa taqdir dan gharqa: urutan tahap, meja berisi semua dunia, kotak jami'ah (diberikan + ditahan) pas, sebutan lengkap.
import { hitungGharqa, hitungTaqdir, type InputEngine, type InputGharqa } from '@waris/engine';
import { describe, expect, it } from 'vitest';
import { grafG1 } from '../../../engine/src/__tests__/fixtures/gharqa.js';
import { TAQDIR_FIXTURES } from '../../../engine/src/__tests__/fixtures/taqdir.js';
import { KUNCI_DITAHAN, susunLinimasaGharqa, susunLinimasaTaqdir } from '../linimasaKasusKhusus.js';
import type { Linimasa } from '../linimasa.js';
import { kamusSnapshot } from './kamus.js';

const HARTA = { kotor: 7_200_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

function kotakDi(linimasa: Linimasa) {
  return linimasa.tahap.flatMap(tahap => tahap.langkah.flatMap(langkah => (langkah.visual?.jenis === 'kotak' ? [langkah.visual] : [])));
}
function periksaKotak(linimasa: Linimasa) {
  for (const kotak of kotakDi(linimasa)) {
    expect(kotak.isi.reduce((total, isi) => total + isi.jumlah, 0n)).toBe(kotak.jumlah * kotak.potong);
    for (const isi of kotak.isi) expect(linimasa.nama![isi.anggota[0]!], isi.anggota[0]).toBeTruthy();
  }
}

describe('skrip taqdir', () => {
  it('tiap fixture: pembuka bertanya, kemungkinan dibuka dasar + banyaknya + jembatan, pemberian ditutup ringkasan', () => {
    let adaKemungkinan = 0;
    for (const fixture of TAQDIR_FIXTURES) {
      const hasil = hitungTaqdir({ ...fixture.input, tirkah: HARTA });
      if (hasil.status !== 'OK') continue;
      const linimasa = susunLinimasaTaqdir(hasil, fixture.input.graf, { kamus: kamusSnapshot });
      const jenis = (id: string) => linimasa.tahap.find(tahap => tahap.id === id)?.langkah.map(langkah => langkah.jenis);
      expect(jenis('belumPasti')![0], fixture.id).toBe('tanya');
      expect(jenis('pemberian')![0], fixture.id).toBe('tanya');
      expect(jenis('pemberian')!.at(-1), fixture.id).toBe('ringkas');
      const kemungkinan = jenis('kemungkinan');
      if (kemungkinan) {
        adaKemungkinan++;
        expect(kemungkinan.slice(0, 3), fixture.id).toEqual(['dasar', 'logika', 'jembatan']);
      }
    }
    expect(adaKemungkinan).toBeGreaterThan(0);
  });
});

describe('susunLinimasaTaqdir', () => {
  for (const fixture of TAQDIR_FIXTURES) {
    it(`${fixture.id}: pembukaan, meja semua dunia (bila ada kemungkinan luar), pemberian sekarang`, () => {
      const hasil = hitungTaqdir({ ...fixture.input, tirkah: HARTA });
      if (hasil.status !== 'OK') return;
      const linimasa = susunLinimasaTaqdir(hasil, fixture.input.graf, { kamus: kamusSnapshot });
      expect(linimasa.tahap[0]!.id).toBe('belumPasti');
      expect(linimasa.tahap.at(-1)!.id).toBe('pemberian');
      expect(linimasa.tabel).toEqual([]);
      const ada = hasil.daftarDunia.some(dunia => Object.keys(dunia.taqdir).length > 0);
      expect(linimasa.tahap.some(tahap => tahap.id === 'kemungkinan')).toBe(ada);
      for (const tahap of linimasa.tahap) for (const langkah of tahap.langkah) {
        if (langkah.visual?.jenis === 'meja') expect(langkah.visual.dunia).toHaveLength(hasil.daftarDunia.length);
      }
      periksaKotak(linimasa);
      // Bagian ditahan hanya muncul bila engine menahan sesuatu.
      const ditahan = kotakDi(linimasa).at(-1)!.isi.some(isi => isi.kelompok === KUNCI_DITAHAN);
      expect(ditahan).toBe(hasil.mauquf > 0n);
    });
  }
});

describe('susunLinimasaGharqa', () => {
  const dasar = (ruleset: InputEngine['ruleset']): InputEngine => ({ graf: grafG1, tirkah: HARTA, pembulatan: { satuan: 1n },
    konfigurasi: { kebijakanSisa: 'radd', talakBainSaatMaradh: 'qaulJadid' }, ruleset, versiKb: 'uji' });
  const kasus: Array<[string, InputEngine['ruleset'], InputGharqa['keadaan'], string[]]> = [
    ['hanbali tidak diketahui (skenario)', 'hanbali', 'tidakDiketahui', ['ZAID', 'AMR', 'BAKR']],
    ['syafii terlupakan', 'syafii', 'terlupakan', ['ZAID', 'AMR']],
  ];
  for (const [nama, ruleset, keadaan, anggota] of kasus) {
    it(`${nama}: pembukaan lalu tahap per harta, kotak pas`, () => {
      const hasil = hitungGharqa({ dasar: dasar(ruleset), anggota, keadaan, tirkah: { ZAID: { ...HARTA, kotor: 1_440_000n } } });
      if (hasil.status !== 'OK' && hasil.status !== 'MAUQUF') throw new Error(hasil.status);
      const linimasa = susunLinimasaGharqa(hasil, grafG1, keadaan, { kamus: kamusSnapshot });
      expect(linimasa.tahap[0]!.id).toBe('wafatBersamaan');
      expect(linimasa.tahap.slice(1).every(tahap => tahap.id === 'harta')).toBe(true);
      expect(linimasa.tahap.length).toBeGreaterThan(1);
      periksaKotak(linimasa);
    });
  }
});
