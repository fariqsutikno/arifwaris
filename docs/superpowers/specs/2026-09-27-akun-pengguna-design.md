# Akun Pengguna (Tahap 4) — Desain

Status: disetujui dalam diskusi 2026-09-27, menunggu review spec.
Branch: `fitur/database-portal-admin`. Melanjutkan [database-portal-admin](2026-09-26-database-portal-admin-design.md)
bagian "Data pengguna"; aturan di sana tetap berlaku kecuali diubah di sini.

## Tujuan

1. Pengguna bisa login Google di web (opsional); kasus tersimpan, progres belajar & latihan, dan preferensi ada di
   semua perangkat.
2. Web tetap jalan penuh tanpa akun, tanpa internet, dan saat Supabase di-pause.
3. Menyiapkan data mentah untuk daily streak & leaderboard (tahap 5).

## Bukan tujuan

- Streak, leaderboard, poin, zona waktu, profil publik → tahap 5, spec sendiri.
- Menyinkronkan "Terakhir dibuka" atau jejak "Aktivitas" beranda.
- Pustaka sinkron (RxDB/PowerSync).

## Keputusan

| Hal | Keputusan |
|---|---|
| Riwayat | Dua daftar: **Terakhir dibuka** (otomatis, lokal, 30 hari, `riwayat.ts`, tak pernah dikirim) dan **Tersimpan** (tombol Simpan, tanpa kedaluwarsa, disinkron, `tersimpan.ts`) |
| Arsitektur sinkron | Lokal dulu: layar baca/tulis localStorage, `sinkron.ts` mengirim lewat antrean ke `RepositoriPengguna` |
| Hari aktif (tahap 5) | Menyelesaikan ≥1 kegiatan belajar: pelajaran selesai, soal hitung dijawab, atau kuis dijawab (benar/salah sama) |
| Data untuk tahap 5 | Tabel `log_kegiatan`, insert saja, waktu dari server |

## Data lokal

- `riwayat.ts` → "Terakhir dibuka". Perilaku sekarang tetap.
- `tersimpan.ts` (baru): daftar `RiwayatTersimpan` (id kasus, kasus, judul, `disimpanPada`). Tombol "Simpan" di layar
  hasil menambah/menimpa entri; bisa dihapus dari halaman Riwayat.
- `preferensi.ts`: catatan pelajaran/soal/kuis berganti format mengikuti tabel:
  - pelajaran: `{ selesai, diubahPada }` per slug;
  - latihan (soal hitung & kuis): `{ jenis, jawabanTerakhir, benar, jumlahCoba, diubahPada }` per soal.
  Format lama (`'selesai'`/`'benar'`/`'salah'`) dimigrasi sekali saat dibaca: `jumlahCoba = 1`, `diubahPada = 0`
  (kalah dari data mana pun yang punya waktu), `jawabanTerakhir = null`. Soal hitung lama yang `'selesai'` dianggap
  `benar = true`.
- Preferensi yang disinkron (satu objek `isi` + `diubahPada`): tujuan, bahasa, ukuran baca, tur dilihat, pilihan kecil.
  "Aktivitas" tetap lokal.
- Semua akses localStorage tetap dibungkus try/catch dengan cadangan memori seperti sekarang.

## Login

- Header web: "Masuk dengan Google"; setelah masuk: avatar dengan menu "Keluar".
- `RepositoriAkun.masukGoogle(location.href)`, klien Supabase yang sama dengan portal.
- Supabase tidak terjangkau → pesan "Layanan akun sedang tidak tersedia"; fitur lokal tetap jalan.

## Penggabungan (`gabung.ts`, fungsi murni)

Dijalankan sekali per perangkat, saat akun pertama kali masuk di perangkat itu: tarik data server → gabung dengan
lokal → tulis hasil ke lokal → kirim baris yang berbeda dari server. Sesudahnya, tiap aplikasi dibuka: kirim antrean
dulu; bila antrean kosong, data lokal diganti data server (semua perubahan lokal sudah lewat antrean). Menggabung di
setiap buka akan menghidupkan lagi kasus tersimpan yang sudah dihapus di perangkat lain.
Akun lain masuk di perangkat yang masih menyimpan data akun sebelumnya → data lokal dibersihkan dulu, tidak digabung.

- Tersimpan: gabung per id kasus; id sama → `disimpanPada` terbaru.
- Progres belajar: `selesai` = OR; `diubahPada` = maksimum.
- Progres latihan: per (jenis, soal) ambil `diubahPada` terbaru; `jumlahCoba` = maksimum keduanya.
- Preferensi: `diubahPada` terbaru, utuh satu objek.

## Sinkron (`sinkron.ts`)

- Setelah login, tiap perubahan: tulis lokal → masukkan ke antrean `arif-waris:antrean` → coba kirim.
- Antrean dikunci per baris (tabel + kunci baris); entri baru menimpa entri lama dengan kunci sama. Hapus
  tersimpan = entri operasi hapus.
- Kirim ulang saat event `online`, saat aplikasi dibuka, dan saat login.
- Konflik antar perangkat: `diubah_pada` terbaru menang per baris, dijaga di SQL (upsert hanya bila
  `excluded.diubah_pada > diubah_pada`) supaya perangkat berjam salah tidak menimpa data server yang lebih baru.
- Tanpa login: tidak ada antrean; semua hanya lokal.

## Keluar

1. Kirim antrean (batas tunggu beberapa detik).
2. Masih ada yang gagal → konfirmasi "N perubahan belum terkirim, tetap keluar?".
3. Hapus di perangkat semua kunci `arif-waris:*` di localStorage (tersimpan, progres, preferensi, antrean,
   "Terakhir dibuka", kasus yang sedang diisi, aktivitas). Cache konten di IndexedDB tidak disentuh.

## `log_kegiatan` (fondasi tahap 5)

```
log_kegiatan  id uuid (dari klien), user_id → auth.users (default auth.uid()),
              jenis ('pelajaran'|'soal'|'kuis'), slug text, benar bool null,
              terjadi_pada timestamptz default now()
```

- RLS: insert & select hanya baris sendiri; tidak ada update/delete.
- `terjadi_pada` dari server, bukan jam klien.
- `id uuid` dibuat klien; kirim ulang baris yang sebenarnya sudah masuk diabaikan (tidak dobel).
- Dicatat hanya saat login, lewat antrean yang sama. Log sebelum login tidak digabung (waktunya tidak bisa
  dipercaya); streak dihitung sejak akun dibuat.

## Pengujian

- `gabung.ts`: satu tes per aturan penggabungan.
- `sinkron.ts`: dengan repository `memori/` yang bisa diset gagal — antrean, penimpaan per kunci, kirim ulang.
- Migrasi format catatan lama.
- SQL: upsert dengan `diubah_pada` lebih lama tidak menimpa; RLS `log_kegiatan` (insert boleh, update/delete ditolak,
  tidak bisa membaca milik orang lain).
- Keluar membersihkan semua kunci pengguna.

## Risiko

- Kegiatan saat offline tercatat di `log_kegiatan` pada waktu terkirim, bisa jatuh di hari berikutnya → dibahas di
  spec tahap 5.
- Supabase di-pause → login gagal, data lokal aman; antrean menunggu.
- Perangkat bersama: data pengguna sebelumnya hilang dari perangkat hanya bila ia menekan Keluar.
