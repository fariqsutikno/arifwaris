// Kamus UI Indonesia → Arab (bahasa 'ar'), digabung dari berkas per halaman di konten/kamus/.
// Kunci = teks Indonesia persis seperti di kode (termasuk spasi tepi). Yang belum ada tampil dalam bahasa Indonesia.
// Nama orang, merek (ARIF, ArifLab) dan "Rp" sengaja tidak diterjemahkan. Ubah diksi di berkas halamannya, bukan di sini.

import { KAMUS_UMUM } from './kamus/umum';
import { KAMUS_BERANDA } from './kamus/beranda';
import { KAMUS_HITUNG } from './kamus/hitung';
import { KAMUS_BELAJAR } from './kamus/belajar';
import { KAMUS_LATIHAN } from './kamus/latihan';
import { KAMUS_RUJUKAN } from './kamus/rujukan';
import { KAMUS_FAQ } from './kamus/faq';
import { KAMUS_GLOSARIUM } from './kamus/glosarium';
import { KAMUS_TANYA_JAWAB } from './kamus/tanyaJawab';
import { KAMUS_BAB } from './kamus/bab';

export const PERLU_CEK_KAMUS = true;

export const KAMUS_ARAB: Record<string, string> = {
  ...KAMUS_UMUM,
  ...KAMUS_BERANDA,
  ...KAMUS_HITUNG,
  ...KAMUS_BELAJAR,
  ...KAMUS_LATIHAN,
  ...KAMUS_RUJUKAN,
  ...KAMUS_FAQ,
  ...KAMUS_GLOSARIUM,
  ...KAMUS_TANYA_JAWAB,
  ...KAMUS_BAB,
};
