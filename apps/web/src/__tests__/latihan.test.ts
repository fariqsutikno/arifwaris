import { describe, expect, it } from 'vitest';
import { hitungMunasakhat } from '@waris/engine';
import { hitungIsian, kurangiAhliWaris, tambahAhliWaris } from '../checklist';
import { keInputEngine } from '../jalankan';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { namaSingkat } from '../keadaanOrang';
import { geserUrutan, labelMayit, mayitLatihan, mayitTanpaAhliWaris, orangDiKartu, tandaiWafatSebelumDibagi } from '../latihan';

const tambah = (kasus: Kasus, idMayit: string, ...kunci: Parameters<typeof tambahAhliWaris>[2][]) =>
  kunci.reduce((k, satu) => ({ ...k, graf: tambahAhliWaris(k.graf, idMayit, satu) }), kasus);
const pertama = (kasus: Kasus, idMayit: string, kunci: Parameters<typeof tambahAhliWaris>[2]) => hitungIsian(kasus.graf, idMayit)[kunci]![0]!;
const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));

/** Soal kitab: suami wafat (istri, anak lk, anak pr) → istri wafat → anak lk wafat (istri, anak lk, anak pr). */
function soalA() {
  let k = tambah(kasusBaru('L', 'latihan'), 'PEWARIS', 'ISTRI', 'ANAK_LK', 'ANAK_PR');
  const istri = pertama(k, 'PEWARIS', 'ISTRI'), anakLk = pertama(k, 'PEWARIS', 'ANAK_LK'), anakPr = pertama(k, 'PEWARIS', 'ANAK_PR');
  k = tandaiWafatSebelumDibagi(k, istri, true);
  k = tandaiWafatSebelumDibagi(k, anakLk, true);
  k = tambah(k, anakLk, 'ISTRI', 'ANAK_LK', 'ANAK_PR');
  return { k, istri, anakLk, anakPr };
}

describe('latihan (spec kanvas 6)', () => {
  it('menandai wafat sebelum dibagi menambah kartu mayit, urut sesuai urutan menandai', () => {
    const { k, istri, anakLk } = soalA();
    expect(mayitLatihan(k)).toEqual(['PEWARIS', istri, anakLk]);
  });

  it('kartu mayit lanjutan menghitung orang yang sudah tercatat (ibu = istri mayit pertama), tanpa orang ganda', () => {
    const { k, istri, anakLk, anakPr } = soalA();
    expect(hitungIsian(k.graf, anakLk).IBU).toEqual([istri]);   // ibunya = istri mayit pertama, satu orang di graf
    expect(orangDiKartu(k, istri)).toEqual(expect.arrayContaining([anakLk, anakPr]));
    expect(orangDiKartu(k, anakLk)).not.toContain(istri);
  });

  it('fixture latihan A: Rina 1/3, istri mayit 3 1/12, anak lk 7/18, anak pr 7/36; jami\'ah 72 [R12-2]', () => {
    const { k, anakPr, anakLk } = soalA();
    const hasil = hitungMunasakhat({ dasar: keInputEngine(k), urutanWafat: k.urutanWafat });
    if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    const pecahan = Object.fromEntries(Object.entries(hasil.saham).filter(([, s]) => s > 0n).map(([id, s]) => { const g = fpb(s, hasil.jamiah); return [id, `${s / g}/${hasil.jamiah / g}`]; }));
    const istriB = pertama(k, anakLk, 'ISTRI'), cucuLk = pertama(k, anakLk, 'ANAK_LK'), cucuPr = pertama(k, anakLk, 'ANAK_PR');
    expect(pecahan).toEqual({ [anakPr]: '1/3', [istriB]: '1/12', [cucuLk]: '7/18', [cucuPr]: '7/36' });
    expect(hasil.jamiah).toBe(72n);
  });

  it('lepas tanda menghapus keluarga yang hanya tercatat lewatnya', () => {
    const { k, anakLk } = soalA();
    const lepas = tandaiWafatSebelumDibagi(k, anakLk, false);
    expect(lepas.urutanWafat).not.toContain(anakLk);
    expect(hitungIsian(lepas.graf, anakLk).ISTRI).toBeUndefined();
  });

  it('kurangi orang bertanda wafat: keluar dari urutan wafat', () => {
    const { k, anakLk } = soalA();
    // anakLk punya keturunan → jadi penghubung; rapikanKeadaan (dipanggil reducer) membuangnya dari urutan wafat
    const kurang = rapikanKeadaan({ ...k, graf: kurangiAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') });
    expect(mayitLatihan(kurang)).not.toContain(anakLk);
  });

  it('geserUrutan menukar posisi di urutan wafat; batas tidak berubah', () => {
    const { k, istri, anakLk } = soalA();
    expect(geserUrutan(k, anakLk, -1).urutanWafat).toEqual([anakLk, istri]);
    expect(geserUrutan(k, istri, -1)).toBe(k);
  });

  it('labelMayit: nama bila ada, selain itu peran dari sisi mayit sebelumnya', () => {
    const { k, anakLk } = soalA();
    expect(labelMayit(k, 'PEWARIS')).toBe(namaSingkat(k, 'PEWARIS'));
    expect(labelMayit(k, anakLk).toLowerCase()).toContain('anak laki-laki');
  });

  it('mayitTanpaAhliWaris: kartu tanpa ahli waris hidup ditemukan', () => {
    let k = tambah(kasusBaru('L', 'latihan'), 'PEWARIS', 'ANAK_LK', 'ANAK_LK');
    const [a1] = hitungIsian(k.graf, 'PEWARIS').ANAK_LK!;
    k = tandaiWafatSebelumDibagi(k, a1!, true);
    expect(mayitTanpaAhliWaris(k)).toBeNull();   // a1 punya saudara a2 yang hidup
    expect(mayitTanpaAhliWaris(tambah(kasusBaru('L', 'latihan'), 'PEWARIS'))).toBe('PEWARIS');
  });
});
