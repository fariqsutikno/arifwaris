import { fpb } from '@waris/math';
import type { IdKelompok, HubunganInkisar, KonfigurasiMadzhab, LangkahJejak } from '../types.js';
import { penerimaSisa, type Masalah, type TidakDidukung } from './model.js';

// [R09-4] hanya 6, 12, 24 yang bisa 'aul, dengan batas masing-masing.
const VALID_AUL: Record<string, bigint[]> = { 6: [7n, 8n, 9n, 10n], 12: [13n, 15n, 17n], 24: [27n] };
// Id kelompok pasangan dari tahap 2 (bagian.ts); pasangan tidak menerima radd [R09-9].
const KELOMPOK_PASANGAN: IdKelompok[] = ['SUAMI', 'ISTRI'];

export interface HasilKlasifikasi {
  /** Penyebut setelah klasifikasi: ashl ('adilah), hasil 'aul, atau hasil radd. */
  dasar: bigint;
  saham: Record<IdKelompok, bigint>;
  column?: 'aul' | 'radd';
  jejak: LangkahJejak[];
}

const sum = (xs: bigint[]) => xs.reduce((a, b) => a + b, 0n);

/** Tahap 4: 'adilah / 'ailah / radd (bab 9.2–9.4). */
export function klasifikasikanMasalah(masalah: Masalah, konfigurasi: KonfigurasiMadzhab, adaDzawilArham: boolean): HasilKlasifikasi | TidakDidukung {
  const { ashl, saham, daftarKelompok } = masalah;
  const total = sum(Object.values(saham));

  if (total === ashl) {
    return { dasar: ashl, saham, jejak: [{ tahap: 'klasifikasi', refs: ['R09-3'], jenis: 'KELAS_MASALAH', kelas: 'adilah', jumlahSaham: total, ashl }] };
  }
  if (total > ashl) {
    if (!VALID_AUL[ashl.toString()]?.includes(total)) throw new Error(`invariant [R09-4]: 'aul ${ashl} → ${total} tidak sah`);
    return {
      dasar: total, saham, column: 'aul',
      jejak: [
        { tahap: 'klasifikasi', refs: ['R09-3'], jenis: 'KELAS_MASALAH', kelas: 'ailah', jumlahSaham: total, ashl },
        { tahap: 'klasifikasi', refs: ['R09-3', 'R09-4'], jenis: 'AUL', dari: ashl, menjadi: total },
      ],
    };
  }
  if (daftarKelompok.some(penerimaSisa)) throw new Error('invariant: ada ashabah tetapi saham < ashl');
  return terapkanRadd(masalah, total, konfigurasi, adaDzawilArham);
}

function terapkanRadd(masalah: Masalah, total: bigint, konfigurasi: KonfigurasiMadzhab, adaDzawilArham: boolean): HasilKlasifikasi | TidakDidukung {
  const { ashl, saham, daftarKelompok } = masalah;
  if (konfigurasi.kebijakanSisa === 'baitulMal') {
    return { status: 'TIDAK_DIDUKUNG', alasan: 'Sisa harta ke baitul mal belum didukung output engine.', refs: ['R09-8'] };
  }
  const pasangan = daftarKelompok.find(g => KELOMPOK_PASANGAN.includes(g.id));
  const penerima = daftarKelompok.filter(g => g !== pasangan);
  if (penerima.length === 0) {
    return adaDzawilArham
      ? { status: 'TIDAK_DIDUKUNG', alasan: 'Sisa harta ke dzawil arham (fase 3); pasangan tidak menerima radd.', refs: ['R09-9', 'R14-4'] }
      : { status: 'TIDAK_DIDUKUNG', alasan: 'Sisa harta ke baitul mal; pasangan tidak menerima radd.', refs: ['R09-9', 'R02-1'] };
  }

  // [R09-7] ashl radd = jumlah saham ahli radd, disederhanakan (satu jenis → per kepala lewat tashih).
  const pembagi = penerima.reduce((acc, g) => fpb(acc, saham[g.id]!), 0n);
  const raddSaham: Record<IdKelompok, bigint> = Object.fromEntries(penerima.map(g => [g.id, saham[g.id]! / pembagi]));
  const raddAshl = sum(Object.values(raddSaham));

  if (!pasangan) {
    return {
      dasar: raddAshl, saham: raddSaham, column: 'radd',
      jejak: [
        { tahap: 'klasifikasi', refs: ['R09-7'], jenis: 'KELAS_MASALAH', kelas: 'raddA', jumlahSaham: total, ashl },
        { tahap: 'klasifikasi', refs: ['R09-7', 'R09-10'], jenis: 'RADD', raddiyyah: { saham: raddSaham, ashl: raddAshl }, hasil: raddAshl },
      ],
    };
  }

  // [R09-10] mas'alah zawjiyyah dari makhraj fardh pasangan; sisanya dibandingkan dengan ashl radd.
  if (pasangan.bagian.jenis !== 'fardh') throw new Error('invariant: pasangan harus fardh');
  const zawjiyyahAshl = pasangan.bagian.fardh.d;
  const sahamPasangan = pasangan.bagian.fardh.n;
  const sisa = zawjiyyahAshl - sahamPasangan;
  const faktor = fpb(sisa, raddAshl);
  const hubungan: HubunganInkisar = sisa % raddAshl === 0n ? 'habis' : faktor > 1n ? 'tawafuq' : 'tabayun';
  const pengali = raddAshl / faktor;             // habis → 1; tawafuq → wafq ashl radd; tabayun → seluruh ashl radd
  const hasil = zawjiyyahAshl * pengali;
  const sahamAkhir: Record<IdKelompok, bigint> = { [pasangan.id]: sahamPasangan * pengali };
  for (const g of penerima) sahamAkhir[g.id] = raddSaham[g.id]! * (sisa / faktor);

  return {
    dasar: hasil, saham: sahamAkhir, column: 'radd',
    jejak: [
      { tahap: 'klasifikasi', refs: ['R09-7'], jenis: 'KELAS_MASALAH', kelas: 'raddB', jumlahSaham: total, ashl },
      { tahap: 'klasifikasi', refs: ['R09-10'], jenis: 'PERBANDINGAN_NISAB', tujuan: 'raddVsSisa', a: sisa, b: raddAshl, hubungan, fpb: faktor, hasil },
      { tahap: 'klasifikasi', refs: ['R09-7', 'R09-10'], jenis: 'RADD',
        zawjiyyah: { kelompok: pasangan.id, ashl: zawjiyyahAshl, sahamPasangan, sisa },
        raddiyyah: { saham: raddSaham, ashl: raddAshl }, hasil },
    ],
  };
}
