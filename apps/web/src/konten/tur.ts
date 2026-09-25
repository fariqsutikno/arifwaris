// Isi tur singkat per layar. `sasaran` = nilai atribut data-tur pada elemen yang disorot.

import type { Layar } from '../keadaan';

export interface LangkahTur { sasaran: string; judul: string; isi: string }

export const TUR: Partial<Record<Layar, LangkahTur[]>> = {
  wizard: [
    { sasaran: 'stepper', judul: 'Lima langkah saja', isi: 'Ini peta langkahmu. Langkah yang sudah diisi bisa diklik untuk diubah.' },
    { sasaran: 'pertanyaan', judul: 'Satu pertanyaan sekali', isi: 'Jawab pertanyaan besar ini. Tulisan abu-abu di bawahnya menjelaskan kenapa ditanya.' },
    { sasaran: 'bar-bawah', judul: 'Maju dan mundur', isi: 'Kembali ke langkah sebelumnya, atau lanjut. Kalau masih ada yang kurang, alasannya tertulis di sini.' },
  ],
  hasil: [
    { sasaran: 'pohon', judul: 'Pohon keluarga', isi: 'Warna menunjukkan kelompok, garis putus-putus berarti tidak dapat bagian. Klik siapa pun untuk penjelasannya.' },
    { sasaran: 'pembagian', judul: 'Pembagian', isi: 'Bagian tiap orang. Ikon mata menyembunyikan nominal, ikon atur memilih pecahan atau persen.' },
    { sasaran: 'pembulatan', judul: 'Pembulatan', isi: 'Muncul hanya kalau ada angka yang tidak bulat. Pilih sesuai cara membagi: transfer atau tunai.' },
    { sasaran: 'langkah', judul: 'Pelajari langkahnya', isi: 'Buka ini untuk melihat cara hitungnya, satu langkah sekali. Pohon dan tabel ikut menyorot yang sedang dibahas.' },
    { sasaran: 'selanjutnya', judul: 'Habis ini ngapain?', isi: 'Daftar hal yang biasanya dilakukan keluarga setelah tahu pembagiannya.' },
  ],
};
