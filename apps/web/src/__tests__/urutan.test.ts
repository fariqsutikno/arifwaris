import { describe, expect, it } from 'vitest';
import { kasusBaru, type Kasus } from '../kasus';
import { jawabSisip, mulaiSisip, pembanding, posisiAkhir, type Sisipan } from '../urutan';

const dengan = (urutanWafat: string[]): Kasus => ({ ...kasusBaru('L'), urutanWafat });
function jumlahPertanyaan(sisipan: Sisipan, targetIndeks: number): { banyak: number; posisi: number } {
  let banyak = 0;
  while (pembanding(sisipan)) {
    const indeksPembanding = sisipan.calon.indexOf(pembanding(sisipan)!);
    sisipan = jawabSisip(sisipan, targetIndeks <= indeksPembanding);
    banyak++;
  }
  return { banyak, posisi: posisiAkhir(sisipan) };
}

describe('urutan berpasangan', () => {
  it('tanpa almarhum lain: tanpa pertanyaan', () => {
    expect(pembanding(mulaiSisip(dengan([]), 'PEWARIS'))).toBeNull();
  });
  it('2 orang = 1 pertanyaan, 3 ≤ 2, 4 ≤ 3, 5 ≤ 3 (lebih hemat dari batas spec 1/3/5)', () => {
    for (const [ada, maks] of [[1, 1], [2, 2], [3, 2], [4, 3]] as const) {
      const calon = Array.from({ length: ada }, (_, i) => `A${i}`);
      for (let target = 0; target <= ada; target++) {
        const { banyak, posisi } = jumlahPertanyaan(mulaiSisip(dengan(calon), 'PEWARIS'), target);
        expect(posisi).toBe(target);
        expect(banyak).toBeLessThanOrEqual(maks);
      }
    }
  });
  it('orang babak Budi hanya dibanding dengan yang wafat sesudah Budi', () => {
    const sisipan = mulaiSisip(dengan(['A', 'BUDI', 'C']), 'BUDI');
    expect(sisipan.calon).toEqual(['C']);
    expect(posisiAkhir(jawabSisip(sisipan, true))).toBe(2);
    expect(posisiAkhir(jawabSisip(sisipan, false))).toBe(3);
  });
});
