import { describe, expect, it } from 'vitest';
import { tundaUrutan } from '../antreanUrutan';
import { bisaDihitungDenganKemungkinan, daftarBelumPasti } from '../belumPasti';
import { keluargaKarto, tambah } from './fixtures/kanvas';

describe('belumPasti (spec kanvas 7.1)', () => {
  it('ibu Karto belum tahu → satu hal keadaan dengan milik = PEWARIS; masih bisa dihitung dengan kemungkinan', () => {
    const { kasus: dasar } = keluargaKarto();
    const { kasus, id: ibu } = tambah(dasar, 'PEWARIS', 'IBU', { statusHidup: 'tidakDiketahui' });
    expect(daftarBelumPasti(kasus)).toEqual([{ jenis: 'keadaan', orang: ibu, milik: 'PEWARIS' }]);
    expect(bisaDihitungDenganKemungkinan(kasus)).toBe(true);
  });

  it('urutan tertunda → tidak bisa dihitung dengan kemungkinan (P1)', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const tunda = tundaUrutan(kasus, sumi, budi);
    expect(daftarBelumPasti(tunda)).toEqual([{ jenis: 'urutan', a: sumi, b: budi }]);
    expect(bisaDihitungDenganKemungkinan(tunda)).toBe(false);
  });
});
