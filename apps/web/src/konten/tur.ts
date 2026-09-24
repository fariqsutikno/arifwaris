// Isi tur singkat per layar. `sasaran` = nilai atribut data-tur pada elemen yang disorot.

import type { Layar } from '../keadaan';

export interface LangkahTur { sasaran: string; judul: string; isi: string }

export const TUR: Partial<Record<Layar, LangkahTur[]>> = {
  wizard: [
    { sasaran: 'stepper', judul: 'Lima langkah saja', isi: 'Ini peta langkahmu. Langkah yang sudah diisi bisa diklik untuk diubah.' },
    { sasaran: 'pertanyaan', judul: 'Satu pertanyaan sekali', isi: 'Jawab pertanyaan besar ini. Tulisan abu-abu di bawahnya menjelaskan kenapa ditanya.' },
    { sasaran: 'bar-bawah', judul: 'Maju dan mundur', isi: 'Kembali ke langkah sebelumnya, atau lanjut. Kalau masih ada yang kurang, alasannya tertulis di sini.' },
  ],
};
