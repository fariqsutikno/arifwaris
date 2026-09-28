// Tes keadaanSunting (murni): kapan form bisa disunting & salinan kerja mana, menunggu review (boleh tarik atau tidak),
// alasan terkunci, Sampah, dan revisi basis sesudah pengajuan Sampah ditolak.
import { expect, test } from 'vitest';
import type { RingkasanRevisi } from '@waris/data';
import { keadaanSunting, revisiBasis, type EntriSunting } from '../editor/keadaanSunting';

const r = (id: string, status: RingkasanRevisi['status'], dibuatOleh = 'p', sisa: Partial<RingkasanRevisi> = {}): RingkasanRevisi => ({
  id, entriId: 'e', status, hapus: false, diabaikan: false, refs: [], isi: {}, dibuatOleh, diperiksaOleh: null, catatanReview: null,
  dibuatPada: `2026-01-01T00:00:0${id}Z`, diperiksaPada: null, ...sisa,
});
const entri = (semuaRevisi: RingkasanRevisi[], sisa: Partial<EntriSunting> = {}): EntriSunting =>
  ({ revisiTerbitId: null, dihapus: false, dibuang: false, diarsipkan: false, semuaRevisi, ...sisa });
const penulis = { peran: 'penulis' as const, userId: 'p', namaDari: (id: string) => `nama-${id}` };

test('tayang tanpa draf → sunting dengan salinan kerja baru; draf sendiri → salinan itu', () => {
  expect(keadaanSunting(entri([r('1', 'disetujui')], { revisiTerbitId: '1' }), penulis)).toEqual({ jenis: 'sunting', salinanKerjaId: null });
  expect(keadaanSunting(entri([r('1', 'disetujui'), r('2', 'draf')], { revisiTerbitId: '1' }), penulis)).toEqual({ jenis: 'sunting', salinanKerjaId: '2' });
});

test('draf orang lain & reviewer → terkunci dengan alasan', () => {
  expect(keadaanSunting(entri([r('1', 'draf', 'q')]), penulis)).toEqual({ jenis: 'terkunci', alasan: 'Sedang disunting oleh nama-q (belum dikirim).' });
  expect(keadaanSunting(entri([r('1', 'disetujui')]), { ...penulis, peran: 'reviewer' }).jenis).toBe('terkunci');
});

test('diajukan: pembuat menyunting ajuannya langsung; orang lain melihat menunggu review, hanya admin boleh tarik', () => {
  expect(keadaanSunting(entri([r('1', 'diajukan')]), penulis)).toEqual({ jenis: 'sunting', salinanKerjaId: '1', ajuan: true });
  expect(keadaanSunting(entri([r('1', 'diajukan', 'q')]), penulis)).toMatchObject({ jenis: 'menungguReview', bolehTarik: false });
  expect(keadaanSunting(entri([r('1', 'diajukan', 'q')]), { ...penulis, peran: 'admin' })).toMatchObject({ bolehTarik: true });
});

test('Sampah: pulihkan menurut aturan', () => {
  expect(keadaanSunting(entri([r('1', 'draf')], { dibuang: true }), penulis)).toEqual({ jenis: 'sampah', bolehPulihkan: true, alasan: null });
  expect(keadaanSunting(entri([r('1', 'disetujui'), r('2', 'disetujui', 'a', { hapus: true })], { revisiTerbitId: '2', dihapus: true }), penulis))
    .toMatchObject({ jenis: 'sampah', bolehPulihkan: false });
});

test('revisiBasis: pengajuan Sampah yang ditolak → mulai dari versi tayang', () => {
  const tayang = r('1', 'disetujui');
  expect(revisiBasis(entri([tayang, r('2', 'dikembalikan', 'p', { hapus: true })], { revisiTerbitId: '1' }))).toBe(tayang);
  expect(revisiBasis(entri([tayang, r('2', 'dikembalikan')], { revisiTerbitId: '1' }))!.id).toBe('2');
});

test('revisiBasis & keadaan: revisi dikembalikan yang dibuang → mulai dari versi tayang, tanpa salinan kerja', () => {
  const tayang = r('1', 'disetujui');
  const e = entri([tayang, r('2', 'dikembalikan', 'p', { diabaikan: true })], { revisiTerbitId: '1' });
  expect(revisiBasis(e)).toBe(tayang);
  expect(keadaanSunting(e, penulis)).toEqual({ jenis: 'sunting', salinanKerjaId: null });
});
