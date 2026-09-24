import { expect, it } from 'vitest';
import { bacaInputUang, formatRupiah, teksPecahan } from '../format';

it('format rupiah bigint besar tanpa kehilangan presisi', () => {
  expect(formatRupiah(123456789012345678901n)).toBe('Rp 123.456.789.012.345.678.901');
});
it('baca input uang: titik ribuan boleh, selain digit ditolak', () => {
  expect(bacaInputUang('1.500.000')).toBe(1500000n);
  expect(bacaInputUang('')).toBe(0n);
  expect(bacaInputUang('12a')).toBeNull();
  expect(bacaInputUang('-5')).toBeNull();
});
it('teks pecahan', () => {
  expect(teksPecahan({ n: 1n, d: 8n })).toBe('1/8');
});
