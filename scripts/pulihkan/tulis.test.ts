// scripts/pulihkan/tulis.test.ts
import { expect, test } from 'vitest';
import { RUJUKAN } from '@waris/content';
import { buatMemori } from '@waris/data';
import snapshot from '../../apps/web/src/snapshot.json';
import { barisRujukanKb, pulihkanDariSnapshot, type BarisSnapshot, type DiksiSnapshot } from './tulis';

const ADMIN = { userId: 'admin', email: 'admin@lokal' };
const data = snapshot as unknown as { konten: BarisSnapshot[]; diksi: DiksiSnapshot[] };

test('seluruh snapshot pulih ke repo kosong, lalu jalan kedua tidak menulis apa pun', async () => {
  const repo = buatMemori({ refs: RUJUKAN.map(r => r.kode), sesi: ADMIN, peran: { admin: 'admin' } });
  const total = data.konten.length + data.diksi.length;
  expect(await pulihkanDariSnapshot(repo, data)).toEqual({ dibuat: total, dilewati: 0 });
  const terbit = await repo.konten.bacaTerbit();
  expect(terbit.map(b => `${b.jenis}/${b.slug}`).sort()).toEqual(data.konten.map(b => `${b.jenis}/${b.slug}`).sort());
  expect((await repo.diksi.bacaTerbit())).toHaveLength(data.diksi.length);
  expect(await pulihkanDariSnapshot(repo, data)).toEqual({ dibuat: 0, dilewati: total });
});

test('entri tanpa revisi dari jalan yang gagal dipakai ulang', async () => {
  const repo = buatMemori({ refs: RUJUKAN.map(r => r.kode), sesi: ADMIN, peran: { admin: 'admin' } });
  const [pertama] = data.konten;
  await repo.editorial.buatEntri(pertama!.jenis as never, pertama!.slug, pertama!.urutan);
  await pulihkanDariSnapshot(repo, { konten: [pertama!], diksi: [] });
  expect(await repo.konten.daftarEntri()).toHaveLength(1);
  expect(await repo.konten.bacaTerbit()).toHaveLength(1);
});

test('rujukan KB pulih dari tabel docs/kb dan bisa diekspor kembali tanpa mengubah berkas', async () => {
  const { tulisBerkasKb } = await import('../ekspor/susun');
  const { readdirSync, readFileSync } = await import('node:fs');
  const repo = buatMemori({ refs: RUJUKAN.map(r => r.kode), sesi: ADMIN, peran: { admin: 'admin' } });
  await pulihkanDariSnapshot(repo, { konten: barisRujukanKb(), diksi: [] });
  const folder = new URL('../../docs/kb/', import.meta.url);
  const berkas = Object.fromEntries(readdirSync(folder).filter(n => n.endsWith('.md')).map(n => [n, readFileSync(new URL(n, folder), 'utf8')]));
  expect(tulisBerkasKb(await repo.konten.bacaTerbit(), berkas)).toEqual({});
});
