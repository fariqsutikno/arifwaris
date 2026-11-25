// Format kiriman materi (docs/materi-kit/format-materi.md): bacaPelajaran ⇄ tulisPelajaran, nomor bagian, galat berbaris,
// dan pemeriksa tanpa engine. Dua contoh di docs/materi-kit/contoh adalah acuan Codex, jadi wajib selalu lolos.
import { describe, expect, test } from 'vitest';
import hajb from '../../../../docs/materi-kit/contoh/5-1-hajb.md?raw';
import aul from '../../../../docs/materi-kit/contoh/6-2-aul.md?raw';
import { bacaBlok, bacaIsi, bacaPelajaran, keJson, nomorBagian, periksaMateri, tulisBlok, tulisPelajaran } from '../index.js';

const KEPALA = '---\nslug: 9-9-uji\nmodul: 9\nurutan: 9\njudul: Uji\ntujuan: t\ndurasi: 1\ntahap: hajb\nprasyarat:\nsinggung:\n---\n';

describe('contoh kit', () => {
  test.each([['5-1-hajb', hajb], ['6-2-aul', aul]])('%s: bolak-balik utuh', (slug, teks) => {
    const pelajaran = bacaPelajaran(teks, slug);
    expect(bacaPelajaran(tulisPelajaran(pelajaran), slug)).toEqual(pelajaran);
  });

  test.each([['5-1-hajb', hajb], ['6-2-aul', aul]])('%s: pemeriksa tanpa galat', (slug, teks) => {
    const slugDikenal = new Set(bacaPelajaran(teks, slug).prasyarat!.concat(bacaPelajaran(teks, slug).singgung!, ['3-2-orang-tua-kakek-nenek', '5-2-tabel-hajb', '6-2-aul', '5-1-hajb', '6-1-ashlul-masalah', '6-3-radd', '2-2-penghalang-waris', '10-1-kakek-dan-saudara', '2-3-daftar-ahli-waris', '3-1-enam-bagian-pasti']));
    const hasil = periksaMateri(teks, `${slug}.md`, { slugDikenal, bagianPelajaran: new Map() });
    expect(hasil.temuan.filter(temuan => temuan.tingkat === 'galat')).toEqual([]);
  });
});

test('nomor bagian: ## = n, ### = n + huruf', () => {
  const blok = bacaBlok('u', '## A\n### B\n### C\n## D\n### E');
  expect(nomorBagian(blok).map(bagian => bagian.nomor)).toEqual(['1', '1a', '1b', '2', '2a']);
});

test('bolak-balik semua blok baru', () => {
  const isi = [
    '```alur\ntahap: hajb\ntanya: T [[>5-1-hajb#2b|lihat]] [[#1]]\nhasil: H\n```',
    '## Satu',
    '```cara-berpikir\njudul: J\nA? -> b\nC? -> d\n```',
    '```kasus\njudul: K\ncerita: C\npewaris: L\nahli waris: ISTRI, 2 ANAK_PR\nharta: 1000\nharapan: ISTRI 3, ANAK_PR 16; ashl 24\nketerangan: ISTRI turun\n```',
    '```kasus-berkas\nberkas: a.waris.json\n```',
    '```peraga\npewaris: L\ntampil: kotak\nkeadaan: A\nahli waris: ISTRI\npenjelasan: x\nkeadaan: B\npewaris: P\nahli waris: SUAMI\npenjelasan: y\n```',
    '```bandingan\nkolom: X | Y | Z | W | V\nIbu | 1/3 | sisa | 1/6 + sisa | 1/3 sisa | gugur\n```',
    '```simulasi\npewaris: L\npilihan: AYAH, IBU\nawal: AYAH\ntampil: bagian\n```',
    '```peta\nAkar | k\n  Anak -> #1\n    Cucu\n```',
    '```ingat\n- A | a\n- B | b\npenutup: p\n```',
    '```dasar\nKalimat.\nrujukan: R06-1, R06-2\n```',
    '```tebak\ntanya: t\njawab: j\n```',
    '```lipat\njudul: L\n| A | B |\n|---|---|\n| 1 | 2 |\n\nparagraf\n```',
    '```matriks\nkolom: A | B\nX | **a** | b\n```',
    '```video\nmenyusul: rencana\n```',
    '```soal\nkode: K-9.9-1\ntingkat: dasar\ntanya: T\n- a | x\n* b [[x|y]] | z\n- c | w\npembahasan: P\nrujukan: R06-6\n```',
    '## Cek pemahaman', '## Ringkasnya',
  ].join('\n\n');
  const blok = bacaBlok('u', isi);
  expect(bacaBlok('u', tulisBlok(blok))).toEqual(blok);
  const soal = blok.find(isiBlok => isiBlok.jenis === 'soal');
  expect(soal?.jenis === 'soal' && [soal.soal.indeksBenar, soal.soal.bab]).toEqual([1, 6]);
});

test('galat menyebut baris berkas', () => {
  expect(() => bacaPelajaran(`${KEPALA}\nteks\n\n\`\`\`ingat\n- satu | a\n\`\`\`\n`, 'x')).toThrow(/^9-9-uji:15: blok ingat butuh 2–4 butir/);
  expect(() => bacaPelajaran(`${KEPALA}\n\`\`\`soal\nkode: K-1.1-1\ntingkat: dasar\ntanya: t\n- a | x\n- b | y\n- c | z\npembahasan: p\nrujukan: R06-1\n\`\`\``, 'x')).toThrow(/tepat satu pilihan benar/);
  expect(() => bacaBlok('u', '```entah\n```')).toThrow(/tidak dikenal/);
});

test('pemeriksa: alur dan penutup wajib, rujukan sebaris ditolak', () => {
  const hasil = periksaMateri(`${KEPALA}\n## A\n\nTeks [R06-1].\n`, '9-9-uji.md', { slugDikenal: new Set(), bagianPelajaran: new Map() });
  expect(hasil.temuan.map(temuan => temuan.pesan)).toEqual(expect.arrayContaining([
    'blok alur wajib menjadi blok pertama', expect.stringMatching(/Cek pemahaman/), expect.stringMatching(/\[R06-1\] tidak boleh/),
  ]));
});

describe('skema zod menerima format baru', () => {
  test.each([['5-1-hajb', hajb], ['6-2-aul', aul]])('%s: keJson → bacaIsi utuh (bigint kembali)', (slug, teks) => {
    const pelajaran = bacaPelajaran(teks, slug);
    const hasil = bacaIsi('materi', JSON.parse(JSON.stringify(keJson('materi', pelajaran))));
    expect(hasil).toEqual({ ok: true, isi: pelajaran });
  });

  test('data lama tanpa field baru tetap terbaca', () => {
    const lama = { slug: 'x', judul: 'x', modul: 1, urutan: 1, tujuan: 't', perluCek: false, blok: [{ jenis: 'paragraf', isi: [{ jenis: 'teks', teks: 'a' }] }] };
    expect(bacaIsi('materi', lama).ok).toBe(true);
  });

  test('blok lipat bersarang dan blok tak dikenal ditolak', () => {
    const dasar = { slug: 'x', judul: 'x', modul: 1, urutan: 1, tujuan: 't', perluCek: false };
    const lipat = { jenis: 'lipat', judul: 'j', blok: [{ jenis: 'lipat', judul: 'k', blok: [{ jenis: 'tebak', tanya: [], jawab: [] }] }] };
    expect(bacaIsi('materi', { ...dasar, blok: [lipat] }).ok).toBe(true);
    expect(bacaIsi('materi', { ...dasar, blok: [{ jenis: 'asing' }] }).ok).toBe(false);
  });
});
