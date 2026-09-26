import { beforeEach, expect, test, vi } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { akunLokal, bacaAntrean, kirimAntrean } from '../akun/antrean';
import { keluarDanBersihkan, kirimSebelumKeluar, mulaiSinkron } from '../akun/sinkron';
import { bacaPelajaranSelesai, tandaiPelajaranSelesai } from '../progres';

const A = { userId: 'a', email: 'a@tes.local' };
const B = { userId: 'b', email: 'b@tes.local' };
const siapkan = (sesi: typeof A | null) => {
  const bersama = buatMemori({ sesi });
  return { bersama, repo: buatMemoriPengguna(bersama) };
};
beforeEach(() => localStorage.clear());

test('tanpa sesi: tidak ada yang berubah', async () => {
  const { repo } = siapkan(null);
  tandaiPelajaranSelesai('x');
  expect(await mulaiSinkron(repo, vi.fn())).toBeNull();
  expect(akunLokal()).toBeNull();
});

test('login pertama: data lokal digabung & dikirim, data server masuk ke lokal', async () => {
  const { repo } = siapkan(A);
  await repo.pengguna.simpanProgresBelajar({ pelajaranSlug: 'server', selesai: true, diubahPada: '2026-09-27T00:00:00.000Z' });
  tandaiPelajaranSelesai('lokal');
  await mulaiSinkron(repo, vi.fn());
  expect(akunLokal()).toBe('a');
  expect(bacaPelajaranSelesai()).toEqual(new Set(['server', 'lokal']));
  expect((await repo.pengguna.bacaProgresBelajar()).map(baris => baris.pelajaranSlug).sort()).toEqual(['lokal', 'server']);
  expect(bacaAntrean()).toEqual([]);
});

test('buka berikutnya: server jadi acuan (hapus di perangkat lain tidak hidup lagi)', async () => {
  const { repo } = siapkan(A);
  await repo.pengguna.simpanRiwayat({ id: 'k1', kasus: {}, judul: 'x', disimpanPada: '2026-09-27T00:00:00.000Z' });
  await mulaiSinkron(repo, vi.fn());
  await repo.pengguna.hapusRiwayat('k1'); // perangkat lain menghapus
  await mulaiSinkron(repo, vi.fn());
  expect(localStorage.getItem('arif-waris:tersimpan')).toBe('[]');
});

test('akun lain masuk tanpa keluar: data akun lama dibersihkan, tidak digabung', async () => {
  const { bersama, repo } = siapkan(A);
  await mulaiSinkron(repo, vi.fn());
  tandaiPelajaranSelesai('milik-a');
  await mulaiSinkron(repo, vi.fn());
  bersama.masukSebagai(B);
  await mulaiSinkron(repo, vi.fn());
  expect(bacaPelajaranSelesai().has('milik-a')).toBe(false);
  expect(await repo.pengguna.bacaProgresBelajar()).toEqual([]);
});

test('antrean gagal terkirim: data lokal tidak ditimpa server', async () => {
  const { repo } = siapkan(A);
  await mulaiSinkron(repo, vi.fn());
  repo.pengguna.simpanProgresBelajar = vi.fn().mockRejectedValue(new Error('luring'));
  tandaiPelajaranSelesai('belum-terkirim');
  await mulaiSinkron(repo, vi.fn());
  expect(bacaPelajaranSelesai().has('belum-terkirim')).toBe(true);
  expect(await kirimSebelumKeluar(repo, 50)).toBeGreaterThan(0);
});

test('perubahan lokal masuk antrean selagi menunggu server: tidak ditimpa tarikan', async () => {
  const { repo } = siapkan(A);
  await mulaiSinkron(repo, vi.fn());
  const asli = repo.pengguna.bacaProgresBelajar.bind(repo.pengguna);
  // Kirim gagal (mis. jaringan putus tepat saat entri baru diantre) supaya entri tetap di antrean, apa pun urutan microtask.
  repo.pengguna.simpanProgresBelajar = vi.fn().mockRejectedValue(new Error('luring'));
  repo.pengguna.bacaProgresBelajar = async () => {
    // Simulasikan: pengguna menandai pelajaran selesai tepat selagi tarikan server masih menunggu jaringan.
    tandaiPelajaranSelesai('selama-tarik');
    return asli();
  };
  await mulaiSinkron(repo, vi.fn());
  expect(bacaAntrean().length).toBeGreaterThan(0);
  expect(bacaPelajaranSelesai().has('selama-tarik')).toBe(true);
});

test('perubahan lokal terkirim & keluar antrean selagi menunggu server: tetap tidak ditimpa tarikan', async () => {
  const { repo } = siapkan(A);
  await mulaiSinkron(repo, vi.fn());
  const asli = repo.pengguna.bacaProgresBelajar.bind(repo.pengguna);
  repo.pengguna.bacaProgresBelajar = async () => {
    // Snapshot server diambil sebelum perubahan, lalu perubahan terkirim sehingga antrean kosong lagi.
    const lama = await asli();
    tandaiPelajaranSelesai('selama-tarik');
    await kirimAntrean(repo.pengguna);
    return lama;
  };
  await mulaiSinkron(repo, vi.fn());
  expect(bacaAntrean()).toEqual([]);
  expect(bacaPelajaranSelesai().has('selama-tarik')).toBe(true);
});

test('keluar menghapus semua kunci arif-waris', async () => {
  const { repo } = siapkan(A);
  await mulaiSinkron(repo, vi.fn());
  localStorage.setItem('arif-waris:riwayat', '[]');
  localStorage.setItem('lain', '1');
  await keluarDanBersihkan(repo);
  expect(Object.keys(localStorage)).toEqual(['lain']);
});
