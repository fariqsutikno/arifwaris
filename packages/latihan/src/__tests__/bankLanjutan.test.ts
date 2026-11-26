import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import type { KeadaanGharqa } from '@waris/engine';
import {
  bangunBankDariKode, bangunKasusLanjutan, buatKodeSoal, DAFTAR_JENIS_CHECKLIST, DAFTAR_KELUARGA_LANJUTAN, jalankan, KUOTA_KELUARGA_LANJUTAN,
  keKandidat, MAKS_ANAK_TAMBAHAN, MAKS_KERABAT_PER_JENIS, modulSoal, sapuKasusBiasa, sapuKasusLanjutan, saringKode, soalDariKode, terapkanKuota,
  tingkatSoal, uraiKodeSoal, URUTAN_KERABAT_JAUH, URUTAN_KUNCI,
  type AhliWarisTambahan, type BarisBank, type KasusBiasa, type KasusLanjutan, type NamaKeluargaLanjutan, type Rujukan,
} from '../index.js';

const kasusBiasaSah = fc.constantFrom<'L' | 'P'>('L', 'P').chain(pewaris =>
  fc.tuple(...DAFTAR_JENIS_CHECKLIST.map(jenis => {
    const dibolehkan = !jenis.hanyaUntuk || jenis.hanyaUntuk === pewaris;
    return fc.integer({ min: 0, max: dibolehkan ? jenis.maksimal ?? 7 : 0 });
  })).map(jumlah => ({
    pewaris,
    ahliWaris: Object.fromEntries(DAFTAR_JENIS_CHECKLIST.flatMap((jenis, i) => (jumlah[i]! > 0 ? [[jenis.kunci, jumlah[i]!]] : []))),
  } satisfies KasusBiasa)),
).filter(kasus => Object.keys(kasus.ahliWaris).length > 0);

const semuaRujukan = (dasar: KasusBiasa): Rujukan[] =>
  URUTAN_KUNCI.flatMap(kunci => Array.from({ length: dasar.ahliWaris[kunci] ?? 0 }, (_, urutan) => ({ kunci, urutan })));

const tambahanArb: fc.Arbitrary<AhliWarisTambahan> = fc.record({
  pasangan: fc.constantFrom<0 | 1>(0, 1), anakLk: fc.integer({ min: 0, max: MAKS_ANAK_TAMBAHAN }), anakPr: fc.integer({ min: 0, max: MAKS_ANAK_TAMBAHAN }),
});

const berantaiArb = (maksMayit: number) => kasusBiasaSah.chain(dasar => {
  const orang = semuaRujukan(dasar);
  return fc.shuffledSubarray(orang, { minLength: 1, maxLength: Math.min(maksMayit, orang.length) }).chain(pilihan =>
    fc.tuple(...pilihan.map(() => tambahanArb)).map(tambahan => ({ dasar, mayit: pilihan.map((rujukan, urutan) => ({ ...rujukan, tambahan: tambahan[urutan]! })) })));
});

const munasakhatArb: fc.Arbitrary<KasusLanjutan> = berantaiArb(3).map(isi => ({ keluarga: 'munasakhat' as const, ...isi }));
const gharqaArb: fc.Arbitrary<KasusLanjutan> = fc.tuple(berantaiArb(2), fc.constantFrom<KeadaanGharqa>('serentak', 'terlupakan', 'berurutanTakDiketahui', 'tidakDiketahui'))
  .map(([isi, keadaan]) => ({ keluarga: 'gharqa' as const, ...isi, keadaan }));
const taqdirArb: fc.Arbitrary<KasusLanjutan> = fc.tuple(fc.constantFrom<'mafqud' | 'khuntsa' | 'haml'>('mafqud', 'khuntsa', 'haml'), kasusBiasaSah).chain(([keluarga, dasar]) =>
  fc.constantFrom(...semuaRujukan(dasar)).map(sasaran => ({ keluarga, dasar, sasaran })));
const arhamArb: fc.Arbitrary<KasusLanjutan> = fc.record({
  pewaris: fc.constantFrom<'L' | 'P'>('L', 'P'), pasangan: fc.constantFrom<0 | 1>(0, 1),
  kerabat: fc.array(fc.integer({ min: 0, max: MAKS_KERABAT_PER_JENIS }), { minLength: URUTAN_KERABAT_JAUH.length, maxLength: URUTAN_KERABAT_JAUH.length }),
}).filter(kasus => kasus.kerabat.some(jumlah => jumlah > 0)).map(kasus => ({ keluarga: 'dzawilArham' as const, ...kasus }));

