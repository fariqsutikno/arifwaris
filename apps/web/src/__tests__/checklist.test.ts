import { describe, expect, it } from 'vitest';
import type { GrafKeluarga } from '@waris/engine';
import { daftarInduk, hitungIsian, kurangiAhliWaris, tambahAhliWaris } from '../checklist';

const grafAwal = (jenisKelamin: 'L' | 'P'): GrafKeluarga => ({
  idPewaris: 'PEWARIS',
  orang: { PEWARIS: { id: 'PEWARIS', jenisKelamin, statusHidup: 'wafat', agama: 'islam' } },
  pernikahan: [],
});
const jumlah = (graf: GrafKeluarga, idMayit = 'PEWARIS') =>
  Object.fromEntries(Object.entries(hitungIsian(graf, idMayit)).map(([kunci, ids]) => [kunci, ids!.length]));

describe('checklist', () => {
  it('menambah anak, istri, orang tua', () => {
    let graf = grafAwal('L');
    for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_LK', 'ANAK_PR', 'AYAH', 'IBU'] as const) graf = tambahAhliWaris(graf, 'PEWARIS', kunci);
    expect(jumlah(graf)).toEqual({ ISTRI: 1, ANAK_LK: 2, ANAK_PR: 1, AYAH: 1, IBU: 1 });
  });

  it('saudara diisi sebelum ibu: ibu tetap satu, saudara tetap kandung', () => {
    let graf = tambahAhliWaris(grafAwal('L'), 'PEWARIS', 'SAUDARA_KANDUNG');
    graf = tambahAhliWaris(graf, 'PEWARIS', 'IBU');
    expect(jumlah(graf)).toEqual({ SAUDARA_KANDUNG: 1, IBU: 1 });
  });

  it('saudara sebapak dan seibu dibedakan lewat orang tua', () => {
    let graf = grafAwal('P');
    for (const kunci of ['SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU'] as const) graf = tambahAhliWaris(graf, 'PEWARIS', kunci);
    expect(jumlah(graf)).toEqual({ SAUDARA_SEBAPAK: 1, SAUDARI_SEBAPAK: 1, SAUDARA_SEIBU: 1 });
  });

  it('cucu tanpa anak lk yang hidup: induk dibuat sebagai penghubung wafat', () => {
    const graf = tambahAhliWaris(grafAwal('L'), 'PEWARIS', 'CUCU_LK');
    expect(jumlah(graf)).toEqual({ CUCU_LK: 1 });
    expect(daftarInduk(graf, 'PEWARIS', 'ANAK_LK')).toHaveLength(1);
  });

  it('cucu kedua memakai induk penghubung yang sama bila tidak dipilih', () => {
    let graf = tambahAhliWaris(grafAwal('L'), 'PEWARIS', 'CUCU_LK');
    graf = tambahAhliWaris(graf, 'PEWARIS', 'CUCU_PR');
    expect(daftarInduk(graf, 'PEWARIS', 'ANAK_LK')).toHaveLength(1);
  });

  it('paman dan sepupu', () => {
    let graf = tambahAhliWaris(grafAwal('L'), 'PEWARIS', 'PAMAN_KANDUNG');
    graf = tambahAhliWaris(graf, 'PEWARIS', 'SEPUPU_KANDUNG');
    expect(jumlah(graf)).toEqual({ PAMAN_KANDUNG: 1, SEPUPU_KANDUNG: 1 });
  });

  it('mengurangi anak lk yang punya cucu: anak jadi penghubung, cucu tetap', () => {
    let graf = tambahAhliWaris(grafAwal('L'), 'PEWARIS', 'ANAK_LK');
    const [idAnak] = hitungIsian(graf, 'PEWARIS').ANAK_LK!;
    graf = tambahAhliWaris(graf, 'PEWARIS', 'CUCU_LK', { idInduk: idAnak! });
    graf = kurangiAhliWaris(graf, 'PEWARIS', 'ANAK_LK');
    expect(jumlah(graf)).toEqual({ CUCU_LK: 1 });
    expect(graf.orang[idAnak!]).toMatchObject({ penghubung: true, statusHidup: 'wafat' });
  });

  it('mengurangi orang tanpa keturunan: dihapus bersama pernikahannya', () => {
    let graf = tambahAhliWaris(grafAwal('L'), 'PEWARIS', 'ISTRI');
    graf = kurangiAhliWaris(graf, 'PEWARIS', 'ISTRI');
    expect(Object.keys(graf.orang)).toEqual(['PEWARIS']);
    expect(graf.pernikahan).toEqual([]);
  });

  it('anak dari suami (mayit munasakhat) tidak menjadi anak pewaris wanita yang sudah wafat', () => {
    let graf = tambahAhliWaris(grafAwal('P'), 'PEWARIS', 'SUAMI');
    const [idSuami] = hitungIsian(graf, 'PEWARIS').SUAMI!;
    graf = tambahAhliWaris(graf, idSuami!, 'ANAK_LK');
    expect(jumlah(graf)).toEqual({ SUAMI: 1 });
    expect(jumlah(graf, idSuami!)).toMatchObject({ ANAK_LK: 1 });
  });

  it('anak pewaris wanita dengan suami hidup: suami jadi ayahnya', () => {
    let graf = tambahAhliWaris(grafAwal('P'), 'PEWARIS', 'SUAMI');
    graf = tambahAhliWaris(graf, 'PEWARIS', 'ANAK_PR');
    const [idSuami] = hitungIsian(graf, 'PEWARIS').SUAMI!;
    expect(jumlah(graf, idSuami!)).toMatchObject({ ANAK_PR: 1 });
  });

  it('menolak melebihi batas (ayah kedua)', () => {
    const graf = tambahAhliWaris(grafAwal('L'), 'PEWARIS', 'AYAH');
    expect(() => tambahAhliWaris(graf, 'PEWARIS', 'AYAH')).toThrow();
  });
});
