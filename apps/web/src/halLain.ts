// Bagian "Hal lain" (spec kanvas 5.2, bab 02): ada yang beda agama dengan almarhum, atau terlibat dalam wafatnya.
// Menerima Kasus + almarhum pemilik bagian; menyerahkan Kasus dengan `agama` dan `membunuhPewaris` terisi.
// Logikanya dipindahkan dari LangkahKondisi (yang dipakai alur Babak sampai rencana 4).

import type { IdOrang } from '@waris/engine';
import { tandaiDijawab } from './isianBagian';
import type { Kasus } from './kasus';
import { babakAsal, kerabatDari } from './keadaanOrang';

/** Kerabat almarhum yang masih hidup; yang wafat tidak mewarisi sehingga tak perlu ditanya. */
export const anggotaHalLain = (kasus: Kasus, milik: IdOrang): IdOrang[] =>
  kerabatDari(kasus, milik).filter(id => kasus.graf.orang[id]!.statusHidup !== 'wafat');

export function jawabHalLain(kasus: Kasus, milik: IdOrang, ada: boolean): Kasus {
  // "Tidak" berarti benar-benar tidak ada: tanda yang sempat dicentang dibersihkan supaya hasil tidak berubah diam-diam.
  const bersih = ada ? kasus : anggotaHalLain(kasus, milik).reduce(bersihkanTanda, kasus);
  // "Ada" tanpa centang belum jawaban, jadi bagian terbuka lagi.
  return tandaiDijawab(bersih, milik, 'halLain', ada ? adaTanda(bersih, milik) : true);
}

export function tandaiBedaAgama(kasus: Kasus, id: IdOrang, beda: boolean): Kasus {
  return selaraskan(ubahOrang(kasus, id, orang => ({ ...orang, agama: beda ? 'nonIslam' : 'islam' })), id);
}

export function tandaiTerlibat(kasus: Kasus, id: IdOrang, terlibat: boolean): Kasus {
  return selaraskan(ubahOrang(kasus, id, ({ membunuhPewaris: _lama, ...orang }) => (terlibat ? { ...orang, membunuhPewaris: true } : orang)), id);
}

const bertanda = (kasus: Kasus, id: IdOrang) => kasus.graf.orang[id]!.agama === 'nonIslam' || !!kasus.graf.orang[id]!.membunuhPewaris;
const adaTanda = (kasus: Kasus, milik: IdOrang) => anggotaHalLain(kasus, milik).some(id => bertanda(kasus, id));

function bersihkanTanda(kasus: Kasus, id: IdOrang): Kasus {
  if (!bertanda(kasus, id)) return kasus;
  return ubahOrang(kasus, id, ({ membunuhPewaris: _lama, ...orang }) => ({ ...orang, agama: orang.agama === 'nonIslam' ? 'islam' : orang.agama }));
}

/** Bagian dianggap dijawab selama masih ada yang dicentang; centang terakhir dicabut = kembali belum jawaban. */
function selaraskan(kasus: Kasus, id: IdOrang): Kasus {
  const milik = babakAsal(kasus, id);
  return milik ? tandaiDijawab(kasus, milik, 'halLain', adaTanda(kasus, milik)) : kasus;
}

function ubahOrang(kasus: Kasus, id: IdOrang, ubah: (orang: Kasus['graf']['orang'][string]) => Kasus['graf']['orang'][string]): Kasus {
  return { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [id]: ubah(kasus.graf.orang[id]!) } } };
}
