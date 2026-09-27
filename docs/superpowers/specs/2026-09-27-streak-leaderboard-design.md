# Streak, XP & Papan Peringkat (Tahap 5) — Desain

Status: disetujui dalam diskusi 2026-09-27. Branch: `fitur/tahap5-streak-leaderboard`.
Melanjutkan [akun pengguna](2026-09-27-akun-pengguna-design.md). Login Google, sinkron, dan `log_kegiatan` sudah ada
di sana dan tidak berubah; tahap ini membaca `log_kegiatan` untuk streak, XP, dan papan peringkat.

## Tujuan

1. Pengguna yang login melihat streak harian (check-in otomatis) dan XP-nya.
2. Papan peringkat mingguan dan sepanjang waktu, hanya berisi pengguna yang memilih ikut (opt-in).
3. Kuis punya tingkat kesulitan seperti soal hitung, supaya XP-nya bisa dibedakan.

## Bukan tujuan

- Metode login selain Google.
- Streak freeze, lencana, notifikasi pengingat.
- Moderasi nama tampilan (dicatat di Risiko).
- Profil publik selain nama tampilan (dan avatar bila diizinkan) di papan peringkat.

## Keputusan

| Hal | Keputusan |
|---|---|
| Check-in harian | Otomatis: hari aktif = ≥1 kegiatan belajar (pelajaran selesai, soal hitung, kuis benar/salah) — definisi spec akun |
| Batas hari | 00:00 di zona waktu profil (default `Asia/Jakarta`); waktu dari server |
| Toleransi luring | Kegiatan tercatat 00:00–01:59 lokal menutup **kemarin** bila kemarin belum aktif dari kegiatan lain; selain itu hari ini |
| Streak freeze | Tidak ada |
| XP | Tabel di bawah; hanya **pertama kali** per konten; jawaban salah 0 |
| Periode papan | Mingguan (mulai Senin 00:00 WIB, sama untuk semua) dan sepanjang waktu |
| Ikut papan | Opt-in; default tidak ikut |
| Hitungan | Di Postgres dari `log_kegiatan`; klien hanya menampilkan |
| Tingkat kuis | Field `tingkat` opsional di `soal_kuis`, kosong = `dasar`; diisi dari form portal |

### XP

| Kegiatan | Dasar | Menengah | Sulit |
|---|---|---|---|
| Soal hitung, pertama kali benar | 10 | 20 | 30 |
| Kuis, pertama kali benar | 5 | 10 | 15 |
| Pelajaran, pertama kali selesai | 10 | | |
| Hari aktif | 2 | | |

- "Pertama kali" dihitung dari seluruh `log_kegiatan` pemilik, jadi reset progres tidak membuka XP lagi.
- Hanya slug yang **terbit** (materi / soal_hitung / soal_kuis) yang dihitung, termasuk untuk hari aktif; log dengan
  slug karangan tidak memberi apa-apa.
- Tingkat dibaca dari revisi terbit **saat dihitung**: bila admin mengubah tingkat, XP lama ikut berubah.
- XP mingguan: kegiatan konten masuk minggu (WIB) saat `terjadi_pada`; bonus hari aktif masuk minggu tanggalnya.

## Data

```
profil  user_id → auth.users (pk, default auth.uid()), nama_tampilan text (1–40, tanpa spasi tepi),
        ikut_papan_peringkat bool default false, tampilkan_avatar bool default false,
        zona_waktu text default 'Asia/Jakarta' (dicek terhadap pg_timezone_names)
```

- RLS: baca/tulis baris sendiri saja. Tidak ada baris = belum pernah atur profil = tidak ikut papan, zona WIB.
- Profil **tidak** lewat antrean lokal: hanya dibuka di halaman yang memang butuh jaringan.
- Nama bawaan di form = nama depan dari Google (`user_metadata.full_name`), bisa diganti.
- Avatar = `raw_user_meta_data.avatar_url` Google, hanya tampil bila `tampilkan_avatar`.

## Fungsi SQL

Fungsi internal (tidak bisa dipanggil klien):

