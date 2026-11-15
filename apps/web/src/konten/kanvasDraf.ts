// DRAF: kalimat kanvas keluarga yang menunggu pengesahan tim keilmuan (spec kanvas 13, keputusan K2 rencana 2).
// Sengaja bukan kunci diksi: kalimat yang belum sah tidak boleh masuk snapshot. Pindahkan ke diksi bila sudah disahkan.

import { sisipkan } from '../terjemah';

const PENGANTAR_CABANG = '{almarhum} wafat sesudah {pewaris}, sebelum hartanya dibagi. Jadi bagian {almarhum} nanti dibagi lagi ke keluarganya.';

export const pengantarCabang = (almarhum: string, pewaris: string): string => sisipkan(PENGANTAR_CABANG, { almarhum, pewaris });

/** Arti dua pilihan keadaan yang tidak ada di mockup (Bingung memilih?); menunggu pengesahan yang sama. */
export const ARTI_KEADAAN_DRAF = {
  bercerai: 'Pernikahannya sudah berakhir dengan talak; nanti ditanya masa iddahnya.',
  khuntsa: 'Belum jelas laki-laki atau perempuan; nanti ditanya apakah sudah dewasa.',
} as const;
