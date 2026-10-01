import { expect, it } from 'vitest';
import { TAUTAN_BERANDA, TAUTAN_KALKULATOR, bacaRute, tautanKasus, tautanPeringkat, tautanInduk, tautanBelajar, tautanFaq, tautanTanyaJawab, tautanLatihan, tautanGlosarium, tautanRujukan } from '../rute';

it('hash dibaca jadi rute; yang tak dikenal jatuh ke beranda', () => {
  expect(bacaRute('')).toEqual({ halaman: 'beranda' });
  expect(bacaRute('#/')).toEqual({ halaman: 'beranda' });
  expect(bacaRute('#/entah')).toEqual({ halaman: 'beranda' });
  expect(bacaRute('#/hitung')).toEqual({ halaman: 'kalkulator' });
  expect(bacaRute('#/glosarium')).toEqual({ halaman: 'glosarium' });
  expect(bacaRute('#/riwayat')).toEqual({ halaman: 'riwayat' });
  expect(bacaRute(tautanPeringkat())).toEqual({ halaman: 'peringkat' });
  expect(bacaRute(tautanFaq('apa-itu'))).toEqual({ halaman: 'faq', id: 'apa-itu' });
  expect(bacaRute(tautanTanyaJawab('sengketa'))).toEqual({ halaman: 'tanya-jawab', slug: 'sengketa' });
  expect(bacaRute(tautanLatihan())).toEqual({ halaman: 'latihan', tab: 'hitung' });
  expect(bacaRute(tautanLatihan('kuis'))).toEqual({ halaman: 'latihan', tab: 'kuis' });
  expect(bacaRute(tautanLatihan('kuis', 'bab-4'))).toEqual({ halaman: 'latihan', tab: 'kuis', paket: 'bab-4' });
  expect(bacaRute(tautanBelajar())).toEqual({ halaman: 'belajar' });
  expect(bacaRute(tautanBelajar('1-1-apa-itu-faraidh'))).toEqual({ halaman: 'materi', slug: '1-1-apa-itu-faraidh' });
  expect(bacaRute(tautanGlosarium('hajb-hirman'))).toEqual({ halaman: 'glosarium', id: 'hajb-hirman' });
  expect(bacaRute(tautanRujukan('R09-4'))).toEqual({ halaman: 'rujukan', kode: 'R09-4' });
  expect(bacaRute('#/rujukan/sunnah')).toEqual({ halaman: 'rujukan', kategori: 'sunnah' });
  expect(bacaRute('#/rujukan/kitab/0')).toEqual({ halaman: 'rujukan', kategori: 'kitab', kitab: '0' });
});

it('induk untuk tombol Kembali saat halaman dibuka langsung', () => {
  expect(tautanInduk(bacaRute(tautanFaq('apa-itu')))).toBe(tautanBelajar());
  expect(tautanInduk(bacaRute(tautanRujukan('R09-4')))).toBe(tautanRujukan());
  expect(tautanInduk(bacaRute(tautanLatihan('kuis', 'bab-4')))).toBe(tautanLatihan('kuis'));
  expect(tautanInduk(bacaRute('#/riwayat'))).toBe(TAUTAN_KALKULATOR);
  expect(tautanInduk(bacaRute(tautanPeringkat()))).toBe(TAUTAN_BERANDA);
});

it('posisi kasus di URL: hasil, wizard (langkah+babak), cerita', () => {
  const awal = { layar: 'awal', langkah: 1, babak: 0, ada: true };
  expect(tautanKasus('abc', awal)).toBe('#/hitung');
  expect(tautanKasus('abc', { ...awal, layar: 'hasil' })).toBe('#/hitung/abc');
  expect(tautanKasus('abc', { ...awal, layar: 'wizard', langkah: 3, babak: 2 })).toBe('#/hitung/abc/langkah/3/2');
  expect(tautanKasus('abc', { ...awal, layar: 'cerita' })).toBe('#/hitung/abc/cerita');
  expect(tautanKasus('abc', { ...awal, layar: 'hasil', ada: false })).toBe('#/hitung');
  // Layar keadaan (langkah 3, bagian 'keadaan') ikut ke URL; layar daftar tetap memakai tautan lama.
  expect(tautanKasus('abc', { ...awal, layar: 'wizard', langkah: 3, babak: 0, bagian: 'keadaan' })).toBe('#/hitung/abc/langkah/3/0/keadaan');
  expect(tautanKasus('abc', { ...awal, layar: 'wizard', langkah: 3, babak: 1, bagian: 'daftar' })).toBe('#/hitung/abc/langkah/3/1');
  expect(tautanKasus('abc', { ...awal, layar: 'wizard', langkah: 2, babak: 0, bagian: 'keadaan' })).toBe('#/hitung/abc/langkah/2');
  for (const posisi of [{ layar: 'hasil' }, { layar: 'cerita' }] as const) {
    expect(bacaRute(tautanKasus('abc', { langkah: 1, babak: 0, ada: true, ...posisi }))).toEqual({ halaman: 'kalkulator', kasus: { id: 'abc', ...posisi } });
  }
  for (const posisi of [{ langkah: 3, babak: 2, bagian: 'daftar' }, { langkah: 3, babak: 0, bagian: 'keadaan' }, { langkah: 2, babak: 0, bagian: 'daftar' }] as const) {
    const tautan = tautanKasus('abc', { layar: 'wizard', ada: true, ...posisi });
    expect(bacaRute(tautan)).toEqual({ halaman: 'kalkulator', kasus: { id: 'abc', layar: 'wizard', ...posisi } });
  }
});