describe('kode soal keluarga lanjutan', () => {
  test('bolak-balik per keluarga: urai(buat(k)) = k (termasuk munasakhat 4 mayit)', () => {
    for (const arb of [munasakhatArb, gharqaArb, taqdirArb, arhamArb]) {
      fc.assert(fc.property(arb, kasus => {
        expect(uraiKodeSoal(buatKodeSoal(kasus))).toEqual({ ok: true, kasus });
      }), { numRuns: 300 });
    }
  });

  test('munasakhat 4 mayit (pewaris + 3) bolak-balik dan huruf keluarga M', () => {
    const kasus: KasusLanjutan = {
      keluarga: 'munasakhat', dasar: { pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_LK: 2, ANAK_PR: 1 } },
      mayit: [
        { kunci: 'ANAK_PR', urutan: 0, tambahan: { pasangan: 1, anakLk: 1, anakPr: 0 } },
        { kunci: 'ISTRI', urutan: 0, tambahan: { pasangan: 0, anakLk: 0, anakPr: 0 } },
        { kunci: 'ANAK_LK', urutan: 1, tambahan: { pasangan: 1, anakLk: 0, anakPr: 2 } },
      ],
    };
    const kode = buatKodeSoal(kasus);
    expect(kode).toMatch(/^G1-M-[0-9A-HJKMNP-TV-Z]+$/);
    expect(uraiKodeSoal(kode)).toEqual({ ok: true, kasus });
  });

  test('satu kasus tepat satu kode: slot tak terpakai atau bit sisa tidak nol ditolak; kode berbeda = kasus berbeda', () => {
    fc.assert(fc.property(fc.oneof(munasakhatArb, gharqaArb, taqdirArb, arhamArb), kasus => {
      const kode = buatKodeSoal(kasus);
      const huruf = kode.at(-1)!;
      const lain = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'.replace(huruf, '')[0]!;
      const diubah = `${kode.slice(0, -1)}${lain}`;
      const hasil = uraiKodeSoal(diubah);
      // Mengubah huruf terakhir selalu menghasilkan kasus lain atau kode ditolak, tidak pernah kasus yang sama.
      expect(hasil.ok && JSON.stringify(hasil.kasus) === JSON.stringify(kasus)).toBe(false);
    }), { numRuns: 200 });
  });

  test('buat menolak struktur tidak sah; urai menolak kode keluarga/versi/muatan asing', () => {
    const dasar: KasusBiasa = { pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_LK: 1 } };
    const nol = { pasangan: 0 as const, anakLk: 0, anakPr: 0 };
    const tidakSah: KasusLanjutan[] = [
      { keluarga: 'munasakhat', dasar, mayit: [] },
      { keluarga: 'munasakhat', dasar, mayit: [{ kunci: 'AYAH', urutan: 0, tambahan: nol }] },
      { keluarga: 'munasakhat', dasar, mayit: [{ kunci: 'ANAK_LK', urutan: 1, tambahan: nol }] },
      { keluarga: 'munasakhat', dasar, mayit: [{ kunci: 'ANAK_LK', urutan: 0, tambahan: nol }, { kunci: 'ANAK_LK', urutan: 0, tambahan: nol }] },
      { keluarga: 'gharqa', dasar, keadaan: 'serentak', mayit: [{ kunci: 'ANAK_LK', urutan: 0, tambahan: nol }, { kunci: 'ISTRI', urutan: 0, tambahan: nol }, { kunci: 'ISTRI', urutan: 1, tambahan: nol }] },
      { keluarga: 'haml', dasar, sasaran: { kunci: 'ANAK_PR', urutan: 0 } },
      { keluarga: 'dzawilArham', pewaris: 'L', pasangan: 0, kerabat: Array(URUTAN_KERABAT_JAUH.length).fill(0) },
      { keluarga: 'dzawilArham', pewaris: 'L', pasangan: 0, kerabat: [3, ...Array(URUTAN_KERABAT_JAUH.length - 1).fill(0)] },
    ];
    for (const kasus of tidakSah) expect(() => buatKodeSoal(kasus), JSON.stringify(kasus)).toThrow();
    expect(uraiKodeSoal('G1-Z-000')).toEqual({ ok: false, galat: 'KELUARGA_TIDAK_DIKENAL' });
    expect(uraiKodeSoal('G2-M-0000')).toEqual({ ok: false, galat: 'VERSI_TIDAK_DIKENAL' });
    expect(uraiKodeSoal('G1-M-0')).toEqual({ ok: false, galat: 'MUATAN_RUSAK' });
  });

  test('kode biasa lama tidak berubah (dibekukan di bank.test.ts) dan tetap diurai sebagai biasa', () => {
    expect(uraiKodeSoal('G1-B-2000000002000040')).toEqual({ ok: true, kasus: { pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_LK: 1, ANAK_PR: 1 } } });
  });
});

