// Property test invarian (CLAUDE.md "Invarian sebagai assertion"): untuk susunan ahli waris acak,
// pipeline tidak boleh throw, dan hasil OK harus memenuhi Σ saham = penyebut akhir, 'aul hanya ke nilai sah [R09-4],
// saham bulat ≥ 0, dan rasio 2:1 dalam kelompok ashabah campuran (bab 10.5).
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { hitung } from '../pipeline.js';
import type { GrafKeluarga, HasilEngine, Orang, Pernikahan, Ruleset } from '../types.js';
import { input, p } from './fixtures/bab16.js';

export interface Susunan {
  pewarisLk: boolean; pasangan: number; ayah: boolean; ibu: boolean; kakek: boolean; nenekDariIbu: boolean; nenekDariAyah: boolean;
  anakLk: number; anakPr: number; cucuLk: number; cucuPr: number;
  saudaraKandung: number; saudariKandung: number; saudaraSebapak: number; saudariSebapak: number;
  saudaraSeibu: number; saudariSeibu: number; pamanKandung: number;
}

const antara = (max: number) => fc.integer({ min: 0, max });
export const arbSusunan: fc.Arbitrary<Susunan> = fc.record({
  pewarisLk: fc.boolean(), pasangan: antara(4), ayah: fc.boolean(), ibu: fc.boolean(), kakek: fc.boolean(),
  nenekDariIbu: fc.boolean(), nenekDariAyah: fc.boolean(), anakLk: antara(3), anakPr: antara(3), cucuLk: antara(2), cucuPr: antara(2),
  saudaraKandung: antara(3), saudariKandung: antara(3), saudaraSebapak: antara(2), saudariSebapak: antara(2),
  saudaraSeibu: antara(2), saudariSeibu: antara(2), pamanKandung: antara(1),
});

/** Kerangka tetap: kakek K + nenek NA → ayah A; nenek NI → ibu I; A + I → pewaris PW. Yang "tidak ada" = penghubung wafat. */
export function susunGraf(s: Susunan): GrafKeluarga {
  const orang: Record<string, Orang> = {};
  const pernikahan: Pernikahan[] = [];
  const penghubung = { statusHidup: 'wafat' as const, penghubung: true };
  const tambah = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}) => { orang[id] = p(id, jenisKelamin, lain); };
  const banyak = (awalan: string, jumlah: number, jenisKelamin: 'L' | 'P', lain: Partial<Orang>) => {
    for (let i = 0; i < jumlah; i++) tambah(`${awalan}${i}`, jenisKelamin, lain);
  };

  tambah('K', 'L', s.kakek ? {} : penghubung);
  tambah('NA', 'P', s.nenekDariAyah ? {} : penghubung);
  tambah('A', 'L', { ...(s.ayah ? {} : penghubung), idAyah: 'K', idIbu: 'NA' });
  tambah('NI', 'P', s.nenekDariIbu ? {} : penghubung);
  tambah('I', 'P', { ...(s.ibu ? {} : penghubung), idIbu: 'NI' });
  tambah('PW', s.pewarisLk ? 'L' : 'P', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' });

  const jumlahPasangan = s.pewarisLk ? s.pasangan : Math.min(s.pasangan, 1);
  for (let i = 0; i < jumlahPasangan; i++) {
    tambah(`PS${i}`, s.pewarisLk ? 'P' : 'L');
    pernikahan.push(s.pewarisLk ? { idSuami: 'PW', idIstri: `PS${i}`, status: 'utuh' } : { idSuami: `PS${i}`, idIstri: 'PW', status: 'utuh' });
  }
  const dariPewaris: Partial<Orang> = s.pewarisLk ? { idAyah: 'PW' } : { idIbu: 'PW' };
  banyak('AL', s.anakLk, 'L', dariPewaris);
  banyak('AP', s.anakPr, 'P', dariPewaris);
  tambah('AW', 'L', { ...penghubung, ...dariPewaris });          // anak lk wafat, jalur cucu
  banyak('CL', s.cucuLk, 'L', { idAyah: 'AW' });
  banyak('CP', s.cucuPr, 'P', { idAyah: 'AW' });
  banyak('SK', s.saudaraKandung, 'L', { idAyah: 'A', idIbu: 'I' });
  banyak('SKP', s.saudariKandung, 'P', { idAyah: 'A', idIbu: 'I' });
  tambah('IT', 'P', penghubung);                                   // ibu tiri, jalur saudara sebapak
  banyak('SB', s.saudaraSebapak, 'L', { idAyah: 'A', idIbu: 'IT' });
  banyak('SBP', s.saudariSebapak, 'P', { idAyah: 'A', idIbu: 'IT' });
  tambah('AT', 'L', penghubung);                                   // ayah tiri, jalur saudara seibu
  banyak('SI', s.saudaraSeibu, 'L', { idAyah: 'AT', idIbu: 'I' });
  banyak('SIP', s.saudariSeibu, 'P', { idAyah: 'AT', idIbu: 'I' });
  banyak('PM', s.pamanKandung, 'L', { idAyah: 'K', idIbu: 'NA' });
  return { idPewaris: 'PW', orang, pernikahan };
}

