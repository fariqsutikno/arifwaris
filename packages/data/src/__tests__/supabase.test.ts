// packages/data/src/__tests__/supabase.test.ts
// Tes integrasi ke Supabase lokal. Jalankan: `pnpm db:mulai && pnpm db:reset`, lalu
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... pnpm --filter @waris/data test
// (nilai kunci dari `supabase status`). Tanpa variabel itu, tes dilewati supaya `pnpm test` tetap tanpa jaringan.
import { createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, test } from 'vitest';
import { DAFTAR_FAQ_UJI, SOAL_HITUNG_UJI } from './contoh.js';
import { buatRepositoriSupabase } from '../index.js';

declare const process: { env: Record<string, string | undefined> };

const URL_DB = process.env.SUPABASE_URL;
const KUNCI_ANON = process.env.SUPABASE_ANON_KEY ?? '';
const KUNCI_SERVIS = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
// Kata sandi uji lokal saja (akun dibuat di tes ini, di Supabase lokal).
const SANDI_UJI = 'sandi-uji-lokal-123';
const akhiran = Date.now().toString(36);

async function masuk(email: string) {
  const klien = createClient(URL_DB!, KUNCI_ANON, { auth: { persistSession: false } });
  const { error } = await klien.auth.signInWithPassword({ email, password: SANDI_UJI });
  if (error) throw error;
  return buatRepositoriSupabase(klien);
}

async function idPengguna(alamat: string): Promise<string> {
  const servis = createClient(URL_DB!, KUNCI_SERVIS, { auth: { persistSession: false } });
  const { data } = await servis.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find(u => u.email === alamat)!.id;
}

