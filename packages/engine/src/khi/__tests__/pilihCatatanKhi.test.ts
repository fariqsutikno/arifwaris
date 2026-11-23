// Tes pemicu catatan KHI: fungsi murni yang hanya memilih catatan relevan; tidak menghitung bagian.
// Ditulis sebelum implementasi (Review Focus 1: kasus tanpa kaitan KHI → daftar kosong).
import { describe, expect, test } from 'vitest';
import { hitung } from '../../pipeline.js';
import { hitungDzawilArham } from '../../dzawilArham.js';
import type { GrafKeluarga, HasilEngine, InputEngine } from '../../types.js';
import { input, p } from '../../__tests__/fixtures/bab16.js';
import { ID_CATATAN_KHI, pilihCatatanKhi } from '../pilihCatatanKhi.js';

const pilih = (masukan: InputEngine) => pilihCatatanKhi(hitung(masukan), masukan);
const graf = (orang: GrafKeluarga['orang'], pernikahan: GrafKeluarga['pernikahan'] = []): GrafKeluarga =>
  ({ idPewaris: 'D', orang, pernikahan });
const wafat = (id: string, jk: 'L' | 'P', ekstra = {}) => p(id, jk, { statusHidup: 'wafat', ...ekstra });

describe('pilihCatatanKhi: tanpa kaitan KHI → kosong', () => {
  test('hanya anak laki-laki', () => {
    const masukan = input(graf({ D: wafat('D', 'L'), A1: p('A1', 'L', { idAyah: 'D' }) }));
    expect(pilih(masukan)).toEqual([]);
  });

  test('anak laki-laki dan anak perempuan, tanpa pasangan', () => {
    const masukan = input(graf({ D: wafat('D', 'L'), A1: p('A1', 'L', { idAyah: 'D' }), A2: p('A2', 'P', { idAyah: 'D' }) }));
    expect(pilih(masukan)).toEqual([]);
  });

  test('hasil bukan OK dan tanpa sinyal dari graf → kosong', () => {
    const masukan = input(graf({ D: wafat('D', 'L'), A1: p('A1', 'L', { idAyah: 'D' }) }));
    const hasil: HasilEngine = { status: 'PERLU_INPUT', pertanyaan: [] };
    expect(pilihCatatanKhi(hasil, masukan)).toEqual([]);
  });
});

describe('pilihCatatanKhi: harta bersama', () => {
  const dengan = (status: 'utuh' | 'talakRajiIddah' | 'talakBain', agamaIstri: 'islam' | 'nonIslam' = 'islam') => input(graf(
    { D: wafat('D', 'L'), W: p('W', 'P', { agama: agamaIstri }), A1: p('A1', 'L', { idAyah: 'D' }) },
    [{ idSuami: 'D', idIstri: 'W', status }],
  ));

  test('pasangan hidup → hartaBersama', () => expect(pilih(dengan('utuh'))).toEqual(['hartaBersama']));
  test('talak raj\'i dalam iddah → hartaBersama', () => expect(pilih(dengan('talakRajiIddah'))).toContain('hartaBersama'));
  test('talak ba\'in → tidak', () => expect(pilih(dengan('talakBain'))).not.toContain('hartaBersama'));
  test('istri non-muslim tetap hartaBersama, ditambah penghalang dan wasiatWajibah', () => {
    expect(pilih(dengan('utuh', 'nonIslam'))).toEqual(['wasiatWajibah', 'hartaBersama', 'penghalang']);
  });
  test('pemicu graf tetap jalan walau hasil bukan OK', () => {
    const hasil: HasilEngine = { status: 'PERLU_INPUT', pertanyaan: [] };
    expect(pilihCatatanKhi(hasil, dengan('utuh'))).toEqual(['hartaBersama']);
  });
});

describe('pilihCatatanKhi: pengganti', () => {
  test('cucu terhalang anak laki-laki lain', () => {
    const masukan = input(graf({
      D: wafat('D', 'L'), S1: p('S1', 'L', { idAyah: 'D' }), S2: wafat('S2', 'L', { idAyah: 'D' }), C: p('C', 'L', { idAyah: 'S2' }),
    }));
    expect(pilih(masukan)).toEqual(['pengganti']);
  });

  test('cucu dari anak perempuan (dzawil arham) → pengganti dan kerabatJauh', () => {
    const masukan = input(graf({
      D: wafat('D', 'L'), P1: wafat('P1', 'P', { idAyah: 'D' }), C: p('C', 'L', { idIbu: 'P1' }),
    }));
    const hasil = hitungDzawilArham(masukan);
    expect(hasil.status).toBe('OK');
    expect(pilihCatatanKhi(hasil, masukan)).toEqual(['pengganti', 'kerabatJauh']);
  });

  test('keponakan dari saudara yang wafat lebih dulu → pengganti', () => {
    const masukan = input(graf({
      D: wafat('D', 'L', { idAyah: 'F', idIbu: 'M' }), F: wafat('F', 'L'), M: wafat('M', 'P'),
      B: wafat('B', 'L', { idAyah: 'F', idIbu: 'M' }), K: p('K', 'L', { idAyah: 'B' }),
    }));
    expect(pilih(masukan)).toContain('pengganti');
  });

  test('anak yang wafat tanpa keturunan hidup → tidak', () => {
    const masukan = input(graf({
      D: wafat('D', 'L'), S1: p('S1', 'L', { idAyah: 'D' }), S2: wafat('S2', 'L', { idAyah: 'D' }), C: wafat('C', 'L', { idAyah: 'S2' }),
    }));
    expect(pilih(masukan)).not.toContain('pengganti');
  });
});

