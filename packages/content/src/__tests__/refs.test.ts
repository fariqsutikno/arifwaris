import { describe, expect, test } from 'vitest';
import { DAFTAR_AYAT, DAFTAR_HADITS, DAFTAR_KITAB, JUDUL_BAB, TITIK_DIKAJI, RUJUKAN, rujukanAyat, dalilUntuk, cariRujukan, bacaAyat, bacaPerluVerifikasi, bacaRujukan } from '../index.js';

describe('parseRefs — tabel "Dasar dan Rujukan"', () => {
  const teksBab = [
    '# 99. Contoh',
    '| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |',
    '|---|---|---|---|---|',
    '| X99-9 | tabel lain, bukan rujukan | - | - | - |',
    '## Dasar dan Rujukan Bab Ini',
    '| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |',
    '|---|---|---|---|---|',
    '| R99-1 | Bagian suami | Q + RDH | An-Nisa\' 12 · RDH Bab 1 | «فللزوج نصف المال» dan «وربعه» |',
    '| R99-2 | Hikmah | — | Penjelasan fuqaha | Keterangan saja |',
  ].join('\n');

  test('hanya tabel di bagian "Dasar dan Rujukan"; jenis gabungan dipecah; teks «…» diambil', () => {
    expect(bacaRujukan(teksBab, 99)).toEqual([
      { kode: 'R99-1', bab: 99, klaim: 'Bagian suami', jenis: 'Q + RDH', daftarJenis: ['Q', 'RDH'], sumber: "An-Nisa' 12 · RDH Bab 1",
        kutipan: '«فللزوج نصف المال» dan «وربعه»', arab: ['فللزوج نصف المال', 'وربعه'] },
      { kode: 'R99-2', bab: 99, klaim: 'Hikmah', jenis: '—', daftarJenis: [], sumber: 'Penjelasan fuqaha', kutipan: 'Keterangan saja', arab: [] },
    ]);
  });

  test('sumber "Idem" diganti sumber baris di atasnya', () => {
    const md = ['## Dasar dan Rujukan Bab Ini', '| Kode | Klaim | Jenis | Sumber | Kutipan |', '|---|---|---|---|---|',
      '| R99-1 | a | RDH | Bab 9, muqaddimah 4 | x |', '| R99-2 | b | RDH | Idem | y |', "| R99-3 | c | RDH | Idem, far' | z |"].join('\n');
    expect(bacaRujukan(md, 99).map(rujukan => rujukan.sumber)).toEqual(['Bab 9, muqaddimah 4', 'Bab 9, muqaddimah 4', "Bab 9, muqaddimah 4, far'"]);
  });

  test('daftar perlu verifikasi dari bab 17.4', () => {
    const md17 = ['## 17.4 Titik yang Masih Ditandai', '| Kode | Topik | Yang dibutuhkan |', '|---|---|---|',
      '| R01-7 | Ijazah | Raudhah |', '## 17.5 Koreksi', '| R09-9 | bukan 17.4 | x |'].join('\n');
    expect(bacaPerluVerifikasi(md17)).toEqual(['R01-7']);
  });
});

describe('rujukan KB (bab 01–14, 16)', () => {
  test('kode unik dan lengkap', () => {
    const daftarKode = RUJUKAN.map(r => r.kode);
    expect(new Set(daftarKode).size).toBe(daftarKode.length);
    expect(daftarKode.length).toBe(129);
  });

  test('status dan jenis', () => {
    expect(cariRujukan('R04-2')).toMatchObject({ bab: 4, daftarJenis: ['Q', 'RDH'], status: 'terverifikasi' });
    expect(cariRujukan('R01-7')).toMatchObject({ status: 'perluVerifikasi' });
    expect(cariRujukan('R09-10')).toMatchObject({ daftarJenis: ['KH'] });
    expect(cariRujukan('R01-8')).toMatchObject({ daftarJenis: ['H'], dhaif: true });
  });
});

