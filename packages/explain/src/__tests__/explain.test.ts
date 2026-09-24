import { findRef, findTerm } from '@waris/content';
import { hitung, type InputEngine, type LangkahJejak } from '@waris/engine';
import { describe, expect, test } from 'vitest';
import * as bab16 from '../../../engine/src/__tests__/fixtures/bab16.js';
import { TERM_IDS, jelaskan, narrateNisab, toPlainText, type Explanation } from '../index.js';

function explainCase(input: InputEngine, mode?: 'cerita' | 'ringkas'): Explanation {
  const hasil = hitung(input);
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  return jelaskan(hasil, input.graf, mode ? { mode } : {});
}

const texts = (e: Explanation, step: number) => e.sections[step - 1]!.lines.map(toPlainText);

/** Salin input dengan nama orang (nama opsional di input). */
function withNames(input: InputEngine, names: Record<string, string>): InputEngine {
  const orang = Object.fromEntries(Object.entries(input.graf.orang)
    .map(([id, p]) => [id, names[id] ? { ...p, nama: names[id] } : p]));
  return { ...input, graf: { ...input.graf, orang } };
}

describe('kasus 10 — mode cerita tanpa nama', () => {
  const e = explainCase(bab16.case10.input);

  test('judul langkah', () => {
    expect(e.sections.map(sec => sec.title)).toEqual([
      'Langkah 1 — Siapa yang mendapat warisan',
      'Langkah 2 — Bagian masing-masing',
      'Langkah 3 — Menyamakan penyebut',
      'Langkah 4 — Masih ada sisa, untuk siapa?',
      'Langkah 5 — Hasil akhir',
    ]);
  });

  test('ahli waris dan bagian, dengan hajb nuqshan dijelaskan sekali', () => {
    expect(texts(e, 1)).toEqual(['Ahli waris (warits) almarhumah: suami, anak perempuan, dan cucu perempuan dari anak laki-laki.']);
    expect(texts(e, 2)).toEqual([
      "Suami mendapat 1/4, bukan 1/2, karena almarhumah meninggalkan keturunan yang ikut mewarisi (far'u warits): "
        + 'anak perempuan dan cucu perempuan dari anak laki-laki. Pengurangan seperti ini disebut hajb nuqshan.',
      "Anak perempuan mendapat 1/2 karena ia sendirian dan tidak ada laki-laki sederajat yang membuatnya ikut mengambil sisa (mu'ashshib).",
      'Cucu perempuan dari anak laki-laki mendapat 1/6, bukan 1/2, sebagai pelengkap agar bagiannya bersama anak perempuan genap 2/3 '
        + '(takmilah ats-tsulutsain).',
    ]);
  });

  test('menyamakan penyebut: 4 dan 2 tadakhul, lalu 4 dan 6 tawafuq', () => {
    expect(texts(e, 3)).toEqual([
      'Bagian-bagian di atas masih berupa pecahan: suami 1/4, anak perempuan 1/2, dan cucu perempuan dari anak laki-laki 1/6. '
        + "Supaya bisa dijumlah, kita cari satu angka yang bisa dibagi oleh semua penyebutnya. Angka ini disebut ashlul mas'alah.",
      'Mulai dari 4 dan 2: 4 sudah habis dibagi 2 (tadakhul), jadi cukup pakai 4.',
      'Lalu 4 dengan 6: tidak ada yang habis membagi yang lain, tetapi keduanya sama-sama bisa dibagi 2 (tawafuq). Caranya: 4 × (6 ÷ 2) = 12.',
      'Jadi harta kita bayangkan dipotong menjadi 12 bagian yang sama (saham): suami 3, anak perempuan 6, dan cucu perempuan dari anak laki-laki 2.',
    ]);
  });

  test('radd diceritakan bertahap', () => {
    expect(texts(e, 4)).toEqual([
      'Jumlah semua bagian 3 + 6 + 2 = 11, padahal ada 12. Masih tersisa 1 bagian, dan tidak ada ahli waris yang berhak atas sisa (ashabah). '
        + 'Sisa itu dikembalikan kepada anak perempuan dan cucu perempuan dari anak laki-laki sesuai besar bagian mereka (radd). '
        + 'Suami tidak ikut, karena suami/istri tidak menerima radd.',
      'Pertama, bagian suami diselesaikan dulu: 1/4 berarti dari 4 bagian ia mendapat 1, dan sisanya 3 bagian.',
      'Kedua, anak perempuan dan cucu perempuan dari anak laki-laki berbagi sisa itu dengan perbandingan 3 : 1, totalnya 4 bagian.',
      'Ketiga, 3 bagian tidak bisa dibagi rata menjadi 4, dan keduanya tidak punya faktor bersama (tabayun). '
        + 'Maka semuanya dikalikan 4: harta dibagi menjadi 16 bagian.',
      'Hasilnya: suami 4 bagian (tetap 1/4), anak perempuan 9 bagian, dan cucu perempuan dari anak laki-laki 3 bagian.',
    ]);
  });

  test('hasil akhir', () => {
    expect(texts(e, 5)).toEqual([
      'Harta dibagi menjadi 16 bagian:',
      'Suami: 4 bagian (4/16).',
      'Anak perempuan: 9 bagian (9/16).',
      'Cucu perempuan dari anak laki-laki: 3 bagian (3/16).',
    ]);
  });

  test('istilah dan orang adalah potongan tersendiri (untuk tooltip & hover)', () => {
    const segments = e.sections[2]!.lines[1]!.segments;
    expect(segments).toContainEqual({ jenis: 'term', term: 'tadakhul', text: 'tadakhul', example: 'Di kasus ini: 4 dan 2 → 4.' });
    const suami = e.sections[1]!.lines[0]!.segments[0];
    expect(suami).toEqual({ jenis: 'orangIni', daftarIdOrang: ['H1'], text: 'Suami' });
  });
});

