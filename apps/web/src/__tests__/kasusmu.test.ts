import { beforeEach, expect, test, vi } from 'vitest';
import { antre, aturAkunLokal, bacaAntrean, kirimAntrean } from '../akun/antrean';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { sudahDibagikan, tandaiDibagikan } from '../bagikanLokal';
import { bacaKasusKu, hapusKasus, hapusSemuaSementara, pulihkanKasus } from '../kasusmu';
import { kasusDariSusunan, SUSUNAN_CEPAT } from '../lab';
import { bacaRiwayat, catatRiwayat, hapusRiwayat } from '../riwayat';
import { semuaTersimpan, simpanKasus } from '../tersimpan';

const HARI = 24 * 60 * 60 * 1000;
const sendiri = { jenis: 'sendiri' } as const;
const kasusKe = (i: number) => {
  const dasar = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: BigInt(1_000_000 * (i + 1)) } };
};
beforeEach(() => { localStorage.clear(); aturAkunLokal('u'); hapusRiwayat(); });

test('kasus yang ada di riwayat dan tersimpan hanya muncul sekali, sebagai tersimpan dengan nama', () => {
  catatRiwayat('a', kasusKe(0), Date.now(), sendiri);
  simpanKasus('a', kasusKe(0), 'Keluarga A');
  catatRiwayat('b', kasusKe(1), Date.now(), sendiri);
  const daftar = bacaKasusKu();
  expect(daftar.map(kasus => [kasus.id, kasus.judul, kasus.tersimpan])).toEqual([['a', 'Keluarga A', true], ['b', 'Istri, Anak laki-laki, Anak perempuan', false]]);
});

test('tersimpan di depan, lalu yang sementara; masing-masing terbaru dulu', () => {
  const sekarang = Date.now();
  catatRiwayat('s1', kasusKe(0), sekarang - 3000, sendiri);
  catatRiwayat('s2', kasusKe(1), sekarang - 1000, sendiri);
  simpanKasus('t1', kasusKe(2), 'T1');
  expect(bacaKasusKu(sekarang).map(kasus => kasus.id)).toEqual(['t1', 's2', 's1']);
});

test('sementara punya sisa hari sampai dihapus otomatis; tersimpan tidak', () => {
  const sekarang = Date.now();
  catatRiwayat('lama', kasusKe(0), sekarang - 10 * HARI, sendiri);
  simpanKasus('t', kasusKe(1), 'T');
  const [tersimpan, sementara] = bacaKasusKu(sekarang);
  expect(sementara!.sisaHari).toBe(20);
  expect(tersimpan!.sisaHari).toBeNull();
});

test('kasus tersimpan dari perangkat lain (tanpa riwayat lokal) tetap tampil', () => {
  simpanKasus('x', kasusKe(0), 'Dari HP');
  expect(bacaKasusKu().map(kasus => kasus.judul)).toEqual(['Dari HP']);
});

test('hapusKasus menghapus dari riwayat dan tersimpan sekaligus', () => {
  catatRiwayat('a', kasusKe(0), Date.now(), sendiri);
  simpanKasus('a', kasusKe(0), 'A');
  hapusKasus('a');
  expect(bacaKasusKu()).toEqual([]);
  expect(semuaTersimpan()).toEqual([]);
});

test('hapusSemuaSementara menyisakan yang tersimpan', () => {
  catatRiwayat('s', kasusKe(0), Date.now(), sendiri);
  catatRiwayat('t', kasusKe(1), Date.now(), sendiri);
  simpanKasus('t', kasusKe(1), 'T');
  hapusSemuaSementara();
  expect(bacaKasusKu().map(kasus => kasus.id)).toEqual(['t']);
});

test('hapusKasus mengantre hapus_tersimpan (S1, S6)', () => {
  catatRiwayat('a', kasusKe(0), Date.now(), sendiri);
  simpanKasus('a', kasusKe(0), 'A');
  hapusKasus('a');
  expect(bacaRiwayat()).toEqual([]);
  expect(bacaAntrean()).toContainEqual({ tabel: 'hapus_tersimpan', id: 'a' });
});

test('kasus yang sedang dibagikan: tautan dihentikan dan penanda lokal dibersihkan (S3)', () => {
  catatRiwayat('a', kasusKe(0), Date.now(), sendiri);
  tandaiDibagikan('a', true);
  const berhenti = vi.fn().mockResolvedValue(undefined);
  hapusKasus('a', { berhenti });
  expect(berhenti).toHaveBeenCalledWith('a');
  expect(sudahDibagikan('a')).toBe(false);
});

test('tanpa akses akun, penanda bagikan dibiarkan (tautan belum bisa dihentikan)', () => {
  catatRiwayat('a', kasusKe(0), Date.now(), sendiri);
  tandaiDibagikan('a', true);
  hapusKasus('a');
  expect(sudahDibagikan('a')).toBe(true);
});

test('berhenti gagal (offline): hapus lokal tetap jalan dan perintah berhenti masuk antrean, diputar saat online (S4)', async () => {
  catatRiwayat('a', kasusKe(0), Date.now(), sendiri);
  tandaiDibagikan('a', true);
  const berhenti = vi.fn().mockRejectedValue(new Error('offline'));
  expect(() => hapusKasus('a', { berhenti })).not.toThrow();
  await new Promise(selesai => setTimeout(selesai, 0));
  expect(bacaRiwayat()).toEqual([]);
  expect(bacaAntrean()).toContainEqual({ tabel: 'hentikan_bagikan', idRiwayat: 'a' });
  const { pengguna } = buatMemoriPengguna(buatMemori({ sesi: { userId: 'u', email: 'u@tes.local' } }));
  const ulang = vi.fn().mockResolvedValue(undefined);
  expect(await kirimAntrean(pengguna, { berhenti: ulang })).toBe(0);
  expect(ulang).toHaveBeenCalledWith('a');
});

test('antrean hentikan_bagikan tetap menunggu bila repositori bagikan belum tersedia', async () => {
  antre({ tabel: 'hentikan_bagikan', idRiwayat: 'a' });
  const { pengguna } = buatMemoriPengguna(buatMemori({ sesi: { userId: 'u', email: 'u@tes.local' } }));
  expect(await kirimAntrean(pengguna)).toBeGreaterThan(0);
});

test('pulihkanKasus menulis ulang riwayat, tersimpan (ikut antre ke akun) (S2)', () => {
  catatRiwayat('a', kasusKe(0), 123, { jenis: 'impor' });
  simpanKasus('a', kasusKe(0), 'Nama A');
  const cadangan = hapusKasus('a');
  localStorage.removeItem('arif-waris:antrean');
  pulihkanKasus(cadangan);
  expect(bacaRiwayat().map(entri => [entri.id, entri.waktu, entri.sumber])).toEqual([['a', 123, { jenis: 'impor' }]]);
  expect(semuaTersimpan().map(baris => [baris.id, baris.judul])).toEqual([['a', 'Nama A']]);
  expect(bacaAntrean().some(entri => entri.tabel === 'tersimpan')).toBe(true);
});
