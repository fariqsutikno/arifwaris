import { expect, test } from 'vitest';
import { bacaPelajaran, bacaIsi, RUJUKAN } from '@waris/content';
import { buatMemori } from '@waris/data';
import hajb from '../../docs/materi-kit/contoh/5-1-hajb.md?raw';
import aul from '../../docs/materi-kit/contoh/6-2-aul.md?raw';
import { imporMateri } from './tulis';

const ADMIN = { userId: 'admin', email: 'admin@lokal' };
const pelajaran = [bacaPelajaran(hajb, '5-1-hajb'), bacaPelajaran(aul, '6-2-aul')];
const buatRepo = () => buatMemori({ refs: RUJUKAN.map(r => r.kode), sesi: ADMIN, peran: { admin: 'admin' } });

test('menulis 2 pelajaran dan 6 soal sebagai draf, tidak ada yang terbit', async () => {
  const repo = buatRepo();
  const hasil = await imporMateri(repo, pelajaran, false);
  expect(hasil.ditulis.map(r => r.jenis).sort()).toEqual(['materi', 'materi', ...Array(6).fill('soal_kuis')]);
  expect(await repo.konten.bacaTerbit()).toEqual([]);
  const entri = await repo.konten.daftarEntri();
  expect(entri).toHaveLength(8);
  expect(entri.every(e => e.revisiTerakhir?.status === 'draf')).toBe(true);
  const soal = entri.find(e => e.slug === 'K-5.1-1')!.revisiTerakhir!.isi;
  const dibaca = bacaIsi('soal_kuis', soal);
  expect(dibaca.ok && dibaca.isi.sumber).toBe('materi:5-1-hajb');
});

test('impor ulang dengan isi sama dilewati; mode kering tidak menulis', async () => {
  const repo = buatRepo();
  expect((await imporMateri(repo, pelajaran, true)).ditulis).toHaveLength(8);
  expect(await repo.konten.daftarEntri()).toEqual([]);
  await imporMateri(repo, pelajaran, false);
  const ulang = await imporMateri(repo, pelajaran, false);
  expect(ulang).toMatchObject({ ditulis: [], dilewati: expect.any(Array) });
  expect(ulang.dilewati).toHaveLength(8);
  expect((await repo.konten.daftarEntri()).every(e => e.revisiTerakhir?.status === 'draf')).toBe(true);
});

test('isi berubah → draf baru pada entri yang sama', async () => {
  const repo = buatRepo();
  await imporMateri(repo, pelajaran, false);
  const ubah = [{ ...pelajaran[0]!, judul: 'Judul baru' }, pelajaran[1]!];
  const hasil = await imporMateri(repo, ubah, false);
  expect(hasil.ditulis.map(r => r.slug)).toEqual(['5-1-hajb']);
  expect(await repo.konten.daftarEntri()).toHaveLength(8);
});
