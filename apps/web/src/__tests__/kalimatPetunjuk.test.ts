import { describe, expect, test } from 'vitest';
import type { PetunjukKolom } from '@waris/latihan';
import { kalimatPetunjuk, type BahanKalimat } from '../hasil/kalimatPetunjuk';

const bahan: BahanKalimat = {
  judulKolom: id => `K:${id}`, namaKemungkinan: k => `M:${k}`, namaMayit: id => `Y:${id}`,
  labelPeran: kunci => kunci.toLowerCase(), labelBagian: bagian => bagian,
};
const petunjuk = (bagian: Partial<PetunjukKolom>): PetunjukKolom => ({
  p1: { kunci: 'umum', parameter: {}, fokus: [] }, p2: { kunci: 'umum', parameter: { kolom: 'bagian', nama: 'Istri' } }, ...bagian,
});

describe('kalimatPetunjuk', () => {
  test('p1 kolom pilihan: kalimat jenis kekeliruan + arah perhatian, tanpa nama orang', () => {
    const { teks } = kalimatPetunjuk(1, petunjuk({ p1: { kunci: 'pilihan.besarKeliru', parameter: {}, fokus: ['keturunan', 'saudara'] } }), bahan);
    expect(teks).toContain('Ada bagian pasti yang besarnya belum sesuai.');
    expect(teks).toContain('Perhatikan terutama **keturunan dan saudara-saudara** almarhum.');
  });
  test('kolom taqdir diawali kemungkinan; kolom perantara diakhiri kalimat perantara', () => {
    const taqdir = kalimatPetunjuk(1, petunjuk({ p1: { kunci: 'pilihan.caraKeliru', parameter: { kemungkinan: 'hidup' }, fokus: [] } }), bahan).teks;
    expect(taqdir.startsWith('Pada kemungkinan **M:hidup**, ada yang cara mewarisinya')).toBe(true);
    const perantara = kalimatPetunjuk(1, petunjuk({ p1: { kunci: 'pilihan.kedudukanKeliru', parameter: { perantara: '1' }, fokus: [] } }), bahan).teks;
    expect(perantara.endsWith('Perlakukan tiap perantara seperti ahli waris biasa.')).toBe(true);
  });
  test('p2 kontras menampilkan dua kasus lain dengan nilainya', () => {
    const { teks } = kalimatPetunjuk(2, petunjuk({ p2: { kunci: 'kontras', parameter: { peran: 'ISTRI', susunanA: 'ISTRI,ANAK_LK', bagianA: '1/8', susunanB: 'ISTRI,AYAH', bagianB: '1/4' } } }), bahan);
    expect(teks).toBe('Bandingkan dua kasus lain. **istri, anak_lk**: istri mendapat 1/8. **istri, ayah**: istri mendapat 1/4. Apa yang berbeda di antara keduanya? Sekarang periksa keluargamu.');
  });
  test('p2 materi membawa nomor bab; kunci bertitik diubah ke snake_case', () => {
    expect(kalimatPetunjuk(2, petunjuk({ p2: { kunci: 'materi', parameter: { bab: '4.4' } } }), bahan)).toEqual({ teks: 'Baca lagi bab **4.4** di materi, lalu periksa keluargamu.', bab: '4.4' });
    expect(kalimatPetunjuk(1, petunjuk({ p1: { kunci: 'jumlahSaham.perOrang', parameter: {}, fokus: [] } }), bahan).teks).toContain('Setelah asal masalah berubah');
  });
  test('templat umum memakai judul kolom dan nama', () => {
    expect(kalimatPetunjuk(2, petunjuk({}), bahan).teks).toBe('Lihat lagi kolom **K:bagian** baris **Istri**. Dari mana kamu mendapat isiannya?');
  });
});