describe('nama opsional', () => {
  test('bernama: sebutan pertama memperkenalkan peran, berikutnya nama saja', () => {
    const e = explainCase(withNames(bab16.case10.input, { D: 'Khadijah', H1: 'Hasan', D1: 'Fatimah', GD1: 'Aisyah' }));
    expect(texts(e, 1)).toEqual([
      'Ahli waris (warits) Khadijah: Hasan (suami), Fatimah (anak perempuan), dan Aisyah (cucu perempuan dari anak laki-laki).',
    ]);
    expect(texts(e, 2)[0]).toBe("Hasan mendapat 1/4, bukan 1/2, karena Khadijah meninggalkan keturunan yang ikut mewarisi (far'u warits): "
      + 'Fatimah dan Aisyah. Pengurangan seperti ini disebut hajb nuqshan.');
  });

  test('tanpa nama, peran sama: kolektif bila semuanya disebut, urutan bila satu per satu', () => {
    const e = explainCase(bab16.case06.input);
    expect(texts(e, 2)).toContain("Kedua anak perempuan berbagi 2/3 sama rata karena jumlahnya lebih dari satu dan tidak ada laki-laki sederajat "
      + "yang membuat mereka ikut mengambil sisa (mu'ashshib).");
    // Urutan mengikuti urutan input: D1 = pertama, D2 = kedua.
    const hasil = e.sections[e.sections.length - 1]!.lines.map(l => l.segments[0]);
    expect(hasil).toContainEqual({ jenis: 'orangIni', daftarIdOrang: ['D1'], text: 'Anak perempuan pertama' });
    expect(hasil).toContainEqual({ jenis: 'orangIni', daftarIdOrang: ['D2'], text: 'Anak perempuan kedua' });
  });

  test('[R04-3] istri-istri berbagi rata, bukan masing-masing mendapat 1/4', () => {
    expect(texts(explainCase(bab16.case22.input), 2)[0])
      .toBe("Keempat istri berbagi 1/4 sama rata karena almarhum tidak meninggalkan keturunan yang ikut mewarisi (far'u warits).");
  });

  test('saudara terhalang tetap mengurangi bagian ibu', () => {
    const e = explainCase(bab16.case15.input);
    expect(texts(e, 1)).toEqual([
      'Ahli waris (warits) almarhum: ayah dan ibu.',
      'Kedua saudara laki-laki kandung tidak mendapat bagian karena terhalang oleh ayah (hajb hirman).',
    ]);
    expect(texts(e, 2)).toContain("Ibu mendapat 1/6, bukan 1/3, karena almarhum punya dua saudara atau lebih (jam' min al-ikhwah): "
      + 'kedua saudara laki-laki kandung. Mereka tetap dihitung walaupun tidak mendapat bagian. Pengurangan seperti ini disebut hajb nuqshan.');
  });
});

