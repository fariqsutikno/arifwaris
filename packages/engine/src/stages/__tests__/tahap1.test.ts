import { describe, expect, test } from 'vitest';
import * as bab16 from '../../__tests__/fixtures/bab16.js';
import { jalankanTahapAhliWaris } from '../../pipeline.js';
import type { InputEngine, StatusOrang } from '../../types.js';
import { turunkanPeran } from '../derivasi.js';
import { ANAK, KANDUNG, ANAK_KAKEK, SEBAPAK, SEIBU, keluarga, p } from './helpers.js';

const keysOf = (input: InputEngine) =>
  Object.fromEntries(Object.entries(turunkanPeran(input.graf, input.konfigurasi).daftarPeran).map(([id, r]) => [id, r.kunci]));

function statusOrang(input: InputEngine): Record<string, StatusOrang> {
  const hasil = jalankanTahapAhliWaris(input);
  if (hasil.status !== 'AHLI_WARIS') throw new Error(`status ${hasil.status}`);
  return hasil.statusOrang;
}

const mahjubBy = (input: InputEngine, id: string) => {
  const s = statusOrang(input)[id];
  return s?.jenis === 'mahjub' ? [...s.oleh].sort() : null;
};

describe('1a derivasi peran [R03-1]', () => {
  test('fixture bab 16', () => {
    expect(keysOf(bab16.case01.input)).toMatchObject({ W1: 'ISTRI', S1: 'ANAK_LK', D1: 'ANAK_PR' });
    expect(keysOf(bab16.case04.input)).toMatchObject({ H1: 'SUAMI', F1: 'AYAH', GF1: 'KAKEK', M1: 'IBU' });
    expect(keysOf(bab16.case07.input)).toMatchObject({ UK1: 'SAUDARI_KANDUNG', UM1: 'SAUDARI_SEIBU', UF1: 'BUKAN_AHLI_WARIS' });
    expect(keysOf(bab16.case08.input)).toMatchObject({ GD1: 'CUCU_PR', UK1: 'SAUDARI_KANDUNG' });
    expect(keysOf(bab16.case16.input)).toMatchObject({
      S1: 'ANAK_LK', GS1: 'CUCU_LK', AK1: 'SAUDARA_KANDUNG', IA1: 'KEPONAKAN_KANDUNG', AM1: 'PAMAN_KANDUNG', IM1: 'SEPUPU_KANDUNG', GF1: 'KAKEK',
    });
    expect(keysOf(bab16.case17.input)).toMatchObject({ AB1: 'SAUDARA_SEBAPAK', UB1: 'SAUDARI_SEBAPAK' });
    expect(keysOf(bab16.case18.input)).toMatchObject({ GD1: 'CUCU_PR', GGS1: 'CUCU_LK' });
    expect(keysOf(bab16.case23.input)).toMatchObject({ GM1: 'NENEK_DARI_AYAH', GM2: 'NENEK_DARI_IBU' });
    expect(keysOf(bab16.case24.input)).toMatchObject({ KL1: 'DZAWIL_ARHAM', AM1: 'DZAWIL_ARHAM' });
  });

  test('darajah dan koordinat kekerabatan (bab 5.3)', () => {
    const { daftarPeran } = turunkanPeran(bab16.case18.input.graf, bab16.case18.input.konfigurasi);
    expect(daftarPeran['GGS1']?.kekerabatan).toMatchObject({ generasiLeluhur: 0, kedalamanKeturunan: 3 });
    const paman = turunkanPeran(bab16.case16.input.graf, bab16.case16.input.konfigurasi).daftarPeran['IM1'];
    expect(paman?.kekerabatan).toMatchObject({ generasiLeluhur: 2, kedalamanKeturunan: 2, jalur: 'kandung' });
  });

  test('[R03-5] [R03-7] [R14-4] jalur lewat perempuan → dzawil arham', () => {
    const keys = keysOf(keluarga({
      B1: { jenisKelamin: 'P', ...ANAK, statusHidup: 'wafat' },
      CB1: { jenisKelamin: 'L', idIbu: 'B1' },                       // cucu dari anak pr
      MGM: { jenisKelamin: 'P' },                                       // ibunya ibu → NENEK_DARI_IBU
      MGF: { jenisKelamin: 'L' },                                       // ayahnya ibu → jadd fasid
      AK1: { jenisKelamin: 'P', ...KANDUNG, statusHidup: 'wafat' },
      AKS: { jenisKelamin: 'L', idIbu: 'AK1' },                      // anak saudari
      AU1: { jenisKelamin: 'L', ...SEIBU, statusHidup: 'wafat' },
      AUS: { jenisKelamin: 'L', idAyah: 'AU1' },                      // anak saudara seibu
      AMU: { jenisKelamin: 'L', idAyah: 'X', idIbu: 'PGM' },       // paman seibu (saudara seibu ayah)
      X:   { jenisKelamin: 'L', statusHidup: 'wafat' },
    }));
    const withMpgm = keluarga({
      MGF: { jenisKelamin: 'L', statusHidup: 'wafat', idIbu: 'MPGM' },
      MPGM: { jenisKelamin: 'P' },
    });
    expect(keysOf(withMpgm)['MPGM']).toBe('DZAWIL_ARHAM');
    expect(keys).toMatchObject({
      CB1: 'DZAWIL_ARHAM', MGM: 'NENEK_DARI_IBU', MGF: 'DZAWIL_ARHAM',
      AKS: 'DZAWIL_ARHAM', AUS: 'DZAWIL_ARHAM', AMU: 'DZAWIL_ARHAM',
    });
  });

  test('[R03-4] nenek di atas kakek dari ayah = ahli waris [SYF]', () => {
    expect(keysOf(keluarga({ PPGM: { jenisKelamin: 'P' } }))['PPGM']).toBe('NENEK_DARI_AYAH');
  });

  test('[R02-3] talak: raj\'i dalam iddah mewarisi; ba\'in tidak, kecuali maradh + qaul qadim', () => {
    const graf = (status: 'talakRajiIddah' | 'talakBain') =>
      keluarga({ W1: { jenisKelamin: 'P' } }, [{ idSuami: 'D', idIstri: 'W1', status, talakSaatMaradh: true }]);
    expect(keysOf(graf('talakRajiIddah'))['W1']).toBe('ISTRI');
    expect(keysOf(graf('talakBain'))['W1']).toBe('BUKAN_AHLI_WARIS');
    const qadim = graf('talakBain');
    qadim.konfigurasi = { ...qadim.konfigurasi, talakBainSaatMaradh: 'qaulQadim' };
    expect(keysOf(qadim)['W1']).toBe('ISTRI');
  });

  test('suami yang juga anak paman → dua jihah (tidak diatur KB)', () => {
    const graf = keluarga({
      D: { jenisKelamin: 'P', statusHidup: 'wafat' },
      AM1: { jenisKelamin: 'L', ...ANAK_KAKEK, statusHidup: 'wafat' },
      H1: { jenisKelamin: 'L', idAyah: 'AM1' },
    }, [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }]);
    expect(turunkanPeran(graf.graf, graf.konfigurasi).duaJihah).toEqual(['H1']);
  });
});

