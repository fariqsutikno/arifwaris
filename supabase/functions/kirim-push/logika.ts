// Logika murni Edge Function kirim-push (tanpa jaringan dan tanpa Deno, supaya bisa dites di vitest bersama ai-bantu):
// menyusun teks kabar dari kandidat (diksi terbit, dengan bawaan bila kunci belum ada di DB), memilih kandidat per batas harian,
// dan menerjemahkan hasil HTTP dari layanan push menjadi tindakan terhadap langganan.
// Pemilihan siapa dikirimi apa ada di SQL (kandidat_push); di sini hanya penyajian dan penanganan kegagalan.

export type JenisPush = 'streak_terancam' | 'peringkat_pekan';
export interface Kandidat {
  user_id: string; jenis: JenisPush; kunci: string; parameter: Record<string, string | number>; tautan: string | null; mendesak: boolean;
}
export type Bahasa = 'id' | 'ar';
export type Teks = Record<string, { id: string; ar?: string | null }>;
export interface Kabar { judul: string; isi: string; tautan: string; tag: string }

/** Kunci diksi yang dipakai server; sama dengan kunci notifikasi di klien supaya satu kalimat satu sumber (portal admin). */
export const KUNCI_DIKSI = [
  'notifikasi.streak_ingat_judul', 'notifikasi.streak_ingat_isi', 'notifikasi.pekan_judul',
  'notifikasi.pekan_naik', 'notifikasi.pekan_turun', 'notifikasi.pekan_sama', 'notifikasi.pekan_awal',
] as const;

/** Cadangan bila kunci belum terbit di DB (salinan snapshot web); diksi terbit selalu menang. */
export const TEKS_BAWAAN: Teks = {
  'notifikasi.streak_ingat_judul': { id: 'Streak {jumlah} harimu belum aman' },
  'notifikasi.streak_ingat_isi': { id: 'Selesaikan satu pelajaran atau soal hari ini untuk menjaganya.' },
  'notifikasi.pekan_judul': { id: 'Peringkatmu pekan lalu: {peringkat}' },
  'notifikasi.pekan_naik': { id: 'Naik {selisih} peringkat dari pekan sebelumnya.' },
  'notifikasi.pekan_turun': { id: 'Turun {selisih} peringkat dari pekan sebelumnya.' },
  'notifikasi.pekan_sama': { id: 'Sama dengan pekan sebelumnya.' },
  'notifikasi.pekan_awal': { id: 'Pekan baru sudah dimulai. Kumpulkan XP untuk naik peringkat.' },
};

const sisipkan = (teks: string, sisipan: Record<string, string | number>): string =>
  teks.replace(/\{(\w+)\}/g, (utuh, nama: string) => (nama in sisipan ? String(sisipan[nama]) : utuh));

function kunciIsi(kandidat: Kandidat): string {
  if (kandidat.jenis === 'streak_terancam') return 'notifikasi.streak_ingat_isi';
  const arah = kandidat.parameter.arah;
  return arah === 'naik' ? 'notifikasi.pekan_naik' : arah === 'turun' ? 'notifikasi.pekan_turun' : arah === 'sama' ? 'notifikasi.pekan_sama' : 'notifikasi.pekan_awal';
}

export function susunKabar(kandidat: Kandidat, teks: Teks, bahasa: Bahasa): Kabar {
  const kunciJudul = kandidat.jenis === 'streak_terancam' ? 'notifikasi.streak_ingat_judul' : 'notifikasi.pekan_judul';
  const ambil = (kunci: string): string => {
    const butir = teks[kunci] ?? TEKS_BAWAAN[kunci]!;
    return sisipkan((bahasa === 'ar' ? butir.ar : null) ?? butir.id, kandidat.parameter);
  };
  return { judul: ambil(kunciJudul), isi: ambil(kunciIsi(kandidat)), tautan: kandidat.tautan ?? '#/', tag: kandidat.kunci };
}

/** Semua kabar mendesak lolos; kabar biasa hanya satu per pengguna per putaran (batas harian lintas putaran dijaga SQL). */
export function pilihPerBatas(daftar: readonly Kandidat[]): Kandidat[] {
  const sudahBiasa = new Set<string>();
  return daftar.filter(kandidat => {
    if (kandidat.mendesak) return true;
    if (sudahBiasa.has(kandidat.user_id)) return false;
    sudahBiasa.add(kandidat.user_id);
    return true;
  });
}

export const GAGAL_MAKS = 5;
export type Tindakan = 'berhasil' | 'hapus' | 'ulang-nanti';

/** 404/410: langganan sudah mati (pengguna mencabut izin atau browser dihapus). Selain itu dianggap gagal sementara. */
export const tindakanDariStatus = (status: number): Tindakan =>
  status >= 200 && status < 300 ? 'berhasil' : status === 404 || status === 410 ? 'hapus' : 'ulang-nanti';

/** Langganan dihapus bila mati, atau gagal sementara terlalu sering berturut-turut. */
export const harusDihapus = (tindakan: Tindakan, gagalBerturut: number): boolean =>
  tindakan === 'hapus' || (tindakan === 'ulang-nanti' && gagalBerturut + 1 > GAGAL_MAKS);

/** Cocok dengan handler 'push' di web/public/sw.js: judul, isi, tautan, tag. */
export const muatanPush = (kabar: Kabar): string => JSON.stringify(kabar);

/** Perbandingan rahasia cron yang tidak bocor lewat waktu eksekusi. */
export function samaRahasia(diterima: string | null, diharapkan: string | undefined): boolean {
  if (!diterima || !diharapkan || diterima.length !== diharapkan.length) return false;
  let selisih = 0;
  for (let i = 0; i < diterima.length; i++) selisih |= diterima.charCodeAt(i) ^ diharapkan.charCodeAt(i);
  return selisih === 0;
}
