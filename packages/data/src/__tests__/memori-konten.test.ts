// packages/data/src/__tests__/memori-konten.test.ts
import { describe, expect, test, vi } from 'vitest';
import { DAFTAR_FAQ_UJI, SOAL_HITUNG_UJI, soalKuisUji } from './contoh.js';
import { buatMemori } from '../index.js';

const PENULIS = { userId: 'p', email: 'p@tes.local' };
const REVIEWER = { userId: 'r', email: 'r@tes.local' };
const siapkan = () => buatMemori({ refs: ['R09-7', 'R04-2'], peran: { p: 'penulis', r: 'reviewer' }, sesi: PENULIS });

describe('memori: konten & editorial', () => {
  test('alur lengkap: draf → ajukan → setujui → terbit, versi naik', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
    expect(await db.konten.bacaTerbit()).toEqual([]);
    await db.editorial.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    expect((await db.editorial.antreanReview()).map(revisi => revisi.id)).toEqual([revisiId]);
    await db.editorial.setujui(revisiId);
    const terbit = await db.konten.bacaTerbit();
    expect(terbit).toHaveLength(1);
    expect(terbit[0]!.isi).toEqual(DAFTAR_FAQ_UJI[0]);
    expect(await db.konten.versiSekarang()).toBe(1);
  });

  test('revisi dikembalikan dibuang pembuatnya; reviewer tidak bisa; tidak bisa dua kali', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
    await db.editorial.ajukan(revisiId);
    await expect(db.editorial.abaikan(revisiId)).rejects.toThrow(/tidak bisa dibuang/);
    db.masukSebagai(REVIEWER);
    await db.editorial.kembalikan(revisiId, 'perbaiki');
    await expect(db.editorial.abaikan(revisiId)).rejects.toThrow(/tidak bisa dibuang/);
    db.masukSebagai(PENULIS);
    await db.editorial.abaikan(revisiId);
    expect((await db.konten.daftarRevisi(entriId))[0]).toMatchObject({ status: 'dikembalikan', diabaikan: true });
    await expect(db.editorial.abaikan(revisiId)).rejects.toThrow(/tidak bisa dibuang/);
  });

  test('teks aplikasi (diksi): revisi dikembalikan dibuang pembuatnya, teks tayang tetap', async () => {
    const db = siapkan();
    await db.diksi.buatKunci('uji.satu', 'uji');
    const revisiId = await db.diksi.buatDraf('uji.satu', 'Lama', null, null);
    await db.diksi.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.diksi.kembalikan(revisiId, 'perbaiki');
    await expect(db.diksi.abaikan(revisiId)).rejects.toThrow(/tidak bisa dibuang/);
    db.masukSebagai(PENULIS);
    await db.diksi.abaikan(revisiId);
    expect((await db.diksi.daftarRevisi('uji.satu'))[0]).toMatchObject({ status: 'dikembalikan', diabaikan: true });
    await expect(db.diksi.abaikan(revisiId)).rejects.toThrow(/tidak bisa dibuang/);
  });

  test('bigint tetap bigint setelah disimpan dan dibaca', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('soal_hitung', 'H-01', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
    await db.editorial.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.editorial.setujui(revisiId);
    const [soal] = await db.konten.bacaTerbit({ jenis: 'soal_hitung' });
    expect(soal!.isi).toEqual(SOAL_HITUNG_UJI);
  });

  test('sejakVersi hanya mengembalikan yang terbit setelahnya', async () => {
    const db = siapkan();
    for (const [indeks, faq] of DAFTAR_FAQ_UJI.slice(0, 2).entries()) {
      db.masukSebagai(PENULIS);
      const entriId = await db.editorial.buatEntri('faq', `f${indeks}`, indeks);
      const revisiId = await db.editorial.buatDraf(entriId, 'faq', faq, ['R09-7']);
      await db.editorial.ajukan(revisiId);
      db.masukSebagai(REVIEWER);
      await db.editorial.setujui(revisiId);
    }
    expect((await db.konten.bacaTerbit({ sejakVersi: 1 })).map(konten => konten.slug)).toEqual(['f1']);
  });

  test('aturan ditolak dengan Error', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    await expect(db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, [])).rejects.toThrow(/minimal satu ref/);
    await expect(db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R99-1'])).rejects.toThrow(/R99-1/);
    await expect(db.editorial.buatDraf(entriId, 'faq', { id: 'x' } as never, ['R09-7'])).rejects.toThrow(/tidak sah/);
    const revisiId = await db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
    await expect(db.editorial.setujui(revisiId)).rejects.toThrow();
    await db.editorial.ajukan(revisiId);
    await expect(db.editorial.ubahDraf(revisiId, 'faq', DAFTAR_FAQ_UJI[1]!, ['R09-7'])).rejects.toThrow();
    db.masukSebagai(REVIEWER);
    await expect(db.editorial.kembalikan(revisiId, '')).rejects.toThrow(/catatan/);
  });

  test('rollback menerbitkan ulang revisi lama', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    const revisiIds: string[] = [];
    for (const faq of DAFTAR_FAQ_UJI.slice(0, 2)) {
      db.masukSebagai(PENULIS);
      const revisiId = await db.editorial.buatDraf(entriId, 'faq', faq, ['R09-7']);
      await db.editorial.ajukan(revisiId);
      db.masukSebagai(REVIEWER);
      await db.editorial.setujui(revisiId);
      revisiIds.push(revisiId);
    }
    await db.editorial.terbitkanUlang(revisiIds[0]!);
    expect((await db.konten.bacaTerbit())[0]!.isi).toEqual(DAFTAR_FAQ_UJI[0]);
    expect(await db.konten.daftarRevisi(entriId)).toHaveLength(2);
  });

  test('isi tidak valid di baris terbit dibuang dengan peringatan, bukan crash', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
    await db.editorial.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.editorial.setujui(revisiId);
    db.isiRevisiMentah(revisiId, { rusak: true });
    const peringatan = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await db.konten.bacaTerbit()).toEqual([]);
    expect(peringatan).toHaveBeenCalledWith(expect.stringContaining('faq/contoh'));
    peringatan.mockRestore();
  });

  test('diksi: draf → terbit; ar kosong = null', async () => {
    const db = siapkan();
    await db.diksi.buatKunci('hitung.lanjut', 'hitung');
    const revisiId = await db.diksi.buatDraf('hitung.lanjut', 'Lanjut', null, null);
    await db.diksi.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.diksi.setujui(revisiId);
    expect(await db.diksi.bacaTerbit()).toEqual([{ kunci: 'hitung.lanjut', halaman: 'hitung', id: 'Lanjut', ar: null, versiTerbit: 1 }]);
  });

  test('revisi diksi yang mengubah himpunan sisipan ditolak', async () => {
    const db = siapkan();
    await db.diksi.buatKunci('narasi.tes.contoh', 'narasi');
    const revisiId = await db.diksi.buatDraf('narasi.tes.contoh', 'Harta {jumlah} untuk {orang}.', null, null);
    await db.diksi.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.diksi.setujui(revisiId);
    db.masukSebagai(PENULIS);
    await expect(db.diksi.buatDraf('narasi.tes.contoh', 'Harta untuk {orang}.', null, null))
      .rejects.toThrow('Teks harus tetap memuat bagian otomatis: {jumlah}, {orang}');
    await expect(db.diksi.buatDraf('narasi.tes.contoh', 'Harta {jumlah} untuk {orang}.', 'لـ{orang}', null)).rejects.toThrow(/bagian otomatis/);
    const bolehId = await db.diksi.buatDraf('narasi.tes.contoh', 'Untuk {orang}: {jumlah}.', null, null);
    await db.diksi.ajukan(bolehId);
    await expect(db.diksi.perbaruiAjuan(bolehId, 'Untuk {orang}.', null)).rejects.toThrow(/bagian otomatis/);
  });
});

