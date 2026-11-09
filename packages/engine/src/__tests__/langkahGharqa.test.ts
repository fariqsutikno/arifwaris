import { describe, expect, test } from 'vitest';
import { ekspansiSkenario, metodeGharqa } from '../langkahGharqa.js';

describe('langkahGharqa', () => {
  test('metodeGharqa mengikuti 13d.2', () => {
    expect(metodeGharqa('syafii', 'serentak')).toEqual({ metode: 'terpisah', rujukan: 'R13-10' });
    expect(metodeGharqa('hanbali', 'serentak')).toEqual({ metode: 'terpisah', rujukan: 'R13-10' });
    expect(metodeGharqa('hanbali', 'tidakDiketahui')).toEqual({ metode: 'tilad' });
    expect(metodeGharqa('syafii', 'terlupakan')).toEqual({ metode: 'skenario' });
    expect(metodeGharqa('hanafi', 'terlupakan')).toEqual({ metode: 'terpisah', rujukan: 'K13d-1' });
  });

  test('ekspansiSkenario hanya memecah kelompok terlupakan [SYF]', () => {
    const kelompok = { anggota: ['B', 'C'], keadaan: 'terlupakan' as const };
    expect(ekspansiSkenario(['X', kelompok], 'syafii')).toEqual([['X', 'B', 'C'], ['X', 'C', 'B']]);
    expect(ekspansiSkenario(['X', kelompok], 'hanbali')).toEqual([['X', kelompok]]);
  });
});
