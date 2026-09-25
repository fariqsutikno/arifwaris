// Teks kerangka wizard: nama langkah (stepper & tombol Lanjut), pertanyaan utama, dan caption penjelas.
// Diedit tim keilmuan/konten tanpa menyentuh logika. `perluCek` = belum diverifikasi tim keilmuan.

export interface TeksLangkah { nama: string; pertanyaan: string; caption: string; perluCek?: boolean }

export const LANGKAH_WIZARD: TeksLangkah[] = [
  { nama: 'Almarhum', pertanyaan: 'Almarhum laki-laki atau perempuan?',
    caption: 'Ini menentukan pasangan yang ditanya nanti (istri atau suami) dan besar bagiannya.' },
  { nama: 'Harta', pertanyaan: 'Berapa harta peninggalannya?',
    caption: 'Semua yang dimiliki almarhum saat wafat: uang, tanah, kendaraan, emas, juga piutang yang bisa ditagih.', perluCek: true },
  { nama: 'Kewajiban', pertanyaan: 'Ada kewajiban yang harus dibayar dulu?',
    caption: 'Sebelum dibagi, harta dipakai dulu untuk mengurus jenazah, melunasi hutang, lalu menunaikan wasiat.' },
  { nama: 'Ahli waris', pertanyaan: 'Siapa saja keluarga yang ditinggalkan?',
    caption: 'Masukkan semua kerabat yang masih hidup saat almarhum wafat. Nanti dihitung siapa yang dapat.' },
  { nama: 'Kondisi khusus', pertanyaan: 'Ada kondisi khusus?',
    caption: 'Opsional. Kebanyakan kasus nggak butuh ini.' },
];
