import { expect, test } from 'vitest';
import { bacaPaketSoal, bacaIsi, RUJUKAN } from '@waris/content';
import { buatMemori } from '@waris/data';
import aul from '../../docs/soal-kit/contoh/aul-dasar.md?raw';
import hajb from '../../docs/soal-kit/contoh/hajb-dasar.md?raw';
import { imporSoal, putuskan, susunRencana } from './tulis';

const ADMIN = { userId: 'admin', email: 'admin@lokal' };
const paket = [bacaPaketSoal(aul, 'aul-dasar'), bacaPaketSoal(hajb, 'hajb-dasar')];
const jumlah = paket.reduce((total, isi) => total + isi.butir.length, 0);
const buatRepo = () => buatMemori({ refs: RUJUKAN.map(r => r.kode), sesi: ADMIN, peran: { admin: 'admin' } });

test('rencana: slug = kode soal, sumber paket:<nama>, refs memuat rujukan soal', () => {
  const rencana = susunRencana(paket);
  expect(rencana).toHaveLength(jumlah);
  expect(rencana[0]!.slug).toBe('P-06-001');
  expect(rencana[0]!.refs).toContain('R09-3');
  expect((rencana[0]!.isi as { sumber: string }).sumber).toBe('paket:aul-dasar');
});

test('putuskan: baru, sama, ubah, dilewati', () => {
  const [rencana] = susunRencana(paket);
  const revisi = (status: string, isi: unknown = rencana!.isi) => ({ status, diabaikan: false, isi, refs: rencana!.refs });
  expect(putuskan(rencana!, undefined)).toBe('baru');
  expect(putuskan(rencana!, revisi('diajukan'))).toBe('sama');
  expect(putuskan(rencana!, revisi('disetujui', { ...(rencana!.isi as object) }))).toBe('sama');
  expect(putuskan(rencana!, revisi('disetujui', {}))).toBe('ubah');
  expect(putuskan(rencana!, revisi('draf', {}))).toBe('ubah');
  expect(putuskan(rencana!, revisi('diajukan', {}))).toBe('dilewati');
  expect(putuskan(rencana!, revisi('diperiksa', {}))).toBe('dilewati');
  expect(putuskan(rencana!, { ...revisi('diajukan', {}), diabaikan: true })).toBe('ubah');
});

test('menulis semua soal berstatus diajukan; ulang = sama; kering tidak menulis', async () => {
  const repo = buatRepo();
  expect((await imporSoal(repo, paket, true)).baru).toHaveLength(jumlah);
  expect(await repo.konten.daftarEntri()).toEqual([]);
  expect((await imporSoal(repo, paket, false)).baru).toHaveLength(jumlah);
  const entri = await repo.konten.daftarEntri('soal_kuis');
  expect(entri).toHaveLength(jumlah);
  expect(entri.every(e => e.revisiTerakhir?.status === 'diajukan')).toBe(true);
  const dibaca = bacaIsi('soal_kuis', entri[0]!.revisiTerakhir!.isi);
  expect(dibaca.ok && dibaca.isi.sumber).toMatch(/^paket:/);
  expect((await imporSoal(repo, paket, false)).sama).toHaveLength(jumlah);
});

test('isi berubah saat revisi sedang diajukan: dilaporkan dan tidak ditimpa', async () => {
  const repo = buatRepo();
  await imporSoal(repo, paket, false);
  const ubah = structuredClone(paket);
  ubah[0]!.butir[0]!.soal.pembahasan = [{ jenis: 'teks', isi: 'pembahasan lain' } as never];
  const hasil = await imporSoal(repo, ubah, false);
  expect(hasil.dilewati.map(d => d.rencana.slug)).toEqual(['P-06-001']);
  expect((await repo.konten.daftarEntri('soal_kuis')).every(e => e.revisiTerakhir?.status === 'diajukan')).toBe(true);
});
