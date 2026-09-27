// Teks langkah Harta dan Kewajiban.

import type { KategoriHarta } from '../kasus';
import { angka, teksEdukasi } from '../terjemah';

export const KATEGORI_HARTA_TEKS: Record<KategoriHarta, { label: string; contoh: string }> = {
  tabungan: { label: teksEdukasi('harta.tabungan_kas'), contoh: teksEdukasi('harta.rekening_bank_deposito_uang_tunai') },
  properti: { label: teksEdukasi('harta.tanah_bangunan'), contoh: 'Rumah, tanah, ruko; pakai harga pasar saat ini' },
  kendaraan: { label: teksEdukasi('harta.kendaraan'), contoh: 'Mobil, motor; pakai harga jual saat ini' },
  emas: { label: teksEdukasi('harta.emas_perhiasan'), contoh: teksEdukasi('harta.emas_batangan_perhiasan') },
  piutang: { label: teksEdukasi('harta.piutang'), contoh: teksEdukasi('harta.uang_almarhum_yang_dipinjam_orang_lain') },
  lainnya: { label: teksEdukasi('harta.lainnya'), contoh: teksEdukasi('harta.saham_barang_berharga_usaha') },
};

export const TEKS_HARTA = {
  presisi: teksEdukasi('harta.untuk_belajar_angka_kira_kira_boleh'),
  gonoGini: teksEdukasi('harta.harta_bersama_suami_istri_gono_gini'),
  tambahCepat: [1_000_000n, 10_000_000n, 100_000_000n] as const,
};

export const PILIHAN_PEMBULATAN = [
  { satuan: 1n, judul: angka('Rp 1'), keterangan: teksEdukasi('harta.pas_sampai_rupiah_terakhir_cocok_kalau') },
  { satuan: 100n, judul: angka('Rp 100'), keterangan: teksEdukasi('harta.hampir_pas_angka_lebih_rapi') },
  { satuan: 1000n, judul: angka('Rp 1.000'), keterangan: teksEdukasi('harta.paling_praktis_kalau_dibagi_tunai') },
] as const;

export const TEKS_KEWAJIBAN = {
  urutan: [
    { kunci: 'tajhiz', label: teksEdukasi('harta.pengurusan_jenazah'), alasan: teksEdukasi('harta.biaya_memandikan_mengafani_dan_menguburkan_almarhum') },
    { kunci: 'hutang', label: teksEdukasi('harta.hutang'), alasan: teksEdukasi('harta.termasuk_kewajiban_yang_tertunda_misalnya_zakat') },
    { kunci: 'wasiat', label: teksEdukasi('harta.wasiat'), alasan: teksEdukasi('harta.maksimal_1_3_dari_sisa_harta') },
  ] as const,
  kosong: teksEdukasi('harta.nggak_ada_biarkan_kosong_dihitung_rp'),
};
