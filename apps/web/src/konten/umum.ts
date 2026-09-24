// Teks umum di luar wizard.

/** Ganti dengan URL repo sungguhan saat dipublikasikan. */
export const TAUTAN_LAPORAN = 'https://github.com/NAMA-ORG/arif-waris/issues';

export const TEKS_BERANDA = {
  judul: 'Waris itu gampang, asal tahu urutannya.',
  janji: 'Masukin kasusnya, ikutin langkahnya. Tiap angka dijelasin, lengkap sama alasannya.',
  fakta: ['5 langkah, sekitar 3 menit', "Madzhab Syafi'i", 'Dihitung di perangkatmu, nggak dikirim ke mana-mana'],
  tanyaTujuan: 'Mau pakai buat apa?',
  tujuan: {
    hitung: { judul: 'Hitung kasus', keterangan: 'Ada keluarga yang meninggal dan mau tahu pembagiannya.' },
    belajar: { judul: 'Belajar', keterangan: 'Latihan faraidh. Jawaban disembunyikan dulu supaya bisa menebak.' },
  },
} as const;
