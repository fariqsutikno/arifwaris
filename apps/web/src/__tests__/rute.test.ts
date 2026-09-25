import { expect, it } from 'vitest';
import { bacaRute, tautanGlosarium, tautanRujukan } from '../rute';

it('hash dibaca jadi rute; yang tak dikenal jatuh ke kalkulator', () => {
  expect(bacaRute('')).toEqual({ halaman: 'kalkulator' });
  expect(bacaRute('#/')).toEqual({ halaman: 'kalkulator' });
  expect(bacaRute('#/entah')).toEqual({ halaman: 'kalkulator' });
  expect(bacaRute('#/glosarium')).toEqual({ halaman: 'glosarium' });
  expect(bacaRute(tautanGlosarium('hajb-hirman'))).toEqual({ halaman: 'glosarium', id: 'hajb-hirman' });
  expect(bacaRute(tautanRujukan('R09-4'))).toEqual({ halaman: 'rujukan', kode: 'R09-4' });
});
