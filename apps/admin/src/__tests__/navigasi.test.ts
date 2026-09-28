import { expect, test } from 'vitest';
import { JENIS_KONTEN } from '@waris/content';
import { LABEL_ISI, MENU_PORTAL, menuDari, menuUntukJenis } from '../navigasi';

test('tiap jenis konten + diksi + layar muncul tepat sekali di MENU_PORTAL', () => {
  const semua = MENU_PORTAL.flatMap(menu => menu.isi);
  expect([...semua].sort()).toEqual([...JENIS_KONTEN.filter(jenis => jenis !== 'teks_edukasi'), 'teks', 'layar'].sort());
});
test('semua isi punya label manusiawi', () => {
  for (const isi of [...JENIS_KONTEN, 'teks', 'layar'] as const) expect(LABEL_ISI[isi]).toMatch(/^[A-Z]/);
});
test('menuUntukJenis & menuDari', () => {
  expect(menuUntukJenis('modul').kunci).toBe('materi');
  expect(menuUntukJenis('teks').kunci).toBe('aplikasi');
  expect(menuUntukJenis('teks_edukasi').kunci).toBe('aplikasi');
  expect(menuDari('pustaka')?.isi).toEqual(['kitab', 'syahid']);
  expect(menuDari('bukan')).toBeUndefined();
});
