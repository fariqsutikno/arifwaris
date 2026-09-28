// Rujukan untuk manusia: pengguna portal tidak perlu tahu kode `Rxx-y`. Menerima daftar kode dari daftar_refs;
// memutuskan teks yang ditampilkan (klaim dari tabel "Dasar dan Rujukan" KB lewat dalilUntuk, judul bab, jenis dalil,
// peringatan perlu verifikasi/dha'if) dan pencarian lewat kata biasa. Kode tetap disimpan di isi, hanya tidak tampil.
import { dalilUntuk, JUDUL_BAB, type IsiRujukan } from '@waris/content';

// Rujukan KB yang sudah terbit di database menggantikan isi berkas KB, supaya portal langsung menampilkan hasil koreksi
// dan rujukan baru (berkas KB baru ikut berubah saat ekspor). ponytail: diisi sekali saat portal dimuat (Portal.tsx);
// rujukan yang terbit selama sesi ini tampil setelah muat ulang. Pindah ke konteks React bila perlu segar seketika.
const rujukanDatabase = new Map<string, { entriId: string; isi: IsiRujukan }>();
export function catatRujukanDatabase(daftar: readonly { entriId: string; isi: IsiRujukan }[]): void {
  rujukanDatabase.clear();
  for (const rujukan of daftar) rujukanDatabase.set(rujukan.isi.kode, rujukan);
}
/** Entri dasar hukum di database untuk satu kode, supaya bisa dibuka dari kartu rujukan. */
export const entriRujukan = (kode: string): string | undefined => rujukanDatabase.get(kode)?.entriId;

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
    const database = rujukanDatabase.get(kode)?.isi;
    return {
      kode, bab, klaim: database?.klaim ?? dalil?.klaim ?? kode, judulBab: JUDUL_BAB[bab] ?? '',
      jenisDalil: dalil?.label.join(' · ') ?? database?.jenis ?? '', sumber: database?.sumber ?? dalil?.sumber ?? '', peringatan: dalil?.peringatan ?? [],
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
export const teksRujukan = (kode: string): string =>
  rujukanDatabase.get(kode)?.isi.klaim ?? dalilUntuk([kode]).daftarEntri[0]?.klaim ?? kode;

// Apostrof ('aul, 'ashabah) dan huruf besar diabaikan supaya "aul" menemukan "'aul".
const normal = (teks: string) => teks.toLowerCase().replace(/['’‘`]/g, '');
