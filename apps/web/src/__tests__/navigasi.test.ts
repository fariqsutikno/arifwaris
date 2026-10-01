import { expect, it } from 'vitest';
import { posisiAwal, posisiBerikut, posisiSebelum, type Posisi } from '../layar/wizard/navigasi';

const p = (langkah: number, babak = 0, bagian: Posisi['bagian'] = 'daftar'): Posisi => ({ langkah, babak, bagian });

it('kasus biasa: tiga langkah pertama berurutan, Keluarga = daftar lalu keadaan, lalu Periksa dan hasil', () => {
  expect(posisiBerikut(p(1), 1)).toEqual(p(2));
  expect(posisiBerikut(p(2), 1)).toEqual(p(3));
  expect(posisiBerikut(p(3), 1)).toEqual(p(3, 0, 'keadaan'));
  expect(posisiBerikut(p(3, 0, 'keadaan'), 1)).toEqual(p(4));
  expect(posisiBerikut(p(4), 1)).toBe('hasil');
});

it('beberapa babak: tiap babak daftar → keadaan, baru babak berikutnya', () => {
  expect(posisiBerikut(p(3, 0, 'keadaan'), 3)).toEqual(p(3, 1, 'daftar'));
  expect(posisiBerikut(p(3, 1, 'keadaan'), 3)).toEqual(p(3, 2, 'daftar'));
  expect(posisiBerikut(p(3, 2, 'keadaan'), 3)).toEqual(p(4));
});

it('mundur: kebalikan maju, dari Periksa mendarat di keadaan babak terakhir, dari langkah 1 ke awal', () => {
  expect(posisiSebelum(p(1), 1)).toBe('awal');
  expect(posisiSebelum(p(2), 1)).toEqual(p(1));
  expect(posisiSebelum(p(3), 1)).toEqual(p(2));
  expect(posisiSebelum(p(3, 0, 'keadaan'), 1)).toEqual(p(3));
  expect(posisiSebelum(p(3, 1, 'daftar'), 3)).toEqual(p(3, 0, 'keadaan'));
  expect(posisiSebelum(p(4), 3)).toEqual(p(3, 2, 'keadaan'));
});

it('maju lalu mundur selalu kembali ke posisi semula', () => {
  for (const jumlah of [1, 2, 4]) {
    let kini: Posisi = posisiAwal(1);
    const jejak: Posisi[] = [kini];
    for (let langkah = 0; langkah < 20; langkah++) {
      const berikut = posisiBerikut(kini, jumlah);
      if (berikut === 'hasil') break;
      kini = berikut;
      jejak.push(kini);
    }
    for (let indeks = jejak.length - 1; indeks > 0; indeks--) expect(posisiSebelum(jejak[indeks]!, jumlah)).toEqual(jejak[indeks - 1]);
  }
});
