import { describe, expect, it } from 'vitest';
import { bacaSkor, capaianKuis, persenBulat, predikatDari, skorTerbaik, targetBerikut } from '../skorKuis';

describe('skor kuis', () => {
  it('membaca "benar/total" dan menolak yang rusak', () => {
    expect(bacaSkor('8/10')).toEqual({ benar: 8, total: 10 });
    for (const rusak of ['', '8', '8/0', '11/10', 'a/b', '-1/5']) expect(bacaSkor(rusak)).toBeNull();
  });

  it('persen dibulatkan ke bawah: 17/19 = 89% belum Sangat baik', () => {
    expect(persenBulat({ benar: 17, total: 19 })).toBe(89);
    expect(predikatDari(89)).toBe('baik');
    expect(predikatDari(90)).toBe('sangat_baik');
  });

  it.each([[0, 'perlu_diulang'], [49, 'perlu_diulang'], [50, 'cukup'], [69, 'cukup'], [70, 'baik'], [100, 'sangat_baik']] as const)(
    '%i%% → %s', (persen, predikat) => expect(predikatDari(persen)).toBe(predikat));

  it('target berikut: naik satu tingkat, kosong di puncak', () => {
    expect(targetBerikut(57)).toEqual({ predikat: 'baik', dari: 70 });
    expect(targetBerikut(0)).toEqual({ predikat: 'cukup', dari: 50 });
    expect(targetBerikut(90)).toBeNull();
  });

  it('skor terbaik tidak turun; skor rusak kalah', () => {
    expect(skorTerbaik('8/10', '5/10')).toBe('8/10');
    expect(skorTerbaik('5/10', '8/10')).toBe('8/10');
    expect(skorTerbaik('1/2', '5/10')).toBe('1/2');
    expect(skorTerbaik('8/10', 'rusak')).toBe('8/10');
    expect(skorTerbaik(undefined, '3/5')).toBe('3/5');
  });

  it('capaian: percobaan pertama = terbaik baru dengan predikat; mengulang lebih buruk = tidak', () => {
    expect(capaianKuis(undefined, '8/10')).toMatchObject({ terbaikBaru: true, persenTerbaik: 80, persenSebelumnya: null, predikatNaik: 'baik' });
    expect(capaianKuis('8/10', '5/10')).toMatchObject({ terbaikBaru: false, persenTerbaik: 80, predikatNaik: null });
    expect(capaianKuis('5/10', '7/10')).toMatchObject({ terbaikBaru: true, persenSebelumnya: 50, predikatNaik: 'baik' });
    expect(capaianKuis('7/10', '8/10')).toMatchObject({ terbaikBaru: true, predikatNaik: null });
    expect(capaianKuis('8/10', '8/10')).toMatchObject({ terbaikBaru: false });
  });
});
