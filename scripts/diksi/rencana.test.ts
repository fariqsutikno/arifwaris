import { describe, expect, test } from 'vitest';
import { ambilTeksT, slugTeks, susunPeta, tulisUlang } from './rencana';

const KAMUS = { umum: { Batal: 'إلغاء' }, hitung: { 'Harta peninggalan': 'التركة' }, belajar: {} };

describe('ambilTeksT', () => {
  test('literal kutip tunggal & ganda, escape', () => {
    expect(ambilTeksT(`t('Batal') + t("Al-Qur'an") + t('Kalau \\'ragu\\'', { a: 1 }) + t(x)`)).toEqual(['Batal', "Al-Qur'an", "Kalau 'ragu'"]);
  });
});

describe('slugTeks', () => {
  test('huruf kecil, tanpa diakritik, maksimal 6 kata, sisipan jadi kata', () => {
    expect(slugTeks('Berapa harta peninggalannya?')).toBe('berapa_harta_peninggalannya');
    expect(slugTeks('Soal {nomor}, {status}')).toBe('soal_nomor_status');
    expect(slugTeks("Ma'al ghair — sisa bersama anak perempuan sekali lagi")).toBe('ma_al_ghair_sisa_bersama_anak');
    expect(slugTeks('← →')).toBe('teks');
  });
});

describe('susunPeta', () => {
  const berkas = [
    { jalur: 'ui/Tombol.tsx', isi: `t('Batal'); t('Batal')` },
    { jalur: 'layar/wizard/LangkahHarta.tsx', isi: `t('Harta peninggalan'); t('Harta peninggalan!')` },
    { jalur: 'layar/belajar/Materi.tsx', isi: `t('Batal'); t('Materi baru')` },
    { jalur: 'konten/harta.ts', isi: `t('Tabungan & kas')` },
    { jalur: 'konten/ahwal.ts', isi: `t('Diabaikan')` },
  ];
  const peta = susunPeta(berkas, KAMUS);
  test('teks di KAMUS_UMUM → halaman umum, satu kunci meski dipakai banyak berkas', () => {
    expect(peta.diksi.filter(b => b.id === 'Batal')).toEqual([{ kunci: 'umum.batal', halaman: 'umum', id: 'Batal', ar: 'إلغاء' }]);
  });
  test('halaman dari kamus, lalu dari jalur; tabrakan slug dapat akhiran _2', () => {
    expect(peta.diksi.find(b => b.id === 'Harta peninggalan')?.kunci).toBe('hitung.harta_peninggalan');
    expect(peta.diksi.find(b => b.id === 'Harta peninggalan!')?.kunci).toBe('hitung.harta_peninggalan_2');
    expect(peta.diksi.find(b => b.id === 'Materi baru')).toMatchObject({ kunci: 'belajar.materi_baru', ar: null });
  });
  test('berkas konten → edukasi; ahwal.ts dilewati', () => {
    expect(peta.edukasi).toEqual([{ slug: 'harta.tabungan_kas', id: 'Tabungan & kas', ar: null }]);
    expect(peta.diksi.some(b => b.id === 'Diabaikan')).toBe(false);
  });
  test('deterministik', () => {
    expect(susunPeta([...berkas].reverse(), KAMUS)).toEqual(peta);
  });
  test('tulisUlang: t diksi → kunci; berkas edukasi → teksEdukasi + impor', () => {
    expect(tulisUlang(berkas[1]!, peta)).toBe(`t('hitung.harta_peninggalan'); t('hitung.harta_peninggalan_2')`);
    const edukasi = tulisUlang({ jalur: 'konten/harta.ts', isi: `import { angka, t } from '../terjemah';\nx = t('Tabungan & kas');` }, peta);
    expect(edukasi).toBe(`import { angka, teksEdukasi } from '../terjemah';\nx = teksEdukasi('harta.tabungan_kas');`);
  });
});
