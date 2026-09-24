import { describe, expect, test } from 'vitest';
import * as bab16 from '../../__tests__/fixtures/bab16.js';
import { jalankanTahapAhliWaris } from '../../pipeline.js';
import type { InputEngine } from '../../types.js';
import type { KelompokBagian } from '../model.js';
import { ANAK, KANDUNG, SEBAPAK, keluarga } from './helpers.js';

/** Ringkas grup → { "id1,id2": "fardh 2/3 [id1:2,id2:1]" } supaya ekspektasi mudah dibaca. */
function summarize(kelompokKelompok: KelompokBagian[]): Record<string, string> {
  const fr = (f: { n: bigint; d: bigint }) => `${f.n}/${f.d}`;
  const out: Record<string, string> = {};
  for (const g of kelompokKelompok) {
    const anggota = [...g.anggota].sort();
    const s = g.bagian;
    let text = s.jenis === 'fardh' || s.jenis === 'fardhAshabah' ? `${s.jenis} ${fr(s.fardh)}`
      : s.jenis === 'ashabah' ? `ashabah ${s.type}`
      : `fixed ${fr(s.nilai)} ${s.basis}`;
    if (anggota.some(id => g.bobot[id] !== 1n)) text += ` [${anggota.map(id => `${id}:${g.bobot[id]}`).join(',')}]`;
    out[anggota.join(',')] = text;
  }
  return out;
}

function hasilBagian(input: InputEngine) {
  const hasil = jalankanTahapAhliWaris(input);
  if (hasil.status !== 'AHLI_WARIS') throw new Error(`${hasil.status}: ${JSON.stringify(hasil)}`);
  return { kelompokKelompok: summarize(hasil.kelompokKelompok), jejak: hasil.jejak };
}

describe('tahap 2 — furudh dan ashabah pada fixture bab 16', () => {
  const cases: Array<[string, InputEngine, Record<string, string>]> = [
    ['C01', bab16.case01.input, { W1: 'fardh 1/8', 'D1,S1': 'ashabah bilGhair [D1:1,S1:2]' }],
    ['C02', bab16.case02.input, { H1: 'fardh 1/2', M1: 'fardh 1/6', F1: 'ashabah binNafsi' }],
    ['C03', bab16.case03.input, { W1: 'fardh 1/4', M1: 'fardh 1/4', F1: 'ashabah binNafsi' }],
    ['C04', bab16.case04.input, { H1: 'fardh 1/2', M1: 'fardh 1/3', GF1: 'ashabah binNafsi' }],
    ['C05', bab16.case05.input, { H1: 'fardh 1/2', 'UK1,UK2': 'fardh 2/3' }],
    ['C06', bab16.case06.input, { W1: 'fardh 1/8', F1: 'fardhAshabah 1/6', M1: 'fardh 1/6', 'D1,D2': 'fardh 2/3' }],
    ['C07', bab16.case07.input, { H1: 'fardh 1/2', M1: 'fardh 1/6', 'UK1,UK2': 'fardh 2/3', 'UM1,UM2': 'fardh 1/3' }],
    ['C08', bab16.case08.input, { D1: 'fardh 1/2', GD1: 'fardh 1/6', UK1: 'ashabah maalGhair' }],
    ['C09', bab16.case09.input, { D1: 'fardh 1/2', M1: 'fardh 1/6' }],
    ['C10', bab16.case10.input, { H1: 'fardh 1/4', D1: 'fardh 1/2', GD1: 'fardh 1/6' }],
    ['C11', bab16.case11.input, { W1: 'fardh 1/4', M1: 'fardh 1/6', 'US1,US2': 'fardh 1/3' }],
    ['C12', bab16.case12.input, { H1: 'fardh 1/2', M1: 'fardh 1/3', 'GF1,UK1': 'fardh 2/3 [GF1:2,UK1:1]' }],
    ['C13', bab16.case13.input, { H1: 'fardh 1/2', M1: 'fardh 1/6', 'AK1,US1,US2': 'fardh 1/3' }],
    ['C14', bab16.case14.input, { W1: 'fardh 1/4', GF1: 'fixed 1/4 tsulutsBaqi', 'AK1,AK2,AK3': 'ashabah binNafsi' }],
    ['C15', bab16.case15.input, { F1: 'ashabah binNafsi', M1: 'fardh 1/6' }],
    ['C16', bab16.case16.input, { H1: 'fardh 1/4', F1: 'fardh 1/6', S1: 'ashabah binNafsi' }],
    ['C17', bab16.case17.input, { H1: 'fardh 1/2', M1: 'fardh 1/6', UK1: 'fardh 1/2', 'AB1,UB1': 'ashabah bilGhair [AB1:2,UB1:1]' }],
    ['C17b', bab16.case17b.input, { H1: 'fardh 1/2', M1: 'fardh 1/6', UK1: 'fardh 1/2', UB1: 'fardh 1/6' }],
    ['C18', bab16.case18.input, { 'D1,D2': 'fardh 2/3', 'GD1,GGS1': 'ashabah bilGhair [GD1:1,GGS1:2]' }],
    ['C19', bab16.case19.input, { W1: 'fardh 1/8', D1: 'fardh 1/2', AB1: 'ashabah binNafsi' }],
    ['C20', bab16.case20.input, { W1: 'fardh 1/8', F1: 'fardh 1/6', M1: 'fardh 1/6', S1: 'ashabah binNafsi' }],
    ['C21', bab16.case21.input, { W1: 'fardh 1/8', D1: 'fardh 1/2', M1: 'fardh 1/6', F1: 'fardhAshabah 1/6' }],
    ['C22', bab16.case22.input, { 'W1,W2,W3,W4': 'fardh 1/4', 'AK1,AK2,AK3': 'ashabah binNafsi' }],
    ['C23', bab16.case23.input, { 'GM1,GM2': 'fardh 1/6', 'AB1,AB2,AB3': 'ashabah binNafsi' }],
    ['NEG1', bab16.caseNeg1.input, { W1: 'fardh 1/4', M1: 'fardh 1/3' }],
    ['NEG2', bab16.caseNeg2.input, { W1: 'fardh 1/4', M1: 'fardh 1/3' }],
  ];

  test.each(cases)('%s', (_id, input, expected) => {
    expect(hasilBagian(input).kelompokKelompok).toEqual(expected);
  });

  test('kasus khusus dicatat di jejak', () => {
    const special = (input: InputEngine) =>
      hasilBagian(input).jejak.filter(s => s.jenis === 'KASUS_KHUSUS').map(s => s.jenis === 'KASUS_KHUSUS' && s.nama);
    expect(special(bab16.case02.input)).toEqual(['umariyyatain']);
    expect(special(bab16.case04.input)).toEqual([]);            // kakek ≠ ayah [R07-1]
    expect(special(bab16.case12.input)).toEqual(['akdariyyah']);
    expect(special(bab16.case13.input)).toEqual(['musyarrakah']);
  });

  test('hajb nuqshan dicatat [bab 6.3]', () => {
    const nuqshan = hasilBagian(bab16.case10.input).jejak.filter(s => s.jenis === 'HAJB_NUQSHAN');
    expect(nuqshan).toContainEqual(expect.objectContaining({ terdampak: 'H1', from: { n: 1n, d: 2n }, to: { n: 1n, d: 4n } }));
    expect(nuqshan).toContainEqual(expect.objectContaining({ terdampak: 'GD1', from: { n: 1n, d: 2n }, to: { n: 1n, d: 6n } }));
  });
});

