// Isi ahwal dari apps/web/src/konten/ahwal.ts sebelum dipindah ke database (tahap 2), disalin apa adanya untuk skrip impor
// sekali jalan. Sumber kebenarannya sekarang konten jenis `ahwal` di database; berkas ini dihapus bersama skrip impor.
import type { BarisAhwal } from '@waris/content';

export const AHWAL_LAMA: Record<string, BarisAhwal[]> = {
  SUAMI: [
    { bagian: '1/2', syarat: 'Almarhumah tidak punya anak atau cucu dari anak laki-laki.', cocok: { fardh: '1/2' } },
    { bagian: '1/4', syarat: 'Almarhumah punya anak atau cucu dari anak laki-laki.', cocok: { fardh: '1/4' } },
  ],
  ISTRI: [
    { bagian: '1/4', syarat: 'Almarhum tidak punya anak atau cucu dari anak laki-laki.', cocok: { fardh: '1/4' } },
    { bagian: '1/8', syarat: 'Almarhum punya anak atau cucu dari anak laki-laki.', cocok: { fardh: '1/8' } },
  ],
  IBU: [
    { bagian: '1/6', syarat: 'Ada anak/cucu, atau ada dua saudara atau lebih.', cocok: { fardh: '1/6' } },
    { bagian: '1/3', syarat: 'Tidak ada anak/cucu dan saudaranya kurang dari dua.', cocok: { fardh: '1/3', kodeAlasan: 'TANPA_FARU_WARITS_DAN_IKHWAH' } },
    { bagian: '1/3 sisa', syarat: 'Hanya bersama ayah dan suami/istri (umariyyatain).', cocok: { kodeAlasan: 'UMARIYYATAIN' } },
  ],
  AYAH: [
    { bagian: '1/6', syarat: 'Ada anak laki-laki atau cucu laki-laki.', cocok: { fardh: '1/6', ashabah: false } },
    { bagian: '1/6 + sisa', syarat: 'Hanya ada anak/cucu perempuan.', cocok: { fardh: '1/6', ashabah: true } },
    { bagian: 'Sisa (ashabah)', syarat: 'Tidak ada anak maupun cucu.', cocok: { fardh: null, ashabah: true } },
  ],
  ANAK_LK: [
    { bagian: 'Sisa (ashabah)', syarat: 'Selalu mewarisi dan tidak pernah terhalang. Bersama anak perempuan: dapat dua kali bagiannya.', cocok: { ashabah: true } },
  ],
  ANAK_PR: [
    { bagian: '1/2', syarat: 'Sendirian, tanpa anak laki-laki.', cocok: { fardh: '1/2' } },
    { bagian: '2/3', syarat: 'Dua orang atau lebih, tanpa anak laki-laki.', cocok: { fardh: '2/3' } },
    { bagian: 'Sisa, 1 : 2', syarat: 'Bersama anak laki-laki (ashabah bil ghair).', cocok: { ashabah: true } },
  ],
  SAUDARA_KANDUNG: [
    { bagian: 'Sisa (ashabah)', syarat: 'Tidak ada anak laki-laki, cucu laki-laki, maupun ayah.', cocok: { ashabah: true } },
    { bagian: 'Terhalang', syarat: 'Ada anak laki-laki, cucu laki-laki, atau ayah.', cocok: { terhalang: true } },
  ],
};