const AUL_SAH: Record<string, bigint[]> = { 6: [7n, 8n, 9n, 10n], 12: [13n, 15n, 17n], 24: [27n] };   // [R09-4]

export function periksaInvarian(graf: GrafKeluarga, hasil: HasilEngine): void {
  if (hasil.status !== 'OK') return;
  const { totalKolom, baris } = hasil.tabel;
  const penyebut = totalKolom.tashih ?? totalKolom.radd ?? totalKolom.aul ?? totalKolom.ashl;
  if (penyebut === undefined) throw new Error('tabel tanpa penyebut');
  const semuaSaham = baris.flatMap(barisIni => Object.values(barisIni.perOrang).map(sel => sel.saham));
  expect(semuaSaham.every(saham => saham >= 0n)).toBe(true);
  expect(semuaSaham.reduce((a, b) => a + b, 0n) + (hasil.sisaKeluar?.saham ?? 0n)).toBe(penyebut);
  for (const langkah of hasil.jejak) {
    if (langkah.jenis === 'AUL') expect(AUL_SAH[String(langkah.dari)]).toContain(langkah.menjadi);
  }
  for (const barisIni of baris) {
    if (!barisIni.ashabah) continue;
    const perJenis = { L: new Set<bigint>(), P: new Set<bigint>() };
    // Saham 0 = ma'dud di mu'addah (R08-4): dihitung untuk kakek, tidak menerima; dikecualikan dari 2:1.
    for (const [id, sel] of Object.entries(barisIni.perOrang)) if (sel.saham > 0n) perJenis[graf.orang[id]!.jenisKelamin].add(sel.saham);
    expect(perJenis.L.size, `anggota lk ${barisIni.kelompok} berbeda saham`).toBeLessThanOrEqual(1);
    expect(perJenis.P.size, `anggota pr ${barisIni.kelompok} berbeda saham`).toBeLessThanOrEqual(1);
    const [lk] = perJenis.L; const [pr] = perJenis.P;
    if (lk !== undefined && pr !== undefined) expect(lk, `2:1 di ${barisIni.kelompok}`).toBe(2n * pr);
  }
}

const BANYAK_PERCOBAAN = 500;

export function jalankanProperty(ruleset: Ruleset): void {
  let banyakOk = 0;
  fc.assert(fc.property(arbSusunan, susunan => {
    const graf = susunGraf(susunan);
    const hasil = hitung({ ...input(graf), ruleset });
    expect(['OK', 'TIDAK_DIDUKUNG', 'PERLU_INPUT']).toContain(hasil.status);
    if (hasil.status === 'OK') banyakOk++;
    periksaInvarian(graf, hasil);
  }), { numRuns: BANYAK_PERCOBAAN });
  // Tanpa ini, generator yang selalu memicu PERLU_INPUT membuat property lulus tanpa memeriksa apa pun.
  // Untuk [SYF] harus mayoritas OK; ruleset lain boleh lebih rendah karena gerbang 18.4.
  if (ruleset === 'syafii') expect(banyakOk).toBeGreaterThan(BANYAK_PERCOBAAN / 2);
}

describe('Invarian pipeline — susunan acak', () => {
  test('[SYF]', () => jalankanProperty('syafii'));
  test.each(['hanbali', 'hanafi', 'maliki'] as const)('[%s]', ruleset => jalankanProperty(ruleset));
});
