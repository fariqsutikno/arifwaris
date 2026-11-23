import { expect, it } from 'vitest';
import { soalDariSumber } from '../Aplikasi';

it('sumber latihan dipetakan ke soal bank soal; selain itu null', () => {
  expect(soalDariSumber({ jenis: 'latihan', kode: 'H-01' })?.kode).toBe('H-01');
  expect(soalDariSumber({ jenis: 'latihan', kode: 'tidak-ada' })).toBeNull();
  expect(soalDariSumber({ jenis: 'sendiri' })).toBeNull();
  expect(soalDariSumber(undefined)).toBeNull();
});
