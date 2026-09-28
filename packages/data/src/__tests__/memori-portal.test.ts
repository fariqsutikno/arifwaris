// Tes portal admin di memori: daftar entri/kunci untuk kolom status, antrean review, refs, dan peran berbasis email.
import { expect, test } from 'vitest';
import { buatMemori } from '../index.js';
import { DAFTAR_FAQ_UJI, SOAL_HITUNG_UJI } from './contoh.js';

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

async function terbitkan(m: ReturnType<typeof siapkan>) {
  const id = await m.editorial.buatEntri('soal_hitung', SOAL_HITUNG_UJI.kode, 10);
  const r1 = await m.editorial.buatDraf(id, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  await m.editorial.terbitkanLangsung(r1);
  return { id, r1 };
}

test('terbitkanLangsung: hanya admin, draf langsung terbit', async () => {
  const m = siapkan();
  const { id, r1 } = await terbitkan(m);
  expect((await m.konten.daftarEntri())[0]).toMatchObject({ entriId: id, revisiTerbitId: r1, revisiTerakhir: { status: 'disetujui', diperiksaOleh: 'u-admin' } });
  m.aturPeranLangsung('u-pen', 'penulis');
  m.masukSebagai({ userId: 'u-pen', email: 'pen@x.id' });
  const r2 = await m.editorial.buatDraf(id, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  await expect(m.editorial.terbitkanLangsung(r2)).rejects.toThrow('hanya admin');
});

test('tarik: pengajuan kembali jadi draf dan bisa disunting lagi', async () => {
  const m = siapkan();
  const { id } = await terbitkan(m);
  const r2 = await m.editorial.buatDraf(id, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  await m.editorial.ajukan(r2);
  await m.editorial.tarik(r2);
  expect(await m.editorial.antreanReview()).toEqual([]);
  await m.editorial.ubahDraf(r2, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
});

test('perbaruiAjuan: isi ajuan diganti, tetap di antrean; penulis lain & reviewer ditolak', async () => {
  const m = siapkan();
  const { id } = await terbitkan(m);
  m.aturPeranLangsung('u-pen', 'penulis');
  m.aturPeranLangsung('u-rev', 'reviewer');
  m.masukSebagai({ userId: 'u-pen', email: 'pen@x.id' });
  const r2 = await m.editorial.buatDraf(id, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  await m.editorial.ajukan(r2);
  const baru = { ...SOAL_HITUNG_UJI, judul: 'Judul baru' };
  await m.editorial.perbaruiAjuan(r2, 'soal_hitung', baru, ['R09-7']);
  expect(await m.editorial.antreanReview()).toMatchObject([{ id: r2, status: 'diajukan', isi: { judul: 'Judul baru' } }]);
  m.masukSebagai({ userId: 'u-rev', email: 'rev@x.id' });
  await expect(m.editorial.perbaruiAjuan(r2, 'soal_hitung', baru, ['R09-7'])).rejects.toThrow('tidak bisa diperbarui');
});

test('diksi: admin terbitkan langsung; pembuat memperbarui ajuan', async () => {
  const m = siapkan();
  await m.diksi.buatKunci('uji.a', 'uji');
  const r1 = await m.diksi.buatDraf('uji.a', 'Bagi', null, null);
  await m.diksi.terbitkanLangsung(r1);
  expect(await m.diksi.bacaTerbit()).toMatchObject([{ kunci: 'uji.a', id: 'Bagi' }]);
  const r2 = await m.diksi.buatDraf('uji.a', 'Bagikn', null, null);
  await m.diksi.ajukan(r2);
  await m.diksi.perbaruiAjuan(r2, 'Bagikan', 'شارك');
  expect(await m.diksi.antreanReview()).toMatchObject([{ id: r2, idTeks: 'Bagikan', arTeks: 'شارك', status: 'diajukan' }]);
  m.aturPeranLangsung('u-pen', 'penulis');
  m.masukSebagai({ userId: 'u-pen', email: 'pen@x.id' });
  const r3 = await m.diksi.buatDraf('uji.a', 'x', null, null);
  await expect(m.diksi.terbitkanLangsung(r3)).rejects.toThrow('hanya admin');
});

test('Sampah entri terbit: penulis mengajukan (tetap tayang), disetujui → hilang dari web, jejak tercatat, pulihkan', async () => {
  const m = siapkan();
  const { id, r1 } = await terbitkan(m);
  m.aturPeranLangsung('u-pen', 'penulis');
  m.masukSebagai({ userId: 'u-pen', email: 'pen@x.id' });
  expect(await m.editorial.buangEntri(id, 'duplikat')).toBe('diajukan');
  await expect(m.editorial.buangEntri(id)).rejects.toThrow('sudah diajukan');
  expect(await m.konten.bacaTerbit()).toHaveLength(1);
  m.masukSebagai(ADMIN);
  const [pengajuan] = await m.editorial.antreanReview();
  expect(pengajuan).toMatchObject({ hapus: true, refs: ['R09-7'] });
  await m.editorial.setujui(pengajuan!.id);
  expect(await m.konten.bacaTerbit()).toEqual([]);
  expect(await m.konten.bacaDihapus(0)).toEqual([id]);
  expect((await m.konten.daftarEntri())[0]).toMatchObject({ dihapus: true, dibuang: false });
  m.masukSebagai({ userId: 'u-pen', email: 'pen@x.id' });
  await expect(m.editorial.pulihkanEntri(id)).rejects.toThrow('reviewer atau admin');
  m.masukSebagai(ADMIN);
  await m.editorial.pulihkanEntri(id);
  expect((await m.konten.bacaTerbit()).map(b => b.revisiId)).toEqual([r1]);
  expect((await m.konten.daftarJejak(id)).map(j => [j.aksi, j.pelaku, j.catatan])).toEqual([
    ['buang_diajukan', 'u-pen', 'duplikat'], ['dipulihkan', 'u-admin', null],
  ]);
});

test('Sampah entri terbit oleh admin: langsung', async () => {
  const m = siapkan();
  const { id } = await terbitkan(m);
  expect(await m.editorial.buangEntri(id)).toBe('dibuang');
  expect(await m.konten.bacaTerbit()).toEqual([]);
  await expect(m.editorial.buangEntri(id)).rejects.toThrow('sudah di Sampah');
});

test('Sampah entri belum terbit: langsung, tidak ada hapus permanen, pengajuan ditarik, tidak bisa disunting sampai dipulihkan', async () => {
  const m = siapkan();
  m.aturPeranLangsung('u-pen', 'penulis');
  const id = await m.editorial.buatEntri('faq', 'f', 10);
  const r = await m.editorial.buatDraf(id, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  await m.editorial.ajukan(r);
  m.masukSebagai({ userId: 'u-pen', email: 'pen@x.id' });
  await expect(m.editorial.buangEntri(id)).rejects.toThrow('revisi orang lain');
  m.masukSebagai(ADMIN);
  expect(await m.editorial.buangEntri(id)).toBe('dibuang');
  expect(await m.editorial.antreanReview()).toEqual([]);
  expect((await m.konten.daftarEntri())[0]).toMatchObject({ entriId: id, dibuang: true });
  expect(await m.konten.daftarRevisi(id)).toHaveLength(1);
  await expect(m.editorial.buatDraf(id, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7'])).rejects.toThrow('Sampah');
  await m.editorial.pulihkanEntri(id);
  expect((await m.konten.daftarEntri())[0]).toMatchObject({ dibuang: false, revisiTerakhir: { status: 'draf' } });
});

test('daftarNamaTim: nama atau bagian depan email', async () => {
  const m = siapkan();
  m.daftarkanPengguna({ userId: 'u-pen', email: 'penulis.satu@x.id' });
  m.aturPeranLangsung('u-pen', 'penulis');
  expect(await m.akun.daftarNamaTim()).toEqual([{ userId: 'u-admin', nama: 'Admin' }, { userId: 'u-pen', nama: 'penulis.satu' }]);
});

test('revisiSaya: hanya milik sendiri yang sudah dikirim, terbaru dulu, dengan entri; diksi mencatat waktu diperiksa', async () => {
  const m = siapkan();
  m.aturPeranLangsung('u-pen', 'penulis');
  m.aturPeranLangsung('u-rev', 'reviewer');
  const { id } = await terbitkan(m);
  m.masukSebagai({ userId: 'u-pen', email: 'pen@x.id' });
  await m.editorial.buatDraf(id, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  const r2 = await m.editorial.buatDraf(id, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  await m.editorial.ajukan(r2);
  await m.diksi.buatKunci('uji.a', 'uji');
  const d1 = await m.diksi.buatDraf('uji.a', 'A', null, null);
  await m.diksi.ajukan(d1);
  m.masukSebagai({ userId: 'u-rev', email: 'rev@x.id' });
  await m.editorial.kembalikan(r2, 'perbaiki');
  await m.diksi.setujui(d1);
  expect(await m.editorial.revisiSaya('u-pen')).toMatchObject([{ id: r2, status: 'dikembalikan', catatanReview: 'perbaiki', jenis: 'soal_hitung', slug: 'H-01' }]);
  const [diksi] = await m.diksi.revisiSaya('u-pen');
  expect(diksi).toMatchObject({ id: d1, status: 'disetujui', diperiksaOleh: 'u-rev' });
  expect(diksi!.diperiksaPada).toBeTruthy();
});