describe.skipIf(!URL_DB)('supabase lokal', () => {
  const email = { penulis: `penulis-${akhiran}@tes.local`, reviewer: `reviewer-${akhiran}@tes.local`, biasa: `biasa-${akhiran}@tes.local` };

  beforeAll(async () => {
    const servis = createClient(URL_DB!, KUNCI_SERVIS, { auth: { persistSession: false } });
    for (const [peran, alamat] of Object.entries(email)) {
      const { data, error } = await servis.auth.admin.createUser({ email: alamat, password: SANDI_UJI, email_confirm: true });
      if (error) throw error;
      if (peran !== 'biasa') await servis.from('peran_pengguna').insert({ user_id: data.user.id, peran });
    }
  });

  test('alur editorial end-to-end dan bigint utuh', async () => {
    const penulis = await masuk(email.penulis);
    const entriId = await penulis.editorial.buatEntri('soal_hitung', `uji-${akhiran}`, 1);
    const revisiId = await penulis.editorial.buatDraf(entriId, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
    await expect(penulis.editorial.setujui(revisiId)).rejects.toThrow();
    await penulis.editorial.ajukan(revisiId);

    const reviewer = await masuk(email.reviewer);
    const versiSebelum = await reviewer.konten.versiSekarang();
    await reviewer.editorial.setujui(revisiId);
    expect(await reviewer.konten.versiSekarang()).toBe(versiSebelum + 1);

    const anonim = buatRepositoriSupabase(createClient(URL_DB!, KUNCI_ANON, { auth: { persistSession: false } }));
    const terbit = await anonim.konten.bacaTerbit({ jenis: 'soal_hitung', sejakVersi: versiSebelum });
    expect(terbit.find(baris => baris.revisiId === revisiId)?.isi).toEqual(SOAL_HITUNG_UJI);
  });

  test('perbarui ajuan tetap diajukan; revisiSaya memuat entri; diksi mencatat waktu diperiksa', async () => {
    const penulis = await masuk(email.penulis);
    const entriId = await penulis.editorial.buatEntri('faq', `ajuan-${akhiran}`, 1);
    const revisiId = await penulis.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
    await penulis.editorial.ajukan(revisiId);
    await penulis.editorial.perbaruiAjuan(revisiId, 'faq', DAFTAR_FAQ_UJI[1]!, ['R09-7']);
    const [ajuan] = (await penulis.editorial.revisiSaya(await idPengguna(email.penulis))).filter(r => r.id === revisiId);
    expect(ajuan).toMatchObject({ status: 'diajukan', isi: DAFTAR_FAQ_UJI[1], jenis: 'faq', slug: `ajuan-${akhiran}` });

    await penulis.diksi.buatKunci(`uji.k${akhiran}`, 'uji');
    const diksiId = await penulis.diksi.buatDraf(`uji.k${akhiran}`, 'A', null, null);
    await penulis.diksi.ajukan(diksiId);
    const reviewer = await masuk(email.reviewer);
    await reviewer.diksi.setujui(diksiId);
    const [diksi] = (await penulis.diksi.revisiSaya(await idPengguna(email.penulis))).filter(r => r.id === diksiId);
    expect(diksi?.diperiksaPada).toBeTruthy();
  });

  test('draf tidak terlihat anonim; ref tak dikenal ditolak dengan pesan', async () => {
    const penulis = await masuk(email.penulis);
    const entriId = await penulis.editorial.buatEntri('faq', `draf-${akhiran}`, 1);
    await expect(penulis.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R99-1'])).rejects.toThrow(/R99-1/);
    await penulis.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
    const anonim = buatRepositoriSupabase(createClient(URL_DB!, KUNCI_ANON, { auth: { persistSession: false } }));
    expect((await anonim.konten.bacaTerbit({ jenis: 'faq' })).some(baris => baris.entriId === entriId)).toBe(false);
  });

  test('data pengguna terpisah antar akun', async () => {
    const biasa = await masuk(email.biasa);
    await biasa.pengguna.simpanProgresBelajar({ pelajaranSlug: 'ashabah-1', selesai: true, diubahPada: new Date().toISOString() });
    expect(await biasa.pengguna.bacaProgresBelajar()).toHaveLength(1);
    const penulis = await masuk(email.penulis);
    expect(await penulis.pengguna.bacaProgresBelajar()).toEqual([]);
    expect(await biasa.akun.peranSaya()).toBeNull();
    expect(await penulis.akun.peranSaya()).toBe('penulis');
  });

  test('peran diatur & dibaca lewat email; email tak dikenal dan non-admin ditolak', async () => {
    const servis = createClient(URL_DB!, KUNCI_SERVIS, { auth: { persistSession: false } });
    const { data, error } = await servis.auth.admin.createUser({ email: `admin-${akhiran}@tes.local`, password: SANDI_UJI, email_confirm: true });
    if (error) throw error;
    await servis.from('peran_pengguna').insert({ user_id: data.user.id, peran: 'admin' });
    const admin = await masuk(`admin-${akhiran}@tes.local`);

    await admin.akun.aturPeran(email.reviewer, 'reviewer');
    expect((await admin.akun.daftarPeran()).map(p => p.email)).toContain(email.reviewer);
    await expect(admin.akun.aturPeran('tidak-ada@tes.local', 'penulis')).rejects.toThrow(/akun belum pernah masuk/);

    const penulis = await masuk(email.penulis);
    await expect(penulis.akun.daftarPeran()).rejects.toThrow(/admin/);
  });

  test('profil & peringkat: profil milik sendiri, ringkasan nol tanpa kegiatan, papan terbaca anonim', async () => {
    const biasa = await masuk(email.biasa);
    expect(await biasa.pengguna.bacaProfil()).toBeNull();
    await biasa.pengguna.simpanProfil({ namaTampilan: 'Uji', ikutPapanPeringkat: true, tampilkanAvatar: false, zonaWaktu: 'Asia/Makassar' });
    expect(await biasa.pengguna.bacaProfil()).toEqual({ namaTampilan: 'Uji', ikutPapanPeringkat: true, tampilkanAvatar: false, zonaWaktu: 'Asia/Makassar' });
    await expect(biasa.pengguna.simpanProfil({ namaTampilan: 'Uji', ikutPapanPeringkat: true, tampilkanAvatar: false, zonaWaktu: 'Mars/Olympus' }))
      .rejects.toThrow(/zona waktu/);
    expect((await biasa.peringkat.ringkasanSaya()).xpTotal).toBe(0);

    const anonim = buatRepositoriSupabase(createClient(URL_DB!, KUNCI_ANON, { auth: { persistSession: false } }));
    await expect(anonim.peringkat.papan('minggu')).resolves.toBeInstanceOf(Array);
    await expect(anonim.peringkat.ringkasanSaya()).rejects.toThrow(/belum masuk/);
  });
});
