import { describe, expect, test } from 'vitest';
import { DAFTAR_AYAT, DAFTAR_HADITS, DAFTAR_KITAB, JUDUL_BAB, TITIK_DIKAJI, RUJUKAN, rujukanAyat, dalilUntuk, cariRujukan, bacaAyat, bacaPerluVerifikasi, bacaRujukan, KEBERLAKUAN, MATRIKS_KHILAF, cariTitikKhilaf, sqlDaftarRefs, uraiTokenTautan, uraiTautan } from '../index.js';
import { BERLAKU_LINTAS_MADZHAB } from '../../../engine/src/rulesets/berlaku.js';

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
    expect(cariRujukan('R13-14')).toMatchObject({ status: 'perluVerifikasi' });
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
    expect(warn('R13-14')).toEqual(['Dasar ini belum dicek ke teks aslinya (bab 17.4).']);
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
    expect(DAFTAR_KITAB.map(kitab => kitab.kode)).toEqual(['[RDH]', 'TSH', 'MYS', 'LHM', 'MBS', 'MGN', 'BHR', 'IQD', 'BMZ', 'ITH', 'IMN', 'IQN', 'BHQ', 'SSM', 'MAR', 'MIS']);
    expect(DAFTAR_KITAB[0]!.judul).toBe("Raudhah ath-Thalibin wa 'Umdah al-Muftin");
    expect(DAFTAR_HADITS.length).toBe(15);
    expect(DAFTAR_HADITS[0]).toMatchObject({ takhrij: 'Al-Bukhari 6732; Muslim 1615 · hadits:bukhari:6732 hadits:muslim:1615', status: "Muttafaq 'alaih" });
    expect(TITIK_DIKAJI.map(titik => titik.kode)).toEqual(['R13-14']);
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

describe('KB 18.4 keberlakuan token', () => {
  // Token Rxx-y yang dipakai kode engine (di luar tes), per 2026-09-29.
  const TOKEN_ENGINE = ['R01-1', 'R01-4', 'R01-7', 'R01-9', 'R02-1', 'R02-3', 'R02-4', 'R02-9', 'R03-1', 'R03-2', 'R03-4', 'R03-5', 'R04-10', 'R04-11', 'R04-12', 'R04-13', 'R04-14', 'R04-16', 'R04-2', 'R04-3', 'R04-4', 'R04-5', 'R04-6', 'R04-7', 'R04-8', 'R04-9', 'R05-2', 'R05-3', 'R05-4', 'R05-5', 'R06-2', 'R06-3', 'R06-4', 'R06-5', 'R06-6', 'R07-1', 'R07-2', 'R07-3', 'R08-2', 'R08-3', 'R08-4', 'R08-5', 'R09-1', 'R09-10', 'R09-2', 'R09-3', 'R09-4', 'R09-7', 'R09-8', 'R09-9', 'R10-1', 'R10-2', 'R10-3', 'R11-1', 'R12-1', 'R12-2', 'R12-3', 'R13-1', 'R13-2', 'R14-3', 'R14-4', 'R14-5'];

  test('setiap token engine tercantum tepat sekali', () => {
    const tokens = KEBERLAKUAN.map(baris => baris.token);
    expect(new Set(tokens).size).toBe(tokens.length);
    expect([...tokens].sort()).toEqual([...TOKEN_ENGINE].sort());
  });

  test('konstanta engine sama persis dengan tabel KB', () => {
    for (const madzhab of ['hanbali', 'hanafi', 'maliki'] as const) {
      const dariKb = KEBERLAKUAN.filter(baris => baris[madzhab]).map(baris => baris.token).sort();
      expect([...BERLAKU_LINTAS_MADZHAB[madzhab]].sort(), madzhab).toEqual(dariKb);
    }
  });
});

describe('Matriks khilaf bab 18.2', () => {
  test('memuat kode Kxx-y unik', () => {
    const kode = MATRIKS_KHILAF.map(titik => titik.kode);
    expect(kode).toEqual(expect.arrayContaining(['K03-1', 'K04-1', 'K04-2', 'K05-1', 'K07-1', 'K08-1', 'K09-1', 'K13a-1']));
    expect(new Set(kode).size).toBe(kode.length);
  });

  test('K04-2 [HNB] berisi sel Mughni dan tautannya', () => {
    const titik = cariTitikKhilaf('K04-2')!;
    expect(titik.sel.hanbali).toContain('tidak terhijab');
    expect(titik.tautan.hanbali.map(tautan => tautan.label).join(' ')).toContain('8463/2625');
  });

  // grep -rohE "K[0-9]{2}[a-d]?-[0-9]+" packages/engine/src --exclude-dir=__tests__ | sort -u
  const KODE_ENGINE = ['K02-3', 'K03-1', 'K04-1', 'K04-2', 'K04-3', 'K05-1', 'K07-1', 'K08-1', 'K09-1'];
  test.each(KODE_ENGINE)('%s yang dipakai engine ada di matriks', kode => {
    expect(cariTitikKhilaf(kode)).toBeDefined();
  });
});
