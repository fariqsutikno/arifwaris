// Tahap 1b — Mawani' (bab 02): status awal tiap orang.
//   bukan kerabat/pasangan sah, dzawil arham, sudah wafat → bukanAhliWaris
//   beda agama, pembunuh                                  → mamnu (dianggap tidak ada,
//                                                            tidak menghijab siapa pun [R06-6])
//   sisanya                                               → ahliWaris, lanjut ke tahap hajb.

import type { GrafKeluarga, PeranAhliWaris, IdOrang, StatusOrang, LangkahJejak, Orang, Ruleset } from '../types.js';

export function terapkanMawani(
  graf: GrafKeluarga,
  daftarPeran: Record<IdOrang, PeranAhliWaris>,
  ruleset: Ruleset = 'syafii',
): { statusOrang: Record<IdOrang, StatusOrang>; jejak: LangkahJejak[] } {
  const statusOrang: Record<IdOrang, StatusOrang> = {};
  const jejak: LangkahJejak[] = [];

  for (const [idOrang, peran] of Object.entries(daftarPeran)) {
    const orangIni = graf.orang[idOrang]!;
    const penghalang = maniDari(orangIni);
    if (peran.kunci === 'BUKAN_AHLI_WARIS') {
      statusOrang[idOrang] = terkenaTalakBain(graf, idOrang)
        ? { jenis: 'bukanAhliWaris', alasan: "talak ba'in memutus sebab nikah", rujukanAturan: 'R02-3' }
        : { jenis: 'bukanAhliWaris', alasan: 'tidak ada sebab waris' };
    } else if (peran.kunci === 'DZAWIL_ARHAM') {
      statusOrang[idOrang] = { jenis: 'bukanAhliWaris', alasan: 'dzawil arham', rujukanAturan: peran.rujukan ?? 'R14-4' };
      // [K03-1] nenek di luar batas madzhab ini; di [SYF] ia ahli waris.
      if (peran.rujukan === 'K03-1' && orangIni.statusHidup === 'hidup') jejak.push({ tahap: 'mawani', refs: ['K03-1'], jenis: 'KHILAF_MADZHAB', kode: 'K03-1', ruleset, idOrang: [idOrang] });
    } else if (orangIni.statusHidup !== 'hidup') {
      // Syarat 2 (bab 2.2): warits harus hidup saat muwarrits wafat.
      statusOrang[idOrang] = { jenis: 'bukanAhliWaris', alasan: 'tidak hidup saat pewaris wafat' };
    } else if (penghalang) {
      const { mani, rujukanAturan } = penghalang;
      statusOrang[idOrang] = { jenis: 'mamnu', peran, mani, rujukanAturan };
      jejak.push({ tahap: 'mawani', refs: [rujukanAturan], jenis: 'MANI', idOrang, mani });
    } else {
      statusOrang[idOrang] = { jenis: 'ahliWaris', peran };
    }
  }
  return { statusOrang, jejak };
}

/** Penghalang yang melekat pada orangnya (bab 02); dipakai juga orkestrator dzawil arham sebelum tanzil. */
export function maniDari(orang: Orang): { mani: 'ikhtilafDin' | 'qatl'; rujukanAturan: 'R02-4' | 'R02-9' } | undefined {
  if (orang.agama === 'nonIslam') return { mani: 'ikhtilafDin', rujukanAturan: 'R02-4' };
  // [R02-9] [SYF] semua bentuk pembunuhan menghalangi.
  if (orang.membunuhPewaris === true) return { mani: 'qatl', rujukanAturan: 'R02-9' };
  return undefined;
}

function terkenaTalakBain(graf: GrafKeluarga, idOrang: IdOrang): boolean {
  const { idPewaris } = graf;
  return graf.pernikahan.some(nikah => nikah.status === 'talakBain'
    && ((nikah.idSuami === idPewaris && nikah.idIstri === idOrang) || (nikah.idIstri === idPewaris && nikah.idSuami === idOrang)));
}
