import { describe, expect, test } from 'vitest';
import kasus from './xp-kasus.json';
import { xpSoal, type KejadianXp } from '../index.js';

interface KasusXp { nama: string; bobot: number; xp: number; kejadian: Array<{ aksi: KejadianXp['aksi']; mode: KejadianXp['mode']; benar?: boolean; kolomBenar?: number; kolomTotal?: number }> }

// Berkas yang sama menjadi uji pgTAP (scripts/xp-kasus-ke-sql.ts), jadi TS dan SQL tidak bisa menyimpang diam-diam.
describe('xpSoal (spec 3.1)', () => {
  test.each(kasus as KasusXp[])('$nama', ({ bobot, xp, kejadian }) => {
    const urut: KejadianXp[] = kejadian.map(k => ({ aksi: k.aksi, mode: k.mode, benarSemua: k.kolomTotal === undefined ? k.benar ?? null : k.kolomBenar === k.kolomTotal,
      ...(k.kolomTotal === undefined ? {} : { kolomBenar: k.kolomBenar!, kolomTotal: k.kolomTotal }) }));
    expect(xpSoal(urut, bobot)).toBe(xp);
  });
});