describe('pilihCatatanKhi: penghalang dan wasiat wajibah', () => {
  test('ahli waris non-muslim → penghalang dan wasiatWajibah', () => {
    const masukan = input(graf({ D: wafat('D', 'L'), A1: p('A1', 'L', { idAyah: 'D', agama: 'nonIslam' }), A2: p('A2', 'P', { idAyah: 'D' }) }));
    expect(pilih(masukan)).toEqual(['wasiatWajibah', 'penghalang']);
  });

  test('pembunuh → penghalang saja', () => {
    const masukan = input(graf({ D: wafat('D', 'L'), A1: p('A1', 'L', { idAyah: 'D', membunuhPewaris: true }), A2: p('A2', 'P', { idAyah: 'D' }) }));
    expect(pilih(masukan)).toEqual(['penghalang']);
  });
});

describe('pilihCatatanKhi: saudara, ayah, wasiat', () => {
  test('saudara seibu bersama saudara kandung → saudaraSeibu', () => {
    const masukan = input(graf({
      D: wafat('D', 'L', { idAyah: 'F', idIbu: 'M' }), F: wafat('F', 'L'), M: wafat('M', 'P'), F2: wafat('F2', 'L'),
      B1: p('B1', 'L', { idAyah: 'F', idIbu: 'M' }), B2: p('B2', 'L', { idAyah: 'F2', idIbu: 'M' }),
    }));
    expect(pilih(masukan)).toEqual(['saudaraSeibu']);
  });

  test('saudara seibu tanpa saudara kandung atau seayah → tidak', () => {
    const masukan = input(graf({
      D: wafat('D', 'L', { idAyah: 'F', idIbu: 'M' }), F: wafat('F', 'L'), M: wafat('M', 'P'), F2: wafat('F2', 'L'),
      B2: p('B2', 'L', { idAyah: 'F2', idIbu: 'M' }),
    }));
    expect(pilih(masukan)).not.toContain('saudaraSeibu');
  });

  test('saudari seayah → saudariKandungSeayah', () => {
    const masukan = input(graf({
      D: wafat('D', 'L', { idAyah: 'F', idIbu: 'M' }), F: wafat('F', 'L'), M: wafat('M', 'P'), M2: wafat('M2', 'P'),
      S: p('S', 'P', { idAyah: 'F', idIbu: 'M2' }),
    }));
    expect(pilih(masukan)).toContain('saudariKandungSeayah');
  });

  test('ayah mewarisi tanpa anak laki-laki → ayah; bersama anak laki-laki → tidak', () => {
    const tanpaAnak = input(graf({ D: wafat('D', 'L', { idAyah: 'F' }), F: p('F', 'L') }));
    expect(pilih(tanpaAnak)).toEqual(['ayah']);
    const denganAnak = input(graf({ D: wafat('D', 'L', { idAyah: 'F' }), F: p('F', 'L'), A: p('A', 'L', { idAyah: 'D' }) }));
    expect(pilih(denganAnak)).not.toContain('ayah');
  });

  test('wasiat melebihi sepertiga → wasiatAhliWaris; di bawah batas → tidak', () => {
    const graphAnak = graf({ D: wafat('D', 'L'), A1: p('A1', 'L', { idAyah: 'D' }) });
    const lebih = { ...input(graphAnak), tirkah: { kotor: 90n, tajhiz: 0n, hutang: 0n, wasiat: 50n } };
    expect(pilih(lebih)).toEqual(['wasiatAhliWaris']);
    const wajar = { ...input(graphAnak), tirkah: { kotor: 90n, tajhiz: 0n, hutang: 0n, wasiat: 20n } };
    expect(pilih(wajar)).toEqual([]);
  });
});

describe('pilihCatatanKhi: sifat fungsi', () => {
  test('urutan stabil mengikuti ID_CATATAN_KHI, tanpa duplikat, dan murni', () => {
    const masukan = input(graf({
      D: wafat('D', 'L'), W: p('W', 'P', { agama: 'nonIslam' }), S1: p('S1', 'L', { idAyah: 'D' }),
      S2: wafat('S2', 'L', { idAyah: 'D' }), C: p('C', 'L', { idAyah: 'S2' }),
    }, [{ idSuami: 'D', idIstri: 'W', status: 'utuh' }]));
    const hasil = pilih(masukan);
    expect(hasil).toEqual(ID_CATATAN_KHI.filter(id => hasil.includes(id)));
    expect(new Set(hasil).size).toBe(hasil.length);
    expect(pilih(masukan)).toEqual(hasil);
  });

  test('tidak mengubah masukan', () => {
    const masukan = input(graf({ D: wafat('D', 'L'), A1: p('A1', 'L', { idAyah: 'D' }) }));
    const salinan = JSON.stringify(masukan, (_k, v) => (typeof v === 'bigint' ? `${v}n` : v));
    pilih(masukan);
    expect(JSON.stringify(masukan, (_k, v) => (typeof v === 'bigint' ? `${v}n` : v))).toBe(salinan);
  });
});
