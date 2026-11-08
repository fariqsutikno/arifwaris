import { describe, expect, it } from 'vitest';
import { ubahNama } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { bagianLengkap, daftarBagian, type Bagian } from '../kelompok';
import { jawabLanjutan } from '../keadaanBaris';
import {
  calonKamu, dampakAdaKeTidak, hapusBaris, isiBarisTetap, jawabAdaTidak, jawabKamu, kunciBagian, kurangiBarisKosong, slotTetap, tambahBaris,
} from '../isianBagian';
import { keluargaKarto } from './fixtures/kanvas';

const bagianDari = (kasus: Kasus, id: string): Bagian => daftarBagian(kasus).find(b => b.id === id)!;
const PASANGAN: Bagian = { id: 'pasangan:PEWARIS', milik: 'PEWARIS', jenis: 'pasangan' };
const ORANG_TUA: Bagian = { id: 'orangTua:PEWARIS', milik: 'PEWARIS', jenis: 'orangTua' };

describe('penghitung (spec kanvas 5.4)', () => {
  it('tambahBaris menandai belumDiisi dan bagian dijawab; kurangiBarisKosong hanya membuang baris kosong terakhir', () => {
    let kasus = tambahBaris(tambahBaris(kasusBaru('L'), PASANGAN, 'ISTRI'), PASANGAN, 'ISTRI');
    expect(kasus.belumDiisi).toHaveLength(2);
    expect(kasus.kelompokDijawab?.PEWARIS).toContain('pasangan');
    const [pertama, kedua] = kasus.belumDiisi!;
    kasus = { ...kasus, graf: ubahNama(kasus.graf, pertama!, 'Siti') };
    const sisa = kurangiBarisKosong(kasus, PASANGAN, 'ISTRI')!;
    expect(sisa.graf.orang[kedua!]).toBeUndefined();
    expect(sisa.belumDiisi).toEqual([pertama]);
    expect(kurangiBarisKosong(sisa, PASANGAN, 'ISTRI')).toBeNull();   // yang tersisa sudah bernama
  });

  it('membuang baris kosong terakhir membuka lagi bagian bila tak ada yang tersisa', () => {
    const satu = tambahBaris(kasusBaru('L'), PASANGAN, 'ISTRI');
    const kosong = kurangiBarisKosong(satu, PASANGAN, 'ISTRI')!;
    expect(kosong.kelompokDijawab?.PEWARIS ?? []).not.toContain('pasangan');
    expect(kosong.belumDiisi).toBeUndefined();
  });

  it('istri maksimal 4: baris kelima melempar galat yang sama dengan checklist', () => {
    let kasus = kasusBaru('L');
    for (let i = 0; i < 4; i++) kasus = tambahBaris(kasus, PASANGAN, 'ISTRI');
    expect(() => tambahBaris(kasus, PASANGAN, 'ISTRI')).toThrow(/maksimal/);
  });

  it('pasangan laki-laki menghitung istri, perempuan suami', () => {
    expect(kunciBagian(kasusBaru('L'), PASANGAN)).toEqual(['ISTRI']);
    expect(kunciBagian(kasusBaru('P'), PASANGAN)).toEqual(['SUAMI']);
  });
});