describe('graf keluarga lanjutan', () => {
  test('munasakhat: mayit tambahan masuk urutanWafat, ahli waris tambahan terhubung ke mayit itu', () => {
    const kasus = bangunKasusLanjutan({
      keluarga: 'munasakhat', dasar: { pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_LK: 1, ANAK_PR: 1 } },
      mayit: [{ kunci: 'ANAK_PR', urutan: 0, tambahan: { pasangan: 1, anakLk: 1, anakPr: 0 } }],
    });
    expect(kasus.urutanWafat).toHaveLength(1);
    const idMayit = kasus.urutanWafat[0]!;
    const anak = Object.values(kasus.graf.orang).filter(orang => orang.idIbu === idMayit);
    expect(anak).toHaveLength(1);
    expect(kasus.graf.pernikahan.some(nikah => nikah.idIstri === idMayit && nikah.idSuami !== kasus.graf.idPewaris)).toBe(true);
  });

  test('gharqa: anggota selain pewaris berstatus wafat dan punya harta tetap', () => {
    const kasus = bangunKasusLanjutan({
      keluarga: 'gharqa', dasar: { pewaris: 'L', ahliWaris: { AYAH: 1, ANAK_LK: 1 } }, keadaan: 'serentak',
      mayit: [{ kunci: 'ANAK_LK', urutan: 0, tambahan: { pasangan: 0, anakLk: 1, anakPr: 0 } }],
    });
    expect(kasus.gharqa!.anggota).toHaveLength(2);
    const idLain = kasus.gharqa!.anggota[1]!;
    expect(kasus.graf.orang[idLain]!.statusHidup).toBe('wafat');
    expect(kasus.gharqa!.tirkah[idLain]!.kotor).toBe(kasus.tirkah.kotor);
  });

  test('haml butuh ibu hidup; khuntsa bukan pasangan/leluhur; istri mayit tak dinikahkan lagi', () => {
    const dasar: KasusBiasa = { pewaris: 'L', ahliWaris: { ISTRI: 1, ANAK_LK: 1, AYAH: 1, SAUDARA_SEBAPAK: 1 } };
    expect(() => bangunKasusLanjutan({ keluarga: 'haml', dasar, sasaran: { kunci: 'ANAK_LK', urutan: 0 } })).not.toThrow();
    expect(() => bangunKasusLanjutan({ keluarga: 'haml', dasar, sasaran: { kunci: 'SAUDARA_SEBAPAK', urutan: 0 } })).toThrow();
    expect(() => bangunKasusLanjutan({ keluarga: 'khuntsa', dasar, sasaran: { kunci: 'AYAH', urutan: 0 } })).toThrow();
    expect(() => bangunKasusLanjutan({ keluarga: 'khuntsa', dasar, sasaran: { kunci: 'ISTRI', urutan: 0 } })).toThrow();
    expect(() => bangunKasusLanjutan({ keluarga: 'munasakhat', dasar, mayit: [{ kunci: 'ISTRI', urutan: 0, tambahan: { pasangan: 1, anakLk: 0, anakPr: 0 } }] })).toThrow();
  });
});

const BATAS_SAMPEL = 120;
const MAKS_DUNIA: Record<string, number> = { haml: 4, mafqud: 2, khuntsa: 2 };
const MODUL: Record<NamaKeluargaLanjutan, number> = { munasakhat: 11, dzawilArham: 12, haml: 13, mafqud: 14, khuntsa: 14, gharqa: 14 };

