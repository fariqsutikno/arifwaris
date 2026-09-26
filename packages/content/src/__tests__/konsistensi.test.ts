// packages/content/src/__tests__/konsistensi.test.ts
import { describe, expect, test } from 'vitest';
import { ambilRefs, bacaIsi, periksaKonsistensi } from '../index.js';
import { CONTOH_FAQ, CONTOH_PELAJARAN, CONTOH_SOAL_HITUNG, CONTOH_SOAL_KUIS, CONTOH_SYAHID } from './contoh.js';


describe('ambilRefs', () => {
  test('dari potongan rujukan dan teks bebas, unik & terurut', () => {
    expect(ambilRefs({ blok: [{ jenis: 'paragraf', isi: [{ jenis: 'rujukan', kode: 'R09-7' }] }], sumber: 'lihat R04-2 dan R09-7' }))
      .toEqual(['R04-2', 'R09-7']);
    expect(ambilRefs({ judul: 'tanpa kode' })).toEqual([]);
  });
});

describe('periksaKonsistensi', () => {
  test('konten yang benar konsisten dengan KB', () => {
    expect(periksaKonsistensi([
      { jenis: 'materi', slug: 'uji', isi: CONTOH_PELAJARAN },
      { jenis: 'soal_kuis', slug: 'K-01', isi: CONTOH_SOAL_KUIS },
      { jenis: 'soal_kuis', slug: 'K-02', isi: { ...CONTOH_SOAL_KUIS, kode: 'K-02' } },
      { jenis: 'soal_hitung', slug: 'H-01', isi: CONTOH_SOAL_HITUNG },
      { jenis: 'faq', slug: 'f', isi: CONTOH_FAQ },
      { jenis: 'syahid', slug: 's', isi: CONTOH_SYAHID },
      { jenis: 'glosarium_ar', slug: 'g', isi: { istilahId: "Ta'shib / 'Ashabah", makna: 'عصبة' } },
    ])).toEqual([]);
  });
  test('ref tak dikenal, istilah tak dikenal, kuis hilang, istilah glosarium_ar di luar KB', () => {
    const pelajaran = { ...CONTOH_PELAJARAN, blok: [
      { jenis: 'paragraf' as const, isi: [{ jenis: 'rujukan' as const, kode: 'R99-1' }, { jenis: 'istilah' as const, id: 'tak-ada', teks: 'x' }] },
      { jenis: 'kuis' as const, daftarKode: ['K-999'] },
    ] };
    const galat = periksaKonsistensi([
      { jenis: 'materi', slug: 'uji', isi: pelajaran },
      { jenis: 'glosarium_ar', slug: 'x', isi: { istilahId: 'Bukan Istilah KB', makna: 'م' } },
    ]);
    expect(galat.join('\n')).toMatch(/materi\/uji: ref R99-1/);
    expect(galat.join('\n')).toMatch(/materi\/uji: istilah tak-ada/);
    expect(galat.join('\n')).toMatch(/materi\/uji: kuis K-999/);
    expect(galat.join('\n')).toMatch(/glosarium_ar\/x: istilah "Bukan Istilah KB"/);
  });
  test('syahid yang tidak ada di teks ayat KB ditolak', () => {
    expect(periksaKonsistensi([{ jenis: 'syahid', slug: 's', isi: { ...CONTOH_SYAHID, syahid: 'ليس في الآية' } }])[0]).toMatch(/syahid\/s/);
  });
});

test('ahwal menerima versi Arab per baris', () => {
  const isi = { kunci: 'SUAMI', baris: [{ bagian: '1/2', syarat: 'x', cocok: { fardh: '1/2' }, ar: { bagian: '١/٢', syarat: 'س' } }] };
  expect(bacaIsi('ahwal', isi).ok).toBe(true);
});
