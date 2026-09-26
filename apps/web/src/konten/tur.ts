// Isi tur singkat per layar. `sasaran` = nilai atribut data-tur pada elemen yang disorot.

import type { Layar } from '../keadaan';
import { t } from '../terjemah';

export interface LangkahTur { sasaran: string; judul: string; isi: string }

export const TUR: Partial<Record<Layar, LangkahTur[]>> = {
  wizard: [
    { sasaran: 'stepper', judul: t('Lima langkah saja'), isi: t('Ini peta langkahmu. Langkah yang sudah diisi bisa diklik untuk diubah.') },
    { sasaran: 'pertanyaan', judul: t('Satu pertanyaan sekali'), isi: t('Jawab pertanyaan besar ini. Tulisan abu-abu di bawahnya menjelaskan kenapa ditanya.') },
    { sasaran: 'bar-bawah', judul: t('Maju dan mundur'), isi: t('Kembali ke langkah sebelumnya, atau lanjut. Kalau masih ada yang kurang, alasannya tertulis di sini.') },
  ],
  hasil: [
    { sasaran: 'pohon', judul: t('Pohon keluarga'), isi: t('Warna menunjukkan kelompok, garis putus-putus berarti tidak dapat bagian. Klik siapa pun untuk penjelasannya.') },
    { sasaran: 'pembagian', judul: t('Pembagian'), isi: t('Bagian tiap orang. Ikon mata menyembunyikan nominal, ikon atur memilih pecahan atau persen.') },
    { sasaran: 'pembulatan', judul: t('Pembulatan'), isi: t('Muncul hanya kalau ada angka yang tidak bulat. Pilih sesuai cara membagi: transfer atau tunai.') },
    { sasaran: 'langkah', judul: t('Pelajari langkahnya'), isi: t('Buka ini untuk melihat cara hitungnya, satu langkah sekali. Pohon dan tabel ikut menyorot yang sedang dibahas.') },
    { sasaran: 'selanjutnya', judul: t('Habis ini ngapain?'), isi: t('Daftar hal yang biasanya dilakukan keluarga setelah tahu pembagiannya.') },
  ],
};
