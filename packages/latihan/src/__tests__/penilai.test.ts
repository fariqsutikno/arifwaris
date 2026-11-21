import { describe, expect, test } from 'vitest';
import type { KasusSoal } from '@waris/content';
import type { GrafKeluarga, Orang } from '@waris/engine';
import { bacaKiriman, calonJangkar, keJson, kasusBaru, nilaiKiriman, type IsianGharqa, type IsianTabel, type Kiriman, type TabelSoal } from '../index.js';

// Bab 16.1: istri 1/8, anak lk + anak pr ashabah bil ghair; tashih 8 → 24.
const soal = { kasus: { pewaris: 'L', ahliWaris: ['ISTRI', 'ANAK_LK', 'ANAK_PR'], harta: 24_000_000n, harapan: { saham: {}, ashlAkhir: 24n } } as KasusSoal, revisiId: 'r' };
const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const dasar = { id: UUID(1), idSesiSoal: UUID(2), soalId: 'H-01', revisiSoal: UUID(3), mode: 'latihan', aksi: 'buka' };
const baca = (badan: unknown, ukuran = 100) => bacaKiriman(badan, ukuran);
const kode = (hasil: { ok: boolean } & Partial<{ kode: string }>) => (hasil.ok ? 'OK' : hasil.kode);
const kirimanDari = (bagian: Partial<Kiriman>): Kiriman => ({ ...dasar, mode: 'latihan', aksi: 'periksa', isian: null, jangkar: null, gharqa: null, dimulaiPada: null, ...bagian } as Kiriman);

// Tabel disusun server; ambil id baris dari hasil buka supaya uji tidak menebak id.
const tabel = (() => { const hasil = nilaiKiriman(kirimanDari({ aksi: 'buka' }), soal, 'uji'); if (!hasil.ok) throw new Error(hasil.kode); return hasil.penilaian.daftarTabel[0]!; })();
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

