// Tes pemeriksa sebaris isi pelajaran: contoh pemilik lolos tanpa galat, kesalahan yang disisipkan muncul dengan nomor
// baris relatif ke isi dan pesan berbahasa biasa, isi gaya lama tidak diperiksa; plus pemetaan pesan teknis.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { bacaBlok } from '@waris/content';
import { galatSimpanMateri, periksaIsiMateri } from '../editor/periksaIsiMateri';
import { terjemahkanPesan } from '../editor/pesanMateri';

const bacaContoh = (nama: string) => {
  const berkas = readFileSync(resolve(process.cwd(), `../../docs/materi-kit/contoh/${nama}.md`), 'utf8');
  return berkas.split('\n---\n').slice(1).join('\n---\n');
};
const barisKe = (isi: string, potongan: string) => isi.split('\n').findIndex(baris => baris.includes(potongan)) + 1;

test.each(['5-1-hajb', '6-2-aul'])('contoh pemilik %s: tidak ada galat', nama => {
  const galat = periksaIsiMateri(bacaContoh(nama), nama).filter(isi => isi.tingkat === 'galat');
  expect(galat).toEqual([]);
});

test('angka contoh salah: pesan biasa, baris relatif ke isi, tanpa kunci mentah', () => {
  const isi = bacaContoh('5-1-hajb').replace('harapan: ISTRI 3, IBU 4, ANAK_LK 17; ashl 24', 'harapan: ISTRI 3, IBU 4, ANAK_LK 16; ashl 24');
  const [temuan] = periksaIsiMateri(isi, '5-1-hajb').filter(t => t.tingkat === 'galat');
  expect(temuan?.baris).toBe(barisKe(isi, '```kasus'));
  expect(temuan?.pesan).toBe('Angka contoh tidak sama dengan hasil hitung. Hasil hitung: istri 3, ibu 4, anak laki-laki 17; penyebut akhir 24.');
  expect(temuan?.pesan).not.toMatch(/[A-Z]+_[A-Z]+|engine|ashl/);
});

test('sumber dalil yang tidak ada: pesan biasa tanpa kode', () => {
  const isi = bacaContoh('5-1-hajb').replace('rujukan: R06-2', 'rujukan: R99-1');
  const temuan = periksaIsiMateri(isi, '5-1-hajb').find(t => t.pesan.includes('Sumber dalil'));
  expect(temuan).toMatchObject({ tingkat: 'galat', pesan: 'Sumber dalil tidak dikenali.' });
  expect(temuan?.baris).toBeLessThanOrEqual(barisKe(isi, 'rujukan: R99-1'));
});

test('sintaks blok rusak: galat terbaca, nomor baris pada isi', () => {
  const isi = '```alur\ntahap: hajb\ntanya: a\nhasil: b\n```\n\n```peraga\nngawur\n```\n';
  const [temuan] = periksaIsiMateri(isi, '5-1-hajb');
  expect(temuan).toMatchObject({ tingkat: 'galat', baris: 8 });
  expect(temuan?.pesan).toBe('Bagian peraga: baris "ngawur" tidak dikenal');
});

test('isi gaya lama tidak diperiksa dan tidak menghalangi simpan', () => {
  const isi = '## Masalahnya\n\nSatu paragraf.\n';
  expect(periksaIsiMateri(isi, 'hajb')).toEqual([]);
  expect(galatSimpanMateri('hajb', bacaBlok('hajb', isi))).toBeNull();
});

test('galatSimpanMateri menghitung galat saja, bukan peringatan', () => {
  const baik = bacaContoh('5-1-hajb');
  expect(galatSimpanMateri('5-1-hajb', bacaBlok('5-1-hajb', baik))).toBeNull();
  const salah = baik.replace('ANAK_LK 17; ashl 24', 'ANAK_LK 16; ashl 24');
  expect(galatSimpanMateri('5-1-hajb', bacaBlok('5-1-hajb', salah))).toMatch(/masih punya 1 galat/);
});

test('terjemahan pesan teknis ke bahasa biasa', () => {
  expect(terjemahkanPesan('kode rujukan R99-1 tidak ada di tabel "Dasar dan Rujukan" KB')).toBe('Sumber dalil tidak dikenali.');
  expect(terjemahkanPesan('kode rujukan [R06-2] tidak boleh di teks; pakai blok dasar')).toMatch(/^Sumber dalil tidak boleh ditulis di tengah paragraf/);
  expect(terjemahkanPesan('istilah [[muzahamah]] tidak ada di glosarium; tulis *miring* dan catat di LAPORAN.md')).toMatch(/^Istilah "muzahamah" belum ada di glosarium/);
  expect(terjemahkanPesan('keterangan SAUDARA_KANDUNG untuk ahli waris yang tidak ada di kasus')).toMatch(/^Keterangan untuk saudara/);
  expect(terjemahkanPesan('blok alur wajib menjadi blok pertama')).toBe('Pelajaran harus dibuka dengan bagian alur.');
  expect(terjemahkanPesan('blok soal K-5.1-1 butuh tepat satu pilihan benar (*)')).toBe('Bagian soal K-5.1-1 butuh tepat satu pilihan benar (*)');
  expect(terjemahkanPesan('peraga "Ada anak" bertampil aul, tetapi engine tidak menghasilkan \'aul')).not.toMatch(/engine/);
  expect(terjemahkanPesan('kata tidak baku "banget"')).toBe('Kata tidak baku "banget"');
});
