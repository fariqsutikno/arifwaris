import { cariRujukan, cariIstilah } from '@waris/content';
import { hitung, type InputEngine, type LangkahJejak } from '@waris/engine';
import { describe, expect, test } from 'vitest';
import * as bab16 from '../../../engine/src/__tests__/fixtures/bab16.js';
import { ID_ISTILAH, jelaskan, narasiNisab, keTeksBiasa, type Penjelasan } from '../index.js';

function jelaskanKasus(input: InputEngine, mode?: 'cerita' | 'ringkas' | 'arab'): Penjelasan {
  const hasil = hitung(input);
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  return jelaskan(hasil, input.graf, mode ? { mode } : {});
}

const daftarTeks = (e: Penjelasan, langkah: number) => e.daftarBab[langkah - 1]!.daftarBaris.map(keTeksBiasa);

/** Salin input dengan nama orang (nama opsional di input). */
function denganNama(input: InputEngine, daftarNama: Record<string, string>): InputEngine {
  const orang = Object.fromEntries(Object.entries(input.graf.orang)
    .map(([id, potonganIni]) => [id, daftarNama[id] ? { ...potonganIni, nama: daftarNama[id] } : potonganIni]));
  return { ...input, graf: { ...input.graf, orang } };
}

describe('kasus 10 — mode cerita tanpa nama', () => {
  const e = jelaskanKasus(bab16.case10.input);

  test('judul langkah', () => {
    expect(e.daftarBab.map(babIni => babIni.judul)).toEqual([
      'Langkah 1 — Siapa yang mendapat warisan',
      'Langkah 2 — Bagian masing-masing',
      'Langkah 3 — Menyamakan penyebut',
      'Langkah 4 — Masih ada sisa, untuk siapa?',
      'Langkah 5 — Hasil akhir',
    ]);
  });

  test('ahli waris dan bagian, dengan hajb nuqshan dijelaskan sekali', () => {
    expect(daftarTeks(e, 1)).toEqual(['Ahli waris (warits) almarhumah: suami, anak perempuan, dan cucu perempuan dari anak laki-laki.']);
    expect(daftarTeks(e, 2)).toEqual([
      "Suami mendapat 1/4, bukan 1/2, karena almarhumah meninggalkan keturunan yang ikut mewarisi (far'u warits): "
        + 'anak perempuan dan cucu perempuan dari anak laki-laki. Pengurangan seperti ini disebut hajb nuqshan.',
      "Anak perempuan mendapat 1/2 karena ia sendirian dan tidak ada laki-laki sederajat yang membuatnya ikut mengambil sisa (mu'ashshib).",
      'Cucu perempuan dari anak laki-laki mendapat 1/6, bukan 1/2, sebagai pelengkap agar bagiannya bersama anak perempuan genap 2/3 '
        + '(takmilah ats-tsulutsain).',
    ]);
  });

  test('menyamakan penyebut: 4 dan 2 tadakhul, lalu 4 dan 6 tawafuq', () => {
    expect(daftarTeks(e, 3)).toEqual([
      'Bagian-bagian di atas masih berupa pecahan: suami 1/4, anak perempuan 1/2, dan cucu perempuan dari anak laki-laki 1/6. '
        + "Supaya bisa dijumlah, kita cari satu angka yang bisa dibagi oleh semua penyebutnya. Angka ini disebut ashlul mas'alah.",
      'Mulai dari 4 dan 2: 4 sudah habis dibagi 2 (tadakhul), jadi cukup pakai 4.',
      'Lalu 4 dengan 6: tidak ada yang habis membagi yang lain, tetapi keduanya sama-sama bisa dibagi 2 (tawafuq). Caranya: 4 × (6 ÷ 2) = 12.',
      'Jadi harta kita bayangkan dipotong menjadi 12 bagian yang sama (saham): suami 3, anak perempuan 6, dan cucu perempuan dari anak laki-laki 2.',
    ]);
  });

  test('radd diceritakan bertahap', () => {
    expect(daftarTeks(e, 4)).toEqual([
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
    expect(daftarTeks(e, 5)).toEqual([
      'Harta dibagi menjadi 16 bagian:',
      'Suami: 4 bagian (4/16).',
      'Anak perempuan: 9 bagian (9/16).',
      'Cucu perempuan dari anak laki-laki: 3 bagian (3/16).',
    ]);
  });

  test('istilah dan orang adalah potongan tersendiri (untuk tooltip & hover)', () => {
    const daftarPotongan = e.daftarBab[2]!.daftarBaris[1]!.daftarPotongan;
    expect(daftarPotongan).toContainEqual({ jenis: 'istilah', istilah: 'tadakhul', teks: 'tadakhul', contoh: 'Di kasus ini: 4 dan 2 → 4.' });
    const suami = e.daftarBab[1]!.daftarBaris[0]!.daftarPotongan[0];
    expect(suami).toEqual({ jenis: 'orang', daftarIdOrang: ['H1'], teks: 'Suami' });
  });
});

describe('nama opsional', () => {
  test('bernama: sebutan pertama memperkenalkan peran, berikutnya nama saja', () => {
    const e = jelaskanKasus(denganNama(bab16.case10.input, { D: 'Khadijah', H1: 'Hasan', D1: 'Fatimah', GD1: 'Aisyah' }));
    expect(daftarTeks(e, 1)).toEqual([
      'Ahli waris (warits) Khadijah: Hasan (suami), Fatimah (anak perempuan), dan Aisyah (cucu perempuan dari anak laki-laki).',
    ]);
    expect(daftarTeks(e, 2)[0]).toBe("Hasan mendapat 1/4, bukan 1/2, karena Khadijah meninggalkan keturunan yang ikut mewarisi (far'u warits): "
      + 'Fatimah dan Aisyah. Pengurangan seperti ini disebut hajb nuqshan.');
  });

  test('tanpa nama, peran sama: kolektif bila semuanya disebut, urutan bila satu per satu', () => {
    const e = jelaskanKasus(bab16.case06.input);
    expect(daftarTeks(e, 2)).toContain("Kedua anak perempuan berbagi 2/3 sama rata karena jumlahnya lebih dari satu dan tidak ada laki-laki sederajat "
      + "yang membuat mereka ikut mengambil sisa (mu'ashshib).");
    // Urutan mengikuti urutan input: D1 = pertama, D2 = kedua.
    const hasil = e.daftarBab[e.daftarBab.length - 1]!.daftarBaris.map(l => l.daftarPotongan[0]);
    expect(hasil).toContainEqual({ jenis: 'orang', daftarIdOrang: ['D1'], teks: 'Anak perempuan pertama' });
    expect(hasil).toContainEqual({ jenis: 'orang', daftarIdOrang: ['D2'], teks: 'Anak perempuan kedua' });
  });

  test('[R04-3] istri-istri berbagi rata, bukan masing-masing mendapat 1/4', () => {
    expect(daftarTeks(jelaskanKasus(bab16.case22.input), 2)[0])
      .toBe("Keempat istri berbagi 1/4 sama rata karena almarhum tidak meninggalkan keturunan yang ikut mewarisi (far'u warits).");
  });

  test('saudara terhalang tetap mengurangi bagian ibu', () => {
    const e = jelaskanKasus(bab16.case15.input);
    expect(daftarTeks(e, 1)).toEqual([
      'Ahli waris (warits) almarhum: ayah dan ibu.',
      'Kedua saudara laki-laki kandung tidak mendapat bagian karena terhalang oleh ayah (hajb hirman).',
    ]);
    expect(daftarTeks(e, 2)).toContain("Ibu mendapat 1/6, bukan 1/3, karena almarhum punya dua saudara atau lebih (jam' min al-ikhwah): "
      + 'kedua saudara laki-laki kandung. Mereka tetap dihitung walaupun tidak mendapat bagian. Pengurangan seperti ini disebut hajb nuqshan.');
  });
});

describe('kasus 12 — akdariyyah', () => {
  const e = jelaskanKasus(bab16.case12.input);

  test('bagian kakek dan saudari', () => {
    expect(daftarTeks(e, 2)).toEqual([
      "Suami mendapat 1/2 karena almarhumah tidak meninggalkan keturunan yang ikut mewarisi (far'u warits).",
      'Ibu mendapat 1/3 karena almarhumah tidak meninggalkan keturunan yang ikut mewarisi dan tidak punya dua saudara atau lebih.',
      'Ini termasuk kasus khusus al-Akdariyyah.',
      'Kakek diberi 1/6.',
      'Saudara perempuan kandung diberi 1/2. Bagian keduanya lalu digabung (1/6 + 1/2 = 2/3) dan dibagi ulang: kakek mendapat dua kali bagian saudari.',
    ]);
  });

  test('\'aul lalu pembulatan', () => {
    expect(e.daftarBab.map(babIni => babIni.judul)).toContain('Langkah 4 — Bagiannya melebihi harta');
    expect(daftarTeks(e, 4)).toEqual([
      "Jumlah semua bagian 3 + 2 + 4 = 9, lebih besar dari 6. Supaya adil, penyebutnya dinaikkan menjadi 9 ('aul): setiap orang tetap "
        + 'mendapat jumlah bagian yang sama, tetapi karena harta sekarang dibagi 9, semua bagian berkurang secara sebanding.',
    ]);
    expect(daftarTeks(e, 5)).toEqual([
      'Bagian sebuah kelompok kadang tidak bisa dibagi rata ke anggotanya (inkisar). Kalau begitu, jumlah bagian diperbesar supaya '
        + 'setiap orang mendapat bilangan bulat (tashih).',
      "Kakek dan saudara perempuan kandung mendapat 4 bagian untuk 3 kepala (ru'us, laki-laki dihitung 2). 4 tidak bisa dibagi 3 dan "
        + 'keduanya tidak punya faktor bersama (tabayun), jadi angka 3 disimpan.',
      "Semua bagian dikalikan 3 (juz' as-sahm): 9 × 3 = 27 bagian.",
    ]);
  });
});

describe('nominal dan selisih pembulatan', () => {
  const e = jelaskanKasus({ ...bab16.caseNominal.input, pembulatan: { satuan: 1000n } });

  test('harta yang dibagi', () => {
    expect(daftarTeks(e, 1)).toEqual([
      'Sebelum dibagi, harta peninggalan (tirkah) Rp150.000.000 dipakai dulu untuk biaya pengurusan jenazah Rp5.000.000 dan melunasi '
        + 'hutang Rp25.000.000, sehingga tersisa Rp120.000.000.',
      'Wasiat almarhum sebesar Rp50.000.000 melebihi batas sepertiga harta (Rp40.000.000), jadi yang dijalankan hanya Rp40.000.000. '
        + 'Kelebihan Rp10.000.000 baru boleh dijalankan jika semua ahli waris menyetujuinya (ijazah).',
      'Harta yang dibagi kepada ahli waris: Rp80.000.000.',
    ]);
  });

  test('hasil dalam rupiah dan saran transfer bank', () => {
    expect(daftarTeks(e, e.daftarBab.length)).toEqual([
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
    const e = jelaskanKasus(bab16.case10.input, 'ringkas');
    const ashl = e.daftarBab.find(babIni => babIni.judul.endsWith("Ashlul mas'alah"))!.daftarBaris.map(keTeksBiasa);
    expect(ashl[0]).toBe('Penyebut 4 dan 2: 4 habis dibagi 2 → tadakhul. Ambil yang besar: 4.');
    expect(ashl[1]).toBe('Penyebut 4 dan 6: tidak saling habis membagi, FPB 2 → tawafuq. Kalikan salah satu dengan wafq yang lain: 4 × (6 ÷ 2) = 12.');
  });

  test('narasi nisab: angka 1 dan inkisar', () => {
    const bandingkanNisab = (isianIsian: Partial<Extract<LangkahJejak, { jenis: 'PERBANDINGAN_NISAB' }>>) => keTeksBiasa({ refs: [], daftarPotongan: narasiNisab({
      tahap: 'ashl', refs: [], jenis: 'PERBANDINGAN_NISAB', tujuan: 'ashl', a: 0n, b: 0n, hubungan: 'tamatsul', fpb: 0n, hasil: 0n, ...isianIsian,
    }) });
    expect(bandingkanNisab({ tujuan: 'juzSahm', a: 1n, b: 4n, hubungan: 'tabayun', fpb: 1n, hasil: 4n }))
      .toBe('Simpanan 1 dan 4: setiap bilangan bertemu 1 dihukumi tabayun. Kalikan keduanya: 1 × 4 = 4.');
    expect(bandingkanNisab({ tujuan: 'inkisar', a: 2n, b: 4n, hubungan: 'tawafuq', fpb: 2n, hasil: 2n }))
      .toBe("Saham 2 tidak habis dibagi ru'us 4, FPB 2 → tawafuq. Simpan wafq ru'us: 4 ÷ 2 = 2.");
  });
});

describe('keterkaitan dengan glosarium dan dalil', () => {
  test('setiap istilah yang dipakai narasi ada di glosarium KB bab 15', () => {
    expect(ID_ISTILAH.filter(id => !cariIstilah(id))).toEqual([]);
  });

  test('setiap kode rujukan di jejak dan narasi fixture bab 16 ada di tabel rujukan KB', () => {
    const belumAda = new Set<string>();
    for (const fixture of bab16.BAB16_FIXTURES) {
      const hasil = hitung(fixture.input);
      if (hasil.status !== 'OK') continue;
      const daftarKode = [
        ...hasil.jejak.flatMap(langkah => langkah.refs),
        ...(['cerita', 'ringkas', 'arab'] as const).flatMap(mode =>
          jelaskan(hasil, fixture.input.graf, { mode }).daftarBab.flatMap(babIni => babIni.daftarBaris.flatMap(l => l.refs))),
      ];
      daftarKode.filter(kode => !cariRujukan(kode)).forEach(kode => belumAda.add(`${fixture.id}: ${kode}`));
    }
    expect([...belumAda]).toEqual([]);
  });

  test('baris membawa rujukan untuk lapis dalil', () => {
    expect(jelaskanKasus(bab16.case10.input).daftarBab[1]!.daftarBaris[0]!.refs).toEqual(['R04-2']);
  });
});

describe('penjelasan per orang: subjek, ashabah terdekat, sisa keluar', () => {
  const semuaBaris = (e: Penjelasan) => e.daftarBab.flatMap(babIni => babIni.daftarBaris);

  test('baris hajb & bagian ditandai subjeknya [C16-16]', () => {
    const baris = semuaBaris(jelaskanKasus(bab16.case16.input));
    const tentangCucu = baris.filter(barisIni => barisIni.subjek?.includes('GS1'));
    expect(tentangCucu.map(keTeksBiasa).join(' ')).toMatch(/terhalang/);
    expect(baris.find(barisIni => barisIni.subjek?.includes('H1'))).toBeTruthy();
  });

  test('ashabah bukan anak (saudara sebapak, C16-19): tidak ada yang lebih dekat [R05-2] [R05-3]', () => {
    const { case19 } = bab16;
    const hasil = hitung(case19.input);
    if (hasil.status !== 'OK') throw new Error(hasil.status);
    const ashabah = hasil.jejak.find((langkahIni): langkahIni is Extract<LangkahJejak, { jenis: 'ASHABAH' }> => langkahIni.jenis === 'ASHABAH')!;
    const anggota = hasil.tabel.baris.find(barisIni => barisIni.kelompok === ashabah.kelompok)!.anggota;
    const teks = semuaBaris(jelaskan(hasil, case19.input.graf)).filter(barisIni => barisIni.subjek?.includes(anggota[0]!)).map(keTeksBiasa).join(' ');
    expect(teks).toMatch(/tidak ada yang lebih dekat darinya: anak laki-laki, cucu laki-laki dari anak laki-laki, ayah, atau saudara laki-laki kandung/);
  });

  test('hanya istri: hasil tetap dijelaskan, sisa ke dzawil arham/baitul mal [R09-9]', () => {
    const input = bab16.case01.input;
    const hanyaIstri: InputEngine = {
      ...input,
      graf: { idPewaris: 'D', pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
        orang: { D: { id: 'D', jenisKelamin: 'L', statusHidup: 'wafat', agama: 'islam' }, W1: { id: 'W1', jenisKelamin: 'P', statusHidup: 'hidup', agama: 'islam' } } },
    };
    const teks = semuaBaris(jelaskanKasus(hanyaIstri)).map(keTeksBiasa).join(' ');
    expect(teks).toMatch(/tersisa 3 bagian/);
    expect(teks).toMatch(/baitul mal/);
  });
});

describe('mode arab (santri)', () => {
  test('kasus 10: gaya kitab, angka Arab', () => {
    const e = jelaskanKasus(bab16.case10.input, 'arab');
    const ashl = e.daftarBab.find(babIni => babIni.judul.endsWith('أصل المسألة'))!.daftarBaris.map(keTeksBiasa);
    expect(ashl[0]).toBe('المخرجان ٤ و٢ متداخلان، فيكتفى بالأكبر: ٤.');
    expect(ashl[1]).toBe('المخرجان ٤ و٦ متوافقان بـ٢، فيضرب وفق أحدهما في الآخر: ٤ × (٦ ÷ ٢) = ١٢.');
  });

  test('semua kasus bab 16: tanpa angka Latin di narasi', () => {
    for (const fixture of bab16.BAB16_FIXTURES) {
      const hasil = hitung(fixture.input);
      if (hasil.status !== 'OK') continue;
      const teks = jelaskan(hasil, fixture.input.graf, { mode: 'arab' }).daftarBab.flatMap(babIni => babIni.daftarBaris.map(keTeksBiasa));
      expect(teks.filter(baris => /\d/.test(baris)), fixture.id).toEqual([]);
    }
  });
});
