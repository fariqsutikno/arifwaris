// Nama kasus/keadaan fikih yang baru disebut di layar selesai (spec tangga bantuan 6.1): nama keadaan menyatakan hasilnya,
// jadi tidak muncul di petunjuk. Menerima jejak engine; menyerahkan kunci nama (data, bukan kalimat).

import type { LangkahJejak } from '@waris/engine';

export type NamaKasus = 'aul' | 'radd' | 'inkisar' | 'hajb_nuqshan' | 'akdariyyah' | 'musyarrakah' | 'umariyyatain';

/** Urutan tampil tetap; yang tak ada di jejak tidak disebut. */
export function namaKasusDariJejak(jejak: readonly LangkahJejak[]): NamaKasus[] {
  const ada = new Set<NamaKasus>();
  for (const langkah of jejak) {
    if (langkah.jenis === 'AUL') ada.add('aul'); // [R09-4]
    else if (langkah.jenis === 'RADD') ada.add('radd'); // [R09-7]
    else if (langkah.jenis === 'TASHIH' && langkah.hasil !== langkah.dasar) ada.add('inkisar'); // [R10-3]
    else if (langkah.jenis === 'HAJB_NUQSHAN') ada.add('hajb_nuqshan'); // [R06-6]
    else if (langkah.jenis === 'KASUS_KHUSUS' && langkah.nama !== 'muaddah') ada.add(langkah.nama); // [R07-1] [R07-2] [R08-5]
  }
  return URUTAN.filter(nama => ada.has(nama));
}
const URUTAN: readonly NamaKasus[] = ['akdariyyah', 'musyarrakah', 'umariyyatain', 'hajb_nuqshan', 'aul', 'radd', 'inkisar'];
