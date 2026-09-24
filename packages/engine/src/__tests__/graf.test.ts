import { describe, expect, test } from 'vitest';
import { addRelative, canChangeSex, relationOptions } from '../graf.js';
import { deriveRoles } from '../stages/derivasi.js';
import { validateInput } from '../stages/validasi.js';
import type { FamilyGraph, HeirKey } from '../types.js';
import { BAB16_FIXTURES, input, p } from './fixtures/bab16.js';

const single = (sex: 'M' | 'F'): FamilyGraph => ({ deceasedId: 'D', persons: { D: p('D', sex, { life: 'dead' }) }, marriages: [] });

describe('opsi relasi mengikuti jenis kelamin', () => {
  test('laki-laki hanya ditawari istri, perempuan hanya suami', () => {
    expect(relationOptions(single('M'), 'D')).toEqual(['ayah', 'ibu', 'anakLaki', 'anakPerempuan', 'istri']);
    expect(relationOptions(single('F'), 'D')).toEqual(['ayah', 'ibu', 'anakLaki', 'anakPerempuan', 'suami']);
  });

  test('ayah/ibu hanya sekali; suami maksimal 1, istri maksimal 4', () => {
    let g = addRelative(single('F'), 'D', 'ayah', { id: 'F1' });
    g = addRelative(g, 'D', 'suami', { id: 'H1' });
    expect(relationOptions(g, 'D')).toEqual(['ibu', 'anakLaki', 'anakPerempuan']);

    let m = single('M');
    for (const id of ['W1', 'W2', 'W3', 'W4']) m = addRelative(m, 'D', 'istri', { id });
    expect(relationOptions(m, 'D')).not.toContain('istri');
  });

  test('relasi yang tidak ditawarkan ditolak', () => {
    expect(() => addRelative(single('M'), 'D', 'suami', { id: 'X' })).toThrow(/suami/);
  });
});

describe('addRelative: jenis kelamin dan peran selalu konsisten', () => {
  test('jenis kelamin otomatis dari relasi; anak dihubungkan sesuai jenis kelamin orang tua', () => {
    let g = addRelative(single('F'), 'D', 'suami', { id: 'H1' });
    g = addRelative(g, 'D', 'anakPerempuan', { id: 'B1' }, { otherParentId: 'H1' });
    g = addRelative(g, 'D', 'ibu', { id: 'M1' });
    expect(g.persons['H1']).toMatchObject({ sex: 'M' });
    expect(g.persons['B1']).toMatchObject({ sex: 'F', motherId: 'D', fatherId: 'H1' });
    expect(g.persons['D']).toMatchObject({ motherId: 'M1' });
    expect(g.marriages).toEqual([{ husbandId: 'H1', wifeId: 'D', status: 'intact' }]);
    expect(validateInput(input(g), deriveRoles(g, input(g).config).roles)).toEqual([]);
  });

  test('orang tua kedua harus pasangannya', () => {
    expect(() => addRelative(single('M'), 'D', 'anakLaki', { id: 'S1' }, { otherParentId: 'X' })).toThrow(/pasangan/);
  });

  test('jenis kelamin tidak bisa diubah bila sudah punya peran bergender', () => {
    const g = addRelative(addRelative(single('M'), 'D', 'istri', { id: 'W1' }), 'D', 'anakLaki', { id: 'S1' });
    expect(canChangeSex(g, 'D')).toBe(false);   // suami dan ayah
    expect(canChangeSex(g, 'W1')).toBe(false);  // istri
    expect(canChangeSex(g, 'S1')).toBe(true);   // belum punya peran bergender
  });
});

describe('tidak ada salah gender pada peran hasil derivasi', () => {
  const MALE: HeirKey[] = ['IBN', 'IBN_IBN', 'AB', 'JADD', 'AKH_SYQ', 'AKH_AB', 'AKH_UMM', 'IBN_AKH_SYQ', 'IBN_AKH_AB',
    'AMM_SYQ', 'AMM_AB', 'IBN_AMM_SYQ', 'IBN_AMM_AB', 'ZAWJ', 'MUTIQ'];

  test.each(BAB16_FIXTURES.map(f => [f.id, f] as const))('%s', (_id, fixture) => {
    const { graph, config } = fixture.input;
    for (const role of Object.values(deriveRoles(graph, config).roles)) {
      if (role.key === 'NON_HEIR' || role.key === 'DZAWIL_ARHAM') continue;
      expect(graph.persons[role.personId]!.sex, `${role.personId} ${role.key}`).toBe(MALE.includes(role.key) ? 'M' : 'F');
    }
  });
});
