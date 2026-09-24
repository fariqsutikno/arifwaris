// Tahap 1b — Mawani' (bab 02): status awal tiap orang.
//   bukan kerabat/pasangan sah, dzawil arham, sudah wafat → bukanAhliWaris
//   beda agama, pembunuh                                  → mamnu (dianggap tidak ada,
//                                                            tidak menghijab siapa pun [R06-6])
//   sisanya                                               → ahliWaris, lanjut ke tahap hajb.

import type { GrafKeluarga, PeranAhliWaris, IdOrang, StatusOrang, LangkahJejak } from '../types.js';

export function terapkanMawani(
  graf: GrafKeluarga,
  daftarPeran: Record<IdOrang, PeranAhliWaris>,
): { statusOrang: Record<IdOrang, StatusOrang>; jejak: LangkahJejak[] } {
  const statusOrang: Record<IdOrang, StatusOrang> = {};
  const jejak: LangkahJejak[] = [];

  for (const [idOrang, peran] of Object.entries(daftarPeran)) {
    const orangIni = graf.orang[idOrang]!;
    if (peran.kunci === 'BUKAN_AHLI_WARIS') {
      statusOrang[idOrang] = terkenaTalakBain(graf, idOrang)
        ? { jenis: 'bukanAhliWaris', alasan: "talak ba'in memutus sebab nikah", rujukanAturan: 'R02-3' }
        : { jenis: 'bukanAhliWaris', alasan: 'tidak ada sebab waris' };
    } else if (peran.kunci === 'DZAWIL_ARHAM') {
      statusOrang[idOrang] = { jenis: 'bukanAhliWaris', alasan: 'dzawil arham', rujukanAturan: 'R14-4' };
    } else if (orangIni.statusHidup !== 'hidup') {
      // Syarat 2 (bab 2.2): warits harus hidup saat muwarrits wafat.
      statusOrang[idOrang] = { jenis: 'bukanAhliWaris', alasan: 'tidak hidup saat pewaris wafat' };
    } else if (orangIni.agama === 'nonIslam') {
      statusOrang[idOrang] = { jenis: 'mamnu', peran, mani: 'ikhtilafDin', rujukanAturan: 'R02-4' };
      jejak.push({ tahap: 'mawani', refs: ['R02-4'], jenis: 'MANI', idOrang, mani: 'ikhtilafDin' });
    } else if (orangIni.membunuhPewaris === true) {
      // [R02-9] [SYF] semua bentuk pembunuhan menghalangi.
      statusOrang[idOrang] = { jenis: 'mamnu', peran, mani: 'qatl', rujukanAturan: 'R02-9' };
      jejak.push({ tahap: 'mawani', refs: ['R02-9'], jenis: 'MANI', idOrang, mani: 'qatl' });
    } else {
      statusOrang[idOrang] = { jenis: 'ahliWaris', peran };
    }
  }
  return { statusOrang, jejak };
}

function terkenaTalakBain(graf: GrafKeluarga, idOrang: IdOrang): boolean {
  const { idPewaris } = graf;
  return graf.pernikahan.some(nikah => nikah.status === 'talakBain'
    && ((nikah.idSuami === idPewaris && nikah.idIstri === idOrang) || (nikah.idIstri === idPewaris && nikah.idSuami === idOrang)));
}
