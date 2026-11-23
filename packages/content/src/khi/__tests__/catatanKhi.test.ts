/// <reference path="../../raw.d.ts" />
// Tes data catatan KHI: tiap catatan harus bisa dilacak ke sumber berkode, tanpa kode teknis di teks tampil,
// tanpa angka hasil hitung, dan tanpa arahan fikih karangan (jalan keluar hanya yang terverifikasi di KB).
import { describe, expect, test } from 'vitest';
import daftarSumberMd from '../../../../../docs/kb-khi/02_daftar_sumber.md?raw';
import bab19 from '../../../../../docs/kb/19_harta_pasangan.md?raw';
import { RUJUKAN, MATRIKS_KHILAF } from '../../refs.js';
import { CATATAN_KHI, ID_CATATAN_KHI, JALAN_KELUAR, NAMA_SUMBER_KHI, cariCatatanKhi, teksTampil } from '../catatanKhi.js';
import { ID_CATATAN_KHI as ID_PEMICU_ENGINE } from '../../../../engine/src/khi/pilihCatatanKhi.js';

const kodeKb = new Set([
  ...RUJUKAN.map(rujukan => rujukan.kode),
  ...MATRIKS_KHILAF.map(titik => titik.kode),
  ...[...bab19.matchAll(/^\| (R19-\d+) \|/gm)].map(cocok => cocok[1]!),
]);

const POLA_KODE_TEKNIS = /\bKHI-\d|\bR\d{2}-\d|\bK\d{2}[a-d]?-\d|\bPA-|\bS\d{2}\b|\bF\d{2}\b|shamela:|\[(SYF|HNB|HNF|MLK)\]/;

describe('catatan KHI', () => {
  test('sebelas catatan, id unik dan lengkap', () => {
    expect(CATATAN_KHI.map(catatan => catatan.id).sort()).toEqual([...ID_CATATAN_KHI].sort());
    expect(new Set(CATATAN_KHI.map(catatan => catatan.id)).size).toBe(CATATAN_KHI.length);
    expect(CATATAN_KHI).toHaveLength(11);
  });

  test('id catatan sama persis (dan urutannya) dengan id pemicu di engine', () => {
    expect([...ID_CATATAN_KHI]).toEqual([...ID_PEMICU_ENGINE]);
  });

  test('semua catatan ditandai hukum positif', () => {
    for (const catatan of CATATAN_KHI) expect(catatan.hukumPositif).toBe(true);
  });

  test('setiap sumber berkode ada di daftar sumber dan tiap catatan punya sumber', () => {
    for (const catatan of CATATAN_KHI) {
      expect(catatan.sumber.length, catatan.id).toBeGreaterThan(0);
      for (const sumber of catatan.sumber) {
        expect(sumber.kode, catatan.id).toMatch(/^[SFH]\d{2}$/);
        expect(daftarSumberMd, `${catatan.id}: ${sumber.kode}`).toContain(`| ${sumber.kode} |`);
        expect(sumber.lokasi.length, `${catatan.id}: ${sumber.kode}`).toBeGreaterThan(0);
      }
    }
  });

  test('setiap kode sumber yang dipakai punya nama tampil tanpa kode teknis', () => {
    for (const catatan of CATATAN_KHI) {
      for (const sumber of catatan.sumber) {
        const butir = NAMA_SUMBER_KHI[sumber.kode];
        expect(butir, `${catatan.id}: ${sumber.kode}`).toBeDefined();
        expect(butir!.nama, sumber.kode).not.toMatch(POLA_KODE_TEKNIS);
        expect(sumber.lokasi, `${catatan.id}: ${sumber.kode}`).not.toMatch(POLA_KODE_TEKNIS);
        expect(butir!.hukumPositif, `${catatan.id}: ${sumber.kode}`).toBe(sumber.kode.startsWith('S'));
      }
    }
  });

  test('bunyi KHI atau praktik PA bersumber dari KHI (S01) atau pedoman/SEMA (S05, S06, S07)', () => {
    for (const catatan of CATATAN_KHI) {
      const kode = catatan.sumber.map(sumber => sumber.kode);
      expect(kode.some(k => ['S01', 'S05', 'S06', 'S07'].includes(k)), catatan.id).toBe(true);
    }
  });

  test('rujukan fikih menunjuk kode yang ada di KB; fikih Syafi\'i selalu ada', () => {
    for (const catatan of CATATAN_KHI) {
      expect(catatan.fikih.syafii.length, catatan.id).toBeGreaterThan(0);
      for (const kode of catatan.rujukanFikih) expect(kodeKb.has(kode), `${catatan.id}: ${kode}`).toBe(true);
    }
  });

  test('teks tampil tanpa kode teknis dan tanpa angka hasil hitung', () => {
    for (const catatan of CATATAN_KHI) {
      for (const teks of teksTampil(catatan)) {
        expect(teks, `${catatan.id}: ${teks}`).not.toMatch(POLA_KODE_TEKNIS);
        expect(teks, `${catatan.id}: ${teks}`).not.toMatch(/%|\bRp\b/);
      }
    }
  });

  test('jalan keluar hanya dari daftar terverifikasi dan rujukannya ada di KB', () => {
    for (const [id, jalan] of Object.entries(JALAN_KELUAR)) {
      for (const kode of jalan.rujukanKb) expect(kodeKb.has(kode), `${id}: ${kode}`).toBe(true);
    }
    for (const catatan of CATATAN_KHI) {
      for (const jalan of catatan.jalanKeluar) expect(Object.keys(JALAN_KELUAR), catatan.id).toContain(jalan);
    }
  });

  test('padanan sebagian wajib mencantumkan yang belum tersedia; padanan ada tidak boleh', () => {
    for (const catatan of CATATAN_KHI) {
      if (catatan.padananFikih === 'ada') expect(catatan.belumTersedia, catatan.id).toEqual([]);
      else expect(catatan.belumTersedia.length, catatan.id).toBeGreaterThan(0);
    }
  });

  test('praktik PA: ada pegangan bila ada praktik; sumber bertentangan hanya satu yang jadi pegangan (pengganti)', () => {
    for (const catatan of CATATAN_KHI) {
      if (catatan.praktikPa.length > 0) expect(catatan.praktikPa.some(butir => butir.peran === 'pegangan'), catatan.id).toBe(true);
    }
    const pengganti = cariCatatanKhi('pengganti');
    expect(pengganti.praktikPa.some(butir => butir.peran === 'catatan' && /pedoman/i.test(butir.teks))).toBe(true);
  });

  test('catatan tanpa padanan penuh tidak memuat jalan keluar yang tak terverifikasi', () => {
    for (const catatan of CATATAN_KHI) {
      if (catatan.padananFikih !== 'ada') {
        for (const jalan of catatan.jalanKeluar) expect(JALAN_KELUAR[jalan].terverifikasi, `${catatan.id}: ${jalan}`).toBe(true);
      }
    }
  });
});
