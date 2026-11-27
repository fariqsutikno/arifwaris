// packages/data/src/__tests__/bank.test.ts
// Kontrak bank soal: memori (cari + validasi) dan pembungkus Supabase (argumen RPC, batch upsert) dengan klien tiruan.
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, test, vi } from 'vitest';
import { buatBankSupabase, buatMemoriBank, UKURAN_BATCH_SIMPAN_BANK, type BarisBankSoal } from '../index.js';

const baris = (n: number): BarisBankSoal => ({
  kode: `G1-B-${n}`, versiGenerator: 1, keluarga: n % 7 === 0 ? 'gharqa' : 'biasa', tingkat: (['dasar', 'menengah', 'sulit'] as const)[n % 3]!,
  modul: [n % 4 + 1], label: ['a', ...(n % 2 === 0 ? ['b'] : []), ...(n % 3 === 0 ? ['c'] : []), ...(n % 5 === 0 ? ['aul'] : [])],
  jumlahMayit: 1, jumlahAhliWaris: 3,
});
const isiBank = async () => {
  const bank = buatMemoriBank();
  await bank.simpan(Array.from({ length: 300 }, (_, i) => baris(i + 1)));
  return bank;
};

describe('memori bank: soal kuis dan persetujuan aturan', () => {
  const kuis = (n: number, aturan: string[]): BarisBankSoal => ({ ...baris(n), kode: `K1-${n}`, bentuk: 'kuis', aturan, label: ['aul:6>7'] });
  const isi = async () => {
    const bank = buatMemoriBank();
    await bank.simpan([baris(1), kuis(1, ['lupaAul']), kuis(2, ['lupaAul', 'lupaRadd']), kuis(3, ['lupaRadd'])]);
    return bank;
  };
  test('bawaan hanya soal hitung; kuis butuh semua aturannya disetujui', async () => {
    const bank = await isi();
    expect(await bank.cariSoal({ jumlah: 10, benih: 'x' })).toEqual(['G1-B-1']);
    expect(await bank.cariSoal({ jumlah: 10, benih: 'x', bentuk: 'kuis' })).toEqual([]);
    await bank.setujui('lupaAul');
    expect(await bank.cariSoal({ jumlah: 10, benih: 'x', bentuk: 'kuis' })).toEqual(['K1-1']);
    await bank.setujui('lupaRadd');
    expect((await bank.cariSoal({ jumlah: 10, benih: 'x', bentuk: 'kuis' })).sort()).toEqual(['K1-1', 'K1-2', 'K1-3']);
    await bank.cabut('lupaAul');
    expect(await bank.cariSoal({ jumlah: 10, benih: 'x', bentuk: 'kuis' })).toEqual(['K1-3']);
    expect(await bank.daftarDisetujui()).toEqual(['lupaRadd']);
  });
  test('contohSoal: tanpa melihat persetujuan, deterministik, dibatasi jumlah', async () => {
    const bank = await isi();
    expect((await bank.contohSoal('lupaAul', 5, 'b')).sort()).toEqual(['K1-1', 'K1-2']);
    expect(await bank.contohSoal('lupaRadd', 1, 'b')).toEqual(await bank.contohSoal('lupaRadd', 1, 'b'));
    await expect(bank.contohSoal('lupaAul', 21, 'b')).rejects.toThrow(/jumlah/);
  });
  test('bentuk tak dikenal ditolak', async () => {
    await expect((await isi()).cariSoal({ jumlah: 5, benih: 'x', bentuk: 'lain' as never })).rejects.toThrow(/bentuk/);
  });
});

