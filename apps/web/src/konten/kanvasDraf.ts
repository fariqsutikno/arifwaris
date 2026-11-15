// DRAF: kalimat kanvas keluarga yang menunggu pengesahan tim keilmuan (spec kanvas 13, keputusan K2 rencana 2).
// Sengaja bukan kunci diksi: kalimat yang belum sah tidak boleh masuk snapshot. Pindahkan ke diksi bila sudah disahkan.

import { sisipkan } from '../terjemah';

const PENGANTAR_CABANG = '{almarhum} wafat sesudah {pewaris}, sebelum hartanya dibagi. Jadi bagian {almarhum} nanti dibagi lagi ke keluarganya.';

export const pengantarCabang = (almarhum: string, pewaris: string): string => sisipkan(PENGANTAR_CABANG, { almarhum, pewaris });
