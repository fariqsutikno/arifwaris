// Penurunan data engine dari isian waktu (spec kanvas silsilah 9.1). Menerima Kasus berisi `waktu` dan `peristiwa`;
// menyerahkan Kasus dengan `urutanWafat`, `dikandungSetelahWafat`, dan status pernikahan yang sudah diturunkan.
// Tahun hanya bahan banding di UI; yang dikirim ke engine tetap urutan dan status.

import type { IdOrang } from '@waris/engine';
import type { Kasus, TanggalKira } from './kasus';

export function bandingTanggal(a?: TanggalKira, b?: TanggalKira): -1 | 0 | 1 | null {
  if (!a || !b) return null;
  const berurutan: Array<[number | undefined, number | undefined]> = [[a.tahun, b.tahun], [a.bulan, b.bulan], [a.hari, b.hari]];
  for (const [x, y] of berurutan) {
    if (x === undefined || y === undefined) return null;   // presisi tidak cukup untuk memutuskan
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export function waktuRelatif(kasus: Kasus, id: IdOrang, relatifKe: IdOrang): 'sebelum' | 'sesudah' | null {
  const banding = bandingTanggal(kasus.waktu?.[id]?.wafat, kasus.waktu?.[relatifKe]?.wafat);
  return banding === -1 ? 'sebelum' : banding === 1 ? 'sesudah' : null;
}

/** Orang bertahun diurutkan di antara sesamanya; yang tanpa tahun tetap di posisinya (jawaban berpasangan tidak ditimpa). */
export function urutkanMenurutTahun(kasus: Kasus): Kasus {
  const tanggalWafat = (id: IdOrang) => kasus.waktu?.[id]?.wafat;
  const posisiBertahun = kasus.urutanWafat.flatMap((id, indeks) => (tanggalWafat(id) ? [indeks] : []));
  const bertahun = posisiBertahun.map(indeks => kasus.urutanWafat[indeks]!);
  // Sisip stabil: hanya pindah bila pasti lebih awal; seri atau tak terbanding tetap di tempat.
  const terurut: IdOrang[] = [];
  for (const id of bertahun) {
    let posisi = terurut.length;
    while (posisi > 0 && bandingTanggal(tanggalWafat(id), tanggalWafat(terurut[posisi - 1]!)) === -1) posisi--;
    terurut.splice(posisi, 0, id);
  }
  if (terurut.every((id, indeks) => id === bertahun[indeks])) return kasus;
  const urutanWafat = [...kasus.urutanWafat];
  posisiBertahun.forEach((posisi, urutan) => { urutanWafat[posisi] = terurut[urutan]!; });
  return { ...kasus, urutanWafat };
}

export function terapkanPeristiwa(kasus: Kasus): Kasus {
  if (!kasus.peristiwa?.length) return kasus;
  const almarhum = [kasus.graf.idPewaris, ...kasus.urutanWafat];
  let dikandung = { ...(kasus.dikandungSetelahWafat ?? {}) };
  let pernikahan = kasus.graf.pernikahan;
  for (const peristiwa of kasus.peristiwa) {
    if (!almarhum.includes(peristiwa.sesudahWafat)) continue;
    // [R13-1] lahir (dikandung) sesudah X wafat → bukan ahli waris X.
    if (peristiwa.jenis === 'lahir') dikandung = { ...dikandung, [peristiwa.idOrang]: peristiwa.sesudahWafat };
    // ponytail: cerai dari linimasa = talak bain tanpa menanyakan iddah; iddah ditanyakan lewat keadaan "Sudah bercerai".
    if (peristiwa.jenis === 'cerai') {
      const pasanganIni = (nikah: { idSuami: IdOrang; idIstri: IdOrang }) =>
        (nikah.idSuami === peristiwa.idOrang && nikah.idIstri === peristiwa.idPasangan)
        || (nikah.idIstri === peristiwa.idOrang && nikah.idSuami === peristiwa.idPasangan);
      pernikahan = pernikahan.map(nikah => (pasanganIni(nikah) ? { ...nikah, status: 'talakBain' as const } : nikah));
    }
  }
  return { ...kasus, dikandungSetelahWafat: dikandung, graf: { ...kasus.graf, pernikahan } };
}

export const turunkanDariWaktu = (kasus: Kasus): Kasus => terapkanPeristiwa(urutkanMenurutTahun(kasus));
