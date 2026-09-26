// scripts/impor/tulis.test.ts
import { expect, test } from 'vitest';
import { RUJUKAN } from '@waris/content';
import { buatMemori } from '@waris/data';
import type { ButirDiksi } from '../diksi/rencana';
import { tulisKeRepositori, type BarisImpor } from './tulis';

const ADMIN = { userId: 'admin', email: 'admin@lokal' };
const buatRepo = () => buatMemori({ refs: RUJUKAN.map(r => r.kode), sesi: ADMIN, peran: { admin: 'admin' } });
const baris: BarisImpor[] = [
  { jenis: 'faq', slug: 'a', urutan: 0, isi: { id: 'a', kelompok: 'Fikih', pertanyaan: 'A?', jawaban: [] }, refs: ['R09-7'], perluCek: true },
  { jenis: 'kitab', slug: 'k', urutan: 0, isi: { judul: 'K' }, refs: [], perluCek: false },
];
const diksi: ButirDiksi[] = [
  { kunci: 'umum.batal', halaman: 'umum', id: 'Batal', ar: 'إلغاء' },
  { kunci: 'umum.baru', halaman: 'umum', id: 'Baru', ar: null },
];

test('terbit + antrean: draf punya revisi terbit dan revisi diajukan', async () => {
  const repo = buatRepo();
  expect(await tulisKeRepositori(repo, baris, diksi)).toEqual({ dibuat: 4, dilewati: 0 });
  expect((await repo.konten.bacaTerbit()).map(b => b.slug).sort()).toEqual(['a', 'k']);
  const antrean = await repo.editorial.antreanReview();
  expect(antrean).toHaveLength(1);                                   // hanya faq (kitab bukan draf)
  expect((await repo.diksi.bacaTerbit()).map(d => d.kunci).sort()).toEqual(['umum.baru', 'umum.batal']);
  expect((await repo.diksi.daftarRevisi('umum.batal')).map(r => r.status).sort()).toEqual(['diajukan', 'disetujui']);
  expect((await repo.diksi.daftarRevisi('umum.baru')).map(r => r.status)).toEqual(['disetujui']);
});

test('materi: revisi diajukan tanpa lencana draf', async () => {
  const repo = buatRepo();
  const pelajaran = { slug: 'p', judul: 'P', modul: 1, urutan: 1, tujuan: 't', perluCek: true, blok: [] };
  await tulisKeRepositori(repo, [{ jenis: 'materi', slug: 'p', urutan: 101, isi: pelajaran, refs: ['R01-1'], perluCek: true }], []);
  const [diajukan] = await repo.editorial.antreanReview();
  expect((diajukan!.isi as { perluCek: boolean }).perluCek).toBe(false);
  expect(((await repo.konten.bacaTerbit())[0]!.isi as { perluCek: boolean }).perluCek).toBe(true);
});

test('idempoten: jalan kedua tidak membuat apa pun', async () => {
  const repo = buatRepo();
  await tulisKeRepositori(repo, baris, diksi);
  expect(await tulisKeRepositori(repo, baris, diksi)).toEqual({ dibuat: 0, dilewati: 4 });
  expect(await repo.editorial.antreanReview()).toHaveLength(1);
});
