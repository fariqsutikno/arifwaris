import { describe, expect, it } from 'vitest';
import type { Kasus } from '../kasus';
import { babakKisah, catatanKhusus, hidupSekarang, jedaTahun, keadaanSaat, kematianSebelum } from '../kisah';
import { keluargaKarto } from './fixtures/kanvas';

const tahun = (nilai: number) => ({ tahun: nilai, kiraKira: false });

describe('kisah (spec kanvas 7.3)', () => {
  it('babak = pemilik lalu urutan wafat; Slamet dan ayah wafat lebih dulu di luar babak', () => {
    const { kasus, sumi, budi, slamet, ayah } = keluargaKarto();
    expect(babakKisah(kasus).map(babak => babak.idMayit)).toEqual(['PEWARIS', sumi, budi]);
    expect(kematianSebelum(kasus)).toEqual(expect.arrayContaining([slamet, ayah]));
  });

  it('babak Karto: ditinggalkan istri dan anak Budi, Rina; Slamet sudah tiada', () => {
    const { kasus, sumi, budi, rina, slamet } = keluargaKarto();
    const [karto] = babakKisah(kasus);
    expect(karto!.pasangan).toEqual([sumi]);
    expect(new Set(karto!.anak)).toEqual(new Set([budi, rina]));
    expect(karto!.sudahTiada).toContain(slamet);
  });

  it('babak Budi: Mbah Sumi sudah tiada saat Budi wafat', () => {
    const { kasus, sumi, budi, dewi, andi, sari } = keluargaKarto();
    const babakBudi = babakKisah(kasus).find(babak => babak.idMayit === budi)!;
    expect(babakBudi.pasangan).toEqual([dewi]);
    expect(new Set(babakBudi.anak)).toEqual(new Set([andi, sari]));
    expect(babakBudi.sudahTiada).toContain(sumi);
    expect(keadaanSaat(kasus, sumi, budi)).toBe('mati');
    expect(keadaanSaat(kasus, budi, budi)).toBe('pusat');
    expect(keadaanSaat(kasus, budi, 'PEWARIS')).toBe('hidup');
  });

  it('urutan tertunda ditandai di babaknya', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const tertunda: Kasus = { ...kasus, belumPasti: [{ jenis: 'urutan', a: sumi, b: budi, bersamaan: false }] };
    expect(babakKisah(tertunda).find(babak => babak.idMayit === sumi)!.urutanBelumPasti).toBe(true);
  });

  it('jedaTahun hanya bila dua tahun ada', () => {
    expect(jedaTahun(tahun(1975), tahun(1998))).toBe(23);
    expect(jedaTahun(tahun(1975), undefined)).toBeNull();
  });

  it('hidupSekarang: Rina, Dewi, Andi, Sari', () => {
    const { kasus, rina, dewi, andi, sari } = keluargaKarto();
    expect(new Set(hidupSekarang(kasus))).toEqual(new Set([rina, dewi, andi, sari]));
  });

  it('peristiwa ditempel ke babak almarhum sesudahnya', () => {
    const { kasus, sumi, sari } = keluargaKarto();
    const dengan: Kasus = { ...kasus, peristiwa: [{ jenis: 'lahir', idOrang: sari, sesudahWafat: sumi }] };
    expect(babakKisah(dengan).find(babak => babak.idMayit === sumi)!.peristiwaSesudah).toHaveLength(1);
  });

  it('catatanKhusus kosong pada kasus tanpa keadaan khusus', () => {
    expect(catatanKhusus(keluargaKarto().kasus)).toEqual([]);
  });
});