describe.each(DAFTAR_KELUARGA_LANJUTAN)('sampel keluarga %s', keluarga => {
  const sampel = [...sapuKasusLanjutan(keluarga, BATAS_SAMPEL)];
  const lolos = sampel.map(kandidat => ({ kandidat, soal: soalDariKode(kandidat.kode) })).flatMap(isi => (isi.soal.ok ? [{ ...isi, soal: isi.soal }] : []));

  test('sapuan deterministik dan tanpa duplikat kode', () => {
    expect(sampel.map(isi => isi.kode)).toEqual([...sapuKasusLanjutan(keluarga, BATAS_SAMPEL)].map(isi => isi.kode));
    expect(new Set(sampel.map(isi => isi.kode)).size).toBe(sampel.length);
  });

  test('sebagian besar sampel lolos engine, tingkat dan modul sesuai tabel, madzhab bawaan [SYF]', () => {
    expect(sampel.length).toBeGreaterThan(0);
    expect(lolos.length).toBeGreaterThan(sampel.length / 2);
    for (const { soal } of lolos) {
      expect(soal.kasus.madzhab).toBeUndefined();
      expect(soal.modul).toEqual([MODUL[keluarga]]);
      expect(soal.tingkat).toBe(tingkatSoal(soal.label));
      expect(modulSoal(soal.label)).toEqual(soal.modul);
      expect(soal.label).toContain(keluarga);
      if (keluarga !== 'munasakhat') expect(soal.tingkat).toBe('sulit');
    }
  });

  test('label konsisten dengan jejak dan hasil engine', () => {
    for (const { kandidat, soal } of lolos) {
      const tampil = jalankan(soal.kasus);
      const nilai = (awalan: string) => soal.label.find(token => token.startsWith(awalan))?.slice(awalan.length);
      expect(kandidat.jumlahOrang).toBeGreaterThan(0);
      if (tampil.jenis === 'munasakhat' && tampil.hasil.status === 'OK') {
        expect(Number(nilai('munasakhat:'))).toBe(tampil.hasil.daftarLangkah.length);
        expect(Number(nilai('munasakhat:'))).toBe(soal.kasus.urutanWafat.length + 1);
        expect(nilai('keadaan:')).toBe(String(tampil.hasil.keadaan));
        expect(soal.label.includes('ikhtishar')).toBe(tampil.hasil.ikhtishar.jamiah !== tampil.hasil.jamiah);
      } else if (tampil.jenis === 'gharqa') {
        expect(Number(nilai('mayit:'))).toBe(soal.kasus.gharqa!.anggota.length);
        expect(nilai('gharqa:')).toBe(uraiKeadaan(kandidat.kode));
        expect(soal.label.includes('ditahan')).toBe(tampil.hasil.status === 'MAUQUF');
      } else if (tampil.jenis === 'taqdir' && tampil.hasil.status === 'OK') {
        const dunia = Number(nilai('dunia:'));
        expect(dunia).toBe(tampil.hasil.daftarDunia.length);
        expect(dunia).toBeLessThanOrEqual(MAKS_DUNIA[keluarga]!);
        expect(soal.label.includes('mauquf')).toBe(tampil.hasil.mauquf > 0n);
      } else if (tampil.jenis === 'biasa' && tampil.hasil.status === 'OK') {
        expect(tampil.hasil.tanzil).toBeDefined();
        expect(soal.label.some(token => token.startsWith('tanzil:'))).toBe(true);
      } else {
        throw new Error(`jenis hasil tak terduga untuk ${keluarga}: ${tampil.jenis}`);
      }
    }
  });
});

function uraiKeadaan(kode: string): string {
  const urai = uraiKodeSoal(kode);
  if (!urai.ok || !('keadaan' in urai.kasus)) throw new Error('bukan kasus gharqa');
  return urai.kasus.keadaan;
}

