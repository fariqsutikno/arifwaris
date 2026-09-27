// Tes identitas entri: kode berikutnya, identitas otomatis dari judul, dan slugEntri mereproduksi slug seluruh data
// produksi (snapshot web) supaya entri baru mengikuti konvensi yang sama dengan entri lama.
import { expect, test } from 'vitest';
import { bacaIsi, type JenisKonten } from '@waris/content';
import { KUNCI_CONTOH } from '@waris/web/contoh';
import snapshot from '../../../web/src/snapshot.json';
import { kodeBerikutnya, lengkapiIdentitas, slugEntri } from '../editor/identitas';
import { nilaiFormKosong } from '../editor/nilaiForm';

test('kodeBerikutnya: nomor terbesar + 1, dua digit, awalan lain diabaikan', () => {
  expect(kodeBerikutnya('K-', [])).toBe('K-01');
  expect(kodeBerikutnya('K-', ['K-01', 'K-07', 'H-30', 'K-x'])).toBe('K-08');
  expect(kodeBerikutnya('H-', ['H-99'])).toBe('H-100');
});

test('lengkapiIdentitas: id FAQ kosong diisi slug pertanyaan; yang sudah diisi tidak diubah', () => {
  const kosong = nilaiFormKosong('faq');
  const form = { ...kosong, nilai: { ...kosong.nilai, pertanyaan: 'Apa itu Tirkah?' } };
  expect(lengkapiIdentitas('faq', form).nilai.id).toBe('apa-itu-tirkah');
  const diisi = { ...form, nilai: { ...form.nilai, id: 'tirkah' } };
  expect(lengkapiIdentitas('faq', diisi).nilai.id).toBe('tirkah');
});

// teks_edukasi tidak dibuat dari portal (kuncinya dari kode aplikasi).
const DIBUAT_DI_PORTAL = (jenis: string) => jenis !== 'teks_edukasi';

test('slugEntri = slug entri yang sudah ada di data produksi, untuk semua jenis yang dibuat di portal', () => {
  const beda = snapshot.konten
    .filter(baris => DIBUAT_DI_PORTAL(baris.jenis))
    .flatMap(baris => {
      const isi = bacaIsi(baris.jenis as JenisKonten, baris.isi);
      if (!isi.ok) return [`${baris.slug}: isi tidak sah`];
      const hasil = slugEntri(baris.jenis as JenisKonten, isi.isi);
      return hasil === baris.slug ? [] : [`${baris.jenis} ${baris.slug} → ${hasil}`];
    });
  expect(beda).toEqual([]);
});

test('semua kunci ahwal yang ada termasuk pilihan dropdown ahli waris', () => {
  const pilihan = new Set<string>(KUNCI_CONTOH.map(({ kunci }) => kunci));
  const kunciAhwal = snapshot.konten.filter(baris => baris.jenis === 'ahwal').map(baris => (baris.isi as { kunci: string }).kunci);
  expect(kunciAhwal.filter(kunci => !pilihan.has(kunci))).toEqual([]);
});
