// Identitas entri (murni): kunci yang dipakai web untuk tautan & progres pengguna (kode soal, slug materi/tanya jawab,
// id FAQ, nomor modul, kunci ahwal, istilah glosarium). Menerima jenis + NilaiForm/isi; memutuskan kode berikutnya
// untuk entri baru, mengisi identitas kosong dari bidang asalnya, dan slug entri. Deskripsi bidang ada di formulir.ts.
import { slug as buatSlug, type JenisKonten } from '@waris/content';
import { bidangIdentitas } from './formulir';
import type { NilaiForm } from './nilaiForm';

const LEBAR_NOMOR_KODE = 2;
// Jenis tanpa bidang identitas (kitab, cheatsheet): slug dari judul. Syahid: surah + ayat + hukum, seperti data lama.
// teks_edukasi tidak dibuat dari portal (kuncinya ditentukan kode aplikasi), jadi tidak punya calon.
const FIELD_CALON_JUDUL = ['judul', 'pertanyaan'] as const;

/** Kode berikutnya dengan awalan sama: K-01, K-07 → K-08. Kode berawalan lain diabaikan. */
export function kodeBerikutnya(awalan: string, kodeAda: readonly string[]): string {
  const nomor = kodeAda
    .filter(kode => kode.startsWith(awalan))
    .map(kode => Number.parseInt(kode.slice(awalan.length), 10))
    .filter(Number.isInteger);
  return `${awalan}${String(Math.max(0, ...nomor) + 1).padStart(LEBAR_NOMOR_KODE, '0')}`;
}

/** Nilai otomatis untuk identitas yang dikosongkan: slug dari bidang asalnya; '' bila tidak bisa dibentuk. */
export function identitasOtomatis(jenis: JenisKonten, form: NilaiForm): string {
  const dari = bidangIdentitas(jenis)?.identitas?.dari;
  const asal = dari ? form.nilai[dari] : undefined;
  return typeof asal === 'string' ? buatSlug(asal) : '';
}

/** Isi bidang identitas yang kosong dengan identitasOtomatis; form lain tidak disentuh. */
export function lengkapiIdentitas(jenis: JenisKonten, form: NilaiForm): NilaiForm {
  const bidang = bidangIdentitas(jenis);
  if (!bidang?.identitas?.dari || form.nilai[bidang.jalur] !== '') return form;
  return { ...form, nilai: { ...form.nilai, [bidang.jalur]: identitasOtomatis(jenis, form) } };
}

/** Slug entri = nilai identitas apa adanya (K-01, SUAMI, 1, 1-1-apa-itu-faraidh), sama dengan data yang sudah ada. */
export function slugEntri(jenis: JenisKonten, isi: unknown): string | null {
  const objek = isi as Record<string, unknown>;
  const bidang = bidangIdentitas(jenis);
  if (bidang) {
    const nilai = objek[bidang.jalur];
    return typeof nilai === 'string' || typeof nilai === 'number' ? String(nilai) || null : null;
  }
  if (jenis === 'syahid') return buatSlug([objek.surah, objek.ayat, objek.hukum].join(' ')) || null;
  const calon = FIELD_CALON_JUDUL.map(kunci => objek[kunci]).find((n): n is string => typeof n === 'string' && n.length > 0);
  return calon ? buatSlug(calon) : null;
}
