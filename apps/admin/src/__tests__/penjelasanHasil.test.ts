import { expect, test } from 'vitest';
import { contohKalimat, kelompokkanNarasi, namaSisipan, sisipanDari, sisipanBerubah } from '../editor/penjelasanHasil';

test('sisipan punya nama manusiawi; istilah fikih disebut istilahnya; tak dikenal jadi kata biasa', () => {
  expect(namaSisipan('pewaris')).toBe('nama almarhum');
  expect(namaSisipan('siapa')).toBe('nama orang');
  expect(namaSisipan('tirkah')).toBe('istilah tirkah');
  expect(namaSisipan('hajb_hirman')).toBe('istilah hajb hirman');
  expect(namaSisipan('daftar_ahli_waris')).toBe('daftar ahli waris');
});

test('sisipanDari mengurutkan unik; sisipanBerubah memberi nama manusiawi', () => {
  expect(sisipanDari('{siapa} dan {pewaris} dan {siapa}')).toEqual(['siapa', 'pewaris']);
  expect(sisipanBerubah('{siapa} dari {pewaris}', '{siapa} dari dia')).toEqual({ hilang: ['nama almarhum'], baru: [] });
  expect(sisipanBerubah('{siapa}', '{siapa} {xyz_baru}')).toEqual({ hilang: [], baru: ['xyz baru'] });
  expect(sisipanBerubah('{siapa}', 'Siapa saja')).toEqual({ hilang: ['nama orang'], baru: [] });
});

test('contohKalimat memakai nilai contoh; istilah tampil apa adanya', () => {
  expect(contohKalimat('{siapa} mewarisi dari {pewaris} menurut {tirkah}')).toBe('Ahmad mewarisi dari Budi menurut tirkah');
  expect(contohKalimat('ada {sesuatu_aneh}')).toBe('ada sesuatu aneh');
});

test('kelompokkanNarasi: per tahap berjudul manusiawi, urut tahap, Arab terpisah di akhir, tanpa kunci', () => {
  const kunci = ['narasi.arab.langkah', 'narasi.ringkas.harta.a', 'narasi.cerita.ahli_waris.x', 'narasi.cerita.harta.y',
    'narasi.taqdir.judul.apa', 'narasi.umum.kembali', 'narasi.aneh.z', 'beranda.judul'];
  expect(kelompokkanNarasi(kunci).map(g => [g.judul, g.kunci])).toEqual([
    ['Harta', ['narasi.cerita.harta.y']],
    ['Ahli waris', ['narasi.cerita.ahli_waris.x']],
    ['Versi ringkas', ['narasi.ringkas.harta.a']],
    ['Nama dan istilah umum', ['narasi.umum.kembali']],
    ['Kemungkinan (janin/hilang/khuntsa)', ['narasi.taqdir.judul.apa']],
    ['Lainnya', ['narasi.aneh.z']],
    ['Bahasa Arab', ['narasi.arab.langkah']],
  ]);
});
