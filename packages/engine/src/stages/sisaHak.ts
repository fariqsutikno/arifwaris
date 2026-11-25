// Tahap 6b — Sisa hak (bab 11.3, kaidah hisab [KH], bukan hukum baru).
// Menerima: hasil `hitung` yang OK, tirkah bersih AWAL (termasuk yang sudah diserahkan), dan uang yang sudah
// diterima tiap ahli waris sebagai bagian warisannya. Menyerahkan: sisa hak per orang dan sisa kas.
// Saham/ashl/tashih tidak disentuh. Kelebihan dan kas kurang hanya DITAMPILKAN: KB tidak punya aturan pengembalian [R11-1].

import type { Uang } from '@waris/math';
import type { HasilEngine, IdOrang, LangkahJejak, Pertanyaan } from '../types.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
type PerluInput = Extract<HasilEngine, { status: 'PERLU_INPUT' }>;

export interface SisaHak {
  status: 'OK';
  perOrang: Record<IdOrang, { nominal: Uang; sudahDiterima: Uang; sisaHak: Uang }>;
  /** Tirkah bersih awal − Σ sudah diterima: harta yang masih ada untuk dibagi. */
  sisaKas: Uang;
  /** Bagian yang bukan milik ahli waris mana pun: selisih pembulatan + sisa yang keluar (hanya pasangan mewarisi). */
  sisaLainnya: Uang;
  /** Ahli waris yang sudah menerima lebih dari bagiannya (sisa hak negatif). */
  kelebihan: IdOrang[];
  /** Σ sisa hak positif > sisa kas: akibat kelebihan, tidak dibagi ulang diam-diam. */
  kasKurang: boolean;
  jejak: LangkahJejak[];
}

export function hitungSisaHak(hasil: HasilOk, tirkahBersih: Uang, sudahDiterima: Record<IdOrang, Uang>): SisaHak | PerluInput {
  const nominal = ambilNominal(hasil);
  const masalahInput = periksaPenerimaan(nominal, tirkahBersih, sudahDiterima);
  if (masalahInput.length > 0) return { status: 'PERLU_INPUT', pertanyaan: masalahInput };

  const perOrang: SisaHak['perOrang'] = {};
  for (const [idOrang, besaran] of Object.entries(nominal)) {
    const diterima = sudahDiterima[idOrang] ?? 0n;
    perOrang[idOrang] = { nominal: besaran, sudahDiterima: diterima, sisaHak: besaran - diterima };
  }
  const sisaKas = tirkahBersih - jumlah(Object.values(sudahDiterima));
  const sisaLainnya = tirkahBersih - jumlah(Object.values(nominal));
  const kelebihan = Object.keys(perOrang).filter(idOrang => perOrang[idOrang]!.sisaHak < 0n);
  const sisaPositif = jumlah(Object.values(perOrang).map(orang => (orang.sisaHak > 0n ? orang.sisaHak : 0n)));
  // Invarian: apa yang masih dibagi + sisa lainnya = harta yang masih ada.
  const jumlahSisaHak = jumlah(Object.values(perOrang).map(orang => orang.sisaHak));
  if (jumlahSisaHak + sisaLainnya !== sisaKas) throw new Error('Invarian sisa hak dilanggar: Σ sisaHak + sisaLainnya ≠ sisaKas');
  const kasKurang = sisaPositif > sisaKas;
  const jejak: LangkahJejak[] = [{ tahap: 'sisaHak', refs: ['R11-5', 'KH'], jenis: 'SISA_HAK', perOrang, sisaKas, sisaLainnya, kelebihan, kasKurang }];
  return { status: 'OK', perOrang, sisaKas, sisaLainnya, kelebihan, kasKurang, jejak };
}

function ambilNominal(hasil: HasilOk): Record<IdOrang, Uang> {
  const nominal: Record<IdOrang, Uang> = {};
  for (const baris of hasil.tabel.baris) {
    for (const [idOrang, sel] of Object.entries(baris.perOrang)) nominal[idOrang] = sel.nominal;
  }
  return nominal;
}

function periksaPenerimaan(nominal: Record<IdOrang, Uang>, tirkahBersih: Uang, sudahDiterima: Record<IdOrang, Uang>): Pertanyaan[] {
  const masalah: Pertanyaan[] = [];
  for (const [idOrang, diterima] of Object.entries(sudahDiterima)) {
    if (!(idOrang in nominal)) masalah.push({ idOrang, isian: 'sudahDiterima', alasan: 'Orang ini bukan ahli waris yang mendapat bagian.' });
    else if (diterima < 0n) masalah.push({ idOrang, isian: 'sudahDiterima', alasan: 'Jumlah yang sudah diterima tidak boleh negatif.' });
  }
  if (masalah.length === 0 && jumlah(Object.values(sudahDiterima)) > tirkahBersih) {
    masalah.push({ isian: 'sudahDiterima', alasan: 'Jumlah yang sudah diterima melebihi tirkah bersih. Periksa lagi isian.' });
  }
  return masalah;
}

const jumlah = (daftar: Uang[]): Uang => daftar.reduce((a, b) => a + b, 0n);