describe('1b mawani\' [R02-2] — keluar dan tidak menghijab [R06-6]', () => {
  test('beda agama dan pembunuh → mamnu', () => {
    expect(statusOrang(bab16.caseNeg1.input)['D1']).toMatchObject({ jenis: 'mamnu', mani: 'ikhtilafDin' });
    expect(statusOrang(bab16.caseNeg2.input)['S1']).toMatchObject({ jenis: 'mamnu', mani: 'qatl' });
  });

  test('anak pembunuh tidak dihijab ayahnya yang mamnu', () => {
    const graf = keluarga({ S1: { jenisKelamin: 'L', ...ANAK, membunuhPewaris: true }, SS1: { jenisKelamin: 'L', idAyah: 'S1' } });
    expect(statusOrang(graf)['SS1']).toMatchObject({ jenis: 'ahliWaris' });
  });

  test('status mamnu dan mahjub membawa peran (untuk narasi)', () => {
    expect(statusOrang(bab16.caseNeg1.input)['D1']).toMatchObject({ jenis: 'mamnu', peran: { kunci: 'ANAK_PR' } });
    expect(statusOrang(bab16.case15.input)['AK1']).toMatchObject({ jenis: 'mahjub', peran: { kunci: 'SAUDARA_KANDUNG' } });
  });

  test('yang wafat bukan ahli waris', () => {
    expect(statusOrang(bab16.case04.input)['F1']).toMatchObject({ jenis: 'bukanAhliWaris' });
  });
});

