// Pemeriksa paket soal pilihan ganda (docs/soal-kit): sintaks dan aturan tanpa engine.
import { expect, test } from 'vitest';
import { bacaPaketSoal, kodeSoalPaketGanda, periksaPaketSoal } from '../index.js';

const konteks = { slugDikenal: new Set(['5-1-hajb']), bagianPelajaran: new Map() };
const kepala = '---\npaket: uji\nmodul: 5\nsumber: 06: 6.1\n---\n\n';
const soal = (isi: Record<string, string> = {}) => {
  const bawaan: Record<string, string> = {
    kode: 'P-05-001', tingkat: 'dasar', topik: 'hajb:SAUDARA_KANDUNG', tanya: 'Siapa yang gugur?',
    pembahasan: 'Karena ada ayah.', rujukan: 'R06-4', ...isi,
  };
  return `\`\`\`soal\n${Object.entries(bawaan).filter(([, nilai]) => nilai !== '').map(([kunci, nilai]) => `${kunci}: ${nilai}`).join('\n')}\n- Ayah | Belum tepat.\n* Kakek | Tepat.\n- Ibunya | Belum tepat.\n\`\`\`\n`;
};
const pesan = (teks: string) => periksaPaketSoal(teks, 'uji.md', konteks).temuan.map(temuan => temuan.pesan);

test('paket sah terbaca dengan isian pemeriksa dan nomor baris benar', () => {
  const paket = bacaPaketSoal(kepala + soal({ pewaris: 'L', 'ahli waris': 'AYAH, 2 SAUDARA_KANDUNG', harapan: 'AYAH 1; ashl 1' }), 'uji.md');
  expect(paket).toMatchObject({ paket: 'uji', modul: 5, butir: [{ baris: 7, topik: ['hajb:SAUDARA_KANDUNG'], kasus: { pewaris: 'L', ahliWaris: ['AYAH', 'SAUDARA_KANDUNG', 'SAUDARA_KANDUNG'] } }] });
  expect(pesan(kepala + soal())).toEqual([]);
});

test('galat: kode di luar skema atau beda modul, kode ganda, topik kosong', () => {
  expect(pesan(kepala + soal({ kode: 'K-5.1-1' }))).toEqual([expect.stringContaining('P-<modul')]);
  expect(pesan(kepala + soal({ kode: 'P-06-001' }))).toEqual([expect.stringContaining('tidak sama dengan modul 5')]);
  expect(pesan(kepala + soal() + soal())).toEqual([expect.stringContaining('dipakai dua kali')]);
  expect(pesan(kepala + soal({ topik: '' }))).toEqual([expect.stringContaining('butuh "topik"')]);
});

test('angka bagian wajib berkasus; tanpa-kasus jadi peringatan; tautan [[#x]] ditolak', () => {
  expect(pesan(kepala + soal({ tanya: 'Berapa bagian ibu bila ada ayah, 1/3 atau 1/6?' }))).toEqual([expect.stringContaining('tanpa kasus')]);
  const hasil = periksaPaketSoal(kepala + soal({ tanya: 'Wasiat maksimal 1/3?', 'tanpa-kasus': 'wasiat bukan saham' }), 'uji.md', konteks);
  expect(hasil.temuan).toEqual([expect.objectContaining({ tingkat: 'peringatan' })]);
  expect(pesan(kepala + soal({ pembahasan: 'Lihat [[#3]].' }))).toEqual([expect.stringContaining('[[>slug#bagian]]')]);
  expect(pesan(kepala + soal({ pembahasan: 'Lihat [[>9-9-gaib]].' }))).toEqual([expect.stringContaining('9-9-gaib')]);
});

test('rujukan tak ada dan frasa "semua benar" ditolak', () => {
  expect(pesan(kepala + soal({ rujukan: 'R99-9' }))).toEqual([expect.stringContaining('R99-9')]);
  expect(pesan(kepala + soal({ pembahasan: 'Semua benar.' }))).toEqual([expect.stringContaining('semua benar')]);
});

test('struktur: isi di luar blok soal dan harapan tanpa kasus', () => {
  expect(pesan(`${kepala}Halo\n`)).toEqual([expect.stringContaining('hanya berisi blok')]);
  expect(pesan(kepala + soal({ harapan: 'AYAH 1; ashl 1' }))).toEqual([expect.stringContaining('butuh kasus')]);
});

test('kodeSoalPaketGanda: kode sama di dua berkas', () => {
  const satu = bacaPaketSoal(kepala + soal(), 'a.md');
  expect(kodeSoalPaketGanda([{ namaBerkas: 'a.md', paket: satu }, { namaBerkas: 'b.md', paket: satu }])).toEqual([{ kode: 'P-05-001', berkas: ['a.md', 'b.md'] }]);
});
