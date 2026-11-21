import { describe, expect, test } from 'vitest';
import type { KasusSoal } from '@waris/content';
import { bacaKiriman, calonJangkar, nilaiKiriman, type Kiriman } from '../index.js';

// Bab 16.1: istri 1/8, anak lk + anak pr ashabah bil ghair; tashih 8 → 24.
const soal = { kasus: { pewaris: 'L', ahliWaris: ['ISTRI', 'ANAK_LK', 'ANAK_PR'], harta: 24_000_000n, harapan: { saham: {}, ashlAkhir: 24n } } as KasusSoal, revisiId: 'r' };
const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const dasar = { id: UUID(1), idSesiSoal: UUID(2), soalId: 'H-01', revisiSoal: UUID(3), mode: 'latihan', aksi: 'buka' };
const baca = (badan: unknown, ukuran = 100) => bacaKiriman(badan, ukuran);
const kode = (hasil: { ok: boolean } & Partial<{ kode: string }>) => (hasil.ok ? 'OK' : hasil.kode);
const kirimanDari = (bagian: Partial<Kiriman>): Kiriman => ({ ...dasar, mode: 'latihan', aksi: 'periksa', isian: null, jangkar: null, dimulaiPada: null, ...bagian } as Kiriman);

// Tabel disusun server; ambil id baris dari hasil buka supaya uji tidak menebak id.
const tabel = (() => { const hasil = nilaiKiriman(kirimanDari({ aksi: 'buka' }), soal, 'uji'); if (!hasil.ok) throw new Error(hasil.kode); return hasil.penilaian.tabel; })();
const isianKunci = () => ({ kepala: Object.fromEntries(tabel.kolom.filter(k => k.kepala !== undefined).map(k => [k.id, String(k.kepala)])),
  sel: Object.fromEntries(tabel.baris.map(b => [b.id, { ...b.kunci }])) });

describe('bacaKiriman: bentuk (spec 2.6 butir 2)', () => {
  test('kiriman buka yang sah', () => expect(kode(baca(dasar))).toBe('OK'));
  test('user_id di badan → ditolak', () => expect(kode(baca({ ...dasar, user_id: UUID(9) }))).toBe('USER_ID_DILARANG'));
  test('kunci tak dikenal (hasilKolom dari klien) → ditolak, tidak diabaikan diam-diam', () =>
    expect(kode(baca({ ...dasar, benarSemua: true }))).toBe('KUNCI_TIDAK_DIKENAL'));
  test('badan 33 KB → ditolak', () => expect(kode(baca(dasar, 33_000))).toBe('BADAN_TERLALU_BESAR'));
  test('id bukan uuid, soalId aneh, aksi dan mode di luar daftar', () => {
    expect(kode(baca({ ...dasar, id: 'x' }))).toBe('ID_TIDAK_SAH');
    expect(kode(baca({ ...dasar, soalId: '../etc' }))).toBe('SOAL_ID_TIDAK_SAH');
    expect(kode(baca({ ...dasar, aksi: 'hapus' }))).toBe('AKSI_TIDAK_SAH');
    expect(kode(baca({ ...dasar, mode: 'tugas' }))).toBe('MODE_TIDAK_SAH');
  });
  test('periksa tanpa isian dan buka dengan isian → ditolak', () => {
    expect(kode(baca({ ...dasar, aksi: 'periksa' }))).toBe('ISIAN_WAJIB');
    expect(kode(baca({ ...dasar, isian: { kepala: {}, sel: {} } }))).toBe('BUKA_TANPA_ISIAN');
  });
});