describe('1c hajb hirman [R06-3]', () => {
  test('fixture bab 16', () => {
    expect(mahjubBy(bab16.case15.input, 'AK1')).toEqual(['F1']);
    const c16 = bab16.case16.input;
    expect(mahjubBy(c16, 'GF1')).toEqual(['F1']);
    expect(mahjubBy(c16, 'GS1')).toEqual(['S1']);
    for (const id of ['AK1', 'IA1', 'AM1', 'IM1']) expect(mahjubBy(c16, id)).toEqual(['F1', 'S1']);
    expect(mahjubBy(bab16.case19.input, 'AM1')).toEqual(['AB1']);
    expect(mahjubBy(bab16.case17.input, 'AB1')).toBeNull();   // ashabah, bukan mahjub
    expect(mahjubBy(bab16.case18.input, 'GD1')).toBeNull();   // qarib mubarak [R04-13]
  });

  test('[R04-9] [R04-10] hajb atas nenek', () => {
    const tiga = keluarga({ M: { jenisKelamin: 'P' }, PGM: { jenisKelamin: 'P' }, MGM: { jenisKelamin: 'P' } });
    expect(mahjubBy(tiga, 'PGM')).toEqual(['M']);
    expect(mahjubBy(tiga, 'MGM')).toEqual(['M']);

    const ayah = keluarga({ F: { jenisKelamin: 'L' }, PGM: { jenisKelamin: 'P' }, MGM: { jenisKelamin: 'P' } });
    expect(mahjubBy(ayah, 'PGM')).toEqual(['F']);
    expect(mahjubBy(ayah, 'MGM')).toBeNull();

    // Nenek dekat pihak ibu menghijab nenek jauh pihak ayah, tidak sebaliknya [SYF].
    expect(mahjubBy(keluarga({ MGM: { jenisKelamin: 'P' }, PPGM: { jenisKelamin: 'P' } }), 'PPGM')).toEqual(['MGM']);
    expect(mahjubBy(keluarga({ PGM: { jenisKelamin: 'P' }, MMGM: { jenisKelamin: 'P' } }), 'MMGM')).toBeNull();

    // Kakek menghijab nenek yang lewat dia, bukan ibunya ayah [R04-6].
    const kakek = keluarga({ PGF: { jenisKelamin: 'L' }, PGM: { jenisKelamin: 'P' }, PPGM: { jenisKelamin: 'P' } });
    expect(mahjubBy(kakek, 'PGM')).toBeNull();
    expect(mahjubBy(kakek, 'PPGM')).toEqual(['PGF', 'PGM']);
  });

  test('keturunan perempuan', () => {
    const duaAnakPr = { B1: { jenisKelamin: 'P', ...ANAK }, B2: { jenisKelamin: 'P', ...ANAK }, S1: { jenisKelamin: 'L', ...ANAK, statusHidup: 'wafat' } } as const;
    // [R04-13] 2 anak pr menghabiskan 2/3 → cucu pr gugur tanpa mu'ashshib
    expect(mahjubBy(keluarga({ ...duaAnakPr, BI1: { jenisKelamin: 'P', idAyah: 'S1' } }), 'BI1')).toEqual(['B1', 'B2']);
    // [R06-5] far'u warits pr menghijab saudara seibu
    expect(mahjubBy(keluarga({ B1: { jenisKelamin: 'P', ...ANAK }, AU1: { jenisKelamin: 'L', ...SEIBU } }), 'AU1')).toEqual(['B1']);
  });

  test('saudari sebapak [R04-14] [R05-5]', () => {
    const maalGhair = keluarga({ B1: { jenisKelamin: 'P', ...ANAK }, UK1: { jenisKelamin: 'P', ...KANDUNG }, UB1: { jenisKelamin: 'P', ...SEBAPAK } });
    expect(mahjubBy(maalGhair, 'UB1')).toEqual(['UK1']);

    const duaKandung = { UK1: { jenisKelamin: 'P', ...KANDUNG }, UK2: { jenisKelamin: 'P', ...KANDUNG }, UB1: { jenisKelamin: 'P', ...SEBAPAK } } as const;
    expect(mahjubBy(keluarga(duaKandung), 'UB1')).toEqual(['UK1', 'UK2']);
    expect(mahjubBy(keluarga({ ...duaKandung, AB1: { jenisKelamin: 'L', ...SEBAPAK } }), 'UB1')).toBeNull();
  });

  test('[R05-3] jihah → darajah → quwwah', () => {
    // Anak saudara kandung kalah dari saudara sebapak (darajah sebelum quwwah).
    const g1 = keluarga({ AK1: { jenisKelamin: 'L', ...KANDUNG, statusHidup: 'wafat' }, IAK: { jenisKelamin: 'L', idAyah: 'AK1' }, AB1: { jenisKelamin: 'L', ...SEBAPAK } });
    expect(mahjubBy(g1, 'IAK')).toEqual(['AB1']);
    // Paman kandung kalah dari anak saudara sebapak (jihah).
    const g2 = keluarga({
      AB1: { jenisKelamin: 'L', ...SEBAPAK, statusHidup: 'wafat' }, IAB: { jenisKelamin: 'L', idAyah: 'AB1' }, AM1: { jenisKelamin: 'L', ...ANAK_KAKEK },
    });
    expect(mahjubBy(g2, 'AM1')).toEqual(['IAB']);
  });

  test('kakek bersama saudara [R08-1] [R05-2]', () => {
    const muaddah = keluarga({ PGF: { jenisKelamin: 'L' }, AK1: { jenisKelamin: 'L', ...KANDUNG }, AB1: { jenisKelamin: 'L', ...SEBAPAK } });
    expect(mahjubBy(muaddah, 'AK1')).toBeNull();
    expect(mahjubBy(muaddah, 'AB1')).toBeNull();   // dihitung dalam mu'addah (bab 8.4)

    const anakSaudara = keluarga({ PGF: { jenisKelamin: 'L' }, AK1: { jenisKelamin: 'L', ...KANDUNG, statusHidup: 'wafat' }, IAK: { jenisKelamin: 'L', idAyah: 'AK1' } });
    expect(mahjubBy(anakSaudara, 'IAK')).toEqual(['PGF']);
  });

  test('[R06-6] saudara mahjub tetap menghitung untuk nuqshan ibu (dicek di jejak)', () => {
    const hasil = jalankanTahapAhliWaris(bab16.case15.input);
    if (hasil.status !== 'AHLI_WARIS') throw new Error(hasil.status);
    expect(hasil.jejak).toContainEqual(expect.objectContaining({ jenis: 'HAJB_NUQSHAN', terdampak: 'M1', penyebab: ['AK1', 'AK2'] }));
  });
});

