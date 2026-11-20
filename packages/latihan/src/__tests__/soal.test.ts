import { describe, expect, test } from 'vitest';
import type { KasusSoal } from '@waris/content';
import { bacaIdSoal, GalatKasus, jalankan, kasusBaru, kasusDariSoal, keJson, muatSoal, tambahAhliWaris, tulisIdSoal } from '../index.js';

const lama: KasusSoal = { pewaris: 'L', ahliWaris: ['ISTRI', 'ANAK_LK', 'ANAK_PR'], harta: 24_000_000n, harapan: { saham: {}, ashlAkhir: 24n } };

/** Berkas versi 4 dengan urutan wafat: bentuk yang tidak bisa dinyatakan ContohKasus (munasakhat). */
function berkasMunasakhat(): KasusSoal {
  let kasus = kasusBaru('L', 'latihan');
  kasus = { ...kasus, graf: ['ISTRI', 'ANAK_LK', 'ANAK_PR'].reduce((graf, kunci) => tambahAhliWaris(graf, kasus.graf.idPewaris, kunci as 'ISTRI'), kasus.graf) };
  const idAnak = Object.values(kasus.graf.orang).find(orang => orang.jenisKelamin === 'L' && orang.id !== kasus.graf.idPewaris)!.id;
  const graf = tambahAhliWaris(kasus.graf, idAnak, 'ANAK_PR');
  return { bentuk: 'berkas', berkas: JSON.parse(keJson({ ...kasus, graf, urutanWafat: [idAnak], tirkah: { ...kasus.tirkah, kotor: 300_000_000n } })) };
}

describe('kasusDariSoal', () => {
  test('bentuk lama tanpa penanda tetap terbaca', () => {
    const kasus = kasusDariSoal(lama);
    expect(kasus.tirkah.kotor).toBe(24_000_000n);
    expect(jalankan(kasus).jenis).toBe('biasa');
  });

  test('berkas memuat kasus yang tak bisa dinyatakan bentuk lama (urutan wafat → munasakhat)', () => {
    const kasus = kasusDariSoal(berkasMunasakhat());
    expect(kasus.urutanWafat).toHaveLength(1);
    expect(kasus.jenisKasus).toBe('latihan');
    expect(jalankan(kasus).jenis).toBe('munasakhat');
  });

  test('berkas rusak → GalatKasus berkode, bukan kalimat', () => {
    const galat = (() => { try { kasusDariSoal({ bentuk: 'berkas', berkas: { versi: 99 } }); } catch (e) { return e; } })();
    expect(galat).toBeInstanceOf(GalatKasus);
    expect((galat as GalatKasus).kode).toBe('VERSI_TIDAK_DIKENAL');
  });

  test('semua versi berkas lama (1–3) dimigrasi ke 4', () => {
    const dasar = JSON.parse(keJson(kasusBaru('L', 'latihan'))) as Record<string, unknown>;
    for (const versi of [1, 2, 3]) {
      const { jenisKasus: _j, ...tanpaV4 } = dasar;
      expect(kasusDariSoal({ bentuk: 'berkas', berkas: { ...tanpaV4, versi } }).versi).toBe(4);
    }
  });
});

describe('IdSoal', () => {
  test('kurasi dan pola terbaca; tulis membalikkan baca; yang tidak sah → null', () => {
    expect(bacaIdSoal('H-01')).toEqual({ jenis: 'kurasi', slug: 'H-01' });
    expect(bacaIdSoal('aul-radd@2#12345')).toEqual({ jenis: 'pola', slugPola: 'aul-radd', versi: 2, benih: 12345 });
    for (const id of ['H-01', 'aul-radd@2#12345']) expect(tulisIdSoal(bacaIdSoal(id)!)).toBe(id);
    for (const rusak of ['', 'a@b#c', 'a@1', 'a b', '@1#2']) expect(bacaIdSoal(rusak)).toBeNull();
  });
});

describe('muatSoal', () => {
  const cari = { soal: (slug: string) => (slug === 'H-01' ? { kasus: lama, revisiId: 'rev-1' } : slug === 'H-RUSAK' ? { kasus: { bentuk: 'berkas', berkas: {} } as KasusSoal, revisiId: 'rev-2' } : undefined) };
  test('kurasi ada → kasus + revisi', () => {
    expect(muatSoal('H-01', cari)).toMatchObject({ ok: true, revisiId: 'rev-1' });
  });
  test('tidak ada → TIDAK_ADA; pola → TIDAK_DIDUKUNG; berkas rusak → TIDAK_DIDUKUNG', () => {
    expect(muatSoal('H-99', cari)).toEqual({ ok: false, alasan: 'TIDAK_ADA' });
    expect(muatSoal('???', cari)).toEqual({ ok: false, alasan: 'TIDAK_ADA' });
    expect(muatSoal('pola@1#7', cari)).toEqual({ ok: false, alasan: 'TIDAK_DIDUKUNG' });
    expect(muatSoal('H-RUSAK', cari)).toEqual({ ok: false, alasan: 'TIDAK_DIDUKUNG' });
  });
});
