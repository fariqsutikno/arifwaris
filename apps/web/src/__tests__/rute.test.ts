import { expect, it } from 'vitest';
import { bacaRute, tautanBelajar, tautanFaq, tautanLatihan, tautanGlosarium, tautanRujukan } from '../rute';

it('hash dibaca jadi rute; yang tak dikenal jatuh ke kalkulator', () => {
  expect(bacaRute('')).toEqual({ halaman: 'kalkulator' });
  expect(bacaRute('#/')).toEqual({ halaman: 'kalkulator' });
  expect(bacaRute('#/entah')).toEqual({ halaman: 'kalkulator' });
  expect(bacaRute('#/glosarium')).toEqual({ halaman: 'glosarium' });
  expect(bacaRute('#/riwayat')).toEqual({ halaman: 'riwayat' });
  expect(bacaRute(tautanFaq('apa-itu'))).toEqual({ halaman: 'faq', id: 'apa-itu' });
  expect(bacaRute(tautanLatihan())).toEqual({ halaman: 'latihan', tab: 'hitung' });
  expect(bacaRute(tautanLatihan('kuis'))).toEqual({ halaman: 'latihan', tab: 'kuis' });
  expect(bacaRute(tautanLatihan('kuis', 'bab-4'))).toEqual({ halaman: 'latihan', tab: 'kuis', paket: 'bab-4' });
  expect(bacaRute(tautanBelajar())).toEqual({ halaman: 'belajar' });
  expect(bacaRute(tautanBelajar('1-1-apa-itu-faraidh'))).toEqual({ halaman: 'materi', slug: '1-1-apa-itu-faraidh' });
  expect(bacaRute(tautanGlosarium('hajb-hirman'))).toEqual({ halaman: 'glosarium', id: 'hajb-hirman' });
  expect(bacaRute(tautanRujukan('R09-4'))).toEqual({ halaman: 'rujukan', kode: 'R09-4' });
});
