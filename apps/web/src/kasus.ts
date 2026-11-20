// Sisi web dari Kasus: penyimpanan lokal dan pesan galat berbahasa. Tipe, pembuatan, dan validasi berkas ada di
// @waris/latihan (murni, dipakai juga server); berkas ini meneruskan namanya karena puluhan layar mengimpor dari sini.

import { bacaBerkasKasus, keJson, type GalatKasus, type Kasus } from '@waris/latihan';
import { t } from './terjemah';

export {
  SATUAN_PEMBULATAN, KATEGORI_HARTA, JENIS_KASUS, PINTU, KELOMPOK, kasusBaru, keJson, keJsonDibagikan, rapikanKeadaan,
} from '@waris/latihan';
export type {
  Kasus, KategoriHarta, JenisKasus, Pintu, Kelompok, TanggalKira, Peristiwa, HalBelumPasti, GharqaKasus,
} from '@waris/latihan';

const KUNCI_PENYIMPANAN = 'arif-waris:kasus';

export function dariJson(teks: string): { berhasil: true; kasus: Kasus } | { berhasil: false; pesan: string } {
  const hasil = bacaBerkasKasus(teks);
  return hasil.berhasil ? hasil : { berhasil: false, pesan: pesanGalat(hasil.galat) };
}

function pesanGalat({ kode, param }: GalatKasus): string {
  switch (kode) {
    case 'VERSI_TIDAK_DIKENAL': return t('hitung.versi_file_tidak_dikenal');
    case 'SATUAN_PEMBULATAN_SALAH': return t('hitung.satuan_pembulatan_harus_1_100_1000');
    case 'DATA_KEADAAN_RUSAK': return t('hitung.data_keadaan_rusak');
    case 'ORANG_WAFAT_DUA_KALI': return t('hitung.orang_tercatat_wafat_dua_kali');
    case 'DAFTAR_WAFAT_ORANG_TIDAK_ADA': return t('hitung.daftar_wafat_berisi_orang_tidak_ada');
    case 'PEWARIS_DI_DAFTAR_WAFAT': return t('hitung.pewaris_tidak_boleh_di_daftar_wafat');
    case 'PEWARIS_TIDAK_ADA': return t('hitung.pewaris_tidak_ada_di_file');
    case 'DATA_PERNIKAHAN_RUSAK': return t('hitung.data_pernikahan_rusak');
    case 'DATA_ORANG_RUSAK': return t('hitung.data_orang_rusak', { id: param.id! });
    case 'ORANG_TUA_TIDAK_ADA': return `Orang tua ${param.id} tidak ada di file.`;
    case 'BAGIAN_RUSAK': return `Bagian ${param.nama} rusak.`;
    case 'NILAI_BUKAN_BULAT': return `Nilai ${param.nama} harus angka bulat tidak negatif.`;
    case 'JENIS_HARTA_TIDAK_DIKENAL': return `Jenis harta "${param.kategori}" tidak dikenal.`;
    default: return param.pesan || t('hitung.file_tidak_bisa_dibaca');
  }
}

export function simpanLokal(kasus: Kasus | null): void {
  try {
    if (kasus) localStorage.setItem(KUNCI_PENYIMPANAN, keJson(kasus));
    else localStorage.removeItem(KUNCI_PENYIMPANAN);
  } catch {
    // Mode privat / penyimpanan penuh: aplikasi tetap jalan tanpa autosave.
  }
}

export function muatLokal(): Kasus | null {
  try {
    const teks = localStorage.getItem(KUNCI_PENYIMPANAN);
    if (!teks) return null;
    const hasil = dariJson(teks);
    return hasil.berhasil ? hasil.kasus : null;
  } catch {
    return null;
  }
}