describe('memori bank', () => {
  test('benih sama = kode sama, benih lain = kode lain, tanpa duplikat', async () => {
    const bank = await isiBank();
    const satu = await bank.cariSoal({ jumlah: 20, benih: 'b1' });
    expect(satu).toHaveLength(20);
    expect(new Set(satu).size).toBe(20);
    expect(await bank.cariSoal({ jumlah: 20, benih: 'b1' })).toEqual(satu);
    expect(await bank.cariSoal({ jumlah: 20, benih: 'b2' })).not.toEqual(satu);
  });
  test('filter label semua / salahSatu / tanpa dan tingkat, modul, keluarga', async () => {
    const bank = await isiBank();
    const semua = await bank.cariSoal({ jumlah: 200, benih: 'x', label: { semua: ['b', 'c'] } });
    expect(semua).toHaveLength(50);
    expect(await bank.cariSoal({ jumlah: 200, benih: 'x', label: { salahSatu: ['c', 'aul'] } })).toHaveLength(140);
    expect(await bank.cariSoal({ jumlah: 200, benih: 'x', label: { tanpa: ['b'] } })).toHaveLength(150);
    const kombinasi = await bank.cariSoal({ jumlah: 200, benih: 'x', tingkat: 'sulit', modul: 2, keluarga: 'gharqa' });
    expect(kombinasi.length).toBeGreaterThan(0);
    expect(kombinasi.every(kode => { const n = Number(kode.split('-')[2]); return n % 3 === 2 && n % 4 === 1 && n % 7 === 0; })).toBe(true);
  });
  test('simpan idempoten: kode sama menimpa, bukan menggandakan', async () => {
    const bank = buatMemoriBank();
    await bank.simpan([baris(1)]);
    await bank.simpan([{ ...baris(1), tingkat: 'sulit' }]);
    expect(await bank.cariSoal({ jumlah: 10, benih: 'x' })).toEqual(['G1-B-1']);
    expect(await bank.cariSoal({ jumlah: 10, benih: 'x', tingkat: 'sulit' })).toEqual(['G1-B-1']);
  });
  test.each([
    [{ jumlah: 0, benih: 'x' }, /jumlah/], [{ jumlah: 201, benih: 'x' }, /jumlah/], [{ jumlah: 1.5, benih: 'x' }, /jumlah/],
    [{ jumlah: 5, benih: '' }, /benih/], [{ jumlah: 5, benih: 'x', tingkat: 'mudah' }, /tingkat/], [{ jumlah: 5, benih: 'x', modul: 0 }, /modul/],
    [{ jumlah: 5, benih: 'x', label: { semua: Array(51).fill('a') } }, /label\.semua/], [{ jumlah: 5, benih: 'x', label: { tanpa: [''] } }, /token/],
  ] as const)('masukan tidak sah ditolak: %j', async (masukan, pola) => {
    await expect((await isiBank()).cariSoal(masukan as never)).rejects.toThrow(pola);
  });
});

describe('pembungkus supabase', () => {
  test('cariSoal memetakan argumen ke RPC cari_soal dan memvalidasi sebelum memanggil', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: ['G1-B-1'], error: null });
    const bank = buatBankSupabase({ rpc } as unknown as SupabaseClient);
    expect(await bank.cariSoal({ jumlah: 5, benih: 's', tingkat: 'dasar', modul: 3, label: { semua: ['aul'] } })).toEqual(['G1-B-1']);
    expect(rpc).toHaveBeenCalledWith('cari_soal', {
      p_jumlah: 5, p_benih: 's', p_tingkat: 'dasar', p_modul: 3, p_keluarga: null,
      p_label_semua: ['aul'], p_label_salah_satu: null, p_label_tanpa: null,
    });
    await expect(bank.cariSoal({ jumlah: 500, benih: 's' })).rejects.toThrow(/jumlah/);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  test('galat server dilempar sebagai Error', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'jumlah harus 1..200' } });
    await expect(buatBankSupabase({ rpc } as unknown as SupabaseClient).cariSoal({ jumlah: 5, benih: 's' })).rejects.toThrow('jumlah harus 1..200');
  });
  test('simpan: upsert per batch ke bank_soal onConflict kode, kolom snake_case', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });
    const total = UKURAN_BATCH_SIMPAN_BANK * 2 + 5;
    await buatBankSupabase({ from } as unknown as SupabaseClient).simpan(Array.from({ length: total }, (_, i) => baris(i + 1)));
    expect(from).toHaveBeenCalledWith('bank_soal');
    expect(upsert.mock.calls.map(([isi]) => isi.length)).toEqual([UKURAN_BATCH_SIMPAN_BANK, UKURAN_BATCH_SIMPAN_BANK, 5]);
    expect(upsert.mock.calls[0]![1]).toEqual({ onConflict: 'kode' });
    expect(upsert.mock.calls[0]![0][0]).toEqual({
      kode: 'G1-B-1', versi_generator: 1, keluarga: 'biasa', tingkat: 'menengah', modul: [2], label: ['a'], jumlah_mayit: 1, jumlah_ahli_waris: 3,
      bentuk: 'hitung', aturan: [],
    });
  });
  test('cariSoal bentuk kuis mengirim p_bentuk; hitung tidak (aman pada basis data lama)', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const bank = buatBankSupabase({ rpc } as unknown as SupabaseClient);
    await bank.cariSoal({ jumlah: 5, benih: 'x' });
    await bank.cariSoal({ jumlah: 5, benih: 'x', bentuk: 'kuis' });
    expect(rpc.mock.calls[0]![1]).not.toHaveProperty('p_bentuk');
    expect(rpc.mock.calls[1]![1]).toMatchObject({ p_bentuk: 'kuis' });
  });
  test('simpan melempar bila RLS menolak', async () => {
    const from = () => ({ upsert: async () => ({ error: { message: 'new row violates row-level security policy' } }) });
    await expect(buatBankSupabase({ from } as unknown as SupabaseClient).simpan([baris(1)])).rejects.toThrow(/row-level security/);
  });
});
