// Bahan dasar kalimat penjelasan.
//   kalimat`...`  → template bertag yang menghasilkan Potongan[] (teks, orang, istilah).
//   buatBaris()   → satu baris penjelasan, huruf awal kalimat otomatis kapital.
//   gabungDan()   → "a", "a dan b", "a, b, dan c".

import type { IdOrang } from '@waris/engine';
import type { Pecahan } from '@waris/math';
import type { IdIstilah } from './terms.js';

/**
 * Satu baris penjelasan = potongan berjenis. UI menampilkan `istilah` bergaris bawah + tooltip glosarium,
 * `orangIni` sebagai sebutan orang (bisa di-hover); `teks` apa adanya.
 */
export type Potongan =
  | { jenis: 'teks'; teks: string }
  | { jenis: 'orang'; daftarIdOrang: IdOrang[]; teks: string }
  | { jenis: 'istilah'; istilah: IdIstilah; teks: string; contoh?: string };

/**
 * `subjek`: orang yang dibahas baris ini (bagiannya/haknya). Orang lain yang disebut = penyebab/pembanding.
 * `penekanan`: `subjudul` = kalimat pembuka kelompok baris sesudahnya; `perhatian` = hal yang perlu disikapi pembaca
 * (mis. selisih pembulatan), supaya UI bisa memisahkannya dari uraian biasa.
 */
export interface BarisPenjelasan { daftarPotongan: Potongan[]; refs: string[]; subjek?: IdOrang[]; penekanan?: 'subjudul' | 'perhatian' }

export const tekankan = (baris: BarisPenjelasan, penekanan: NonNullable<BarisPenjelasan['penekanan']>): BarisPenjelasan => ({ ...baris, penekanan });

export const keTeksBiasa = (baris: BarisPenjelasan): string => baris.daftarPotongan.map(potonganIni => potonganIni.teks).join('');

type Sisipan = string | number | bigint | Pecahan | Potongan | Potongan[];

const adalahPecahan = (porsi: object): porsi is Pecahan => 'n' in porsi && 'd' in porsi;

/** Template bertag: `kalimat\`${orangIni} mendapat ${fraction}\`` → Potongan[]; teks berdampingan digabung. */
export function kalimat(teksTetap: TemplateStringsArray, ...sisipan: Sisipan[]): Potongan[] {
  const hasilPotongan: Potongan[] = [];
  const tambahTeks = (teks: string) => {
    if (teks === '') return;
    const terakhir = hasilPotongan[hasilPotongan.length - 1];
    if (terakhir?.jenis === 'teks') hasilPotongan[hasilPotongan.length - 1] = { jenis: 'teks', teks: terakhir.teks + teks };
    else hasilPotongan.push({ jenis: 'teks', teks });
  };
  teksTetap.forEach((teksIni, i) => {
    tambahTeks(teksIni);
    if (i >= sisipan.length) return;
    const porsi = sisipan[i]!;
    if (typeof porsi !== 'object') tambahTeks(String(porsi));
    else if (Array.isArray(porsi)) porsi.forEach(potonganIni => (potonganIni.jenis === 'teks' ? tambahTeks(potonganIni.teks) : hasilPotongan.push(potonganIni)));
    else if ('jenis' in porsi) (porsi.jenis === 'teks' ? tambahTeks(porsi.teks) : hasilPotongan.push(porsi));
    else if (adalahPecahan(porsi)) tambahTeks(`${porsi.n}/${porsi.d}`);
  });
  return hasilPotongan;
}

/** Baris kalimat: potongan yang membuka kalimat (awal baris atau setelah ". ") diberi huruf kapital. */
export function buatBaris(daftarPotongan: Potongan[], refs: string[] = [], subjek?: IdOrang[]): BarisPenjelasan {
  const kapitalAwal = (potonganIni: Potongan): Potongan => ({ ...potonganIni, teks: potonganIni.teks.charAt(0).toUpperCase() + potonganIni.teks.slice(1) });
  const gabungan = kalimat`${daftarPotongan}`;   // satukan teks bersebelahan dari beberapa template
  const hasilPotongan = gabungan.map((potonganIni, i) => {
    const sebelumnya = gabungan[i - 1];
    const membukaKalimat = i === 0 || (sebelumnya?.jenis === 'teks' && /[.!?]\s$/.test(sebelumnya.teks));
    return membukaKalimat ? kapitalAwal(potonganIni) : potonganIni;
  });
  return { daftarPotongan: hasilPotongan, refs, ...(subjek ? { subjek } : {}) };
}

/** "a", "a dan b", "a, b, dan c" — untuk daftar Potongan[]. */
export function gabungDan(daftar: Potongan[][]): Potongan[] {
  return daftar.flatMap((unsur, i) => {
    if (i === 0) return unsur;
    const pemisah = i === daftar.length - 1 ? (daftar.length > 2 ? ', dan ' : ' dan ') : ', ';
    return [{ jenis: 'teks' as const, teks: pemisah }, ...unsur];
  });
}
