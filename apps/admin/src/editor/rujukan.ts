// Rujukan untuk manusia: pengguna portal tidak perlu tahu kode `Rxx-y`. Menerima daftar kode dari daftar_refs;
// memutuskan teks yang ditampilkan (klaim dari tabel "Dasar dan Rujukan" KB lewat dalilUntuk, judul bab, jenis dalil,
// peringatan perlu verifikasi/dha'if) dan pencarian lewat kata biasa. Kode tetap disimpan di isi, hanya tidak tampil.
import { dalilUntuk, JUDUL_BAB } from '@waris/content';

export interface OpsiRujukan {
  kode: string;
  bab: number;
  klaim: string;
  judulBab: string;
  /** "Al-Qur'an · Hadits", kosong bila bukan dalil. */
  jenisDalil: string;
  sumber: string;
  peringatan: string[];
}

export function opsiRujukan(daftarRefs: readonly { kode: string; bab: number }[]): OpsiRujukan[] {
  return daftarRefs.map(({ kode, bab }) => {
    const dalil = dalilUntuk([kode]).daftarEntri[0];
    return {
      kode, bab, klaim: dalil?.klaim ?? kode, judulBab: JUDUL_BAB[bab] ?? '', jenisDalil: dalil?.label.join(' · ') ?? '',
      sumber: dalil?.sumber ?? '', peringatan: dalil?.peringatan ?? [],
    };
  });
}

/** Semua kata pencarian harus ada di klaim, judul bab, jenis dalil, sumber, atau kode (kode tetap cocok untuk yang hafal). */
export function cariOpsiRujukan(daftar: readonly OpsiRujukan[], cari: string): OpsiRujukan[] {
  const kata = normal(cari).split(/\s+/).filter(Boolean);
  if (kata.length === 0) return [...daftar];
  return daftar.filter(opsi => {
    const teks = normal(`${opsi.klaim} ${opsi.judulBab} ${opsi.jenisDalil} ${opsi.sumber} ${opsi.kode} bab ${opsi.bab}`);
    return kata.every(k => teks.includes(k));
  });
}

/** Teks tampilan satu kode rujukan; kode yang tidak dikenal KB ditampilkan apa adanya supaya tetap terlihat salah. */
export const teksRujukan = (kode: string): string => dalilUntuk([kode]).daftarEntri[0]?.klaim ?? kode;

// Apostrof ('aul, 'ashabah) dan huruf besar diabaikan supaya "aul" menemukan "'aul".
const normal = (teks: string) => teks.toLowerCase().replace(/['’‘`]/g, '');
