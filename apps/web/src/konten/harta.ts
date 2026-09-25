// Teks langkah Harta dan Kewajiban. `perluCek` = belum diverifikasi tim keilmuan.

import type { KategoriHarta } from '../kasus';

export const KATEGORI_HARTA_TEKS: Record<KategoriHarta, { label: string; contoh: string }> = {
  tabungan: { label: 'Tabungan & kas', contoh: 'Rekening bank, deposito, uang tunai' },
  properti: { label: 'Tanah & bangunan', contoh: 'Rumah, tanah, ruko; pakai harga pasar saat ini' },
  kendaraan: { label: 'Kendaraan', contoh: 'Mobil, motor; pakai harga jual saat ini' },
  emas: { label: 'Emas & perhiasan', contoh: 'Emas batangan, perhiasan' },
  piutang: { label: 'Piutang', contoh: 'Uang almarhum yang dipinjam orang lain dan bisa ditagih' },
  lainnya: { label: 'Lainnya', contoh: 'Saham, barang berharga, usaha' },
};

export const TEKS_HARTA = {
  presisi: 'Untuk belajar, angka kira-kira boleh. Untuk pembagian nyata, pakai nilai taksiran saat harta dibagi.',
  gonoGini: 'Harta bersama suami-istri (gono-gini) diatur KHI, belum dihitung di sini. Masukkan bagian milik almarhum saja.',
  perluCek: true,
  tambahCepat: [1_000_000n, 10_000_000n, 100_000_000n] as const,
};

export const PILIHAN_PEMBULATAN = [
  { satuan: 1n, judul: 'Rp 1', keterangan: 'Pas sampai rupiah terakhir. Cocok kalau dibagi lewat transfer bank.' },
  { satuan: 100n, judul: 'Rp 100', keterangan: 'Hampir pas, angka lebih rapi.' },
  { satuan: 1000n, judul: 'Rp 1.000', keterangan: 'Paling praktis kalau dibagi tunai.' },
] as const;

export const TEKS_KEWAJIBAN = {
  urutan: [
    { kunci: 'tajhiz', label: 'Pengurusan jenazah', alasan: 'Biaya memandikan, mengafani, dan menguburkan almarhum. Ini didahulukan dari semuanya.' },
    { kunci: 'hutang', label: 'Hutang', alasan: 'Termasuk kewajiban yang tertunda, misalnya zakat yang belum dibayar, haji yang sudah dinazarkan, atau cicilan.' },
    { kunci: 'wasiat', label: 'Wasiat', alasan: 'Maksimal 1/3 dari sisa harta setelah hutang. Kalau lebih, otomatis dipangkas.' },
  ] as const,
  kosong: 'Nggak ada? Biarkan kosong, dihitung Rp 0.',
  perluCek: true,
};
