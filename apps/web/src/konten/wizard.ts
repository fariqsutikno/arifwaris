// Teks kerangka wizard: nama langkah (stepper & tombol Lanjut), pertanyaan utama, dan caption penjelas.
// Diedit tim keilmuan/konten tanpa menyentuh logika. `perluCek` = belum diverifikasi tim keilmuan.

import { t } from '../terjemah';

export interface TeksLangkah { nama: string; pertanyaan: string; caption: string; perluCek?: boolean }

export const LANGKAH_WIZARD: TeksLangkah[] = [
  { nama: t('Almarhum'), pertanyaan: t('Almarhum laki-laki atau perempuan?'),
    caption: t('Ini menentukan pasangan yang ditanya nanti (istri atau suami) dan besar bagiannya.') },
  { nama: t('Harta'), pertanyaan: t('Berapa harta peninggalannya?'),
    caption: t('Semua yang dimiliki almarhum saat wafat: uang, tanah, kendaraan, emas, juga piutang yang bisa ditagih.'), perluCek: true },
  { nama: t('Kewajiban'), pertanyaan: t('Ada kewajiban yang harus dibayar dulu?'),
    caption: t('Sebelum dibagi, harta dipakai dulu untuk mengurus jenazah, melunasi hutang, lalu menunaikan wasiat.') },
  { nama: t('Ahli waris'), pertanyaan: t('Siapa saja keluarga yang ditinggalkan?'),
    caption: t('Masukkan semua kerabat yang masih hidup saat almarhum wafat. Nanti dihitung siapa yang dapat.') },
  { nama: t('Kondisi khusus'), pertanyaan: t('Ada kondisi khusus?'),
    caption: t('Opsional. Kebanyakan kasus nggak butuh ini.') },
];
