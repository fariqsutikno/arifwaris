import { expect, it } from 'vitest';
import { rekomendasiPaket } from '../layar/belajar/rekomendasiKuis';

const paket = [3, 1, 2].map(bab => ({ kode: `bab-${bab}`, bab, jumlahSoal: 5 }));

it('belum dicoba lebih dulu, urut bab', () => {
  expect(rekomendasiPaket(paket, { 'bab-1': { terbaik: '5/5' } })).toMatchObject({ paket: { kode: 'bab-2' }, alasan: 'belum_dicoba' });
});
it('semua sudah dicoba: nilai terbaik terendah yang belum Sangat baik', () => {
  const rekor = { 'bab-1': { terbaik: '5/5' }, 'bab-2': { terbaik: '3/5' }, 'bab-3': { terbaik: '4/5' } };
  expect(rekomendasiPaket(paket, rekor)).toMatchObject({ paket: { kode: 'bab-2' }, alasan: 'nilai_terendah' });
});
it('semua Sangat baik atau daftar kosong: tidak ada rekomendasi', () => {
  expect(rekomendasiPaket(paket, Object.fromEntries(paket.map(isi => [isi.kode, { terbaik: '5/5' }])))).toBeNull();
  expect(rekomendasiPaket([], {})).toBeNull();
});
