// Persetujuan terekam (UU PDP): kapan dialog kebijakan privasi harus muncul.
// Versi dinaikkan tiap kebijakan berubah bermakna; semua pengguna lalu diminta menyetujui lagi (spec 01 bagian 2.2).

import type { PersetujuanSaya } from '@waris/data';

// ponytail: konstanta di kode; pindah ke versiTerbit konten `teks_edukasi` bila kebijakan sering direvisi lewat portal.
export const VERSI_KEBIJAKAN_PRIVASI = 3;

export const perluSetujuKebijakan = (daftar: readonly PersetujuanSaya[]): boolean =>
  !daftar.some(butir => butir.jenis === 'kebijakan_privasi' && butir.setuju && butir.versi >= VERSI_KEBIJAKAN_PRIVASI);
