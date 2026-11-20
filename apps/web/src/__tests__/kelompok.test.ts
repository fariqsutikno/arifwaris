import { describe, expect, it } from 'vitest';
import { kasusBaru, type Kasus, type Kelompok } from '../kasus';
import { anggotaBagian, awalCabang, bagianDariOrang, bagianDilewati, bagianLengkap, daftarBagian } from '../kelompok';
import { isiBarisTetap, tambahBaris } from '../isianBagian';
import { statusKeluarga } from '../statusKeluarga';
import { jalankan } from '@waris/latihan';
import { posisiPerluDitanya } from '../ujiHipotetis';
import { keluargaBudi, keluargaKarto, tambah } from './fixtures/kanvas';

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

describe('cucu dari anak yang wafat sebelum (review K2)', () => {
  /** Pewaris laki-laki, satu-satunya anak (Slamet) wafat sebelum pewaris. */
  function anakTunggalWafat() {
    const { kasus, id } = tambah(kasusBaru('L'), 'PEWARIS', 'ANAK_LK', { nama: 'Slamet', statusHidup: 'wafat' });
    return { kasus: { ...kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak'] as Kelompok[] } }, slamet: id };
  }

  it('bagian cucu muncul bila posisinya berpengaruh menurut engine, dan tidak dicatat sebagai dilewati', () => {
    const { kasus, slamet } = anakTunggalWafat();
    expect(ids(kasus)).toContain(`anak:${slamet}`);
    expect(ids(kasus).indexOf(`anak:${slamet}`)).toBe(ids(kasus).indexOf('anak:PEWARIS') + 1);
    expect(bagianDilewati(kasus).filter(d => d.jenis === 'anakDariWafat')).toEqual([]);
    expect(statusKeluarga(kasus).sisa).toBeGreaterThan(0);
  });

  it('bagian cucu belum dijawab menahan status; menjawab (Tidak) melengkapinya', () => {
    const { kasus, slamet } = anakTunggalWafat();
    const bagian = daftarBagian(kasus).find(b => b.id === `anak:${slamet}`)!;
    expect(bagianLengkap(kasus, bagian)).toBe(false);
    expect(bagianLengkap({ ...kasus, kelompokDijawab: { ...kasus.kelompokDijawab, [slamet]: ['anak'] } }, bagian)).toBe(true);
  });

  it('tidak berpengaruh (ada anak laki-laki hidup): tidak tampil, dilewati; tampil bila sudah dijawab atau punya anggota', () => {
    const { kasus, slamet } = keluargaKarto();
    const dijawab: Kasus = { ...kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak'] } };
    expect(ids(dijawab)).not.toContain(`anak:${slamet}`);
    expect(bagianDilewati(dijawab)).toContainEqual({ jenis: 'anakDariWafat', milik: 'PEWARIS', sebab: slamet });
    const dibuka = { ...dijawab, kelompokDijawab: { ...dijawab.kelompokDijawab, [slamet]: ['anak' as Kelompok] } };
    expect(ids(dibuka)).toContain(`anak:${slamet}`);
    expect(bagianDilewati(dibuka).filter(d => d.jenis === 'anakDariWafat')).toEqual([]);
    const denganCucu = tambahBaris(dijawab, { id: `anak:${slamet}`, milik: slamet, jenis: 'anak' }, 'ANAK_LK');
    expect(ids(denganCucu)).toContain(`anak:${slamet}`);
  });

  it('awalCabang salah untuk bagian cucu (ia bukan cabang urutan wafat)', () => {
    const { kasus, slamet } = anakTunggalWafat();
    expect(awalCabang(kasus, daftarBagian(kasus).find(b => b.id === `anak:${slamet}`)!)).toBe(false);
  });
});

describe('anak dari kerabat jauh yang wafat sebelum (pohon bebas)', () => {
  /** Pewaris laki-laki yatim piatu tanpa keturunan; satu keponakan (Joko) wafat. */
  function keponakanWafat() {
    const { kasus, id } = tambah(kasusBaru('L'), 'PEWARIS', 'KEPONAKAN_KANDUNG', { nama: 'Joko', statusHidup: 'wafat' });
    return { kasus: { ...kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak', 'orangTua', 'saudara', 'jauh'] as Kelompok[] } }, joko: id };
  }

  it('keponakan wafat memunculkan bagian "Anak Joko" tepat sesudah kerabat jauh', () => {
    const { kasus, joko } = keponakanWafat();
    expect(ids(kasus).indexOf(`anak:${joko}`)).toBe(ids(kasus).indexOf('jauh:PEWARIS') + 1);
  });

  it('keponakan hidup tidak punya bagian anak', () => {
    const { kasus, id } = tambah(kasusBaru('L'), 'PEWARIS', 'KEPONAKAN_KANDUNG', { nama: 'Joko' });
    expect(ids({ ...kasus, kelompokDijawab: { PEWARIS: ['anak', 'jauh'] } })).not.toContain(`anak:${id}`);
  });

  it('berulang ke bawah: anak Joko yang wafat membuka "Anak Doni", dan tiap orang hanya di satu bagian', () => {
    const { kasus, joko } = keponakanWafat();
    const dengan = tambahBaris(kasus, { id: `anak:${joko}`, milik: joko, jenis: 'anak' }, 'ANAK_LK');
    const doni = Object.keys(dengan.graf.orang).find(id => dengan.graf.orang[dengan.graf.orang[id]!.idAyah ?? '']?.nama === 'Joko')!;
    const wafat: Kasus = { ...dengan, graf: { ...dengan.graf, orang: { ...dengan.graf.orang, [doni]: { ...dengan.graf.orang[doni]!, statusHidup: 'wafat' } } } };
    expect(ids(wafat)).toContain(`anak:${doni}`);
    const jauh = daftarBagian(wafat).find(b => b.id === 'jauh:PEWARIS')!;
    expect(anggotaBagian(wafat, jauh)).not.toContain(doni);
    expect(bagianDariOrang(wafat, doni)?.id).toBe(`anak:${joko}`);
  });
});

describe('saudara kakek (paman ayah) masuk lewat kakek yang wafat', () => {
  /** Pewaris laki-laki tanpa keturunan; ayah wafat; kakek dari ayah dengan keadaan `keadaanKakek`. */
  function denganKakek(keadaanKakek: 'wafat' | 'hidup') {
    let r = tambah(kasusBaru('L'), 'PEWARIS', 'AYAH', { statusHidup: 'wafat' });
    r = tambah(r.kasus, 'PEWARIS', 'KAKEK', { nama: 'Kakek', statusHidup: keadaanKakek });
    const kasus: Kasus = { ...r.kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak', 'orangTua', 'kakekNenek'] as Kelompok[] } };
    return { kasus, kakek: r.id };
  }

  it('kakek wafat: bagian "Saudara laki-laki kakek" tampil tepat sesudah kakek-nenek', () => {
    const { kasus, kakek } = denganKakek('wafat');
    expect(ids(kasus).indexOf(`saudaraKakek:${kakek}`)).toBe(ids(kasus).indexOf('kakekNenek:PEWARIS') + 1);
  });

  it('kakek hidup: bagian tidak tampil', () => {
    const { kasus, kakek } = denganKakek('hidup');
    expect(ids(kasus)).not.toContain(`saudaraKakek:${kakek}`);
  });

  it('paman ayah kandung hanya di bagian saudara kakek, tidak ganda di kerabat jauh, dan menerima saham', () => {
    const { kasus, kakek } = denganKakek('wafat');
    const dengan = tambahBaris(kasus, { id: `saudaraKakek:${kakek}`, milik: kakek, jenis: 'saudaraKakek' }, 'SAUDARA_KANDUNG');
    const paman = Object.keys(dengan.graf.orang).find(id => !kasus.graf.orang[id] && !dengan.graf.orang[id]!.penghubung)!;
    const semua = daftarBagian(dengan);
    expect(semua.filter(b => anggotaBagian(dengan, b).includes(paman)).map(b => b.id)).toEqual([`saudaraKakek:${kakek}`]);
    expect(bagianDariOrang(dengan, paman)?.id).toBe(`saudaraKakek:${kakek}`);
    const tampil = jalankan(dengan);
    if (tampil.jenis !== 'biasa' || tampil.hasil.status !== 'OK') throw new Error(JSON.stringify(tampil));
    expect(tampil.hasil.tabel.baris.some(baris => (baris.perOrang[paman]?.saham ?? 0n) > 0n)).toBe(true);
  });
});

describe('kakek-nenek ditanya menurut engine, bukan menurut Ayah wafat (review P4)', () => {
  const ORANG_TUA = { id: 'orangTua:PEWARIS', milik: 'PEWARIS', jenis: 'orangTua' as const };
  const denganOrangTua = (ayah: 'hidup' | 'belumTahu' | 'hilang') => {
    let k: Kasus = { ...kasusBaru('L'), kelompokDijawab: { PEWARIS: ['pasangan', 'anak'] } };
    k = isiBarisTetap(k, ORANG_TUA, 'AYAH', ayah);
    k = isiBarisTetap(k, ORANG_TUA, 'IBU', 'hidup');
    return k;
  };

  it('Ayah belum tahu: kakek-nenek muncul bila engine menyatakan posisinya berpengaruh', () => {
    const k = denganOrangTua('belumTahu');
    expect(posisiPerluDitanya(k, 'PEWARIS', 'KAKEK')).toBe(true);
    expect(ids(k)).toContain('kakekNenek:PEWARIS');
  });

  it('Ayah hilang: kakek-nenek muncul', () => {
    expect(ids(denganOrangTua('hilang'))).toContain('kakekNenek:PEWARIS');
  });

  it('Ayah hidup: kakek tertutup (engine), kakek-nenek tidak ditanya; kasus kosong juga tidak', () => {
    expect(ids(denganOrangTua('hidup'))).not.toContain('kakekNenek:PEWARIS');
    expect(ids(kasusBaru('L'))).not.toContain('kakekNenek:PEWARIS');
  });

  it('"kenapa kakek-nenek tidak ditanyakan" tidak muncul untuk yang berpengaruh, atau selama orang tua belum dijawab', () => {
    const k = denganOrangTua('belumTahu');
    expect(bagianDilewati(k).some(d => d.jenis === 'kakekNenek')).toBe(false);
    const belumDijawab: Kasus = { ...kasusBaru('L'), kelompokDijawab: { PEWARIS: ['pasangan', 'anak'] } };
    const denganAyahWafat = tambah(belumDijawab, 'PEWARIS', 'AYAH', { statusHidup: 'wafat' }).kasus;
    expect(bagianDilewati(denganAyahWafat).some(d => d.jenis === 'kakekNenek')).toBe(false);
  });
});

it('bagianDariOrang: Dewi → pasangan:{budi}; orang tak dikenal → null', () => {
  const { kasus, budi, dewi } = keluargaKarto();
  expect(bagianDariOrang(kasus, dewi)?.id).toBe(`pasangan:${budi}`);
  expect(bagianDariOrang(kasus, 'tidak-ada')).toBeNull();
});
