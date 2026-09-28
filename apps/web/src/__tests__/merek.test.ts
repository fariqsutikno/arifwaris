import { expect, test, vi } from 'vitest';

test('mode samaran mengganti merek tapi tidak nama orang', async () => {
  vi.stubEnv('VITE_SAMARKAN_MEREK', '1');
  vi.resetModules();
  const { samarkanMerek } = await import('../terjemah');
  expect(samarkanMerek('Tentang ARIF · Coba di ArifLab · Arif Waris · Ustaz Arif Husnul Khuluq'))
    .toBe('Tentang Kalkulator Waris · Coba di Lab Hitung · Kalkulator Waris · Ustaz Arif Husnul Khuluq');
  vi.unstubAllEnvs();
});
