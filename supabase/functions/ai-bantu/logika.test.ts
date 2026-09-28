import { expect, test } from 'vitest';
import { awalHariWib, bacaPermintaan, bukaSisipan, kunciSisipan, olahJawaban, susunPrompt, type Permintaan } from './logika';

test('sisipan rujukan & istilah dikunci jadi token dan dikembalikan utuh; token hilang/berubah ditolak', () => {
  const { teks, sisipan } = kunciSisipan('Istri dapat 1/4 [R04-2] bila tanpa [[far-u-warits|anak]].');
  expect(teks).toBe('Istri dapat 1/4 ⟦0⟧ bila tanpa ⟦1⟧.');
  expect(bukaSisipan('Istri mendapat 1/4 ⟦0⟧ jika tidak ada ⟦1⟧.', sisipan)).toBe('Istri mendapat 1/4 [R04-2] jika tidak ada [[far-u-warits|anak]].');
  expect(bukaSisipan('Istri mendapat 1/4.', sisipan)).toBeNull();
  expect(bukaSisipan('⟦0⟧ ⟦0⟧', sisipan)).toBeNull();
});

test('rapikan: jawaban yang menghapus rujukan ditolak', () => {
  const permintaan: Permintaan = { fitur: 'rapikan', teks: 'ibu dpt 1/6 [R04-5]' };
  expect(susunPrompt(permintaan).pengguna).toBe('ibu dpt 1/6 ⟦0⟧');
  expect(olahJawaban(permintaan, JSON.stringify({ teks: 'Ibu dapat 1/6 ⟦0⟧.' }))).toEqual({ ok: true, hasil: { fitur: 'rapikan', teks: 'Ibu dapat 1/6 [R04-5].' } });
  expect(olahJawaban(permintaan, JSON.stringify({ teks: 'Ibu dapat 1/6.' })).ok).toBe(false);
});

const kuis: Permintaan = {
  fitur: 'drafKuis', bab: 4, judulBab: 'Ashabul furudh', pertanyaan: '',
  rujukan: [{ kode: 'R04-2', klaim: 'Bagian istri', sumber: "An-Nisa' 12", kutipan: '«...»' }],
};
const draf = { pertanyaan: 'Berapa bagian istri tanpa anak?', pilihan: ['1/8', '1/4', '1/2', '1/6'], indeksBenar: 1,
  alasanPilihan: ['a', 'b', 'c', 'd'], pembahasan: 'Istri 1/4 [R04-2].', rujukan: ['R04-2'] };

test('draf kuis: rujukan di luar bab ditolak, tanpa dalil ditolak, bentuk salah ditolak', () => {
  expect(olahJawaban(kuis, JSON.stringify(draf))).toMatchObject({ ok: true, hasil: { draf: { rujukan: ['R04-2'] } } });
  expect(olahJawaban(kuis, JSON.stringify({ ...draf, pembahasan: 'Lihat [R09-7].' }))).toMatchObject({ ok: false, galat: expect.stringMatching(/R09-7/) });
  expect(olahJawaban(kuis, JSON.stringify({ ...draf, pembahasan: 'Tanpa dalil.', rujukan: [] })).ok).toBe(false);
  expect(olahJawaban(kuis, JSON.stringify({ ...draf, pilihan: ['1/8'] })).ok).toBe(false);
  expect(susunPrompt(kuis).pengguna).toContain("[R04-2] Bagian istri — An-Nisa' 12.");
});

test('permintaan tak dikenal, kosong, atau terlalu panjang ditolak', () => {
  expect(bacaPermintaan({ fitur: 'lain' }).ok).toBe(false);
  expect(bacaPermintaan({ fitur: 'rapikan', teks: '  ' }).ok).toBe(false);
  expect(bacaPermintaan({ fitur: 'rapikan', teks: 'x'.repeat(20_001) }).ok).toBe(false);
  expect(bacaPermintaan({ ...kuis, rujukan: [] }).ok).toBe(false);
  expect(bacaPermintaan(kuis)).toEqual({ ok: true, permintaan: kuis });
});

test('awal hari WIB', () => {
  expect(awalHariWib(new Date('2026-09-28T20:00:00Z'))).toBe('2026-09-28T17:00:00.000Z');
  expect(awalHariWib(new Date('2026-09-28T16:00:00Z'))).toBe('2026-09-27T17:00:00.000Z');
});

test('saran: tujuan pelajaran ikut ke prompt', () => {
  const baca = bacaPermintaan({ fitur: 'saran', jenis: 'materi', judul: 'Apa itu faraidh?', tujuan: 'Mengenal arti faraidh.', teks: 'Isi' });
  expect(baca.ok && susunPrompt(baca.permintaan).pengguna).toContain('Tujuan pelajaran: Mengenal arti faraidh.');
});
