// packages/data/src/__tests__/bank-supabase.test.ts
// Tes integrasi bank soal ke Supabase lokal (setelah migrasi bank_soal): anon membaca lewat RPC, anon tidak bisa menulis.
// Env sama dengan supabase.test.ts; tanpa SUPABASE_URL tes dilewati. Baris uji berawalan G9-UJI- dihapus lagi di akhir.
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { buatBankSupabase, type BarisBankSoal } from '../index.js';

declare const process: { env: Record<string, string | undefined> };
const URL_DB = process.env.SUPABASE_URL;
const AWALAN = `G9-UJI-${Date.now().toString(36)}-`;
const label = `uji-${Date.now().toString(36)}`;
const baris = (n: number): BarisBankSoal => ({
  kode: `${AWALAN}${n}`, versiGenerator: 9, keluarga: 'biasa', tingkat: 'dasar', modul: [3], label: [label, ...(n % 2 ? ['ganjil'] : [])], jumlahMayit: 1, jumlahAhliWaris: 2,
});

describe.skipIf(!URL_DB)('bank soal supabase lokal', () => {
  const servis = () => createClient(URL_DB!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? '', { auth: { persistSession: false } });
  const anon = () => buatBankSupabase(createClient(URL_DB!, process.env.SUPABASE_ANON_KEY ?? '', { auth: { persistSession: false } }));

  beforeAll(async () => {
    const { error } = await servis().from('bank_soal').insert(Array.from({ length: 30 }, (_, i) => baris(i + 1)).map(b => ({
      kode: b.kode, versi_generator: b.versiGenerator, keluarga: b.keluarga, tingkat: b.tingkat, modul: b.modul, label: b.label, jumlah_mayit: b.jumlahMayit, jumlah_ahli_waris: b.jumlahAhliWaris,
    })));
    if (error) throw error;
  });
  afterAll(async () => { await servis().from('bank_soal').delete().like('kode', `${AWALAN}%`); });

  test('anon mencari: deterministik terhadap benih, filter label bekerja', async () => {
    const bank = anon();
    const satu = await bank.cariSoal({ jumlah: 10, benih: 's1', label: { semua: [label] } });
    expect(satu).toHaveLength(10);
    expect(await bank.cariSoal({ jumlah: 10, benih: 's1', label: { semua: [label] } })).toEqual(satu);
    expect(await bank.cariSoal({ jumlah: 10, benih: 's2', label: { semua: [label] } })).not.toEqual(satu);
    expect(await bank.cariSoal({ jumlah: 100, benih: 's1', label: { semua: [label], tanpa: ['ganjil'] } })).toHaveLength(15);
  });
  test('anon tidak bisa menulis', async () => {
    await expect(anon().simpan([baris(999)])).rejects.toThrow(/permission denied|row-level security/);
  });
});
