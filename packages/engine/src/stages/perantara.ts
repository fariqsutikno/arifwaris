// Tahap mas'alah perantara (bab 14.5 langkah 3) — harta dibagi di antara para perantara seolah mayit meninggalkan
// mereka. Pipeline yang sama dijalankan pada "graf posisi": hanya perantara yang hidup, sehingga hajb antar-perantara,
// furudh, 'aul, dan radd tidak ditulis ulang.
//   Keluar: saham per perantara → turun ke penerima (dzawilArham.ts).

import { hitung } from '../pipeline.js';
import { sahamDari, totalSaham, type Saham } from '../gabung.js';
import type { GrafKeluarga, HasilEngine, IdOrang, InputEngine, LangkahJejak, TabelMasalah } from '../types.js';
import type { RuteTanzil } from './tanzil.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
type BukanOk = Exclude<HasilEngine, { status: 'OK' }>;

export const TANPA_TIRKAH = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

export interface MasalahPerantara {
  saham: Saham;
  masalah: bigint;
  /** Perantara yang terhijab → penghijabnya. */
  mahjub: Record<IdOrang, IdOrang[]>;
  jejak: LangkahJejak;
}

export function bagiAntarPerantara(input: InputEngine, lolos: RuteTanzil[]): MasalahPerantara | BukanOk {
  const daftarPerantara = [...new Set(lolos.map(rute => rute.perantara))].sort();
  const hasil = hitungPosisi(input, input.graf.idPewaris, daftarPerantara);
  if (hasil.status !== 'OK') return hasil;
  periksaAulDzawilArham(hasil.tabel.totalKolom);

  const saham = sahamDari(input.graf.idPewaris, hasil);
  const masalah = totalSaham(saham);
  const mahjub = Object.fromEntries(daftarPerantara.flatMap(id => {
    const status = hasil.statusOrang[id];
    return status?.jenis === 'mahjub' ? [[id, status.oleh]] : [];
  }));
  const { ashl, aul } = hasil.tabel.totalKolom;
  return {
    saham, masalah, mahjub,
    jejak: { tahap: 'dzawilArham', refs: ['R14-9', 'R14-13'], jenis: 'DZAWIL_ARHAM_MASALAH_PERANTARA',
      ashl: ashl!, ...(aul !== undefined ? { aul } : {}), saham, masalah, mahjub: Object.keys(mahjub) },
  };
}

/** Pipeline pada graf posisi: `hidup` = ahli waris, pewaris = `idPewaris`; tanpa harta (hanya mas'alah), radd. */
export function hitungPosisi(input: InputEngine, idPewaris: IdOrang, hidup: IdOrang[], hitungFn: (masukan: InputEngine) => HasilEngine = hitung): HasilEngine {
  return hitungFn({ ...input, graf: grafPosisi(input.graf, idPewaris, hidup), tirkah: TANPA_TIRKAH,
    konfigurasi: { ...input.konfigurasi, kebijakanSisa: 'radd' } });
}

/**
 * Graf virtual: `hidup` menempati posisi ahli waris (posisi, bukan orangnya: agama & qatl netral — penghalang orang
 * asli sudah disaring sebelum tanzil), pewaris muslim, yang lain penghubung. Pernikahan dibuang: pasangan diurus
 * di mas'alah zaujiyyah tersendiri [R14-12].
 */
export function grafPosisi(graf: GrafKeluarga, idPewaris: IdOrang, hidup: IdOrang[]): GrafKeluarga {
  const setHidup = new Set(hidup);
  const orang = Object.fromEntries(Object.entries(graf.orang).map(([id, orangIni]) => [id,
    id === idPewaris ? { ...orangIni, statusHidup: 'wafat' as const, agama: 'islam' as const, penghubung: false }
      : setHidup.has(id) ? { ...orangIni, statusHidup: 'hidup' as const, agama: 'islam' as const, membunuhPewaris: false, penghubung: false }
      : { ...orangIni, statusHidup: 'wafat' as const, penghubung: true }]));
  return { idPewaris, orang, pernikahan: [] };
}

/** [R14-13] 'aul dalam bab dzawil arham hanya 6 → 7: 12, 24, dan 'aul di atas 7 selalu melibatkan pasangan. */
export function periksaAulDzawilArham(totalKolom: TabelMasalah['totalKolom']): void {
  if (totalKolom.aul === undefined) return;
  if (totalKolom.ashl !== 6n || totalKolom.aul !== 7n) {
    throw new Error(`invariant: 'aul dzawil arham ${totalKolom.ashl} → ${totalKolom.aul} [R14-13]`);
  }
}

/** Penerima yang mendapat bagian semuanya satu kelompok → satu saham per kepala; selain itu undefined. */
export function samakanDalamSatuKelompok(hasil: HasilOk): { saham: Saham; masalah: bigint } | undefined {
  const barisBerisi = hasil.tabel.baris.filter(baris => Object.values(baris.perOrang).some(sel => sel.saham > 0n));
  if (barisBerisi.length !== 1) return undefined;
  const penerima = Object.entries(barisBerisi[0]!.perOrang).filter(([, sel]) => sel.saham > 0n).map(([id]) => id);
  return { saham: Object.fromEntries(penerima.map(id => [id, 1n])), masalah: BigInt(penerima.length) };
}
