import { describe, expect, it } from 'vitest';
import { kasusBaru, type Kasus, type Kelompok } from '../kasus';
import { anggotaBagian, awalCabang, bagianDilewati, bagianLengkap, daftarBagian } from '../kelompok';
import { keluargaBudi, keluargaKarto } from './fixtures/kanvas';

const ids = (kasus: Kasus) => daftarBagian(kasus).map(b => b.id);

describe('kelompok (spec kanvas 5.2)', () => {
  it('kasus kosong: pasangan, anak, orang tua, hal lain, kamu', () => {
    expect(ids(kasusBaru('L'))).toEqual(['pasangan:PEWARIS', 'anak:PEWARIS', 'orangTua:PEWARIS', 'halLain:PEWARIS', 'kamu']);
  });

  it('Karto: kakek-nenek muncul (ayah wafat), saudara tidak (ada anak lk); cabang Sumi dan Budi; urutan', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const k: Kasus = { ...kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak', 'orangTua'] } };
    expect(ids(k)).toEqual([
      'pasangan:PEWARIS', 'anak:PEWARIS', 'orangTua:PEWARIS', 'kakekNenek:PEWARIS', 'halLain:PEWARIS',
      `anakBersama:${sumi}`, `orangTua:${sumi}`, `halLain:${sumi}`,
      `pasangan:${budi}`, `anak:${budi}`, `halLain:${budi}`,
      'urutan', 'kamu',
    ]);
  });

  it('Budi tak menikah: saudara muncul sesudah anak dijawab; kerabat jauh tidak (ada saudara lk)', () => {
    const { kasus } = keluargaBudi();
    const k: Kasus = { ...kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak', 'orangTua', 'kakekNenek'] } };
    expect(ids(k)).toContain('saudara:PEWARIS');
    expect(ids(k)).not.toContain('jauh:PEWARIS');
  });

  it('bagian yang sudah berisi tetap tampil walau tidak lagi "perlu ditanya" (kakek sudah diisi)', () => {
    const { kasus } = keluargaBudi(true);
    expect(ids(kasus)).toContain('kakekNenek:PEWARIS');
  });

  it('anggota bagian: anak Karto, orang tua Karto, anak Karto bersama Sumi', () => {
    const { kasus, slamet, budi, rina, ayah, sumi } = keluargaKarto();
    const bagian = daftarBagian(kasus);
    expect(new Set(anggotaBagian(kasus, bagian.find(b => b.id === 'anak:PEWARIS')!))).toEqual(new Set([slamet, budi, rina]));
    expect(anggotaBagian(kasus, bagian.find(b => b.id === 'orangTua:PEWARIS')!)).toEqual([ayah]);
    expect(new Set(anggotaBagian(kasus, bagian.find(b => b.id === `anakBersama:${sumi}`)!))).toEqual(new Set([slamet, budi, rina]));
  });

  it('anakBersama hanya anak pewaris dengan pemilik cabang, bukan anak dari pasangan lain', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const { idIbu: _dicabut, ...budiTanpaIbu } = kasus.graf.orang[budi]!;
    const dariIstriLain: Kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [budi]: budiTanpaIbu } } };
    const bagian = daftarBagian(dariIstriLain).find(b => b.id === `anakBersama:${sumi}`)!;
    expect(anggotaBagian(dariIstriLain, bagian)).not.toContain(budi);
  });

  it('bagianLengkap: perlu dijawab, dan tidak ada anggota yang belum diisi', () => {
    const { kasus, budi } = keluargaKarto();
    const anak = daftarBagian(kasus).find(b => b.id === 'anak:PEWARIS')!;
    expect(bagianLengkap(kasus, anak)).toBe(false);
    const dijawab: Kasus = { ...kasus, kelompokDijawab: { PEWARIS: ['anak'] } };
    expect(bagianLengkap(dijawab, anak)).toBe(true);
    expect(bagianLengkap({ ...dijawab, belumDiisi: [budi] }, anak)).toBe(false);
  });

  it('bagian kamu lengkap bila saya dijawab, termasuk null', () => {
    const kamu = { id: 'kamu', milik: 'PEWARIS', jenis: 'kamu' as const };
    expect(bagianLengkap(kasusBaru('L'), kamu)).toBe(false);
    expect(bagianLengkap({ ...kasusBaru('L'), saya: null }, kamu)).toBe(true);
  });
});

describe('awalCabang dan bagianDilewati (spec kanvas 5.2, 5.7)', () => {
  it('awalCabang benar untuk bagian pertama cabang, salah untuk bagian pewaris dan bagian lanjutan cabang', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const bagian = daftarBagian(kasus);
    const ambil = (id: string) => bagian.find(b => b.id === id)!;
    expect(awalCabang(kasus, ambil(`anakBersama:${sumi}`))).toBe(true);
    expect(awalCabang(kasus, ambil(`pasangan:${budi}`))).toBe(true);
    expect(awalCabang(kasus, ambil(`orangTua:${sumi}`))).toBe(false);
    expect(awalCabang(kasus, ambil('anak:PEWARIS'))).toBe(false);
  });

  it('Karto dengan anak dijawab: saudara dan kerabat jauh dilewati, anak Slamet (wafat sebelum) dicatat', () => {
    const { kasus, slamet } = keluargaKarto();
    const dijawab = { ...kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak'] as Kelompok[] } };
    const dilewati = bagianDilewati(dijawab);
    expect(dilewati).toContainEqual({ jenis: 'saudara', milik: 'PEWARIS' });
    expect(dilewati).toContainEqual({ jenis: 'jauh', milik: 'PEWARIS' });
    expect(dilewati).toContainEqual({ jenis: 'anakDariWafat', milik: 'PEWARIS', sebab: slamet });
  });

  it('tanpa jawaban anak tidak ada yang dilewati; bagian yang tampil tidak dicatat sebagai dilewati', () => {
    const { kasus } = keluargaKarto();
    expect(bagianDilewati(kasus).filter(d => d.jenis === 'saudara' || d.jenis === 'jauh')).toEqual([]);
    const { kasus: budi } = keluargaBudi();
    const k: Kasus = { ...budi, kelompokDijawab: { PEWARIS: ['pasangan', 'anak', 'orangTua', 'kakekNenek'] } };
    expect(bagianDilewati(k).find(d => d.jenis === 'saudara')).toBeUndefined();   // saudara tampil di keluarga Budi
  });
});