describe('validasi input → PERLU_INPUT / TIDAK_DIDUKUNG', () => {
  test('uji negatif bab 16', () => {
    expect(jalankanTahapAhliWaris(bab16.caseNeg3.input)).toMatchObject({ status: 'PERLU_INPUT', pertanyaan: [{ idOrang: 'S1', isian: 'statusHidup' }] });
    expect(jalankanTahapAhliWaris(bab16.caseNeg4.input)).toMatchObject({ status: 'PERLU_INPUT', pertanyaan: [{ isian: 'pernikahan' }] });
    expect(jalankanTahapAhliWaris(bab16.caseNeg5.input)).toMatchObject({ status: 'PERLU_INPUT', pertanyaan: [{ isian: 'pembulatan' }] });
  });

  test('agama tidak diketahui → tanya; placeholder tidak ditanya', () => {
    const graf = keluarga({ S1: { jenisKelamin: 'L', ...ANAK, agama: 'tidakDiketahui' } });
    expect(jalankanTahapAhliWaris(graf)).toMatchObject({ status: 'PERLU_INPUT', pertanyaan: [{ idOrang: 'S1', isian: 'agama' }] });
  });

  test('tanpa ahli waris, ada dzawil arham → TIDAK_DIDUKUNG (fase 3)', () => {
    expect(jalankanTahapAhliWaris(bab16.case24.input)).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['R14-4'] });
  });

  test('pewaris non-muslim di luar cakupan', () => {
    const graf = keluarga({ D: { jenisKelamin: 'L', statusHidup: 'wafat', agama: 'nonIslam' }, S1: { jenisKelamin: 'L', ...ANAK } });
    expect(jalankanTahapAhliWaris(graf)).toMatchObject({ status: 'TIDAK_DIDUKUNG' });
  });

  test('jenis kelamin tidak cocok dengan peran di graf → tanya', () => {
    const suamiPerempuan = bab16.input({
      idPewaris: 'D',
      orang: { D: p('D', 'L', { statusHidup: 'wafat' }), H1: p('H1', 'L') },
      pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
    });
    expect(jalankanTahapAhliWaris(suamiPerempuan)).toMatchObject({ status: 'PERLU_INPUT', pertanyaan: [{ idOrang: 'D', isian: 'jenisKelamin' }] });
    const ayahPerempuan = keluarga({ S1: { jenisKelamin: 'L', idIbu: 'D' } });
    expect(jalankanTahapAhliWaris(ayahPerempuan)).toMatchObject({ status: 'PERLU_INPUT', pertanyaan: [{ idOrang: 'D', isian: 'jenisKelamin' }] });
  });

  test('suami lebih dari satu → tanya', () => {
    const graf = bab16.input({
      idPewaris: 'D',
      orang: { D: p('D', 'P', { statusHidup: 'wafat' }), H1: p('H1', 'L'), H2: p('H2', 'L') },
      pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }, { idSuami: 'H2', idIstri: 'D', status: 'utuh' }],
    });
    expect(jalankanTahapAhliWaris(graf)).toMatchObject({ status: 'PERLU_INPUT', pertanyaan: [{ isian: 'pernikahan' }] });
  });

  test('suami pertama sudah wafat lalu menikah lagi → yang dihitung hanya suami yang hidup', () => {
    const graf = bab16.input({
      idPewaris: 'D',
      orang: { D: p('D', 'P', { statusHidup: 'wafat' }), H1: p('H1', 'L', { statusHidup: 'wafat' }), H2: p('H2', 'L') },
      pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }, { idSuami: 'H2', idIstri: 'D', status: 'utuh' }],
    });
    expect(jalankanTahapAhliWaris(graf)).toMatchObject({ status: 'AHLI_WARIS' });
  });
});