describe('Ya / Tidak', () => {
  it('Ya → Tidak menghapus seluruh cabang (Review Focus 2)', () => {
    const { kasus, budi, slamet, rina, dewi, andi, sari, sumi } = keluargaKarto();
    const isi: Kasus = { ...kasus, kelompokDijawab: { PEWARIS: ['anak'], [budi]: ['anak'] } };
    const anak = bagianDari(isi, 'anak:PEWARIS');
    expect(new Set(dampakAdaKeTidak(isi, anak))).toEqual(new Set([slamet, budi, rina, dewi, andi, sari]));
    const hasil = jawabAdaTidak(isi, anak, false);
    for (const id of [slamet, budi, rina, dewi, andi, sari]) expect(hasil.graf.orang[id]).toBeUndefined();
    expect(hasil.graf.orang[sumi]).toBeDefined();
    expect(hasil.urutanWafat).toEqual([sumi]);
    expect(hasil.kelompokDijawab?.[budi]).toBeUndefined();
    expect(hasil.kelompokDijawab?.PEWARIS).toContain('anak');
  });

  it('Tidak pada pasangan hanya menghapus pasangan: anak tetap, ibu yang masih punya anak menjadi penghubung', () => {
    const { kasus, sumi, budi, rina } = keluargaKarto();
    const hasil = jawabAdaTidak(kasus, bagianDari(kasus, 'pasangan:PEWARIS'), false);
    expect(hasil.graf.orang[budi]).toBeDefined();
    expect(hasil.graf.orang[rina]).toBeDefined();
    expect(hasil.graf.orang[sumi]?.penghubung).toBe(true);
    expect(hasil.urutanWafat).toEqual([budi]);
    expect(hasil.kelompokDijawab?.PEWARIS).toContain('pasangan');
  });

  it('Tidak pada bagian kosong tidak menghapus apa pun; Ya sesudah Tidak membuka lagi bagian', () => {
    const anak: Bagian = { id: 'anak:PEWARIS', milik: 'PEWARIS', jenis: 'anak' };
    const dasar = kasusBaru('L');
    const tidak = jawabAdaTidak(dasar, anak, false);
    expect(tidak.graf).toEqual(dasar.graf);
    expect(tidak.kelompokDijawab?.PEWARIS).toContain('anak');
    expect(jawabAdaTidak(tidak, anak, true).kelompokDijawab).toBeUndefined();
  });
});

describe('baris tetap', () => {
  it('isiBarisTetap membuat Ayah bila belum ada, memakai keadaan, dan bagian dijawab setelah semua baris terisi', () => {
    let kasus = isiBarisTetap(kasusBaru('L'), ORANG_TUA, 'AYAH', 'wafat');
    const ayah = Object.values(kasus.graf.orang).find(o => o.id !== 'PEWARIS')!;
    expect(ayah.statusHidup).toBe('wafat');
    expect(kasus.belumDiisi).toContain(ayah.id);
    expect(kasus.kelompokDijawab?.PEWARIS ?? []).not.toContain('orangTua');   // Ibu belum diisi
    kasus = isiBarisTetap(kasus, ORANG_TUA, 'IBU', 'hidup');
    expect(kasus.kelompokDijawab?.PEWARIS).toContain('orangTua');
    expect(slotTetap(kasus, ORANG_TUA)).toEqual(['AYAH', 'IBU']);
    expect(bagianLengkap(kasus, ORANG_TUA)).toBe(false);   // lanjutan wafat Ayah belum dijawab
    kasus = jawabLanjutan(kasus, ayah.id, 'PEWARIS', { jenis: 'wafat', waktu: 'sebelum' });
    expect(bagianLengkap(kasus, ORANG_TUA)).toBe(true);
  });

  it('memilih ulang keadaan baris tetap tidak membuat orang ganda', () => {
    let kasus = isiBarisTetap(kasusBaru('L'), ORANG_TUA, 'AYAH', 'hidup');
    kasus = isiBarisTetap(kasus, ORANG_TUA, 'AYAH', 'belumTahu');
    expect(Object.keys(kasus.graf.orang)).toHaveLength(2);
  });
});

describe('hapusBaris', () => {
  it('menghapus satu orang dan merapikan rujukannya', () => {
    const { kasus, rina } = keluargaKarto();
    const hasil = hapusBaris({ ...kasus, belumDiisi: [rina], kelompokDijawab: { [rina]: ['anak'] } }, rina);
    expect(hasil.graf.orang[rina]).toBeUndefined();
    expect(hasil.belumDiisi).toBeUndefined();
    expect(hasil.kelompokDijawab ?? {}).toEqual({});
  });
});

describe('Kamu (spec kanvas 5.8)', () => {
  it('calonKamu hanya orang yang masih hidup sekarang, bukan almarhum, urutan wafat, atau penghubung', () => {
    const { kasus, rina, dewi, andi, sari, sumi, budi, slamet, ayah } = keluargaKarto();
    const calon = calonKamu(kasus);
    expect(new Set(calon)).toEqual(new Set([rina, dewi, andi, sari]));
    for (const bukan of [sumi, budi, slamet, ayah, 'PEWARIS']) expect(calon).not.toContain(bukan);
  });

  it('jawabKamu: id menyimpan saya, null berarti mengisi untuk orang lain', () => {
    const { kasus, rina } = keluargaKarto();
    expect(jawabKamu(kasus, rina).saya).toBe(rina);
    expect(jawabKamu(kasus, null).saya).toBeNull();
  });
});
