import { describe, expect, test } from 'vitest';
import {
  bisaDinilai, jalankan, jenisSoalDari, kasusDariSoal, muatSoal, nilaiKiriman, REVISI_SOAL_BANK, soalDariKode, soalHitungDariKode,
  susunSoalGharqa, susunTabelSoal, type IsianTabel, type JenisSoal, type Kiriman, type TabelSoal,
} from '../index.js';

// Sampel nyata dari bank (.bank/, hasil sapuan G3); tiap keluarga yang didukung layar soal punya sedikitnya satu.
const SAMPEL: ReadonlyArray<{ keluarga: JenisSoal; kode: string }> = [
  { keluarga: 'biasa', kode: 'G1-B-000000000004J180' },
  { keluarga: 'biasa', kode: 'G1-B-000000000000PV80' },
  { keluarga: 'munasakhat', kode: 'G1-M-0000000000000146R8G00000' }, // 2 mayit
  { keluarga: 'munasakhat', kode: 'G1-M-0000000000004G0AG8A32000' }, // 3 mayit
  { keluarga: 'munasakhat', kode: 'G1-M-000000000080280E02A13A10' }, // 4 mayit
  { keluarga: 'gharqa', kode: 'G1-G-000000000410000EF25WTG' },
  { keluarga: 'gharqa', kode: 'G1-G-0000002000000802A02M20' },
  { keluarga: 'gharqa', kode: 'G1-G-290000000000000500G000' },
  { keluarga: 'mafqud', kode: 'G1-Q-000000000000088BG' },
  { keluarga: 'khuntsa', kode: 'G1-K-0000000000000H0AG' },
  { keluarga: 'haml', kode: 'G1-H-000000000010010B0' },
  { keluarga: 'dzawilArham', kode: 'G1-D-00000004' },
];

const TANPA_TABEL = [
  'G1-B-0000000000000040', // sisa pasangan keluar (sisaKeluar): tabel biasa belum ada
  'G1-B-00400000000029C0', // bagian 3/8 tak ada di daftar pilihan
  'G1-M-000000G00000220548000000', // dzawil arham/sisa keluar di rantai munasakhat
  'G1-G-0000000000000142P0PW2G', // satu harta gharqa tanpa tabel
  'G1-D-0002G0G4', // dzawil arham tanpa jalur tunggal
];

const isianKunci = (tabel: TabelSoal): IsianTabel => ({
  kepala: Object.fromEntries(tabel.kolom.filter(kolom => kolom.kepala !== undefined && !kolom.terkunci).map(kolom => [kolom.id, String(kolom.kepala)])),
  sel: Object.fromEntries(tabel.baris.map(baris => [baris.id,
    Object.fromEntries(Object.entries(baris.kunci).filter(([idKolom]) => !tabel.kolom.find(kolom => kolom.id === idKolom)?.terkunci))])),
  ...(tabel.pengali ? { pengali: Object.fromEntries(Object.entries(tabel.pengali.kunci).map(([id, nilai]) => [id, String(nilai)])) } : {}),
});

const kirimanDasar = (kode: string): Kiriman => ({ id: 'a', idSesiSoal: 'b', soalId: kode, revisiSoal: REVISI_SOAL_BANK, mode: 'latihan', aksi: 'periksa', isian: null, jangkar: null, gharqa: null, bantuan: null, dimulaiPada: null });

