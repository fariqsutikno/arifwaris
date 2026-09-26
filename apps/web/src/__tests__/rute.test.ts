import { expect, it } from 'vitest';
import { TAUTAN_KALKULATOR, bacaRute, tautanInduk, tautanBelajar, tautanFaq, tautanTanyaJawab, tautanLatihan, tautanGlosarium, tautanRujukan } from '../rute';

it('hash dibaca jadi rute; yang tak dikenal jatuh ke beranda', () => {
  expect(bacaRute('')).toEqual({ halaman: 'beranda' });
  expect(bacaRute('#/')).toEqual({ halaman: 'beranda' });
  expect(bacaRute('#/entah')).toEqual({ halaman: 'beranda' });
  expect(bacaRute('#/hitung')).toEqual({ halaman: 'kalkulator' });
  expect(bacaRute('#/glosarium')).toEqual({ halaman: 'glosarium' });
  expect(bacaRute('#/riwayat')).toEqual({ halaman: 'riwayat' });
  expect(bacaRute(tautanFaq('apa-itu'))).toEqual({ halaman: 'faq', id: 'apa-itu' });
  expect(bacaRute(tautanTanyaJawab('sengketa'))).toEqual({ halaman: 'tanya-jawab', id: 'sengketa' });
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
});