describe('dalilFor — lapis 3 per baris penjelasan', () => {
  test('dalil dengan label jenis dan teks Arab dari KB', () => {
    const [view] = dalilUntuk(['R04-2']).daftarEntri;
    expect(view).toMatchObject({ kode: 'R04-2', label: ["Al-Qur'an", 'Raudhah ath-Thalibin (an-Nawawi)'], peringatan: [] });
    expect(view!.arab.length).toBeGreaterThan(0);
  });

  test('peringatan: kaidah hisab, perlu verifikasi, dha\'if, bukan dalil', () => {
    const warn = (kode: string) => dalilUntuk([kode]).daftarEntri[0]!.peringatan;
    expect(warn('R09-10')).toEqual(["Kaidah hisab (cara menghitung), bukan dalil syar'i."]);
    expect(warn('R01-7')).toEqual(['Dasar ini belum dicek ke teks aslinya (bab 17.4).']);
    expect(warn('R01-8')).toEqual(["Sanad hadits ini dha'if (lemah)."]);
    expect(warn('R05-9')).toEqual(['Keterangan tambahan, bukan dalil.']);
  });

  test('baris tanpa rujukan dan kode yang tidak ada di KB ditandai', () => {
    expect(dalilUntuk([])).toEqual({ daftarEntri: [], catatan: ['Langkah ini belum punya rujukan di KB.'] });
    expect(dalilUntuk(['R99-1'])).toEqual({ daftarEntri: [], catatan: ['Rujukan R99-1 belum tersedia di KB.'] });
  });
});

describe('teks ayat dari KB bab 1.2', () => {
  test('parseAyat: blok **Surah: N** diikuti kutipan >', () => {
    const teksBab = ['**An-Nisa: 11** (anak)', '> يُوصِيكُمُ اللَّهُ', '', '**Hadits dasar**', '> bukan ayat'].join('\n');
    expect(bacaAyat(teksBab)).toEqual([{ surah: 'An-Nisa', ayat: 11, teks: 'يُوصِيكُمُ اللَّهُ' }]);
  });

  test('KB memuat An-Nisa\' 11, 12, 176', () => {
    expect(DAFTAR_AYAT.map(ayatIni => `${ayatIni.surah} ${ayatIni.ayat}`)).toEqual(['An-Nisa 11', 'An-Nisa 12', 'An-Nisa 176']);
  });

  test('ayatRefs: bagian Al-Qur\'an di kolom Sumber → daftar ayat', () => {
    expect(rujukanAyat("An-Nisa' 11, 12, 176 · RDH Bab 9, muqaddimah 1")).toEqual([
      { surah: "An-Nisa'", ayat: 11 }, { surah: "An-Nisa'", ayat: 12 }, { surah: "An-Nisa'", ayat: 176 },
    ]);
    expect(rujukanAyat('Al-Anfal 75; Al-Ahzab 6')).toEqual([{ surah: 'Al-Anfal', ayat: 75 }, { surah: 'Al-Ahzab', ayat: 6 }]);
  });

  test('dalilFor menampilkan teks ayat; ayat yang belum ada di KB ditandai', () => {
    const [r042] = dalilUntuk(['R04-2']).daftarEntri;
    expect(r042!.ayat).toEqual([{ label: "An-Nisa' 12", teks: DAFTAR_AYAT[1]!.teks }]);
    const [r141] = dalilUntuk(['R14-1']).daftarEntri;
    expect(r141!.ayat).toEqual([{ label: 'Al-Anfal 75' }, { label: 'Al-Ahzab 6' }]);
    expect(r141!.peringatan).toContain('Teks ayat Al-Anfal 75, Al-Ahzab 6 belum ada di KB.');
    expect(dalilUntuk(['R09-1']).daftarEntri[0]!.ayat).toEqual([]);   // bukan dalil Al-Qur'an
  });
});

describe('daftar pustaka bab 17', () => {
  test('kitab, hadits, dan titik dikaji terbaca dari tabelnya masing-masing', () => {
    expect(DAFTAR_KITAB.map(kitab => kitab.kode)).toEqual(['[RDH]', '—', '—', 'Lahim']);
    expect(DAFTAR_KITAB[0]!.judul).toBe("Raudhah ath-Thalibin wa 'Umdah al-Muftin");
    expect(DAFTAR_HADITS.length).toBe(15);
    expect(DAFTAR_HADITS[0]).toMatchObject({ takhrij: 'Al-Bukhari 6732; Muslim 1615', status: "Muttafaq 'alaih" });
    expect(TITIK_DIKAJI.map(titik => titik.kode)).toEqual(['R01-7', 'R02-11', 'R11-3', 'R13-5', 'R13-14']);
  });

  test('judul bab dari frontmatter', () => {
    expect(JUDUL_BAB[4]).toMatch(/^Ashabul Furudh/);
    expect(Object.keys(JUDUL_BAB).length).toBe(15);
  });
});
