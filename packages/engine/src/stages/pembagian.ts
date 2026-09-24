import { bulatkanKeBawah, pecahan, type Uang } from '@waris/math';
import type { TabelMasalah, IdOrang, StatusOrang, LangkahJejak } from '../types.js';
import type { HasilKlasifikasi } from './klasifikasi.js';
import { fixedFractionOf, isResidueGroup, type Masalah } from './model.js';
import type { Tashih } from './tashih.js';

/**
 * Tahap 6 (bab 11.1): nominal = saham ÷ tashih × tirkah bersih, dibulatkan ke bawah ke kelipatan
 * `satuan` per orang; selisihnya dilaporkan, tidak dibagikan diam-diam (engine-contract Tahap 6).
 */
export function bagikanNominal(perOrang: Record<IdOrang, bigint>, tashih: bigint, bersih: Uang, satuan: bigint):
  { nominal: Record<IdOrang, Uang>; sisaPembulatan: Uang; jejak: LangkahJejak[] } {
  const nominal: Record<IdOrang, Uang> = {};
  const jejak: LangkahJejak[] = [];
  for (const [idOrang, saham] of Object.entries(perOrang)) {
    const besaran = bulatkanKeBawah(bersih, pecahan(saham, tashih), satuan);
    nominal[idOrang] = besaran;
    jejak.push({ tahap: 'distribusi', refs: ['R11-1'], jenis: 'DISTRIBUSI', idOrang, saham, of: tashih, besaran });
  }
  const sisaPembulatan = bersih - Object.values(nominal).reduce((a, b) => a + b, 0n);
  return { nominal, sisaPembulatan, jejak };
}

/** Tabel mas'alah: kolom 'aul/radd/tashih hanya muncul bila terjadi; yang mahjub/mamnu tetap tampil di `dikecualikan`. */
export function susunTabel(
  masalah: Masalah,
  classified: HasilKlasifikasi,
  tashih: Tashih,
  nominal: Record<IdOrang, Uang>,
  statusOrang: Record<IdOrang, StatusOrang>,
): TabelMasalah {
  const adaTashih = tashih.juzSahm > 1n;
  const kolom: TabelMasalah['kolom'] = ['fardh', 'ashl'];
  if (classified.column) kolom.push(classified.column);
  if (adaTashih) kolom.push('tashih');
  kolom.push('perOrang', 'nominal');

  const totalKolom: TabelMasalah['totalKolom'] = { ashl: masalah.ashl };
  if (classified.column) totalKolom[classified.column] = classified.dasar;
  if (adaTashih) totalKolom.tashih = tashih.tashih;

  const baris = masalah.kelompokKelompok.map(kelompok => {
    const sel: Record<string, bigint> = { ashl: masalah.saham[kelompok.id]! };
    if (classified.column) sel[classified.column] = classified.saham[kelompok.id]!;
    if (adaTashih) sel['tashih'] = tashih.groupSaham[kelompok.id]!;
    const fardh = fixedFractionOf(kelompok.bagian);
    return {
      kelompok: kelompok.id,
      anggota: kelompok.anggota,
      ...(fardh ? { fardh } : {}),
      ...(isResidueGroup(kelompok) ? { ashabah: true } : {}),
      sel,
      perOrang: Object.fromEntries(kelompok.anggota.map(id => [id, { saham: tashih.perOrang[id]!, nominal: nominal[id]! }])),
    };
  });

  const dikecualikan = Object.entries(statusOrang).filter(([, s]) => s.jenis === 'mahjub' || s.jenis === 'mamnu').map(([id]) => id);
  return { kolom, totalKolom, baris, dikecualikan };
}