describe('tahap 2 — kakek bersama saudara [SYF] (bab 08)', () => {
  const kakek = { PGF: { jenisKelamin: 'L' } } as const;

  test('[R08-2] tanpa furudh, satuan < 4 → muqasamah bersama', () => {
    expect(hasilBagian(keluarga({ ...kakek, AK1: { jenisKelamin: 'L', ...KANDUNG } })).kelompokKelompok)
      .toEqual({ 'AK1,PGF': 'ashabah binNafsi' });   // kakek = satu saudara lk
  });

  test('[R08-2] tanpa furudh, satuan > 4 → 1/3', () => {
    expect(hasilBagian(keluarga({
      ...kakek, AK1: { jenisKelamin: 'L', ...KANDUNG }, AK2: { jenisKelamin: 'L', ...KANDUNG }, AK3: { jenisKelamin: 'L', ...KANDUNG },
    })).kelompokKelompok).toEqual({ PGF: 'fixed 1/3 tsuluts', 'AK1,AK2,AK3': 'ashabah binNafsi' });
  });

  test('[R08-3] sisa ≤ 1/6 → kakek 1/6, saudara gugur (ashabah tanpa sisa)', () => {
    expect(hasilBagian(keluarga({
      ...kakek, M: { jenisKelamin: 'P' }, B1: { jenisKelamin: 'P', ...ANAK }, B2: { jenisKelamin: 'P', ...ANAK }, W1: { jenisKelamin: 'P' },
      AK1: { jenisKelamin: 'L', ...KANDUNG },
    }, [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }])).kelompokKelompok).toEqual({
      // Furudh 1/8 + 2/3 + 1/6 = 23/24 → sisa 1/24.
      W1: 'fardh 1/8', 'B1,B2': 'fardh 2/3', M: 'fardh 1/6', PGF: 'fardh 1/6', AK1: 'ashabah binNafsi',
    });
  });

  test('[R08-4] mu\'addah: saudara sebapak dihitung lalu bagiannya ke kandung', () => {
    const { kelompokKelompok, jejak } = hasilBagian(keluarga({ ...kakek, AK1: { jenisKelamin: 'L', ...KANDUNG }, AB1: { jenisKelamin: 'L', ...SEBAPAK } }));
    expect(kelompokKelompok).toEqual({ PGF: 'fixed 1/3 muqasamah', 'AB1,AK1': 'ashabah binNafsi [AB1:0,AK1:1]' });
    expect(jejak).toContainEqual(expect.objectContaining({ jenis: 'KASUS_KHUSUS', nama: 'muaddah' }));
  });

  test('[R08-4] mu\'addah, satu saudari kandung mengambil hingga 1/2, sisanya ke sebapak', () => {
    // Kakek, saudari kandung, saudara sebapak → 10: kakek 4, saudari 5, sebapak 1.
    expect(hasilBagian(keluarga({ ...kakek, UK1: { jenisKelamin: 'P', ...KANDUNG }, AB1: { jenisKelamin: 'L', ...SEBAPAK } })).kelompokKelompok).toEqual({
      PGF: 'fixed 2/5 muqasamah', UK1: 'fixed 1/2 muaddah', AB1: 'ashabah binNafsi',
    });
  });

  test('kakek + saudari saja + anak pr → TIDAK_DIDUKUNG (ma\'al ghair bersama kakek tidak dirinci KB)', () => {
    expect(jalankanTahapAhliWaris(keluarga({ ...kakek, B1: { jenisKelamin: 'P', ...ANAK }, UK1: { jenisKelamin: 'P', ...KANDUNG } })))
      .toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['R08-3'] });
  });
});

