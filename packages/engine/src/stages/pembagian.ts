// Tahap 6 — Pembagian (bab 11.1): dari saham ke rupiah, lalu susun tabel mas'alah.
//   bagikanNominal : nominal = saham ÷ tashih × harta bersih, dibulatkan ke bawah ke kelipatan
//                    `satuan`. Sisa pembulatan tidak dibagikan diam-diam (engine-contract Tahap 6).
//   susunTabel     : satu baris per kelompok; kolom 'aul/radd/tashih hanya muncul bila terjadi.

import { bulatkanKeBawah, pecahan, type Uang } from '@waris/math';
import type { TabelMasalah, IdOrang, StatusOrang, LangkahJejak } from '../types.js';
import type { HasilKlasifikasi } from './klasifikasi.js';
import { pecahanTetapDari, penerimaSisa, type Masalah } from './model.js';
import type { Tashih } from './tashih.js';

/** Tahap 6: nominal tiap orang, dibulatkan ke bawah; selisih total dilaporkan terpisah. */
export function bagikanNominal(perOrang: Record<IdOrang, bigint>, tashih: bigint, bersih: Uang, satuan: bigint):
  { nominal: Record<IdOrang, Uang>; sisaPembulatan: Uang; jejak: LangkahJejak[] } {
  const nominal: Record<IdOrang, Uang> = {};
  const jejak: LangkahJejak[] = [];
  for (const [idOrang, saham] of Object.entries(perOrang)) {
    const besaran = bulatkanKeBawah(bersih, pecahan(saham, tashih), satuan);
    nominal[idOrang] = besaran;
    jejak.push({ tahap: 'distribusi', refs: ['R11-1'], jenis: 'DISTRIBUSI', idOrang, saham, dariTashih: tashih, besaran });
  }
  const sisaPembulatan = bersih - Object.values(nominal).reduce((a, b) => a + b, 0n);
  return { nominal, sisaPembulatan, jejak };
}

/** Tabel mas'alah: kolom 'aul/radd/tashih hanya muncul bila terjadi; yang mahjub/mamnu tetap tampil di `dikecualikan`. */
export function susunTabel(
  masalah: Masalah,
  klasifikasi: HasilKlasifikasi,
  tashih: Tashih,
  nominal: Record<IdOrang, Uang>,
  statusOrang: Record<IdOrang, StatusOrang>,
): TabelMasalah {
  const adaTashih = tashih.juzSahm > 1n;
  const kolom: TabelMasalah['kolom'] = ['fardh', 'ashl'];
  if (klasifikasi.kolomTambahan) kolom.push(klasifikasi.kolomTambahan);
  if (adaTashih) kolom.push('tashih');
  kolom.push('perOrang', 'nominal');

  const totalKolom: TabelMasalah['totalKolom'] = { ashl: masalah.ashl };
  if (klasifikasi.kolomTambahan) totalKolom[klasifikasi.kolomTambahan] = klasifikasi.dasar;
  if (adaTashih) totalKolom.tashih = tashih.tashih;

  const baris = masalah.daftarKelompok.map(kelompok => {
    const sel: Record<string, bigint> = { ashl: masalah.saham[kelompok.id]! };
    if (klasifikasi.kolomTambahan) sel[klasifikasi.kolomTambahan] = klasifikasi.saham[kelompok.id]!;
    if (adaTashih) sel['tashih'] = tashih.sahamKelompokTashih[kelompok.id]!;
    const fardh = pecahanTetapDari(kelompok.bagian);
    return {
      kelompok: kelompok.id,
      anggota: kelompok.anggota,
      ...(fardh ? { fardh } : {}),
      ...(penerimaSisa(kelompok) ? { ashabah: true } : {}),
      sel,
      perOrang: Object.fromEntries(kelompok.anggota.map(id => [id, { saham: tashih.perOrang[id]!, nominal: nominal[id]! }])),
    };
  });

  const dikecualikan = Object.entries(statusOrang).filter(([, status]) => status.jenis === 'mahjub' || status.jenis === 'mamnu').map(([id]) => id);
  return { kolom, totalKolom, baris, dikecualikan };
}
