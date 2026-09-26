// packages/data/src/__tests__/memori-pengguna.test.ts
import { describe, expect, test } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '../index.js';

const A = { userId: 'a', email: 'a@tes.local' };
const B = { userId: 'b', email: 'b@tes.local' };

describe('memori: pengguna & akun', () => {
  test('data tiap pengguna terpisah', async () => {
    const bersama = buatMemori({ sesi: A });
    const { pengguna } = buatMemoriPengguna(bersama);
    await pengguna.simpanProgresBelajar({ pelajaranSlug: 'ashabah-1', selesai: true, diubahPada: '2026-09-26T00:00:00Z' });
    bersama.masukSebagai(B);
    expect(await pengguna.bacaProgresBelajar()).toEqual([]);
    bersama.masukSebagai(A);
    expect(await pengguna.bacaProgresBelajar()).toHaveLength(1);
  });

  test('simpan = upsert per kunci baris', async () => {
    const bersama = buatMemori({ sesi: A });
    const { pengguna } = buatMemoriPengguna(bersama);
    const dasar = { soalSlug: 'K-01', jenis: 'kuis' as const, jawabanTerakhir: 1, diubahPada: '2026-09-26T00:00:00Z' };
    await pengguna.simpanProgresLatihan({ ...dasar, benar: false, jumlahCoba: 1 });
    await pengguna.simpanProgresLatihan({ ...dasar, benar: true, jumlahCoba: 2 });
    expect(await pengguna.bacaProgresLatihan()).toEqual([{ ...dasar, benar: true, jumlahCoba: 2 }]);
    await pengguna.simpanRiwayat({ id: 'k1', kasus: {}, judul: 'x', disimpanPada: '2026-09-26T00:00:00Z' });
    await pengguna.hapusRiwayat('k1');
    expect(await pengguna.bacaRiwayat()).toEqual([]);
  });

  test('tanpa sesi ditolak', async () => {
    const { pengguna, akun } = buatMemoriPengguna(buatMemori());
    expect(await akun.sesi()).toBeNull();
    await expect(pengguna.bacaPreferensi()).rejects.toThrow(/belum masuk/);
  });

  test('peran: hanya admin yang bisa mengatur', async () => {
    const bersama = buatMemori({ sesi: A, peran: { a: 'penulis' } });
    const { akun } = buatMemoriPengguna(bersama);
    expect(await akun.peranSaya()).toBe('penulis');
    await expect(akun.aturPeran('b', 'reviewer')).rejects.toThrow(/admin/);
    bersama.aturPeranLangsung('a', 'admin');
    await akun.aturPeran('b', 'reviewer');
    expect(await akun.daftarPeran()).toEqual(expect.arrayContaining([{ userId: 'b', peran: 'reviewer' }]));
  });

  test('keluar menghapus sesi', async () => {
    const bersama = buatMemori({ sesi: A });
    const { akun } = buatMemoriPengguna(bersama);
    await akun.keluar();
    expect(await akun.sesi()).toBeNull();
  });
});
