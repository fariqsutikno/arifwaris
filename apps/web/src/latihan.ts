// Latihan soal (spec kanvas 6): kartu per mayit seperti di kitab. Menerima Kasus latihan; menyerahkan daftar mayit,
// orang di tiap kartu, dan perubahan "wafat sebelum harta dibagi" / urutan wafat. Graf keluarga satu, jadi orang yang sama
// di dua kartu tercatat sekali (hitungIsian menghitungnya dari sisi mayit masing-masing).

import type { IdOrang } from '@waris/engine';
import { hitungIsian, labelOrangChecklist } from './checklist';
import type { Kasus } from './kasus';
import { babakAsal, daftarAlmarhum, kerabatDari, namaSingkat, terapkanKeadaan } from './keadaanOrang';

export const mayitLatihan = (kasus: Kasus): IdOrang[] => daftarAlmarhum(kasus);

export function orangDiKartu(kasus: Kasus, idMayit: IdOrang): IdOrang[] {
  const sebelumnya = new Set(mayitLatihan(kasus).slice(0, mayitLatihan(kasus).indexOf(idMayit)));
  const dihitung = Object.values(hitungIsian(kasus.graf, idMayit)).flatMap(daftar => daftar ?? []);
  return dihitung.filter(id => !sebelumnya.has(id) && !kasus.graf.orang[id]!.penghubung);
}

/** [R12-1] wafat sesudah mayit sebelumnya dan sebelum harta dibagi → masuk urutan wafat (di akhir). */
export function tandaiWafatSebelumDibagi(kasus: Kasus, idOrang: IdOrang, wafat: boolean): Kasus {
  if (wafat === kasus.urutanWafat.includes(idOrang)) return kasus;
  return terapkanKeadaan(kasus, idOrang, wafat ? { jenis: 'wafatSesudah', hartaSudahDibagi: false } : { jenis: 'hidup' });
}

export function geserUrutan(kasus: Kasus, idOrang: IdOrang, arah: -1 | 1): Kasus {
  const i = kasus.urutanWafat.indexOf(idOrang), j = i + arah;
  if (i < 0 || j < 0 || j >= kasus.urutanWafat.length) return kasus;
  const urutanWafat = [...kasus.urutanWafat];
  [urutanWafat[i], urutanWafat[j]] = [urutanWafat[j]!, urutanWafat[i]!];
  return { ...kasus, urutanWafat, urutanDijawab: [...new Set([...(kasus.urutanDijawab ?? []), idOrang])] };
}

export function labelMayit(kasus: Kasus, idMayit: IdOrang): string {
  if (idMayit === kasus.graf.idPewaris || kasus.graf.orang[idMayit]!.nama) return namaSingkat(kasus, idMayit);
  const asal = babakAsal(kasus, idMayit) ?? kasus.graf.idPewaris;
  return `${labelOrangChecklist(kasus.graf, asal, idMayit)} ${namaSingkat(kasus, asal)}`;
}

/** Kartu pertama yang tidak punya ahli waris hidup saat mayitnya wafat (tidak termasuk mayit sebelumnya). */
export function mayitTanpaAhliWaris(kasus: Kasus): IdOrang | null {
  const almarhum = mayitLatihan(kasus);
  return almarhum.find((idMayit, i) => {
    const sebelumnya = new Set(almarhum.slice(0, i));
    return !kerabatDari(kasus, idMayit).some(id => !sebelumnya.has(id) && kasus.graf.orang[id]!.statusHidup !== 'wafat');
  }) ?? null;
}
