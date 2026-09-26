// Teks langkah Harta dan Kewajiban. `perluCek` = belum diverifikasi tim keilmuan.

import type { KategoriHarta } from '../kasus';
import { angka, t } from '../terjemah';

export const KATEGORI_HARTA_TEKS: Record<KategoriHarta, { label: string; contoh: string }> = {
  tabungan: { label: t('Tabungan & kas'), contoh: t('Rekening bank, deposito, uang tunai') },
  properti: { label: t('Tanah & bangunan'), contoh: 'Rumah, tanah, ruko; pakai harga pasar saat ini' },
  kendaraan: { label: t('Kendaraan'), contoh: 'Mobil, motor; pakai harga jual saat ini' },
  emas: { label: t('Emas & perhiasan'), contoh: t('Emas batangan, perhiasan') },
  piutang: { label: t('Piutang'), contoh: t('Uang almarhum yang dipinjam orang lain dan bisa ditagih') },
  lainnya: { label: t('Lainnya'), contoh: t('Saham, barang berharga, usaha') },
};

export const TEKS_HARTA = {
  presisi: t('Untuk belajar, angka kira-kira boleh. Untuk pembagian nyata, pakai nilai taksiran saat harta dibagi.'),
  gonoGini: t('Harta bersama suami-istri (gono-gini) diatur KHI, belum dihitung di sini. Masukkan bagian milik almarhum saja.'),
  perluCek: true,
  tambahCepat: [1_000_000n, 10_000_000n, 100_000_000n] as const,
};

export const PILIHAN_PEMBULATAN = [
  { satuan: 1n, judul: angka('Rp 1'), keterangan: t('Pas sampai rupiah terakhir. Cocok kalau dibagi lewat transfer bank.') },
  { satuan: 100n, judul: angka('Rp 100'), keterangan: t('Hampir pas, angka lebih rapi.') },
  { satuan: 1000n, judul: angka('Rp 1.000'), keterangan: t('Paling praktis kalau dibagi tunai.') },
] as const;

export const TEKS_KEWAJIBAN = {
  urutan: [
    { kunci: 'tajhiz', label: t('Pengurusan jenazah'), alasan: t('Biaya memandikan, mengafani, dan menguburkan almarhum. Ini didahulukan dari semuanya.') },
    { kunci: 'hutang', label: t('Hutang'), alasan: t('Termasuk kewajiban yang tertunda, misalnya zakat yang belum dibayar, haji yang sudah dinazarkan, atau cicilan.') },
    { kunci: 'wasiat', label: t('Wasiat'), alasan: t('Maksimal 1/3 dari sisa harta setelah hutang. Kalau lebih, otomatis dipangkas.') },
  ] as const,
  kosong: t('Nggak ada? Biarkan kosong, dihitung Rp 0.'),
  perluCek: true,
};
