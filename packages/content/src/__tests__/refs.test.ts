import { describe, expect, test } from 'vitest';
import { DAFTAR_AYAT, DAFTAR_HADITS, DAFTAR_KITAB, JUDUL_BAB, TITIK_DIKAJI, RUJUKAN, rujukanAyat, dalilUntuk, cariRujukan, bacaAyat, bacaPerluVerifikasi, bacaRujukan, sqlDaftarRefs, uraiTokenTautan, uraiTautan } from '../index.js';

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
    expect(daftarKode.length).toBe(140);
  });

  test('status dan jenis', () => {
    expect(cariRujukan('R04-2')).toMatchObject({ bab: 4, daftarJenis: ['Q', 'RDH'], status: 'terverifikasi' });
    expect(cariRujukan('R11-3')).toMatchObject({ status: 'perluVerifikasi' });
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
    expect(warn('R11-3')).toEqual(['Dasar ini belum dicek ke teks aslinya (bab 17.4).']);
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
    expect(DAFTAR_KITAB.map(kitab => kitab.kode)).toEqual(['[RDH]', 'TSH', 'MYS', 'LHM', 'MBS', 'MGN', 'BHR', 'IQD', 'BMZ', 'ITH']);
    expect(DAFTAR_KITAB[0]!.judul).toBe("Raudhah ath-Thalibin wa 'Umdah al-Muftin");
    expect(DAFTAR_HADITS.length).toBe(15);
    expect(DAFTAR_HADITS[0]).toMatchObject({ takhrij: 'Al-Bukhari 6732; Muslim 1615', status: "Muttafaq 'alaih" });
    expect(TITIK_DIKAJI.map(titik => titik.kode)).toEqual(['R11-3', 'R13-14']);
  });

  test('judul bab dari frontmatter', () => {
    expect(JUDUL_BAB[4]).toMatch(/^Ashabul Furudh/);
    expect(Object.keys(JUDUL_BAB).length).toBe(15);
  });
});


test('sqlDaftarRefs: satu baris per kode, terurut, idempoten', () => {
  const sql = sqlDaftarRefs([{ kode: 'R09-7', bab: 9 }, { kode: 'R04-2', bab: 4 }, { kode: 'R04-2', bab: 4 }]);
  expect(sql).toBe(
    "insert into daftar_refs (kode, bab) values\n  ('R04-2', 4),\n  ('R09-7', 9)\non conflict (kode) do update set bab = excluded.bab;\n");
});

test('semua kode RUJUKAN cocok dengan pola kolom daftar_refs', () => {
  for (const rujukan of RUJUKAN) expect(rujukan.kode).toMatch(/^R\d{2}-\d+$/);
});

describe('uraiTokenTautan — format bab 00 konvensi 5 & bab 17.1', () => {
  test('shamela:<book_id>/<page_id>', () => {
    expect(uraiTokenTautan('shamela:5423/5974')).toEqual({ jenis: 'shamela', url: 'https://shamela.ws/book/5423/5974', label: 'shamela:5423/5974' });
  });

  test('hadits:<koleksi>:<nomor-standar>', () => {
    expect(uraiTokenTautan('hadits:bukhari:6732')).toEqual({ jenis: 'hadits', url: 'https://sunnah.com/bukhari:6732', label: 'hadits:bukhari:6732' });
  });

  test('quran:<surah>:<ayat> tunggal', () => {
    expect(uraiTokenTautan('quran:4:11')).toEqual({ jenis: 'quran', url: 'https://quran.com/4/11', label: 'quran:4:11' });
  });

  test('quran:<surah>:<ayat>-<ayat> rentang', () => {
    expect(uraiTokenTautan('quran:4:11-12')).toEqual({ jenis: 'quran', url: 'https://quran.com/4/11-12', label: 'quran:4:11-12' });
  });

  test('islamqa:<id>', () => {
    expect(uraiTokenTautan('islamqa:12345')).toEqual({ jenis: 'islamqa', url: 'https://islamqa.info/ar/answers/12345', label: 'islamqa:12345' });
  });

  test('jenis token tidak dikenal → throw', () => {
    expect(() => uraiTokenTautan('quran.com:4:11')).toThrow('tidak dikenal');
  });

  test('koleksi hadits tidak dikenal → throw', () => {
    expect(() => uraiTokenTautan('hadits:sahih9:1')).toThrow('Token hadits tidak valid');
  });

  test('format shamela salah (tanpa page_id) → throw', () => {
    expect(() => uraiTokenTautan('shamela:5423')).toThrow('Token shamela tidak valid');
  });

  test('format quran salah (bukan angka) → throw', () => {
    expect(() => uraiTokenTautan('quran:an-nisa:11')).toThrow('Token quran tidak valid');
  });

  test('format islamqa salah (bukan angka) → throw', () => {
    expect(() => uraiTokenTautan('islamqa:abc')).toThrow('Token islamqa tidak valid');
  });
});

describe('uraiTautan — cari token di dalam teks kolom Sumber', () => {
  test('beberapa token dalam satu baris, diakhiri tanda baca', () => {
    expect(uraiTautan('Al-Bukhari, hadits:bukhari:6732; lihat juga quran:4:11.')).toEqual([
      { jenis: 'hadits', url: 'https://sunnah.com/bukhari:6732', label: 'hadits:bukhari:6732' },
      { jenis: 'quran', url: 'https://quran.com/4/11', label: 'quran:4:11' },
    ]);
  });

  test('tanpa token → array kosong', () => {
    expect(uraiTautan('Bahr al-Madzhab, ar-Ruyani, Kitab al-Washaya, 8/42 (Shamela 16934/3737)')).toEqual([]);
  });

  test('token salah di dalam teks tetap throw', () => {
    expect(() => uraiTautan('lihat islamqa:xyz')).toThrow('Token islamqa tidak valid');
  });
});
