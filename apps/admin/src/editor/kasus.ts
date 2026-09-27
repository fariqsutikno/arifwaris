// Fungsi murni editor kasus soal hitung. Menerima ContohKasus; memutuskan jumlah orang per kunci (ahliWaris disimpan
// satu entri per orang), apakah harapan tertulis sama dengan hasil engine, dan label kunci yang terbaca. Angka saham
// hanya dari kalkulator [SYF] (hitungHarapan di web) atau diketik penulis; di sini tidak ada hitungan fikih.
import type { ContohKasus } from '@waris/content';
import { KUNCI_CONTOH } from '@waris/web/contoh';

export function jumlahPerKunci(ahliWaris: readonly string[]): Record<string, number> {
  const jumlah: Record<string, number> = {};
  for (const kunci of ahliWaris) jumlah[kunci] = (jumlah[kunci] ?? 0) + 1;
  return jumlah;
}

/** Ubah jumlah satu kunci; urutan kemunculan kunci lain dipertahankan, kunci baru ditaruh di akhir. */
export function aturJumlah(ahliWaris: readonly string[], kunci: string, jumlah: number): string[] {
  const tanpa = ahliWaris.filter(k => k !== kunci);
  const posisi = ahliWaris.indexOf(kunci);
  const baru = Array<string>(Math.max(0, jumlah)).fill(kunci);
  return posisi < 0 ? [...tanpa, ...baru] : [...tanpa.slice(0, posisi), ...baru, ...tanpa.slice(posisi)];
}

export function samaHarapan(a: ContohKasus['harapan'], b: ContohKasus['harapan']): boolean {
  const kunci = new Set([...Object.keys(a.saham), ...Object.keys(b.saham)]);
  return a.ashlAkhir === b.ashlAkhir && [...kunci].every(k => a.saham[k] === b.saham[k]);
}

/** Label resmi dari checklist web (ANAK_LK → "Anak laki-laki"); kunci di luar checklist dibentuk dari namanya. */
export const labelKunci = (kunci: string): string => {
  const resmi = KUNCI_CONTOH.find(k => k.kunci === kunci)?.label;
  if (resmi) return resmi;
  const teks = kunci.toLowerCase().replace(/_/g, ' ').replace(/\blk\b/, 'laki-laki').replace(/\bpr\b/, 'perempuan');
  return teks.charAt(0).toUpperCase() + teks.slice(1);
};

/** Teks input angka → bigint ≥ 0; titik/spasi pemisah ribuan diabaikan. Tak terbaca → null. */
export function bacaBigint(teks: string): bigint | null {
  const bersih = teks.replace(/[.\s_]/g, '');
  return /^\d+$/.test(bersih) ? BigInt(bersih) : null;
}

const RIBUAN = new Intl.NumberFormat('id-ID');
/** 120000000n → "120.000.000" untuk isian rupiah. */
export const formatRibuan = (nilai: bigint): string => RIBUAN.format(nilai);