describe('titik blocked haml [SYF]', () => {
  test('tidak ada soal haml yang memakai model enam taqdir atau memberi bagian ke ashabah mitra janin', () => {
    const haml = [...sapuKasusLanjutan('haml', 400)].map(kandidat => soalDariKode(kandidat.kode)).filter(soal => soal.ok);
    expect(haml.length).toBeGreaterThan(0);
    for (const soal of haml) {
      if (!soal.ok) continue;
      const tampil = jalankan(soal.kasus);
      expect(tampil.jenis).toBe('taqdir');
      if (tampil.jenis !== 'taqdir' || tampil.hasil.status !== 'OK') throw new Error('harus OK');
      // [R13-20] [SYF] empat taqdir; [R13-15] mitra ashabah janin bernilai 0 di `diberikan`.
      expect(tampil.hasil.daftarDunia.length).toBeLessThanOrEqual(4);
      for (const langkah of tampil.hasil.jejak) {
        if (langkah.jenis === 'TAQDIR_PEMBERIAN' && langkah.alasan === 'kelasD') expect(langkah.saham).toBe(0n);
      }
    }
  });
});

describe('kuota dan pembangun lintas keluarga', () => {
  const contoh = () => [
    ...[...sapuKasusBiasa(400)].map(keKandidat),
    ...DAFTAR_KELUARGA_LANJUTAN.flatMap(keluarga => [...sapuKasusLanjutan(keluarga, 60)]),
  ];

  test('pembangun mengalir sama dengan saringKode + terapkanKuota, deterministik', () => {
    const mengalir = bangunBankDariKode(contoh, 300);
    const acuan = saringKode(contoh());
    expect(mengalir.kandidat).toBe(acuan.kandidat);
    expect(mengalir.jumlahLolos).toBe(acuan.lolos.length);
    expect(mengalir.dibuang).toEqual(acuan.dibuang);
    expect(mengalir.terpilih).toEqual(terapkanKuota(acuan.lolos, 300));
    expect(bangunBankDariKode(contoh, 300).terpilih).toEqual(mengalir.terpilih);
    expect(new Set(mengalir.perKeluarga.keys())).toEqual(new Set(['biasa', ...DAFTAR_KELUARGA_LANJUTAN].filter(nama => mengalir.perKeluarga.has(nama))));
    expect(mengalir.perKeluarga.has('munasakhat')).toBe(true);
  });

  test('kuota keluarga lanjutan tidak dilampaui dan dibagi rata ke label utama', () => {
    const stok = (keluarga: string, label: string, jumlah: number): BarisBank[] =>
      Array.from({ length: jumlah }, (_, urutan) => ({
        kode: `${keluarga}-${label}-${urutan}`, label: [keluarga], tingkat: 'sulit' as const, modul: [11], jumlahAhliWaris: 1, labelUtama: label, keluarga,
      }));
    const terpilih = terapkanKuota([...stok('munasakhat', 'a', 100_000), ...stok('munasakhat', 'b', 100), ...stok('haml', 'c', 5)], 1000);
    expect(terpilih.filter(baris => baris.keluarga === 'munasakhat')).toHaveLength(KUOTA_KELUARGA_LANJUTAN.munasakhat);
    expect(terpilih.filter(baris => baris.labelUtama === 'b')).toHaveLength(100);
    expect(terpilih.filter(baris => baris.keluarga === 'haml')).toHaveLength(5);
  });
});

describe('tingkat dan modul keluarga lanjutan', () => {
  test('munasakhat 2 mayit menengah, 3 mayit atau lebih sulit; keluarga lain sulit; modul tunggal', () => {
    expect(tingkatSoal(['munasakhat', 'munasakhat:2', 'keadaan:3'])).toBe('menengah');
    expect(tingkatSoal(['munasakhat', 'munasakhat:3', 'keadaan:3'])).toBe('sulit');
    expect(tingkatSoal(['munasakhat', 'munasakhat:4', 'keadaan:1'])).toBe('sulit');
    for (const keluarga of ['gharqa', 'mafqud', 'khuntsa', 'haml', 'dzawilArham']) expect(tingkatSoal([keluarga])).toBe('sulit');
    expect(modulSoal(['munasakhat', 'munasakhat:2', 'hajb:AYAH', 'aul'])).toEqual([11]);
    expect(modulSoal(['dzawilArham'])).toEqual([12]);
    expect(modulSoal(['haml'])).toEqual([13]);
    for (const keluarga of ['mafqud', 'khuntsa', 'gharqa']) expect(modulSoal([keluarga])).toEqual([14]);
  });
});