describe('nilaiKiriman: isian terhadap tabel (spec 2.6 butir 5)', () => {
  const nilai = (isian: unknown, jangkar: Kiriman['jangkar'] = null) => {
    const bacaan = baca({ ...dasar, aksi: 'periksa', isian, jangkar });
    if (!bacaan.ok) return bacaan.kode;
    const hasil = nilaiKiriman(bacaan.kiriman, soal, 'uji');
    return hasil.ok ? hasil : hasil.kode;
  };
  const satuSel = (idBaris: string, idKolom: string, nilaiSel: string) => ({ kepala: {}, sel: { [idBaris]: { [idKolom]: nilaiSel } } });
  const baris0 = tabel.baris[0]!.id;

  test('isian = kunci → semua kolom benar, jenis soal dari server', () => {
    const hasil = nilai(isianKunci());
    expect(typeof hasil).toBe('object');
    if (typeof hasil === 'object') { expect(hasil.penilaian.benarSemua).toBe(true); expect(hasil.penilaian.jenisSoal).toBe('biasa'); }
  });
  test('isian salah → benarSemua false', () => {
    const hasil = nilai(satuSel(baris0, 'bagian', 'Terhalang'));
    expect(typeof hasil === 'object' && hasil.penilaian.benarSemua).toBe(false);
  });
  test('baris dan kolom karangan', () => {
    expect(nilai(satuSel('ZZZ', 'bagian', '1/8'))).toBe('BARIS_TIDAK_ADA');
    expect(nilai(satuSel(baris0, 'kolomKarangan', '1'))).toBe('KOLOM_TIDAK_ADA');
  });
  test('pilihan di luar daftar; pecahan di kotak bulat', () => {
    expect(nilai(satuSel(baris0, 'bagian', '1/7'))).toBe('PILIHAN_DI_LUAR_DAFTAR');
    expect(nilai(satuSel(baris0, 'ashl', '1/8'))).toBe('ISIAN_BUKAN_BULAT');
  });
  test('jangkar bukan calon → ditolak; sel jangkar diisi → ditolak', () => {
    expect(nilai({ kepala: {}, sel: {} }, { idBaris: baris0, idKolom: 'bagian' })).toBe('JANGKAR_BUKAN_CALON');
    const calon = calonJangkar(tabel)[0]!;
    expect(nilai(satuSel(calon.idBaris, calon.idKolom, '1'), calon)).toBe('SEL_JANGKAR_DIISI');
  });
  test('kepala kolom yang tak punya kepala → ditolak', () => {
    expect(nilai({ kepala: { bagian: '1' }, sel: {} })).toBe('KEPALA_TIDAK_ADA');
  });
  test('soal yang tak bisa disusun → SOAL_TIDAK_DIDUKUNG', () => {
    const hasil = nilaiKiriman(kirimanDari({}), { kasus: { bentuk: 'berkas', berkas: {} }, revisiId: 'r' }, 'uji');
    expect(kode(hasil as never)).toBe('SOAL_TIDAK_DIDUKUNG');
  });
});

import { bacaKirimanKegiatan, nilaiKuis } from '../index.js';
describe('kuis dan pelajaran lewat server', () => {
  test('soal tabel (tanpa kunci jenis) bukan kiriman kegiatan', () => expect(bacaKirimanKegiatan(dasar, 10)).toBeNull());
  test('kuis sah; benar dihitung server, bukan dibaca dari kiriman', () => {
    const baca = bacaKirimanKegiatan({ jenis: 'kuis', id: UUID(1), slug: 'K-01', indeksPilihan: 2 }, 10);
    expect(baca && baca.ok).toBe(true);
    expect(bacaKirimanKegiatan({ jenis: 'kuis', id: UUID(1), slug: 'K-01', indeksPilihan: 2, benar: true }, 10)).toMatchObject({ ok: false, kode: 'KUNCI_TIDAK_DIKENAL' });
    expect(nilaiKuis({ pilihan: [1, 2, 3], indeksBenar: 2 }, 2)).toBe(true);
    expect(nilaiKuis({ pilihan: [1, 2, 3], indeksBenar: 2 }, 0)).toBe(false);
    expect(nilaiKuis({ pilihan: [1, 2, 3], indeksBenar: 2 }, 7)).toBeNull();
  });
  test('pelajaran sah; indeks pilihan karangan ditolak', () => {
    expect(bacaKirimanKegiatan({ jenis: 'pelajaran', id: UUID(1), slug: 'ashabah-1' }, 10)).toMatchObject({ ok: true });
    expect(bacaKirimanKegiatan({ jenis: 'kuis', id: UUID(1), slug: 'K-01', indeksPilihan: -1 }, 10)).toMatchObject({ ok: false, kode: 'PILIHAN_TIDAK_SAH' });
  });
});