describe('kasus 12 — akdariyyah', () => {
  const e = explainCase(bab16.case12.input);

  test('bagian kakek dan saudari', () => {
    expect(texts(e, 2)).toEqual([
      "Suami mendapat 1/2 karena almarhumah tidak meninggalkan keturunan yang ikut mewarisi (far'u warits).",
      'Ibu mendapat 1/3 karena almarhumah tidak meninggalkan keturunan yang ikut mewarisi dan tidak punya dua saudara atau lebih.',
      'Ini termasuk kasus khusus al-Akdariyyah.',
      'Kakek diberi 1/6.',
      'Saudara perempuan kandung diberi 1/2. Bagian keduanya lalu digabung (1/6 + 1/2 = 2/3) dan dibagi ulang: kakek mendapat dua kali bagian saudari.',
    ]);
  });

  test('\'aul lalu pembulatan', () => {
    expect(e.sections.map(sec => sec.title)).toContain('Langkah 4 — Bagiannya melebihi harta');
    expect(texts(e, 4)).toEqual([
      "Jumlah semua bagian 3 + 2 + 4 = 9, lebih besar dari 6. Supaya adil, penyebutnya dinaikkan menjadi 9 ('aul): setiap orang tetap "
        + 'mendapat jumlah bagian yang sama, tetapi karena harta sekarang dibagi 9, semua bagian berkurang secara sebanding.',
    ]);
    expect(texts(e, 5)).toEqual([
      'Bagian sebuah kelompok kadang tidak bisa dibagi rata ke anggotanya (inkisar). Kalau begitu, jumlah bagian diperbesar supaya '
        + 'setiap orang mendapat bilangan bulat (tashih).',
      "Kakek dan saudara perempuan kandung mendapat 4 bagian untuk 3 kepala (ru'us, laki-laki dihitung 2). 4 tidak bisa dibagi 3 dan "
        + 'keduanya tidak punya faktor bersama (tabayun), jadi angka 3 disimpan.',
      "Semua bagian dikalikan 3 (juz' as-sahm): 9 × 3 = 27 bagian.",
    ]);
  });
});

describe('nominal dan selisih pembulatan', () => {
  const e = explainCase({ ...bab16.caseNominal.input, pembulatan: { satuan: 1000n } });

  test('harta yang dibagi', () => {
    expect(texts(e, 1)).toEqual([
      'Sebelum dibagi, harta peninggalan (tirkah) Rp150.000.000 dipakai dulu untuk biaya pengurusan jenazah Rp5.000.000 dan melunasi '
        + 'hutang Rp25.000.000, sehingga tersisa Rp120.000.000.',
      'Wasiat almarhum sebesar Rp50.000.000 melebihi batas sepertiga harta (Rp40.000.000), jadi yang dijalankan hanya Rp40.000.000. '
        + 'Kelebihan Rp10.000.000 baru boleh dijalankan jika semua ahli waris menyetujuinya (ijazah).',
      'Harta yang dibagi kepada ahli waris: Rp80.000.000.',
    ]);
  });

  test('hasil dalam rupiah dan saran transfer bank', () => {
    expect(texts(e, e.sections.length)).toEqual([
      'Harta dibagi menjadi 24 bagian:',
      'Istri: 3 bagian (3/24) = Rp10.000.000.',
      'Anak laki-laki: 14 bagian (14/24) = Rp46.666.000.',
      'Anak perempuan: 7 bagian (7/24) = Rp23.333.000.',
      'Karena setiap bagian dibulatkan ke bawah per Rp1.000, ada selisih Rp1.000 yang belum dibagikan. Uang ini tetap milik para ahli '
        + 'waris dan perlu disepakati bersama penyalurannya. Jika dibagikan lewat transfer bank, pembulatan bisa per rupiah sehingga selisihnya lebih kecil.',
    ]);
  });
});

