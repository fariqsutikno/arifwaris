import { describe, expect, it } from 'vitest';
import { ubahOrang } from '../checklist';
import { menerima, posisiPerluDitanya, urutanBerpengaruh } from '../ujiHipotetis';
import { keluargaBudi, keluargaKarto, tambah } from './fixtures/kanvas';
import { kasusBaru } from '../kasus';

describe('ujiHipotetis (spec kanvas 9.3)', () => {
  it('graf contoh: anak Karto beribu Sumi, Andi & Sari menerima di akhir', () => {
    const { kasus, budi, sumi, andi, rina, slamet } = keluargaKarto();
    expect(kasus.graf.orang[budi]!.idIbu).toBe(sumi);
    expect(menerima(kasus, andi)).toBe(true);
    expect(menerima(kasus, rina)).toBe(true);
    expect(menerima(kasus, slamet)).toBe(false);
  });

  it('saudara Karto tidak ditanya: ada anak laki-laki [R06-4]', () => {
    expect(posisiPerluDitanya(keluargaKarto().kasus, 'PEWARIS', 'SAUDARA_KANDUNG')).toBe(false);
  });

  it('kakek Karto ditanya: ayah sudah wafat', () => {
    expect(posisiPerluDitanya(keluargaKarto().kasus, 'PEWARIS', 'KAKEK')).toBe(true);
  });

  it('cucu dari Slamet (wafat lebih dulu) tidak ditanya: Budi masih hidup saat Karto wafat', () => {
    const { kasus, slamet } = keluargaKarto();
    expect(posisiPerluDitanya(kasus, 'PEWARIS', 'CUCU_LK', { idInduk: slamet })).toBe(false);
  });

  it('Budi tak menikah: paman tidak ditanya (ada saudara laki-laki), kakek ditanya (muqasamah) [R08-1]', () => {
    const { kasus } = keluargaBudi();
    expect(posisiPerluDitanya(kasus, 'PEWARIS', 'PAMAN_KANDUNG')).toBe(false);
    expect(posisiPerluDitanya(kasus, 'PEWARIS', 'KAKEK')).toBe(true);
  });

  it('posisi yang sudah penuh (kakek sudah diisi) tidak ditanya lagi', () => {
    expect(posisiPerluDitanya(keluargaBudi(true).kasus, 'PEWARIS', 'KAKEK')).toBe(false);
  });

  it('orang belum pasti → tetap ditanya (uji tidak dipercaya)', () => {
    const { kasus, budi } = keluargaKarto();
    const ragu = { ...kasus, graf: ubahOrang(kasus.graf, budi, { statusHidup: 'tidakDiketahui' }) };
    expect(posisiPerluDitanya(ragu, 'PEWARIS', 'SAUDARA_KANDUNG')).toBe(true);
  });

  it('urutan Sumi–Budi berpengaruh (fixture A vs A2)', () => {
    const { kasus, sumi } = keluargaKarto();
    expect(urutanBerpengaruh(kasus, sumi)).toBe(true);
  });

  it('urutan dua anak yang masing-masing punya anak laki-laki tidak berpengaruh', () => {
    let k = kasusBaru('L');
    let r = tambah(k, 'PEWARIS', 'ANAK_LK'); k = r.kasus; const b1 = r.id;
    r = tambah(k, 'PEWARIS', 'ANAK_LK'); k = r.kasus; const b2 = r.id;
    r = tambah(k, b1, 'ANAK_LK'); k = r.kasus;
    r = tambah(k, b2, 'ANAK_LK'); k = r.kasus;
    expect(urutanBerpengaruh({ ...k, urutanWafat: [b1, b2] }, b1)).toBe(false);
  });
});
