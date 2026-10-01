import { beforeEach, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { keadaanAwal, pengurangKeadaan } from '../keadaan';
import { terapkanKeadaan } from '../keadaanOrang';
import { bacaTujuan, simpanTujuan, sudahLihatTur, tandaiTurDilihat } from '../preferensi';

beforeEach(() => localStorage.clear());

const awal = keadaanAwal(null, null);

it('MULAI membuka wizard langkah 1 tanpa kasus (jenis kelamin belum dipilih)', () => {
  expect(pengurangKeadaan(awal, { jenis: 'MULAI' })).toMatchObject({ layar: 'wizard', langkah: 1, kasus: null });
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

it('KE_POSISI satu lompatan: langkah, babak, dan bagian; babak dibatasi, langkah lain selalu layar daftar', () => {
  let keadaan = pengurangKeadaan(keadaanAwal(null, null), { jenis: 'MULAI' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, tirkah: { ...k.tirkah, kotor: 10n }, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') }) });
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_POSISI', langkah: 3, babak: 0, bagian: 'keadaan' })).toMatchObject({ langkah: 3, babak: 0, bagian: 'keadaan' });
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_POSISI', langkah: 3, babak: 9, bagian: 'keadaan' }).babak).toBe(0);
  expect(pengurangKeadaan({ ...keadaan, bagian: 'keadaan' }, { jenis: 'KE_POSISI', langkah: 2, babak: 0, bagian: 'keadaan' })).toMatchObject({ langkah: 2, bagian: 'daftar' });
  // tetap dibatasi validasi: harta masih 0 → tidak bisa melompat ke Keluarga
  expect(pengurangKeadaan({ ...awal, layar: 'wizard', kasus: kasusBaru('L') }, { jenis: 'KE_POSISI', langkah: 3, babak: 0, bagian: 'daftar' }).langkah).toBe(2);
});

it('mundur dari Periksa mendarat di keadaan babak terakhir; KE_BABAK selalu membuka daftar', () => {
  let keadaan = pengurangKeadaan(keadaanAwal(null, null), { jenis: 'MULAI' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, tirkah: { ...k.tirkah, kotor: 10n }, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') }) });
  keadaan = { ...keadaan, langkah: 4 };
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_LANGKAH', langkah: 3 })).toMatchObject({ langkah: 3, bagian: 'keadaan' });
  expect(pengurangKeadaan({ ...keadaan, langkah: 3, bagian: 'keadaan' }, { jenis: 'KE_BABAK', babak: 0 }).bagian).toBe('daftar');
  expect(pengurangKeadaan({ ...keadaan, langkah: 3, bagian: 'daftar' }, { jenis: 'KE_BAGIAN', bagian: 'keadaan' }).bagian).toBe('keadaan');
});
