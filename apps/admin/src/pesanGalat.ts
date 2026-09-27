// Pesan galat untuk manusia: menerima galat apa pun dari repo (Supabase, Postgres, validasi klien) dan memutuskan
// kalimat yang bisa ditindaklanjuti penulis. Pola yang dikenal diterjemahkan; sisanya dipakai apa adanya setelah UUID
// dibuang dan huruf pertama dibesarkan. Dipakai semua layar portal pengganti `e.message` mentah.

const UUID = /\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s*/gi;

const TERJEMAHAN: [RegExp, string | ((cocok: RegExpMatchArray) => string)][] = [
  [/wajib punya minimal satu ref/i, 'Tambahkan minimal satu rujukan di bagian Refs (panel Info).'],
  [/ref tidak ada di KB: (.+)/i, cocok => `Rujukan ${cocok[1]} tidak ada di KB. Pilih rujukan dari daftar.`],
  [/duplicate key|23505|unique constraint/i, 'Alamat atau kode ini sudah dipakai entri lain. Ganti slug/kode di panel Info.'],
  [/failed to fetch|networkerror|fetch failed|load failed/i, 'Tidak tersambung ke server. Periksa koneksi internet lalu coba lagi.'],
  [/jwt|not authenticated|belum masuk/i, 'Sesi Anda sudah habis. Keluar lalu masuk lagi.'],
  [/permission denied|row-level security|42501/i, 'Anda tidak punya izin untuk tindakan ini.'],
  [/akun belum pernah masuk: (.+)/i, cocok => `Akun ${cocok[1]} belum pernah masuk ke portal. Minta pemiliknya masuk sekali dengan Google, lalu beri peran.`],
  [/revisi (diksi )?.*tidak bisa diajukan/i, 'Revisi ini tidak bisa diajukan lagi (mungkin sudah diajukan). Muat ulang halaman.'],
  [/revisi (diksi )?.*tidak sedang diajukan/i, 'Revisi ini sudah tidak menunggu review (mungkin sudah diperiksa reviewer lain). Muat ulang halaman.'],
  [/revisi yang sudah diajukan tidak bisa diubah/i, 'Revisi ini sudah diajukan sehingga tidak bisa diubah lagi. Muat ulang halaman.'],
];

export function pesanGalat(e: unknown): string {
  const mentah = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String(e.message) : String(e);
  for (const [pola, ganti] of TERJEMAHAN) {
    const cocok = mentah.match(pola);
    if (cocok) return typeof ganti === 'string' ? ganti : ganti(cocok);
  }
  const bersih = mentah.replace(UUID, ' ').replace(/\s+/g, ' ').trim();
  return bersih ? bersih.charAt(0).toUpperCase() + bersih.slice(1) : 'Terjadi galat yang tidak dikenal.';
}
