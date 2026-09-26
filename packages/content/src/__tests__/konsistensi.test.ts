// packages/content/src/__tests__/konsistensi.test.ts
import { describe, expect, test } from 'vitest';
import {
  DAFTAR_FAQ, DAFTAR_MODUL, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, DAFTAR_SYAHID, DAFTAR_TANYA_JAWAB,
  SUMBER_KITAB, GLOSARIUM, ambilRefs, bacaIsi, periksaKonsistensi, type BarisKonten,
} from '../index.js';

const semuaSekarang = (): BarisKonten[] => [
  ...DAFTAR_MODUL.map(isi => ({ jenis: 'modul' as const, slug: String(isi.nomor), isi })),
  ...DAFTAR_PELAJARAN.map(isi => ({ jenis: 'materi' as const, slug: isi.slug, isi })),
  ...DAFTAR_SOAL_KUIS.map(isi => ({ jenis: 'soal_kuis' as const, slug: isi.kode, isi })),
  ...DAFTAR_SOAL_HITUNG.map(isi => ({ jenis: 'soal_hitung' as const, slug: isi.kode, isi })),
  ...DAFTAR_TANYA_JAWAB.map(isi => ({ jenis: 'tanya_jawab' as const, slug: isi.slug, isi })),
  ...DAFTAR_FAQ.map(isi => ({ jenis: 'faq' as const, slug: isi.id, isi })),
  ...SUMBER_KITAB.map(isi => ({ jenis: 'kitab' as const, slug: isi.judul, isi })),
  ...DAFTAR_SYAHID.map((isi, i) => ({ jenis: 'syahid' as const, slug: String(i), isi })),
  ...GLOSARIUM.filter(e => e.ar).map(e => ({ jenis: 'glosarium_ar' as const, slug: e.id, isi: { istilahId: e.istilah, ...e.ar! } })),
];

describe('ambilRefs', () => {
  test('dari potongan rujukan dan teks bebas, unik & terurut', () => {
    expect(ambilRefs({ blok: [{ jenis: 'paragraf', isi: [{ jenis: 'rujukan', kode: 'R09-7' }] }], sumber: 'lihat R04-2 dan R09-7' }))
      .toEqual(['R04-2', 'R09-7']);
    expect(ambilRefs({ judul: 'tanpa kode' })).toEqual([]);
  });
});

describe('periksaKonsistensi', () => {
  test('konten sekarang konsisten dengan KB', () => {
    expect(periksaKonsistensi(semuaSekarang())).toEqual([]);
  });
  test('ref tak dikenal, istilah tak dikenal, kuis hilang, istilah glosarium_ar di luar KB', () => {
    const pelajaran = { ...DAFTAR_PELAJARAN[0]!, blok: [
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
    const [syahid] = DAFTAR_SYAHID;
    expect(periksaKonsistensi([{ jenis: 'syahid', slug: 's', isi: { ...syahid!, syahid: 'ليس في الآية' } }])[0]).toMatch(/syahid\/s/);
  });
});

test('ahwal menerima versi Arab per baris', () => {
  const isi = { kunci: 'SUAMI', baris: [{ bagian: '1/2', syarat: 'x', cocok: { fardh: '1/2' }, ar: { bagian: '١/٢', syarat: 'س' } }] };
  expect(bacaIsi('ahwal', isi).ok).toBe(true);
});