- `hari_aktif(p_user uuid)` → `(user_id, tanggal)`; `null` = semua pengguna. Menerapkan batas hari & toleransi.
- `peristiwa_xp(p_user uuid)` → `(user_id, xp, minggu)`; konten pertama kali + bonus hari aktif.
- `streak(p_user uuid)` → `(user_id, streak_sekarang, streak_terpanjang, aktif_hari_ini)`.
  Streak sekarang = rangkaian hari berturut-turut yang berakhir hari ini atau kemarin (atau lusa selagi masih
  00:00–01:59, karena kemarin masih bisa ditutup toleransi).

Dipanggil klien (`security definer`, `search_path` dikunci):

- `ringkasan_saya()` → xp total, xp minggu ini, streak sekarang, streak terpanjang, aktif hari ini. `authenticated`.
- `papan_peringkat(p_periode 'minggu'|'semua', p_batas int ≤ 100)` → peringkat, nama, avatar, xp, streak, `saya`.
  `anon` & `authenticated`. Hanya yang ikut dan xp > 0; peringkat = `rank()` (seri berbagi peringkat).
  Baris pemanggil ditambahkan bila ia ikut tapi di luar batas.

## Web

- **Beranda** (login): kartu streak & XP — "🔥 N hari", XP total, XP minggu ini, sudah/belum aktif hari ini,
  tautan ke papan peringkat. Tanpa login: tidak tampil.
- **`#/peringkat`**: tab Mingguan / Sepanjang waktu. Belum login → ajakan masuk. Login tapi belum ikut → kartu
  "Tampilkan namaku di papan" (isi nama → ikut). Baris sendiri disorot.
- **Menu akun** → "Profil": nama tampilan, ikut papan, tampilkan avatar, zona waktu.
- Ringkasan dimuat tiap Beranda dibuka (antrean sudah dikirim saat aplikasi dibuka); kegiatan yang masih di antrean
  baru terhitung setelah terkirim. Gagal jaringan → kartu disembunyikan, tidak ada angka palsu.
- Semua teks lewat diksi (halaman `akun`), masuk DB lewat `konten:pulihkan`.

## Repository (`@waris/data`)

- `RepositoriPengguna`: `bacaProfil()`, `simpanProfil(profil)` (langsung, tanpa antrean).
- `RepositoriPeringkat` (baru, `repo.peringkat`): `ringkasanSaya()` (butuh login), `papan(periode, batas)` (tanpa login pun jalan).
- `Sesi` ditambah `nama` dan `avatar` opsional (metadata Google) untuk nilai bawaan form profil.
- `memori/`: hitungan tidak ditiru; tes mengeset nilai lewat `aturPeringkat` (null = layanan gagal). Hitungan diuji pgTAP.

## Pengujian

- pgTAP `06_peringkat.test.sql`: XP per tingkat (hitung & kuis, kuis tanpa tingkat = dasar), pertama kali saja,
  salah = 0, slug tak terbit = 0, bonus hari aktif, streak berturut/putus, toleransi 00:00–01:59 (menutup kemarin
  hanya bila kemarin kosong), minggu WIB, papan hanya opt-in, anon bisa baca papan tapi tidak profil, RLS profil,
  fungsi internal tidak bisa dipanggil klien, zona waktu tidak sah ditolak.
- Web: rute `#/peringkat`, kartu beranda (ada/tanpa sesi), form profil.
- Konten: skema kuis menerima tanpa/dengan `tingkat`; form portal punya bidang tingkat kuis.

## Risiko

- **Soal hitung**: web mencatat `benar = true` saat jawaban dibuka (`tandaiSoalDikerjakan`), belum dari tebakan yang
  benar. Artinya XP soal hitung = "pertama kali dikerjakan". Dipisah bila nanti ada penilaian jawaban.
- Nama tampilan kasar belum bisa dimoderasi; admin bisa menghapus baris profil lewat dashboard Supabase.
- Ganti zona waktu bisa menggeser batas hari sekali; diterima (tidak memberi XP konten baru).
- Hitungan dilakukan tiap panggilan atas seluruh log; bila lambat nanti → materialized view / tabel ringkasan.
