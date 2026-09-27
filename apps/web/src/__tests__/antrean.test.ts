import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { antre, aturAkunLokal, bacaAntrean, kirimAntrean } from '../akun/antrean';
import { catatLatihan, tandaiPelajaranSelesai } from '../progres';
import { kumpulPreferensi, simpanTujuan, simpanUkuranBaca, terapkanPreferensi, bacaUkuranBaca, useBahasa } from '../preferensi';

const belajar = (slug: string, diubahPada = '2026-09-27T00:00:00Z') => ({ tabel: 'belajar' as const, baris: { pelajaranSlug: slug, selesai: true, diubahPada } });
beforeEach(() => { localStorage.clear(); aturAkunLokal(null); });

test('tanpa akun tidak mengantre', () => {
  antre(belajar('a'));
  expect(bacaAntrean()).toEqual([]);
});

test('entri dengan kunci sama menimpa; kegiatan tidak saling menimpa', () => {
  aturAkunLokal('u');
  antre(belajar('a', '1'));
  antre(belajar('a', '2'));
  antre({ tabel: 'kegiatan', baris: { id: 'k1', jenis: 'kuis', slug: 'K-01', benar: true } });
  antre({ tabel: 'kegiatan', baris: { id: 'k2', jenis: 'kuis', slug: 'K-01', benar: false } });
  expect(bacaAntrean()).toHaveLength(3);
  expect(bacaAntrean()[0]).toMatchObject({ baris: { diubahPada: '2' } });
});

test('gagal di tengah: yang terkirim keluar, sisanya tetap berurutan', async () => {
  aturAkunLokal('u');
  const { pengguna } = buatMemoriPengguna(buatMemori({ sesi: { userId: 'u', email: 'u@tes.local' } }));
  antre(belajar('a'));
  antre(belajar('b'));
  antre(belajar('c'));
  const asli = pengguna.simpanProgresBelajar;
  pengguna.simpanProgresBelajar = vi.fn(async baris => { if (baris.pelajaranSlug === 'b') throw new Error('luring'); return asli(baris); });
  expect(await kirimAntrean(pengguna)).toBe(2);
  expect(bacaAntrean().map(entri => (entri as any).baris.pelajaranSlug)).toEqual(['b', 'c']);
  pengguna.simpanProgresBelajar = asli;
  expect(await kirimAntrean(pengguna)).toBe(0);
  expect((await pengguna.bacaProgresBelajar()).map(baris => baris.pelajaranSlug).sort()).toEqual(['a', 'b', 'c']);
});

test('penulis data mengantre: progres, latihan + kegiatan, preferensi', () => {
  aturAkunLokal('u');
  tandaiPelajaranSelesai('ashabah-1');
  catatLatihan('kuis', 'K-01', true, 0);
  simpanUkuranBaca(20);
  const tabel = bacaAntrean().map(entri => entri.tabel);
  expect(tabel).toEqual(['belajar', 'kegiatan', 'latihan', 'kegiatan', 'preferensi']);
});

test('preferensi: kumpul lalu terapkan bolak-balik', () => {
  simpanUkuranBaca(22);
  const preferensi = kumpulPreferensi()!;
  localStorage.clear();
  terapkanPreferensi(preferensi);
  expect(bacaUkuranBaca()).toBe(22);
});

test('antrean rusak dibaca kosong', () => {
  localStorage.setItem('arif-waris:antrean', 'bukan json');
  expect(bacaAntrean()).toEqual([]);
});

test('entri rusak (tabel asing, tanpa baris/id) dibuang, antre tetap jalan', () => {
  aturAkunLokal('u');
  localStorage.setItem('arif-waris:antrean', JSON.stringify([{ tabel: 'asing', baris: {} }, { tabel: 'belajar' }, { tabel: 'hapus_tersimpan' }, null]));
  expect(bacaAntrean()).toEqual([]);
  antre(belajar('a'));
  expect(bacaAntrean()).toHaveLength(1);
});

test('simpan preferensi dengan nilai yang sama: waktu ubah & antrean tidak berubah', () => {
  aturAkunLokal('u');
  simpanTujuan('hitung');
  localStorage.setItem('arif-waris:preferensi-diubah', '2000-01-01T00:00:00.000Z');
  localStorage.setItem('arif-waris:antrean', '[]');
  simpanTujuan('hitung');
  expect(localStorage.getItem('arif-waris:preferensi-diubah')).toBe('2000-01-01T00:00:00.000Z');
  expect(bacaAntrean()).toEqual([]);
});

test('terapkan preferensi dari akun langsung mengganti bahasa aktif', () => {
  const { result } = renderHook(() => useBahasa());
  expect(result.current).toBe('id');
  act(() => terapkanPreferensi({ isi: { 'arif-waris:bahasa': 'ar' }, diubahPada: '2026-09-27T00:00:00.000Z' }));
  expect(result.current).toBe('ar');
});
