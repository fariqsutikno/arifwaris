// scripts/bank-tulis.test.ts
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { buatMemoriBank } from '@waris/data';
import { keBarisBank, keBarisKuis, tulisBerkasIndeks, tulisIndeksKuis, type BarisIndeks } from './bank-tulis';

const indeks = (n: number, label: string[] = ['aul']): BarisIndeks =>
  ({ kode: `G1-B-${n}`, keluarga: 'biasa', label, tingkat: 'dasar', modul: [6], jumlah_ahli_waris: 3 });

test('versi generator dari awalan kode, jumlah mayit dari label', () => {
  expect(keBarisBank(indeks(1))).toMatchObject({ versiGenerator: 1, jumlahMayit: 1, jumlahAhliWaris: 3 });
  expect(keBarisBank({ ...indeks(2, ['munasakhat', 'munasakhat:3']), kode: 'G2-M-X' })).toMatchObject({ versiGenerator: 2, jumlahMayit: 3 });
  expect(keBarisBank(indeks(3, ['gharqa', 'mayit:2']))).toMatchObject({ jumlahMayit: 2 });
  expect(() => keBarisBank({ ...indeks(4), kode: 'tanpa-versi' })).toThrow(/versi/);
});

test('berkas ditulis per batch dan jalan ulang idempoten (lanjut setelah terputus)', async () => {
  const berkas = join(mkdtempSync(join(tmpdir(), 'bank-')), 'indeks-biasa.jsonl');
  writeFileSync(berkas, Array.from({ length: 4500 }, (_, i) => JSON.stringify(indeks(i + 1))).join('\n') + '\n');
  const repo = buatMemoriBank();
  const langkah: number[] = [];
  expect(await tulisBerkasIndeks(repo, berkas, sudah => langkah.push(sudah))).toBe(4500);
  expect(langkah).toEqual([2000, 4000, 4500]);
  expect(await tulisBerkasIndeks(repo, berkas)).toBe(4500);
  expect(await repo.cariSoal({ jumlah: 200, benih: 'x', label: { semua: ['aul'] } })).toHaveLength(200);
});

test('berkas tidak ada = galat berpetunjuk', async () => {
  await expect(tulisBerkasIndeks(buatMemoriBank(), '/tidak/ada.jsonl')).rejects.toThrow(/bank:bangun --kering/);
});

test('indeks kuis dimuat sebagai bentuk kuis dengan aturannya; tampil hanya setelah aturan disetujui', async () => {
  const berkas = join(mkdtempSync(join(tmpdir(), 'bank-')), 'indeks-kuis.jsonl');
  const baris = { kode: 'K1-ABC', jenis: 'bagian', tingkat: 'sulit', modul: [6, 7], label_utama: 'aul:12>15', aturan: ['lupaAul', 'pasanganTertukar'] } as const;
  writeFileSync(berkas, `${JSON.stringify(baris)}\n`);
  expect(keBarisKuis({ ...baris, modul: [...baris.modul], aturan: [...baris.aturan] })).toMatchObject({ versiGenerator: 1, bentuk: 'kuis', aturan: ['lupaAul', 'pasanganTertukar'] });
  const repo = buatMemoriBank();
  expect(await tulisIndeksKuis(repo, berkas)).toBe(1);
  expect(await repo.cariSoal({ jumlah: 5, benih: 'x' })).toEqual([]);
  expect(await repo.cariSoal({ jumlah: 5, benih: 'x', bentuk: 'kuis' })).toEqual([]);
  await repo.setujui('lupaAul');
  await repo.setujui('pasanganTertukar');
  expect(await repo.cariSoal({ jumlah: 5, benih: 'x', bentuk: 'kuis' })).toEqual(['K1-ABC']);
});
