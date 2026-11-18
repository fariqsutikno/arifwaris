// Isi "Kisah harta {X}" di Periksa (spec kanvas 7.3). Menerima Kasus; menyerahkan babak per kematian (pemilik lalu
// urutan wafat) beserta siapa yang masih ada, siapa yang sudah tiada, yang belum pasti, dan peristiwa sesudahnya.
// Hanya fakta isian: tidak ada siapa-mendapat-apa di sini (fikih tetap di engine).

import type { IdOrang } from '@waris/engine';
import type { Kasus, Peristiwa, TanggalKira } from './kasus';
import { daftarAlmarhum } from './keadaanOrang';

export type KeadaanSaat = 'pusat' | 'hidup' | 'mati' | 'tahu';
export interface BabakKisah {
  idMayit: IdOrang;
  /** 0 = pemilik harta. */
  nomor: number;
  tahun?: TanggalKira;
  urutanBelumPasti: boolean;
  pasangan: IdOrang[]; anak: IdOrang[]; orangTua: IdOrang[];
  sudahTiada: IdOrang[];
  belumPasti: IdOrang[];
  peristiwaSesudah: Peristiwa[];
}
export type JenisCatatanKhusus = 'bersamaan' | 'hilang' | 'janin' | 'sesudahDibagi';

export function babakKisah(kasus: Kasus): BabakKisah[] {
  const tertunda = new Set((kasus.belumPasti ?? []).flatMap(hal => (hal.jenis === 'urutan' ? [hal.a, hal.b] : [])));
  return daftarAlmarhum(kasus).map((idMayit, nomor) => {
    const [pasangan, anak, orangTua] = [pasanganDari(kasus, idMayit), anakDari(kasus, idMayit), orangTuaDari(kasus, idMayit)];
    const kerabat = [...pasangan, ...anak, ...orangTua];
    const ada = (id: IdOrang) => ['hidup', 'tahu'].includes(keadaanSaat(kasus, id, idMayit));
    const tahun = kasus.waktu?.[idMayit]?.wafat;
    return {
      idMayit, nomor, ...(tahun ? { tahun } : {}),
      urutanBelumPasti: tertunda.has(idMayit),
      pasangan: pasangan.filter(ada), anak: anak.filter(ada), orangTua: orangTua.filter(ada),
      sudahTiada: kerabat.filter(id => keadaanSaat(kasus, id, idMayit) === 'mati'),
      belumPasti: kerabat.filter(id => keadaanSaat(kasus, id, idMayit) === 'tahu'),
      peristiwaSesudah: (kasus.peristiwa ?? []).filter(peristiwa => peristiwa.sesudahWafat === idMayit),
    };
  });
}

/** Keadaan `id` pada saat `idMayitBabak` wafat. Yang wafat sebelum pemilik atau lebih awal di urutan = sudah tiada. */
export function keadaanSaat(kasus: Kasus, id: IdOrang, idMayitBabak: IdOrang): KeadaanSaat {
  if (id === idMayitBabak) return 'pusat';
  if (kasus.graf.orang[id]!.statusHidup === 'wafat') return 'mati';
  const almarhum = daftarAlmarhum(kasus);
  const posisi = almarhum.indexOf(id);
  if (posisi >= 0 && posisi < almarhum.indexOf(idMayitBabak)) return 'mati';
  return belumPastiOrang(kasus, id) ? 'tahu' : 'hidup';
}

/** Keluarga dekat pemilik yang wafat sebelum pemilik (tidak punya babak). */
export function kematianSebelum(kasus: Kasus): IdOrang[] {
  const pemilik = kasus.graf.idPewaris;
  return [...pasanganDari(kasus, pemilik), ...anakDari(kasus, pemilik), ...orangTuaDari(kasus, pemilik)]
    .filter(id => kasus.graf.orang[id]!.statusHidup === 'wafat');
}

export function jedaTahun(a?: TanggalKira, b?: TanggalKira): number | null {
  return a && b ? b.tahun - a.tahun : null;
}

export function hidupSekarang(kasus: Kasus): IdOrang[] {
  const almarhum = new Set(daftarAlmarhum(kasus));
  return Object.values(kasus.graf.orang)
    .filter(orang => !orang.penghubung && !almarhum.has(orang.id) && orang.statusHidup === 'hidup').map(orang => orang.id);
}

export function catatanKhusus(kasus: Kasus): Array<{ jenis: JenisCatatanKhusus; orang: IdOrang[] }> {
  const orang = Object.values(kasus.graf.orang).filter(satu => !satu.penghubung);
  const daftar: Array<{ jenis: JenisCatatanKhusus; orang: IdOrang[] }> = [
    { jenis: 'bersamaan', orang: kasus.gharqa?.anggota ?? [] },
    { jenis: 'hilang', orang: orang.filter(satu => satu.statusHidup === 'mafqud').map(satu => satu.id) },
    { jenis: 'janin', orang: orang.filter(satu => satu.statusHidup === 'dalamKandungan').map(satu => satu.id) },
    { jenis: 'sesudahDibagi', orang: kasus.wafatSesudahDibagi ?? [] },
  ];
  return daftar.filter(catatan => catatan.orang.length > 0);
}

const orangNyata = (kasus: Kasus, id: IdOrang | undefined): id is IdOrang =>
  !!id && !!kasus.graf.orang[id] && !kasus.graf.orang[id]!.penghubung;

const pasanganDari = (kasus: Kasus, id: IdOrang): IdOrang[] =>
  kasus.graf.pernikahan.flatMap(nikah => (nikah.idSuami === id ? [nikah.idIstri] : nikah.idIstri === id ? [nikah.idSuami] : []))
    .filter(pasangan => orangNyata(kasus, pasangan));

const anakDari = (kasus: Kasus, id: IdOrang): IdOrang[] =>
  Object.values(kasus.graf.orang).filter(orang => !orang.penghubung && (orang.idAyah === id || orang.idIbu === id)).map(orang => orang.id);

const orangTuaDari = (kasus: Kasus, id: IdOrang): IdOrang[] =>
  [kasus.graf.orang[id]?.idAyah, kasus.graf.orang[id]?.idIbu].filter((orangTua): orangTua is IdOrang => orangNyata(kasus, orangTua));

const belumPastiOrang = (kasus: Kasus, id: IdOrang): boolean => {
  const orang = kasus.graf.orang[id]!;
  return ['tidakDiketahui', 'mafqud', 'dalamKandungan'].includes(orang.statusHidup) || !!orang.khuntsa;
};