test('saringDiksiValid membuang diksi rusak dari cache', async () => {
  const { saringDiksiValid } = await import('../snapshot.js');
  const baik = { kunci: 'a.b', halaman: 'x', id: 'Teks', ar: null, versiTerbit: 1 };
  expect(saringDiksiValid([baik, { kunci: 'a.c', id: 5 }, null])).toEqual([baik]);
});

describe('memori: review dua tahap soal kuis', () => {
  const KEILMUAN = { userId: 'k', email: 'k@tes.local' };
  const ADMIN = { userId: 'a', email: 'a@tes.local' };
  const BUTIR = [1, 2, 3, 4, 5];
  const siapkanKuis = async () => {
    const db = buatMemori({ refs: ['R04-2'], peran: { p: 'penulis', r: 'reviewer', k: 'keilmuan', a: 'admin' }, sesi: PENULIS });
    const entriId = await db.editorial.buatEntri('soal_kuis', 'K-1', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'soal_kuis', soalKuisUji('K-1'), ['R04-2']);
    await db.editorial.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    return { db, entriId, revisiId };
  };
  const centangSemua = async (db: Awaited<ReturnType<typeof siapkanKuis>>['db'], revisiId: string) => {
    for (const butir of BUTIR) await db.editorial.aturCeklis(revisiId, butir, true);
  };

  test('alur: diajukan → periksa (checklist lengkap) → keilmuan setujui → terbit', async () => {
    const { db, revisiId } = await siapkanKuis();
    await expect(db.editorial.setujui(revisiId)).rejects.toThrow(/diperiksa dulu/);
    await expect(db.editorial.periksa(revisiId)).rejects.toThrow(/checklist review belum lengkap/);
    for (const butir of [1, 2, 3, 4]) await db.editorial.aturCeklis(revisiId, butir, true);
    await expect(db.editorial.periksa(revisiId)).rejects.toThrow(/checklist review belum lengkap/);
    await db.editorial.aturCeklis(revisiId, 5, true);
    expect(await db.editorial.daftarCeklis(revisiId)).toEqual(BUTIR);
    await db.editorial.periksa(revisiId);
    expect(await db.editorial.antreanReview()).toMatchObject([{ id: revisiId, status: 'diperiksa', jenis: 'soal_kuis', diperiksaOleh: 'r' }]);
    await expect(db.editorial.setujui(revisiId)).rejects.toThrow(/hanya keilmuan atau admin/);
    expect(await db.konten.bacaTerbit()).toEqual([]);
    db.masukSebagai(KEILMUAN);
    await db.editorial.setujui(revisiId);
    expect((await db.konten.bacaTerbit()).map(t => t.slug)).toEqual(['K-1']);
    expect(await db.editorial.antreanReview()).toEqual([]);
  });

  test('checklist: hanya admin/reviewer, butir 1..5, beku setelah diperiksa; cabut centang membatalkan kelengkapan', async () => {
    const { db, revisiId } = await siapkanKuis();
    await expect(db.editorial.aturCeklis(revisiId, 6, true)).rejects.toThrow(/tidak ada/);
    await centangSemua(db, revisiId);
    await db.editorial.aturCeklis(revisiId, 3, false);
    await expect(db.editorial.periksa(revisiId)).rejects.toThrow(/belum lengkap/);
    await db.editorial.aturCeklis(revisiId, 3, true);
    db.masukSebagai(PENULIS);
    await expect(db.editorial.aturCeklis(revisiId, 1, false)).rejects.toThrow(/perlu peran/);
    db.masukSebagai(REVIEWER);
    await db.editorial.periksa(revisiId);
    await expect(db.editorial.aturCeklis(revisiId, 1, false)).rejects.toThrow(/selagi revisi diajukan/);
  });

  test('keilmuan: tidak bisa memeriksa/mengembalikan dari diajukan, bisa mengembalikan dari diperiksa; materi tidak melewati diperiksa', async () => {
    const { db, revisiId } = await siapkanKuis();
    await centangSemua(db, revisiId);
    db.masukSebagai(KEILMUAN);
    await expect(db.editorial.periksa(revisiId)).rejects.toThrow(/hanya reviewer atau admin/);
    await expect(db.editorial.kembalikan(revisiId, 'x')).rejects.toThrow(/sudah diperiksa/);
    db.masukSebagai(REVIEWER);
    await db.editorial.periksa(revisiId);
    db.masukSebagai(KEILMUAN);
    await expect(db.editorial.kembalikan(revisiId, '  ')).rejects.toThrow(/wajib disertai catatan/);
    await db.editorial.kembalikan(revisiId, 'pengecoh kurang masuk akal');
    expect((await db.konten.daftarRevisi((await db.konten.daftarEntri('soal_kuis'))[0]!.entriId))[0]).toMatchObject({ status: 'dikembalikan', catatanReview: 'pengecoh kurang masuk akal' });

    db.masukSebagai(PENULIS);
    const faq = await db.editorial.buatEntri('faq', 'f', 2);
    const revisiFaq = await db.editorial.buatDraf(faq, 'faq', DAFTAR_FAQ_UJI[0]!, ['R04-2']);
    await db.editorial.ajukan(revisiFaq);
    db.masukSebagai(REVIEWER);
    await expect(db.editorial.periksa(revisiFaq)).rejects.toThrow(/hanya soal kuis/);
    db.masukSebagai(KEILMUAN);
    await expect(db.editorial.setujui(revisiFaq)).rejects.toThrow(/keilmuan hanya menyetujui soal kuis/);
  });

  test('pemeriksa tidak memeriksa revisinya sendiri; admin menyetujui diperiksa tapi tidak bisa terbitkan langsung', async () => {
    const { db, revisiId, entriId } = await siapkanKuis();
    db.masukSebagai(ADMIN);
    await expect(db.editorial.setujui(revisiId)).rejects.toThrow(/diperiksa dulu/);
    await centangSemua(db, revisiId);
    await db.editorial.periksa(revisiId);
    await db.editorial.setujui(revisiId);
    expect((await db.konten.bacaTerbit()).map(t => t.entriId)).toEqual([entriId]);
    const draf = await db.editorial.buatDraf(entriId, 'soal_kuis', soalKuisUji('K-1', { tingkat: 'sulit' }), ['R04-2']);
    await expect(db.editorial.terbitkanLangsung(draf)).rejects.toThrow(/tidak bisa diterbitkan langsung/);
    db.aturPeranLangsung('r', 'penulis');
    db.masukSebagai(REVIEWER);
    const sendiri = await db.editorial.buatEntri('soal_kuis', 'K-2', 3);
    const revisiSendiri = await db.editorial.buatDraf(sendiri, 'soal_kuis', soalKuisUji('K-2'), ['R04-2']);
    await db.editorial.ajukan(revisiSendiri);
    db.aturPeranLangsung('r', 'reviewer');
    for (const butir of BUTIR) await db.editorial.aturCeklis(revisiSendiri, butir, true);
    await expect(db.editorial.periksa(revisiSendiri)).rejects.toThrow(/tidak bisa memeriksa revisinya sendiri/);
  });

  test('membuang entri belum terbit mengembalikan revisi diperiksa ke draf', async () => {
    const { db, entriId, revisiId } = await siapkanKuis();
    await centangSemua(db, revisiId);
    await db.editorial.periksa(revisiId);
    db.masukSebagai({ userId: 'a', email: 'a@tes.local' });
    await db.editorial.buangEntri(entriId);
    expect((await db.konten.daftarRevisi(entriId))[0]!.status).toBe('draf');
  });
});
