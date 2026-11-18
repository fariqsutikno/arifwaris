// Linimasa Langkah demi langkah: urutan tahap, kotak wakil, dan tabel bertahap harus sama dengan tabel engine (kasus bab 16).
import { hitung, type InputEngine } from '@waris/engine';
import { describe, expect, it } from 'vitest';
import { BAB16_FIXTURES, case01, case02, caseNominal } from '../../../engine/src/__tests__/fixtures/bab16.js';
import { kotakWakil, susunLinimasa, type Linimasa } from '../linimasa.js';
import { kamusSnapshot } from './kamus.js';

function linimasaDari(input: InputEngine): { linimasa: Linimasa; hasil: Extract<ReturnType<typeof hitung>, { status: 'OK' }> } {
  const hasil = hitung(input);
  if (hasil.status !== 'OK') throw new Error(`kasus tidak OK: ${hasil.status}`);
  return { linimasa: susunLinimasa(hasil, input.graf, { kamus: kamusSnapshot }), hasil };
}

const URUTAN = ['harta', 'ahliWaris', 'bagian', 'ashl', 'penyesuaian', 'tashih', 'hasil'];

describe('susunLinimasa', () => {
  it('C16-01: asal 8 → tashih 24; kotak tashih memotong ulang kotak asal', () => {
    const { linimasa } = linimasaDari(case01.input);
    expect(linimasa.tahap.map(tahap => tahap.id)).toEqual(['ahliWaris', 'bagian', 'ashl', 'penyesuaian', 'tashih', 'hasil']);
    const kotak = (id: string) => linimasa.tahap.find(tahap => tahap.id === id)!.langkah[0]!.visual;
    expect(kotak('ashl')).toMatchObject({ jenis: 'kotak', jumlah: 8n, potong: 1n });
    expect(kotak('tashih')).toMatchObject({ jenis: 'kotak', jumlah: 8n, potong: 3n });
    expect(linimasa.tabel.map(kolom => kolom.kolom)).toEqual(['bagian', 'ashl', 'tashih', 'nominal']);
  });

  it('C16-02: tanpa tashih, tidak ada tahap tashih dan kolomnya', () => {
    const { linimasa } = linimasaDari(case02.input);
    expect(linimasa.tahap.some(tahap => tahap.id === 'tashih')).toBe(false);
    expect(linimasa.tabel.some(kolom => kolom.kolom === 'tashih')).toBe(false);
  });

  it('harta dengan potongan: visual hitungan kotor − potongan = bersih', () => {
    const { linimasa } = linimasaDari(caseNominal.input);
    const harta = linimasa.tahap[0]!;
    expect(harta.id).toBe('harta');
    expect(harta.langkah[0]!.visual).toEqual({ jenis: 'harta', baris: [
      { kode: 'kotor', nilai: 150_000_000n }, { kode: 'tajhiz', nilai: 5_000_000n }, { kode: 'hutang', nilai: 25_000_000n },
      { kode: 'wasiat', nilai: 40_000_000n }, { kode: 'bersih', nilai: 80_000_000n },
    ] });
  });

  it('semua kasus bab 16 OK: urutan tetap, Σ isi kotak = jumlah × potong, tabel terisi penuh sesuai tabel engine', () => {
    for (const fixture of BAB16_FIXTURES) {
      const hasil = hitung(fixture.input);
      if (hasil.status !== 'OK' || hasil.tabel.baris.length === 0) continue;
      const linimasa = susunLinimasa(hasil, fixture.input.graf, { kamus: kamusSnapshot });
      const urutan = linimasa.tahap.map(tahap => URUTAN.indexOf(tahap.id));
      expect(urutan, fixture.id).toEqual([...urutan].sort((a, b) => a - b));
      // 'Aul/radd: isi asal masalah memang melebihi/kurang dari kotaknya; bingkainya digambar di PR berikutnya (rencana 5.2).
      const adaPenyesuaian = hasil.tabel.totalKolom.aul !== undefined || hasil.tabel.totalKolom.radd !== undefined;
      for (const tahap of linimasa.tahap) for (const langkah of tahap.langkah) {
        if (langkah.visual?.jenis !== 'kotak' || (adaPenyesuaian && tahap.id === 'ashl')) continue;
        const jumlahIsi = langkah.visual.isi.reduce((total, isi) => total + isi.jumlah, 0n);
        expect(jumlahIsi, fixture.id).toBe(langkah.visual.jumlah * langkah.visual.potong);
      }
      const terisi = new Set(linimasa.tahap.flatMap(tahap => tahap.langkah.flatMap(langkah => langkah.sel ?? [])));
      const penerima = hasil.tabel.baris.flatMap(baris => baris.anggota);
      for (const { kolom } of linimasa.tabel) {
        for (const id of penerima) expect(terisi.has(`${kolom}:${id}`), `${fixture.id} ${kolom}:${id}`).toBe(true);
      }
    }
  });
});

describe('kotakWakil', () => {
  it('≤ 24 digambar apa adanya; lebih besar = kotak yang dibelah', () => {
    expect(kotakWakil(24n)).toEqual({ jumlah: 24n, potong: 1n });
    expect(kotakWakil(72n)).toEqual({ jumlah: 24n, potong: 3n });
    expect(kotakWakil(288n)).toEqual({ jumlah: 24n, potong: 12n });
  });
});