// ── Gharqa (KB 13d.2): keputusan + tabel per harta dinilai server sekaligus; benarSemua = keputusan benar dan semua harta benar. ──
describe('gharqa: kiriman dan penilaian', () => {
  const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });
  const wafat = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}) => orang(id, jenisKelamin, { statusHidup: 'wafat', ...lain });
  const graf: GrafKeluarga = { idPewaris: 'ZAID', pernikahan: [{ idSuami: 'AMR', idIstri: 'AW', status: 'utuh' }], orang: {
    KAKEK: wafat('KAKEK', 'L'), F: wafat('F', 'L', { idAyah: 'KAKEK' }), PAMAN: orang('PAMAN', 'L', { idAyah: 'KAKEK' }),
    MZ: orang('MZ', 'P'), MA: wafat('MA', 'P'),
    ZAID: wafat('ZAID', 'L', { idAyah: 'F', idIbu: 'MZ' }), ZD: orang('ZD', 'P', { idAyah: 'ZAID' }),
    AMR: wafat('AMR', 'L', { idAyah: 'F', idIbu: 'MA' }), AW: orang('AW', 'P'),
    AD1: orang('AD1', 'P', { idAyah: 'AMR', idIbu: 'AW' }), AD2: orang('AD2', 'P', { idAyah: 'AMR', idIbu: 'AW' }) } };
  const harta = { kotor: 24_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n };
  const kasusGharqa = (keadaan: 'tidakDiketahui' | 'terlupakan') => ({ ...kasusBaru('L', 'latihan'), graf, tirkah: harta,
    gharqa: { anggota: ['ZAID', 'AMR'], keadaan, tirkah: { AMR: harta } } });
  const soalGharqa = (keadaan: 'tidakDiketahui' | 'terlupakan' = 'tidakDiketahui') =>
    ({ kasus: { bentuk: 'berkas', berkas: JSON.parse(keJson(kasusGharqa(keadaan))) } as KasusSoal, revisiId: 'r' });
  const bagian = (gharqa: IsianGharqa | null, lain: Partial<Kiriman> = {}) => kirimanDari({ gharqa, ...lain });
  const penuh = (tabelHarta: TabelSoal): IsianTabel => ({
    kepala: Object.fromEntries(tabelHarta.kolom.filter(k => k.kepala !== undefined).map(k => [k.id, String(k.kepala)])),
    sel: Object.fromEntries(tabelHarta.baris.map(b => [b.id, { ...b.kunci }])) });
  const hartaBenar = (tabelHarta: TabelSoal, mayit: string) => ({ mayit, isian: penuh(tabelHarta), jangkar: null });
  const buka = nilaiKiriman(kirimanDari({ aksi: 'buka' }), soalGharqa(), 'uji');
  if (!buka.ok) throw new Error(buka.kode);
  const [tabelZaid, tabelAmr] = buka.penilaian.daftarTabel as [TabelSoal, TabelSoal];

  test('buka: jenis gharqa, satu tabel per harta, keputusan benar ikut menjadi kunci', () => {
    expect(buka.penilaian.jenisSoal).toBe('gharqa');
    expect(buka.penilaian.daftarTabel).toHaveLength(2);
    expect(buka.penilaian.keputusanSoal).toBe('tidakSalingMewarisi');
  });
  test('keputusan benar + semua tabel benar → benarSemua', () => {
    const hasil = nilaiKiriman(bagian({ keputusan: 'tidakSalingMewarisi', harta: [hartaBenar(tabelZaid, 'ZAID'), hartaBenar(tabelAmr, 'AMR')] }), soalGharqa(), 'uji');
    expect(hasil.ok && hasil.penilaian.benarSemua).toBe(true);
  });
  test('baru satu harta dikerjakan → belum benarSemua', () => {
    const hasil = nilaiKiriman(bagian({ keputusan: 'tidakSalingMewarisi', harta: [hartaBenar(tabelZaid, 'ZAID')] }), soalGharqa(), 'uji');
    expect(hasil.ok && hasil.penilaian.benarSemua).toBe(false);
  });
  test('keputusan salah → hasilKolom kosong, tabel yang dikirim tidak dinilai', () => {
    const hasil = nilaiKiriman(bagian({ keputusan: 'terakhirMewarisi', harta: [hartaBenar(tabelZaid, 'ZAID')] }), soalGharqa(), 'uji');
    expect(hasil.ok && [hasil.penilaian.benarSemua, hasil.penilaian.hasilKolom]).toEqual([false, []]);
  });
  test('terlupakan [SYF]: ditahan tanpa tabel → keputusan ditahan langsung benarSemua', () => {
    const hasil = nilaiKiriman(bagian({ keputusan: 'ditahan', harta: [] }), soalGharqa('terlupakan'), 'uji');
    expect(hasil.ok && hasil.penilaian.benarSemua).toBe(true);
  });
  test('mayit karangan dan isian di luar tabel → ditolak', () => {
    expect(kode(nilaiKiriman(bagian({ keputusan: 'tidakSalingMewarisi', harta: [hartaBenar(tabelZaid, 'HANTU')] }), soalGharqa(), 'uji'))).toBe('HARTA_TIDAK_ADA');
    const kacau = { mayit: 'ZAID', isian: { kepala: {}, sel: { ZZZ: { bagian: '1/8' } } }, jangkar: null };
    expect(kode(nilaiKiriman(bagian({ keputusan: 'tidakSalingMewarisi', harta: [kacau] }), soalGharqa(), 'uji'))).toBe('BARIS_TIDAK_ADA');
  });
  test('isian tunggal pada soal gharqa, dan gharqa pada soal biasa → ditolak', () => {
    expect(kode(nilaiKiriman(kirimanDari({ isian: isianKunci() }), soalGharqa(), 'uji'))).toBe('GHARQA_ISIAN_TIDAK_SESUAI');
    expect(kode(nilaiKiriman(bagian({ keputusan: 'ditahan', harta: [] }), soal, 'uji'))).toBe('GHARQA_BUKAN_SOAL_INI');
  });
  test('bentuk: gharqa dan isian sekaligus, keputusan aneh, mayit ganda, buka dengan gharqa', () => {
    const sah = { keputusan: 'ditahan', harta: [] };
    expect(kode(baca({ ...dasar, aksi: 'periksa', gharqa: sah }))).toBe('OK');
    expect(kode(baca({ ...dasar, aksi: 'periksa', gharqa: sah, isian: { kepala: {}, sel: {} } }))).toBe('GHARQA_DAN_ISIAN');
    expect(kode(baca({ ...dasar, aksi: 'periksa', gharqa: { ...sah, keputusan: 'bebas' } }))).toBe('GHARQA_TIDAK_SAH');
    const butir = { mayit: 'A', isian: { kepala: {}, sel: {} }, jangkar: null };
    expect(kode(baca({ ...dasar, aksi: 'periksa', gharqa: { ...sah, harta: [butir, butir] } }))).toBe('GHARQA_TIDAK_SAH');
    expect(kode(baca({ ...dasar, aksi: 'buka', gharqa: sah }))).toBe('BUKA_TANPA_ISIAN');
  });
});
