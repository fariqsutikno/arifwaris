// Tes konversi isi ↔ NilaiForm: bolak-balik lossless untuk SEMUA entri di snapshot web (semua jenis), cakupan
// FORM_KONTEN, sakelar Versi Arab, tautan kosong → null, dan galat per bidang (angka, Markdown, Zod).
import { describe, expect, test } from 'vitest';
import { bacaIsi, JENIS_KONTEN, RUJUKAN_MENTAH, type IsiKonten, type JenisKonten } from '@waris/content';
import snapshot from '../../../web/src/snapshot.json';
import { FORM_KONTEN } from '../editor/formulir';
import { dariNilaiForm, keNilaiForm, nilaiFormKosong } from '../editor/nilaiForm';
import { SOAL_HITUNG_UJI } from './contoh';

const semuaEntri = snapshot.konten.map((baris, i) => {
  const jenis = baris.jenis as JenisKonten;
  const hasil = bacaIsi(jenis, baris.isi);
  if (!hasil.ok) throw new Error(`snapshot ${jenis} #${i} tidak sah: ${hasil.galat}`);
  return [`${jenis} #${i}` as string, jenis, hasil.isi as IsiKonten[JenisKonten]] as const;
}).concat(RUJUKAN_MENTAH.map(isi => [`rujukan ${isi.kode}` as string, 'rujukan' as JenisKonten, isi as IsiKonten[JenisKonten]] as const));

test('FORM_KONTEN mencakup semua jenis, jalur unik per jenis', () => {
  expect(Object.keys(FORM_KONTEN).sort()).toEqual([...JENIS_KONTEN].sort());
  for (const jenis of JENIS_KONTEN) {
    const daftar = FORM_KONTEN[jenis].flatMap(bagian => bagian.bidang.map(bidang => bidang.jalur));
    expect(new Set(daftar).size).toBe(daftar.length);
  }
});

test('snapshot memuat semua jenis', () => {
  expect(new Set(semuaEntri.map(([, jenis]) => jenis)).size).toBeGreaterThanOrEqual(JENIS_KONTEN.length - 2);
});

describe('bolak-balik isi → form → isi', () => {
  test.each(semuaEntri)('%s', (_nama, jenis, isi) => {
    expect(dariNilaiForm(jenis, 'uji', keNilaiForm(jenis, isi))).toEqual({ ok: true, isi });
  });
  test('soal hitung (bigint)', () => {
    expect(dariNilaiForm('soal_hitung', 'x', keNilaiForm('soal_hitung', SOAL_HITUNG_UJI))).toEqual({ ok: true, isi: SOAL_HITUNG_UJI });
  });
});

test('sakelar Versi Arab mati → ar hilang', () => {
  const modul = { nomor: 1, judul: 'Pengantar', ringkas: 'r', ar: { judul: 'مقدمة', ringkas: 'ر' } };
  const form = keNilaiForm('modul', modul);
  expect(form.aktif.ar).toBe(true);
  const hasil = dariNilaiForm('modul', 'x', { ...form, aktif: { ar: false } });
  expect(hasil).toEqual({ ok: true, isi: { nomor: 1, judul: 'Pengantar', ringkas: 'r' } });
});

test('cheatsheet: tautan kosong → null', () => {
  const form = keNilaiForm('cheatsheet', { judul: 'J', deskripsi: 'd', tautan: 'https://x.id' });
  const hasil = dariNilaiForm('cheatsheet', 'x', { ...form, nilai: { ...form.nilai, tautan: '' } });
  expect(hasil).toEqual({ ok: true, isi: { judul: 'J', deskripsi: 'd', tautan: null } });
});

test('field opsional kosong dihapus', () => {
  const form = keNilaiForm('glosarium_ar', { istilahId: 'ashabah', makna: 'م', artiAwam: 'ع' });
  expect(dariNilaiForm('glosarium_ar', 'x', { ...form, nilai: { ...form.nilai, artiAwam: ' ' } }))
    .toEqual({ ok: true, isi: { istilahId: 'ashabah', makna: 'م' } });
});

