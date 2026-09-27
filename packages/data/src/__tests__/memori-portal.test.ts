// Tes portal admin di memori: daftar entri/kunci untuk kolom status, antrean review, refs, dan peran berbasis email.
import { expect, test } from 'vitest';
import { buatMemori } from '../index.js';
import { SOAL_HITUNG_UJI } from './contoh.js';

const ADMIN = { userId: 'u-admin', email: 'admin@x.id' };
function siapkan() {
  const memori = buatMemori({ refs: ['R09-7'], sesi: ADMIN, peran: { 'u-admin': 'admin' } });
  memori.daftarkanPengguna({ ...ADMIN, nama: 'Admin' });
  memori.daftarkanPengguna({ userId: 'u-rev', email: 'rev@x.id', nama: 'Ustadz' });
  return memori;
}

test('daftarEntri memuat revisi terakhir dan terbit', async () => {
  const m = siapkan();
  const id = await m.editorial.buatEntri('soal_hitung', SOAL_HITUNG_UJI.kode, 10);
  const r1 = await m.editorial.buatDraf(id, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  await m.editorial.ajukan(r1);
  await m.editorial.setujui(r1);
  const r2 = await m.editorial.buatDraf(id, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  const [entri] = await m.konten.daftarEntri('soal_hitung');
  expect(entri).toMatchObject({ entriId: id, revisiTerbitId: r1, revisiTerakhir: { id: r2, status: 'draf' } });
});

test('daftarEntri tanpa jenis memuat semua jenis', async () => {
  const m = siapkan();
  await m.editorial.buatEntri('soal_hitung', 'h', 10);
  await m.editorial.buatEntri('faq', 'f', 10);
  expect((await m.konten.daftarEntri()).map(entri => entri.jenis).sort()).toEqual(['faq', 'soal_hitung']);
  expect((await m.konten.daftarEntri('faq')).map(entri => entri.slug)).toEqual(['f']);
});

test('aturPeran lewat email; email tak dikenal ditolak', async () => {
  const m = siapkan();
  await m.akun.aturPeran('rev@x.id', 'reviewer');
  expect(await m.akun.daftarPeran()).toContainEqual({ userId: 'u-rev', email: 'rev@x.id', nama: 'Ustadz', peran: 'reviewer' });
  await expect(m.akun.aturPeran('siapa@x.id', 'penulis')).rejects.toThrow('akun belum pernah masuk');
  await m.akun.aturPeran('rev@x.id', null);
  expect((await m.akun.daftarPeran()).map(p => p.email)).toEqual(['admin@x.id']);
});

test('aturPeran oleh non-admin ditolak', async () => {
  const m = siapkan();
  m.aturPeranLangsung('u-rev', 'reviewer');
  m.masukSebagai({ userId: 'u-rev', email: 'rev@x.id' });
  await expect(m.akun.aturPeran('admin@x.id', null)).rejects.toThrow('hanya admin');
});

test('daftarPeran oleh non-admin ditolak', async () => {
  const m = siapkan();
  m.aturPeranLangsung('u-rev', 'reviewer');
  m.masukSebagai({ userId: 'u-rev', email: 'rev@x.id' });
  await expect(m.akun.daftarPeran()).rejects.toThrow('hanya admin yang bisa melihat daftar peran');
});

test('admin tidak bisa mencabut atau menurunkan perannya sendiri', async () => {
  const m = siapkan();
  await expect(m.akun.aturPeran('admin@x.id', 'penulis')).rejects.toThrow('admin tidak bisa mencabut atau menurunkan perannya sendiri');
  await expect(m.akun.aturPeran('admin@x.id', null)).rejects.toThrow('admin tidak bisa mencabut atau menurunkan perannya sendiri');
  await expect(m.akun.aturPeran('admin@x.id', 'admin')).resolves.toBeUndefined();
});

test('daftarKunci & antrean diksi', async () => {
  const m = siapkan();
  await m.diksi.buatKunci('umum.simpan', 'umum');
  const r = await m.diksi.buatDraf('umum.simpan', 'Simpan', null, null);
  await m.diksi.ajukan(r);
  expect((await m.diksi.antreanReview()).map(x => x.id)).toEqual([r]);
  expect(await m.diksi.daftarKunci()).toMatchObject([{ kunci: 'umum.simpan', terbit: null, revisiTerakhir: { id: r, status: 'diajukan' } }]);
});

test('daftarRefs dari refs awal', async () => {
  expect(await siapkan().konten.daftarRefs()).toEqual([{ kode: 'R09-7', bab: 9 }]);
});
test('aturUrutan: urutan = posisi * 10, status tetap, entri terbit naik versi', async () => {
  const m = siapkan();
  const a = await m.editorial.buatEntri('soal_hitung', 'a', 10);
  const b = await m.editorial.buatEntri('soal_hitung', 'b', 20);
  const r = await m.editorial.buatDraf(a, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  await m.editorial.ajukan(r);
  await m.editorial.setujui(r);
  const versiSebelum = await m.konten.versiSekarang();
  await m.editorial.aturUrutan([b, a]);
  const daftar = await m.konten.daftarEntri('soal_hitung');
  expect(daftar.map(e => [e.slug, e.urutan])).toEqual([['b', 10], ['a', 20]]);
  expect(daftar[1]!.revisiTerakhir?.status).toBe('disetujui');
  expect(await m.konten.versiSekarang()).toBe(versiSebelum + 1);
  const [terbit] = await m.konten.bacaTerbit({ jenis: 'soal_hitung' });
  expect(terbit!.versiTerbit).toBe(versiSebelum + 1);
});

test('aturUrutan: reviewer, campur jenis, ganda, kosong ditolak', async () => {
  const m = siapkan();
  const a = await m.editorial.buatEntri('soal_hitung', 'a', 10);
  const k = await m.editorial.buatEntri('kitab', 'k', 10);
  await expect(m.editorial.aturUrutan([a, k])).rejects.toThrow('satu jenis');
  await expect(m.editorial.aturUrutan([a, a])).rejects.toThrow('ganda');
  await expect(m.editorial.aturUrutan([])).rejects.toThrow('kosong');
  m.aturPeranLangsung('u-admin', 'reviewer');
  await expect(m.editorial.aturUrutan([a])).rejects.toThrow('perlu peran');
});