describe('tahap 2 — alasan fardh terstruktur (untuk packages/jelaskan)', () => {
  const reasonOf = (input: InputEngine, kelompok: string) => {
    const step = hasilBagian(input).jejak.find(s => s.jenis === 'FARDH' && s.kelompok === kelompok);
    return step?.jenis === 'FARDH' ? step.alasan : undefined;
  };
  const f = (n: bigint, d: bigint) => ({ n, d });

  test('pasangan dan ibu menyebut siapa penyebab nuqshan', () => {
    expect(reasonOf(bab16.case10.input, 'SUAMI')).toEqual({ code: 'ADA_FARU_WARITS', oleh: ['D1', 'GD1'] });
    expect(reasonOf(bab16.case04.input, 'SUAMI')).toEqual({ code: 'TANPA_FARU_WARITS' });
    expect(reasonOf(bab16.case15.input, 'IBU')).toEqual({ code: 'JAM_IKHWAH', oleh: ['AK1', 'AK2'] });
    expect(reasonOf(bab16.case04.input, 'IBU')).toEqual({ code: 'TANPA_FARU_WARITS_DAN_IKHWAH' });
    expect(reasonOf(bab16.case02.input, 'IBU')).toEqual({ code: 'UMARIYYATAIN', fardhPasangan: f(1n, 2n) });
  });

  test('keturunan, saudari, anak ibu, ayah', () => {
    expect(reasonOf(bab16.case06.input, 'ANAK_PR')).toEqual({ code: 'TANPA_MUASHSHIB', banyaknya: 2 });
    expect(reasonOf(bab16.case08.input, 'CUCU_PR_2')).toEqual({ code: 'TAKMILAH', with: ['D1'] });
    expect(reasonOf(bab16.case17b.input, 'SAUDARI_SEBAPAK')).toEqual({ code: 'TAKMILAH', with: ['UK1'] });
    expect(reasonOf(bab16.case05.input, 'SAUDARI_KANDUNG')).toEqual({ code: 'KALALAH', banyaknya: 2 });
    expect(reasonOf(bab16.case11.input, 'AWLAD_UMM')).toEqual({ code: 'KALALAH', banyaknya: 2 });
    expect(reasonOf(bab16.case20.input, 'AYAH')).toEqual({ code: 'ADA_FARU_MUDZAKKAR', oleh: ['S1'] });
    expect(reasonOf(bab16.case21.input, 'AYAH')).toEqual({ code: 'ADA_FARU_MUANNATS', oleh: ['D1'] });
    expect(reasonOf(bab16.case23.input, 'JADDAH')).toEqual({ code: 'NENEK_TANPA_IBU', banyaknya: 2 });
  });

  test('kasus khusus: pilihan kakek dicatat lengkap dengan pembandingnya', () => {
    expect(reasonOf(bab16.case14.input, 'KAKEK')).toEqual({
      code: 'JADD_WAL_IKHWAH',
      sisa: f(3n, 4n),
      opsi: [
        { nama: 'muqasamah', nilai: f(3n, 16n) },
        { nama: 'tsulutsBaqi', nilai: f(1n, 4n) },
        { nama: 'sudus', nilai: f(1n, 6n) },
      ],
      terpilih: 'tsulutsBaqi',
    });
    expect(reasonOf(bab16.case13.input, 'MUSYARRAKAH')).toEqual({ code: 'MUSYARRAKAH' });
  });

  test('muqasamah bersama tetap mencatat pembanding pilihan kakek', () => {
    const step = hasilBagian(keluarga({ PGF: { jenisKelamin: 'L' }, AK1: { jenisKelamin: 'L', ...KANDUNG } })).jejak
      .find(s => s.jenis === 'ASHABAH' && s.kelompok === 'JADD_IKHWAH');
    expect(step?.jenis === 'ASHABAH' && step.pilihanJadd).toEqual({
      code: 'JADD_WAL_IKHWAH',
      sisa: f(1n, 1n),
      opsi: [{ nama: 'muqasamah', nilai: f(1n, 2n) }, { nama: 'tsuluts', nilai: f(1n, 3n) }],
      terpilih: 'muqasamah',
    });
  });
});