test('angka bukan bilangan bulat → galat di bidang', () => {
  const form = keNilaiForm('modul', { nomor: 1, judul: 'J', ringkas: 'r' });
  const hasil = dariNilaiForm('modul', 'x', { ...form, nilai: { ...form.nilai, nomor: '1,5' } });
  expect(hasil).toMatchObject({ ok: false, galatBidang: { nomor: 'harus bilangan bulat' } });
});

test('Markdown blok rusak → galat di bidang', () => {
  const form = nilaiFormKosong('faq');
  const hasil = dariNilaiForm('faq', 'x', { ...form, nilai: { ...form.nilai, id: 'a', kelompok: 'Fikih', pertanyaan: 'p', jawaban: '```kasus\nrusak\n```' } });
  expect(hasil.ok).toBe(false);
  if (!hasil.ok) expect(hasil.galatBidang.jawaban).toBeTruthy();
});

test('galat Zod dipetakan ke bidang', () => {
  const form = keNilaiForm('cheatsheet', { judul: 'J', deskripsi: 'd', tautan: null });
  const hasil = dariNilaiForm('cheatsheet', 'x', { ...form, nilai: { ...form.nilai, judul: '', tautan: 'bukan url' } });
  expect(hasil.ok).toBe(false);
  if (!hasil.ok) expect(Object.keys(hasil.galatBidang).sort()).toEqual(['judul', 'tautan']);
});

test('soal kuis: pilihan & jawaban benar', () => {
  const form = nilaiFormKosong('soal_kuis');
  const hasil = dariNilaiForm('soal_kuis', 'x', { ...form, nilai: {
    ...form.nilai, kode: 'K-1', bab: '4', pertanyaan: 'Bagian **istri**?', pembahasan: 'Lihat [R04-2]',
    pilihan: { daftar: ['1/4', '1/8', '1/2'], benar: 1, alasan: null },
  } });
  expect(hasil).toMatchObject({ ok: true, isi: {
    kode: 'K-1', bab: 4, tingkat: 'dasar', indeksBenar: 1, pilihan: [[{ jenis: 'teks', teks: '1/4' }], [{ jenis: 'teks', teks: '1/8' }], [{ jenis: 'teks', teks: '1/2' }]],
    pertanyaan: [{ jenis: 'teks', teks: 'Bagian ' }, { jenis: 'tebal', teks: 'istri' }, { jenis: 'teks', teks: '?' }],
  } });
});

test('form kosong setiap jenis tidak melempar', () => {
  for (const jenis of JENIS_KONTEN) expect(() => nilaiFormKosong(jenis)).not.toThrow();
});

test('syahid: potongan yang tidak persis ada di teks ayat → galat di bidang potongan; ayat tak dikenal → galat di bidang ayat', () => {
  const [, , isi] = semuaEntri.find(([, jenis]) => jenis === 'syahid')!;
  const form = keNilaiForm('syahid', isi as never);
  expect(dariNilaiForm('syahid', 's', form).ok).toBe(true);
  const salah = dariNilaiForm('syahid', 's', { ...form, nilai: { ...form.nilai, syahid: 'بسم' } });
  expect(!salah.ok && salah.galatBidang.syahid).toMatch(/tidak ditemukan persis/);
  const ayatLain = dariNilaiForm('syahid', 's', { ...form, nilai: { ...form.nilai, ayat: '99' } });
  expect(!ayatLain.ok && ayatLain.galatBidang.ayat).toMatch(/belum ada di daftar ayat/);
});

test('semua templat terbaca sebagai Markdown yang sah untuk bidangnya', () => {
  for (const jenis of JENIS_KONTEN) {
    for (const bidang of FORM_KONTEN[jenis].flatMap(bagian => bagian.bidang).filter(b => b.templat)) {
      const form = nilaiFormKosong(jenis);
      const hasil = dariNilaiForm(jenis, 'uji', { ...form, nilai: { ...form.nilai, [bidang.jalur]: bidang.templat! } });
      expect(hasil.ok ? undefined : hasil.galatBidang[bidang.jalur], `${jenis}.${bidang.jalur}`).toBeUndefined();
    }
  }
});
