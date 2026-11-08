import { describe, expect, it } from 'vitest';
import { kasusBaru, type Kasus, type Kelompok } from '../kasus';
import { daftarBagian } from '../kelompok';
import { statusKeluarga } from '../statusKeluarga';
import { keluargaKarto } from './fixtures/kanvas';

/** Menjawab semua bagian yang tampil (dua putaran karena menjawab bisa memunculkan bagian lain). */
function semuaDijawab(awal: Kasus): Kasus {
  let kasus: Kasus = { ...awal, saya: null };
  for (let putaran = 0; putaran < 2; putaran++) {
    const peta: Record<string, Kelompok[]> = {};
    for (const bagian of daftarBagian(kasus)) {
      if (bagian.jenis === 'urutan' || bagian.jenis === 'kamu') continue;
      peta[bagian.milik] = [...(peta[bagian.milik] ?? []), bagian.jenis];
    }
    kasus = { ...kasus, kelompokDijawab: peta };
  }
  return kasus;
}

describe('statusKeluarga (spec kanvas 5.9)', () => {
  it('kasus kosong: masih ada bagian, bagian pertama Pasangan', () => {
    const status = statusKeluarga(kasusBaru('L'));
    expect(status.sisa).toBeGreaterThanOrEqual(1);
    expect(status.pertama?.jenis).toBe('pasangan');
    expect(status.status).toBe(`Keluarga: ${status.sisa} bagian lagi.`);
  });

  it('semua bagian lengkap: sisa 0, tidak ada bagian pertama, status "sudah lengkap"', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const bertahun: Kasus = { ...kasus, waktu: { [sumi]: { wafat: { tahun: 1990, kiraKira: false } }, [budi]: { wafat: { tahun: 1998, kiraKira: false } } } };
    const status = statusKeluarga(semuaDijawab(bertahun));
    expect(status).toMatchObject({ sisa: 0, pertama: null, status: 'Keluarga sudah lengkap.' });
  });
});
