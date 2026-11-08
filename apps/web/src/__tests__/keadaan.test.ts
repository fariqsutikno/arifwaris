import { beforeEach, expect, it, vi } from 'vitest';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { keadaanAwal, pengurangKeadaan } from '../keadaan';
import { terapkanKeadaan } from '../keadaanOrang';
import { bacaTujuan, simpanTujuan, sudahLihatTur, tandaiTurDilihat } from '../preferensi';

beforeEach(() => localStorage.clear());

const awal = keadaanAwal(null, null);

it('MULAI membuka layar pintu tanpa kasus dan tanpa jenis kasus', () => {
  expect(pengurangKeadaan(awal, { jenis: 'MULAI' })).toMatchObject({ layar: 'pintu', langkah: 1, kasus: null, jenisKasus: null });
});

it('PILIH_JENIS_KASUS membuka wizard langkah 1; PILIH_PEWARIS membuat kasus berjenis itu', () => {
  let keadaan = pengurangKeadaan(awal, { jenis: 'MULAI' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'PILIH_JENIS_KASUS', jenisKasus: 'latihan' });
  expect(keadaan).toMatchObject({ layar: 'wizard', langkah: 1, jenisKasus: 'latihan', kasus: null });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'PILIH_PEWARIS', jenisKelamin: 'P' });
  expect(keadaan.kasus?.jenisKasus).toBe('latihan');
});

it('PILIH_PEWARIS tanpa pintu (jalur lama) membuat kasus nyata', () => {
  const keadaan = pengurangKeadaan(awal, { jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' });
  expect(keadaan.kasus?.jenisKasus).toBe('nyata');
});

it('MUAT membawa jenisKasus kasusnya; keadaanAwal juga', () => {
  const latihan = kasusBaru('L', 'latihan');
  expect(pengurangKeadaan(awal, { jenis: 'MUAT', kasus: latihan }).jenisKasus).toBe('latihan');
  expect(keadaanAwal(latihan, null).jenisKasus).toBe('latihan');
  expect(keadaanAwal(null, null).jenisKasus).toBeNull();
});

it('ULANGI mengosongkan jenisKasus', () => {
  const keadaan = pengurangKeadaan({ ...awal, jenisKasus: 'nyata', kasus: kasusBaru('L') }, { jenis: 'ULANGI' });
  expect(keadaan.jenisKasus).toBeNull();
});

it('PILIH_PEWARIS membuat kasus, lalu bisa mengganti jenis kelamin selama belum ada pasangan', () => {
  let keadaan = pengurangKeadaan(pengurangKeadaan(awal, { jenis: 'MULAI' }), { jenis: 'PILIH_PEWARIS', jenisKelamin: 'P' });
  expect(keadaan.kasus?.graf.orang.PEWARIS?.jenisKelamin).toBe('P');
  keadaan = pengurangKeadaan(keadaan, { jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' });
  expect(keadaan.kasus?.graf.orang.PEWARIS?.jenisKelamin).toBe('L');
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ISTRI') }) });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'PILIH_PEWARIS', jenisKelamin: 'P' });
  expect(keadaan.kasus?.graf.orang.PEWARIS?.jenisKelamin).toBe('L');
});

it('KE_LANGKAH tidak bisa melompati langkah yang belum lengkap', () => {
  const keadaan = { ...awal, layar: 'wizard' as const, kasus: kasusBaru('L') };   // harta masih 0
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_LANGKAH', langkah: 4 }).langkah).toBe(2);
});

it('KE_LAYAR hasil ditolak bila isian belum lengkap', () => {
  const keadaan = { ...awal, layar: 'wizard' as const, kasus: kasusBaru('L') };
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_LAYAR', layar: 'hasil' }).layar).toBe('wizard');
});

it('ULANGI menghapus kasus dan kembali ke beranda, tujuan tetap', () => {
  const keadaan = { ...awal, layar: 'wizard' as const, kasus: kasusBaru('L'), tujuan: 'belajar' as const };
  expect(pengurangKeadaan(keadaan, { jenis: 'ULANGI' })).toMatchObject({ layar: 'awal', kasus: null, tujuan: 'belajar' });
});

it('UBAH_KASUS selalu merapikan urutan wafat', () => {
  const keadaan = { ...awal, kasus: kasusBaru('L') };
  const hasil = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: kasus => ({ ...kasus, urutanWafat: ['TIDAK_ADA'] }) });
  expect(hasil.kasus?.urutanWafat).toEqual([]);
});

it('preferensi tersimpan, dan tetap jalan bila localStorage melempar error', () => {
  simpanTujuan('belajar');
  expect(bacaTujuan()).toBe('belajar');
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('penuh'); });
  const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('diblokir'); });
  tandaiTurDilihat('wizard');
  expect(sudahLihatTur('wizard')).toBe(true);   // jatuh ke memori
  simpanTujuan('hitung');
  expect(bacaTujuan()).toBe('hitung');
  setItem.mockRestore(); getItem.mockRestore();
});

it('bahasa: bawaan id, tersimpan id+ar', async () => {
  const { bacaBahasa, simpanBahasa } = await import('../preferensi');
  expect(bacaBahasa()).toBe('id');
  simpanBahasa('id+ar');
  expect(bacaBahasa()).toBe('id+ar');
  simpanBahasa('id');
});

it('babak: KE_BABAK dibatasi jumlah almarhum; kembali dari Periksa ke babak terakhir', () => {
  let keadaan = pengurangKeadaan(keadaanAwal(null, null), { jenis: 'MULAI' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, tirkah: { ...k.tirkah, kotor: 10n }, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') }) });
  const anak = Object.values(keadaan.kasus!.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => terapkanKeadaan(k, anak, { jenis: 'wafatSesudah', hartaSudahDibagi: false }) });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'KE_LANGKAH', langkah: 3 });
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_BABAK', babak: 5 }).babak).toBe(1);
  keadaan = { ...keadaan, langkah: 4 };
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_LANGKAH', langkah: 3 })).toMatchObject({ langkah: 3, babak: 1 });
});
it('layar cerita hanya bila semua langkah lengkap', () => {
  expect(pengurangKeadaan(keadaanAwal(null, null), { jenis: 'KE_LAYAR', layar: 'cerita' }).layar).toBe('awal');
});

it('UBAH_KASUS mengurutkan urutan wafat menurut tahun (spec kanvas 9.1)', () => {
  let keadaan = pengurangKeadaan(keadaanAwal(null, 'hitung'), { jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, graf: tambahAhliWaris(tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK'), 'PEWARIS', 'ANAK_LK') }) });
  const [a1, a2] = hitungIsian(keadaan.kasus!.graf, 'PEWARIS').ANAK_LK!;
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, urutanWafat: [a1!, a2!], waktu: { [a1!]: { wafat: { tahun: 2000, kiraKira: false } }, [a2!]: { wafat: { tahun: 1990, kiraKira: false } } } }) });
  expect(keadaan.kasus!.urutanWafat).toEqual([a2, a1]);
});
