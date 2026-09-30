import { describe, expect, test } from 'vitest';
import { hitungMunasakhat } from '../munasakhat.js';
import type { GrafKeluarga, InputMunasakhat, HasilMunasakhat } from '../types.js';
import { input, p } from './fixtures/bab16.js';
import { M2, MUNASAKHAT_FIXTURES, SISA_KELUAR_MAYIT_KEDUA } from './fixtures/munasakhat.js';

type Ok = Extract<HasilMunasakhat, { status: 'OK' }>;

function ok(input: InputMunasakhat): Ok {
  const hasil = hitungMunasakhat(input);
  if (hasil.status !== 'OK') throw new Error(`${hasil.status}: ${JSON.stringify(hasil)}`);
  return hasil;
}

/** Saham > 0 dinyatakan sebagai pecahan saham/jamiah yang dinormalisasi, supaya bisa dibandingkan lintas jami'ah. */
function sebagaiPecahan(saham: Record<string, bigint>, jamiah: bigint): Record<string, string> {
  const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));
  return Object.fromEntries(Object.entries(saham).filter(([, s]) => s > 0n).map(([id, s]) => {
    const g = fpb(s, jamiah);
    return [id, `${s / g}/${jamiah / g}`];
  }));
}

describe('Munasakhat bab 12 — kasus uji M1–M9 (bab 16)', () => {
  for (const fixture of MUNASAKHAT_FIXTURES) {
    test(`${fixture.id}: ${fixture.menguji}`, () => {
      const hasil = ok(fixture.input);
      const { expected } = fixture;

      expect(sebagaiPecahan(hasil.saham, hasil.jamiah)).toEqual(sebagaiPecahan(expected.saham, expected.jamiah));
      expect(Object.values(hasil.saham).reduce((a, b) => a + b, 0n), 'Σ saham = jami\'ah').toBe(hasil.jamiah);
      expect(hasil.sisaKeluar).toEqual([]);
      if (expected.jamiahEksak) {
        expect(hasil.jamiah).toBe(expected.jamiah);
        expect(hasil.saham).toEqual(expected.saham);
      }
      expect(hasil.keadaan, 'keadaan').toBe(expected.keadaan);
      if (expected.ikhtishar) expect(hasil.ikhtishar).toEqual(expected.ikhtishar);
      if (expected.hubunganHubungan) {
        const hubunganHubungan = hasil.jejak.flatMap(step => (step.jenis === 'MUNASAKHAT' ? [step.hubungan] : []));
        expect(hubunganHubungan).toEqual(expected.hubunganHubungan);
      }
      expect(hasil.daftarLangkah.map(s => s.mayit)).toEqual([fixture.input.dasar.graf.idPewaris, ...fixture.input.urutanWafat]);
    });
  }
});

describe('Munasakhat — penolakan dan pertanyaan', () => {
  const salinGraf = () => {
    const { graf } = M2.input.dasar;
    return { ...graf, orang: { ...graf.orang }, pernikahan: [...graf.pernikahan] };
  };

  test('yang wafat tanpa bagian dari mayit sebelumnya (mahjub) → diabaikan dengan catatan', () => {
    const graf = salinGraf();
    graf.orang['F1'] = { id: 'F1', jenisKelamin: 'L', statusHidup: 'wafat', agama: 'islam', penghubung: true };
    graf.orang['D'] = { ...graf.orang['D']!, idAyah: 'F1' };
    graf.orang['AK'] = { id: 'AK', jenisKelamin: 'L', statusHidup: 'hidup', agama: 'islam', idAyah: 'F1' };
    const hasil = ok({ ...M2.input, dasar: { ...M2.input.dasar, graf }, urutanWafat: ['AK', 'B'] });
    expect(hasil.jejak).toContainEqual({ tahap: 'munasakhat', refs: ['R12-1'], jenis: 'MUNASAKHAT_DILEWATI', mayit: 'AK' });
    expect(hasil.daftarLangkah.map(s => s.mayit)).toEqual(['D', 'B']);
    expect(hasil.saham).toEqual({ W: 16n, S: 56n });
  });

  test('mayit di urutan wafat yang tidak ada di graf → error, bukan dilewati diam-diam', () => {
    expect(() => hitungMunasakhat({ ...M2.input, urutanWafat: ['XX'] })).toThrow('tidak ada di graf');
  });

  test('data kurang pada mayit berikutnya → PERLU_INPUT dengan mayit-nya', () => {
    const graf = salinGraf();
    graf.orang['HB'] = { id: 'HB', jenisKelamin: 'L', statusHidup: 'hidup', agama: 'tidakDiketahui' };
    graf.pernikahan.push({ idSuami: 'HB', idIstri: 'B', status: 'utuh' });
    const hasil = hitungMunasakhat({ ...M2.input, dasar: { ...M2.input.dasar, graf } });
    expect(hasil).toMatchObject({ status: 'PERLU_INPUT', mayit: 'B', pertanyaan: [{ idOrang: 'HB', isian: 'agama' }] });
  });
});

describe('Munasakhat — nominal', () => {
  test('hanya harta mayit pertama yang dibagi, menurut jami\'ah (bab 12.5)', () => {
    const hasil = ok({ ...M2.input, dasar: { ...M2.input.dasar, tirkah: { kotor: 72_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } } });
    expect(hasil.nominal).toEqual({ W: 16_000_000n, S: 56_000_000n });
    expect(hasil.pembulatan.sisaPembulatan).toBe(0n);
  });
});

describe('Munasakhat — sisa harta mayit berikutnya keluar ke dzawil arham/baitul mal', () => {
  test('sisa jadi baris tersendiri di jami\'ah, bukan ditolak', () => {
    const kasus = SISA_KELUAR_MAYIT_KEDUA;
    const hasil = ok({ ...kasus, dasar: { ...kasus.dasar, tirkah: { kotor: 16_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } } });
    expect(hasil.jamiah).toBe(16n);
    expect(hasil.saham).toEqual({ S: 12n, W2: 1n });
    expect(hasil.sisaKeluar).toEqual([{ mayit: 'H', tujuan: 'baitulMal', saham: 3n, nominal: 3_000_000n }]);
    expect(hasil.nominal).toEqual({ S: 12_000_000n, W2: 1_000_000n });
  });
});

// 02.3: nikah hanya sebab waris antara dua pasangan, dinilai saat salah satunya wafat. Satu status statis
// (status saat pasangan pertama wafat) sudah cukup untuk seluruh rantai; tidak perlu nikah/talak berwaktu.
describe('Munasakhat — pernikahan dalam rantai', () => {
  // A wafat meninggalkan istri W dan anak S. W lalu menikah dengan B, kemudian W wafat.
  const graf: GrafKeluarga = {
    idPewaris: 'A',
    orang: { A: p('A', 'L', { statusHidup: 'wafat' }), W: p('W', 'P'), S: p('S', 'L', { idAyah: 'A', idIbu: 'W' }), B: p('B', 'L') },
    pernikahan: [{ idSuami: 'A', idIstri: 'W', status: 'utuh' }, { idSuami: 'B', idIstri: 'W', status: 'utuh' }],
  };

  test('janda yang menikah lagi: suami barunya mewarisi bagiannya, pernikahan lama tidak ganda', () => {
    const hasil = ok({ dasar: input(graf), urutanWafat: ['W'] });
    // A: istri 1/8, anak 7/8. W: suami B 1/4 (ada anak), anak S sisa 3/4 → B = 1/32, S = 31/32.
    expect(sebagaiPecahan(hasil.saham, hasil.jamiah)).toEqual({ B: '1/32', S: '31/32' });
  });
});