/** Kunci jawaban dari engine, lalu `rusak` = kiriman yang salah satu isiannya diganti. */
function kirimanKunci(kode: string, rusak: boolean): Kiriman {
  const soal = soalHitungDariKode(kode, () => kode)!;
  const kasus = kasusDariSoal(soal.kasus);
  const tampil = jalankan(kasus);
  const isi = (isian: IsianTabel): IsianTabel => (rusak ? { ...isian, kepala: { ...isian.kepala, ...Object.fromEntries(Object.keys(isian.kepala).slice(0, 1).map(id => [id, String(BigInt(isian.kepala[id]!) + 1n)])) } } : isian);
  if (tampil.jenis === 'gharqa') {
    const susunan = susunSoalGharqa(tampil.hasil, id => id);
    if ('status' in susunan) throw new Error('gharqa tanpa tabel');
    return { ...kirimanDasar(kode), gharqa: { keputusan: susunan.keputusan, harta: susunan.harta.map(harta => ({ mayit: harta.mayit, isian: isi(isianKunci(harta.tabel)), jangkar: null })) } };
  }
  if (tampil.jenis === 'galat' || tampil.jenis === 'menunggu') throw new Error(tampil.jenis);
  const susunan = susunTabelSoal(tampil.hasil, id => id);
  if ('status' in susunan) throw new Error('tanpa tabel');
  return { ...kirimanDasar(kode), isian: isi(isianKunci(susunan)) };
}

describe('soal bank di layar soal hitung', () => {
  test.each(SAMPEL)('$keluarga $kode: dimuat, jenis soal sesuai keluarga, bisa dinilai', ({ keluarga, kode }) => {
    const soal = soalHitungDariKode(kode, () => 'judul uji');
    expect(soal).not.toBeNull();
    expect(soal).toMatchObject({ kode, judul: 'judul uji', kasus: { bentuk: 'berkas' } });
    expect(['dasar', 'menengah', 'sulit']).toContain(soal!.tingkat);
    const kasus = kasusDariSoal(soal!.kasus);
    expect(jenisSoalDari(kasus, jalankan(kasus))).toBe(keluarga === 'dzawilArham' ? 'dzawilArham' : keluarga);
    expect(bisaDinilai(kasus)).toBe(true);
  });

  test.each(SAMPEL)('$keluarga $kode: berkas = kasus asli (hasil engine sama persis)', ({ kode }) => {
    const asli = soalDariKode(kode);
    if (!asli.ok) throw new Error('sampel tak terbaca');
    const lewatBerkas = kasusDariSoal(soalHitungDariKode(kode, () => '')!.kasus);
    const teks = (nilai: unknown) => JSON.stringify(nilai, (_kunci, isi) => (typeof isi === 'bigint' ? isi.toString() : isi));
    expect(teks(jalankan(lewatBerkas))).toBe(teks(jalankan(asli.kasus)));
  });

  test.each(SAMPEL)('$keluarga $kode: kunci engine dinilai benar, isian salah dinilai salah', ({ kode }) => {
    const soal = soalHitungDariKode(kode, () => '')!;
    const penilaian = (kiriman: Kiriman) => nilaiKiriman(kiriman, { kasus: soal.kasus, revisiId: REVISI_SOAL_BANK }, 'uji');
    const benar = penilaian(kirimanKunci(kode, false));
    expect(benar).toMatchObject({ ok: true, penilaian: { benarSemua: true } });
    const salah = penilaian(kirimanKunci(kode, true));
    // Gharqa: isian salah di tabel harta; keadaan tanpa harta (ditahan) tak punya isian untuk dirusak.
    if (salah.ok && salah.penilaian.hasilKolom?.length === 0) return;
    expect(salah).toMatchObject({ ok: true, penilaian: { benarSemua: false } });
  });

  test.each(TANPA_TABEL)('%s: engine menghitung tetapi tak bisa dinilai, jadi tidak dipakai layar', kode => {
    expect(soalHitungDariKode(kode, () => '')).toBeNull();
  });

  test('muatSoal kode generator: kasus latihan dari kode; kode rusak = TIDAK_ADA; tanpa basis data', () => {
    const cari = { soal: () => { throw new Error('tak boleh dipanggil'); } };
    const hasil = muatSoal('G1-B-000000000004J180', cari);
    expect(hasil).toMatchObject({ ok: true, revisiId: REVISI_SOAL_BANK });
    if (hasil.ok) expect(hasil.kasus.jenisKasus).toBe('latihan');
    expect(muatSoal('G1-B-ZZZZ', cari)).toEqual({ ok: false, alasan: 'TIDAK_ADA' });
    expect(muatSoal('G1-B-0000000000000040', cari)).toMatchObject({ ok: true });
  });
});
