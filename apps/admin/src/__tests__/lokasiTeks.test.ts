// Tes pemindai lokasi teks: panggilan t()/teksEdukasi() dipetakan ke nama layar berkasnya; modul virtual terisi dari kode web.
import { expect, test } from 'vitest';
import lokasi from 'virtual:lokasi-teks';
import { layarBerkas, pindaiLokasi } from '../../lokasiTeks';

test('pindaiLokasi: kunci → layar, tanpa duplikat', () => {
  expect(pindaiLokasi([
    { jalur: 'layar/Beranda.tsx', isi: "t('beranda.judul'); t( \"umum.simpan\" )" },
    { jalur: 'hasil/KartuPembagian.tsx', isi: "t('umum.simpan'); teksEdukasi('harta.utang'); t(`dinamis.${x}`)" },
  ])).toEqual({ 'beranda.judul': ['Beranda'], 'umum.simpan': ['Beranda', 'Hasil hitung'], 'harta.utang': ['Hasil hitung'] });
  expect(layarBerkas('berkas/tak-dikenal.ts')).toBe('Lainnya');
});

test('modul virtual berisi lokasi dari kode web', () => {
  expect(lokasi['beranda.judul'] ?? Object.values(lokasi)[0]).toBeTruthy();
  expect(Object.keys(lokasi).length).toBeGreaterThan(100);
});
