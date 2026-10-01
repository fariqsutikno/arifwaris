// packages/data/src/__tests__/memori-pengguna.test.ts
import { describe, expect, test } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '../index.js';

const A = { userId: 'a', email: 'a@tes.local' };
const B = { userId: 'b', email: 'b@tes.local' };

describe('memori: pengguna & akun', () => {
  test('push: langganan idempoten per endpoint, bisa dihapus, kabar hanya milik sendiri dan setelah waktu yang diminta', async () => {
    const bersama = buatMemori({ sesi: A });
    const { pengguna, aturKabarPush } = buatMemoriPengguna(bersama);
    const kabar = (kunci: string, dikirimPada: string) => ({ kunci, jenis: 'streak_terancam' as const, judul: 'j', isi: 'i', tautan: null, mendesak: true, dikirimPada });
    aturKabarPush('a', [kabar('baru', '2026-10-02T11:00:00Z'), kabar('lama', '2026-09-30T11:00:00Z')]);
    aturKabarPush('b', [kabar('milik-b', '2026-10-02T11:00:00Z')]);
    expect((await pengguna.bacaKabarPush('2026-10-01T00:00:00Z')).map(isi => isi.kunci)).toEqual(['baru']);
    await pengguna.simpanLangganan({ endpoint: 'https://p/1', p256dh: 'k', auth: 'a', bahasa: 'id' });
    await pengguna.simpanLangganan({ endpoint: 'https://p/1', p256dh: 'k2', auth: 'a', bahasa: 'ar' });
    await pengguna.hapusLangganan('https://p/1');
    await expect(pengguna.hapusLangganan('https://p/tidak-ada')).resolves.toBeUndefined();
  });

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

  test('profil per pengguna, nama dirapikan', async () => {
    const bersama = buatMemori({ sesi: A });
    const { pengguna } = buatMemoriPengguna(bersama);
    expect(await pengguna.bacaProfil()).toBeNull();
    await pengguna.simpanProfil({ namaTampilan: ' Umar ', ikutPapanPeringkat: true, tampilkanAvatar: false, zonaWaktu: 'Asia/Jakarta' });
    expect((await pengguna.bacaProfil())?.namaTampilan).toBe('Umar');
    bersama.masukSebagai(B);
    expect(await pengguna.bacaProfil()).toBeNull();
  });

  test('peringkat: papan dibatasi tapi baris sendiri tetap ada; ringkasan butuh sesi', async () => {
    const bersama = buatMemori({ sesi: null });
    const { peringkat, aturPeringkat } = buatMemoriPengguna(bersama);
    await expect(peringkat.papan('minggu')).rejects.toThrow('tidak tersedia');
    const baris = (namaTampilan: string, saya = false) => ({ peringkat: 1, namaTampilan, avatar: null, xp: 5, streakSekarang: 1, saya });
    const ringkasan = { xpTotal: 5, xpMingguIni: 5, streakSekarang: 1, streakTerpanjang: 1, aktifHariIni: true };
    aturPeringkat({ ringkasan, papan: { minggu: [baris('a'), baris('b'), baris('c', true)], semua: [] } });
    expect((await peringkat.papan('minggu', 1)).map(b => b.namaTampilan)).toEqual(['a', 'c']);
    await expect(peringkat.ringkasanSaya()).rejects.toThrow('belum masuk');
    bersama.masukSebagai(A);
    expect(await peringkat.ringkasanSaya()).toEqual(ringkasan);
  });

  test('catatKegiatan: id sama diabaikan, tanpa sesi ditolak', async () => {
    const bersama = buatMemori({ sesi: A });
    const { pengguna } = buatMemoriPengguna(bersama);
    const kegiatan = { id: 'u1', jenis: 'kuis' as const, slug: 'K-01', benar: true };
    await pengguna.catatKegiatan(kegiatan);
    await expect(pengguna.catatKegiatan(kegiatan)).resolves.toBeUndefined();
    bersama.masukSebagai(null);
    await expect(pengguna.catatKegiatan(kegiatan)).rejects.toThrow('belum masuk');
  });

  test('tanpa sesi ditolak', async () => {
    const { pengguna, akun } = buatMemoriPengguna(buatMemori());
    expect(await akun.sesi()).toBeNull();
    await expect(pengguna.bacaPreferensi()).rejects.toThrow(/belum masuk/);
  });

  test('peran: hanya admin yang bisa mengatur', async () => {
    const bersama = buatMemori({ sesi: A, peran: { a: 'penulis' } });
    bersama.daftarkanPengguna(A);
    bersama.daftarkanPengguna(B);
    const { akun } = buatMemoriPengguna(bersama);
    expect(await akun.peranSaya()).toBe('penulis');
    await expect(akun.aturPeran(B.email, 'reviewer')).rejects.toThrow(/admin/);
    bersama.aturPeranLangsung('a', 'admin');
    await akun.aturPeran(B.email, 'reviewer');
    expect(await akun.daftarPeran()).toEqual(expect.arrayContaining([{ userId: 'b', email: B.email, nama: null, peran: 'reviewer' }]));
  });

  test('keluar menghapus sesi', async () => {
    const bersama = buatMemori({ sesi: A });
    const { akun } = buatMemoriPengguna(bersama);
    await akun.keluar();
    expect(await akun.sesi()).toBeNull();
  });
});
