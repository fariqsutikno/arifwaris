// Persetujuan terekam (UU PDP): kapan dialog kebijakan privasi harus muncul.
// Versi dinaikkan tiap kebijakan berubah bermakna; semua pengguna lalu diminta menyetujui lagi (spec 01 bagian 2.2).

import type { PersetujuanSaya } from '@waris/data';
import { NAMA_APLIKASI } from '../terjemah';

// ponytail: konstanta di kode; pindah ke versiTerbit konten `teks_edukasi` bila kebijakan sering direvisi lewat portal.
export const VERSI_KEBIJAKAN_PRIVASI = 6;
// Berlaku untuk kebijakan privasi dan syarat layanan (satu persetujuan); ganti bersama versi.
export const TANGGAL_BERLAKU_KEBIJAKAN = '22 November 2026';

export const perluSetujuKebijakan = (daftar: readonly PersetujuanSaya[]): boolean =>
  !daftar.some(butir => butir.jenis === 'kebijakan_privasi' && butir.setuju && butir.versi >= VERSI_KEBIJAKAN_PRIVASI);

// Identitas pengelola di teks kebijakan dan syarat; satu tempat untuk diganti (env saat build, mis. setelah berbadan hukum).
export const SISIPAN_KEBIJAKAN = {
  platform: NAMA_APLIKASI,
  pengelola: import.meta.env.VITE_PENGELOLA || 'ArifWaris Team',
  email: import.meta.env.VITE_EMAIL_KONTAK || 'cs@arifwaris.com',
  // Ganti saat penyedia/lokasi pindah (mis. ke VPS) lalu naikkan VERSI_KEBIJAKAN_PRIVASI.
  penyedia_data: import.meta.env.VITE_PENYEDIA_DATA || 'Supabase',
  lokasi_data: import.meta.env.VITE_LOKASI_DATA || 'Mumbai, India',
  penyedia_web: import.meta.env.VITE_PENYEDIA_WEB || 'Vercel',
  versi: VERSI_KEBIJAKAN_PRIVASI,
  tanggal: TANGGAL_BERLAKU_KEBIJAKAN,
};
