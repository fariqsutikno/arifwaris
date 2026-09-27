// Tes konversi Blok[] ↔ dokumen Tiptap: bolak-balik semua blok di snapshot konten nyata (materi, FAQ, tanya jawab),
// potongan sebaris, dan pemipihan yang tak terwakili skema Blok (tebal+miring, daftar bersarang, paragraf kosong).
import { expect, test } from 'vitest';
import { bacaIsi, type Blok, type JenisKonten } from '@waris/content';
import snapshot from '../../../web/src/snapshot.json';
import { dariDokumen, dariPotonganDokumen, keDokumen, kePotonganDokumen } from '../editor/dokumen';
import { SOAL_HITUNG_UJI } from './contoh';

function semuaDaftarBlok(): Blok[][] {
  return snapshot.konten.flatMap(baris => {
    if (!['materi', 'faq', 'tanya_jawab'].includes(baris.jenis)) return [];
    const hasil = bacaIsi(baris.jenis as JenisKonten, baris.isi);
    if (!hasil.ok) throw new Error(hasil.galat);
    const isi = hasil.isi as unknown as Record<string, unknown>;
    return [isi.blok, isi.jawaban, isi.kasus, isi.penyelesaian].filter((b): b is Blok[] => Array.isArray(b));
  });
}

test('bolak-balik semua blok konten nyata', () => {
  const daftar = semuaDaftarBlok();
  expect(daftar.length).toBeGreaterThan(10);
  for (const blok of daftar) expect(dariDokumen(keDokumen(blok))).toEqual(blok);
});

test('bolak-balik blok khusus, tabel, istilah dengan teks lain', () => {
  const blok: Blok[] = [
    { jenis: 'judul', tingkat: 3, isi: [{ jenis: 'teks', teks: 'Contoh ' }, { jenis: 'miring', teks: 'radd' }] },
    { jenis: 'paragraf', isi: [{ jenis: 'istilah', id: 'ashabah', teks: 'para ashabah' }, { jenis: 'teks', teks: ' ' }, { jenis: 'rujukan', kode: 'R09-7' }] },
    { jenis: 'tabel', kepala: [[{ jenis: 'tebal', teks: 'Ahli waris' }], []], baris: [[[{ jenis: 'teks', teks: 'Ibu' }], [{ jenis: 'teks', teks: '1/6' }]]] },
    { jenis: 'daftar', berurut: true, butir: [[{ jenis: 'teks', teks: 'satu' }], [{ jenis: 'teks', teks: 'dua' }]] },
    { jenis: 'catatan', isi: [{ jenis: 'teks', teks: 'Perhatikan.' }] },
    { jenis: 'kasus', kasus: SOAL_HITUNG_UJI.kasus },
    { jenis: 'video', idYoutube: 'abcdefghijk', judul: 'Pengantar' },
    { jenis: 'kuis', daftarKode: ['K-1', 'K-2'] },
  ];
  expect(dariDokumen(keDokumen(blok))).toEqual(blok);
});

test('dokumen kosong ↔ []', () => {
  expect(dariDokumen(keDokumen([]))).toEqual([]);
  expect(keDokumen([]).content).toHaveLength(1);
});

test('potongan sebaris bolak-balik; beberapa paragraf disambung spasi', () => {
  const potongan = [{ jenis: 'tebal', teks: 'Ibu' }, { jenis: 'teks', teks: ' dapat ' }, { jenis: 'rujukan', kode: 'R04-2' }] as const;
  expect(dariPotonganDokumen(kePotonganDokumen([...potongan]))).toEqual(potongan);
  expect(dariPotonganDokumen({ type: 'doc', content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'a' }] }, { type: 'paragraph' }, { type: 'paragraph', content: [{ type: 'text', text: 'b' }] },
  ] })).toEqual([{ jenis: 'teks', teks: 'a b' }]);
});

test('pemipihan: tebal+miring → tebal, daftar bersarang → butir berikutnya, paragraf kosong dilewati', () => {
  const teks = (text: string, marks: string[] = []) => ({ type: 'text', text, marks: marks.map(type => ({ type })) });
  const butir = (text: string, ...anak: object[]) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [teks(text)] }, ...anak] });
  expect(dariDokumen({ type: 'doc', content: [
    { type: 'paragraph' },
    { type: 'paragraph', content: [teks('a', ['bold', 'italic']), teks('b', ['bold'])] },
    { type: 'bulletList', content: [butir('satu', { type: 'orderedList', content: [butir('dalam')] }), butir('dua')] },
  ] })).toEqual([
    { jenis: 'paragraf', isi: [{ jenis: 'tebal', teks: 'ab' }] },
    { jenis: 'daftar', berurut: false, butir: [[{ jenis: 'teks', teks: 'satu' }], [{ jenis: 'teks', teks: 'dalam' }], [{ jenis: 'teks', teks: 'dua' }]] },
  ]);
});