describe('mode ringkas', () => {
  test('istilah dulu, langsung ke angka', () => {
    const e = explainCase(bab16.case10.input, 'ringkas');
    const ashl = e.sections.find(sec => sec.title.endsWith("Ashlul mas'alah"))!.lines.map(toPlainText);
    expect(ashl[0]).toBe('Penyebut 4 dan 2: 4 habis dibagi 2 → tadakhul. Ambil yang besar: 4.');
    expect(ashl[1]).toBe('Penyebut 4 dan 6: tidak saling habis membagi, FPB 2 → tawafuq. Kalikan salah satu dengan wafq yang lain: 4 × (6 ÷ 2) = 12.');
  });

  test('narasi nisab: angka 1 dan inkisar', () => {
    const cmp = (fields: Partial<Extract<LangkahJejak, { jenis: 'PERBANDINGAN_NISAB' }>>) => toPlainText({ refs: [], segments: narrateNisab({
      tahap: 'ashl', refs: [], jenis: 'PERBANDINGAN_NISAB', tujuan: 'ashl', a: 0n, b: 0n, hubungan: 'tamatsul', fpb: 0n, hasil: 0n, ...fields,
    }) });
    expect(cmp({ tujuan: 'juzSahm', a: 1n, b: 4n, hubungan: 'tabayun', fpb: 1n, hasil: 4n }))
      .toBe('Simpanan 1 dan 4: setiap bilangan bertemu 1 dihukumi tabayun. Kalikan keduanya: 1 × 4 = 4.');
    expect(cmp({ tujuan: 'inkisar', a: 2n, b: 4n, hubungan: 'tawafuq', fpb: 2n, hasil: 2n }))
      .toBe("Saham 2 tidak habis dibagi ru'us 4, FPB 2 → tawafuq. Simpan wafq ru'us: 4 ÷ 2 = 2.");
  });
});

describe('keterkaitan dengan glosarium dan dalil', () => {
  test('setiap istilah yang dipakai narasi ada di glosarium KB bab 15', () => {
    expect(TERM_IDS.filter(id => !findTerm(id))).toEqual([]);
  });

  test('setiap kode rujukan di jejak dan narasi fixture bab 16 ada di tabel rujukan KB', () => {
    const missing = new Set<string>();
    for (const fixture of bab16.BAB16_FIXTURES) {
      const hasil = hitung(fixture.input);
      if (hasil.status !== 'OK') continue;
      const codes = [
        ...hasil.jejak.flatMap(step => step.refs),
        ...(['cerita', 'ringkas'] as const).flatMap(mode =>
          jelaskan(hasil, fixture.input.graf, { mode }).sections.flatMap(sec => sec.lines.flatMap(l => l.refs))),
      ];
      codes.filter(kode => !findRef(kode)).forEach(kode => missing.add(`${fixture.id}: ${kode}`));
    }
    expect([...missing]).toEqual([]);
  });

  test('baris membawa rujukan untuk lapis dalil', () => {
    expect(explainCase(bab16.case10.input).sections[1]!.lines[0]!.refs).toEqual(['R04-2']);
  });
});
