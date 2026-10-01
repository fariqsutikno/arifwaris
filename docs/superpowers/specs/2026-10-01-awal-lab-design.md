# Awal Lab (halaman utama Lab Hitung) — Sub-proyek A

Status: draf untuk ditinjau pemilik. Sub-proyek B (bangku eksperimen) dan C (Lab ↔ Belajar) punya spek sendiri.

## Tujuan
Layar `AwalHitung` berubah dari menu tiga kartu menjadi tempat kerja yang hidup: kasus diberi nama, disimpan ke akun,
dan bisa disematkan; pohon keluarga kasus terakhir tampil sebagai panggung. Pemakai kembali ke kasus yang sedang
dikerjakan dengan satu ketukan.

## Keputusan pemilik (dasar spek)
- Struktur ulang total, bebas berkreasi, tidak flat, terasa laboratorium.
- Kasus diberi nama ("Keluarga X"); data tersimpan juga di DB.
- Arah visual: gabungan hero pohon hidup + rak berkas bernama.
- Aksi sekunder berupa teks/tautan, bukan tombol berbingkai (CLAUDE.md). Ikon SVG, bukan emoji.
- Bagian tanpa isi tidak dirender; urutan mengikuti pertanyaan pengguna.

## Susunan layar (atas ke bawah)
1. **Hero panggung** — hanya bila ada kasus terakhir: `PratinjauPohon` dalam kotak gelap teal, harta mengalir pelan ke
   penerima; di bawahnya nama kasus, ringkasan, tombol utama **Lanjutkan**. Tanpa kasus terakhir: `HeroMini` dengan
   ajakan **Mulai skenario baru** (aksi utama).
2. **Mulai cepat** — chip susunan keluarga; satu ketukan membuka wizard dengan ahli waris terisi (hanya mengisi input
   awal wizard, tanpa aturan fikih baru).
3. **Rak Eksperimen** — kasus bernama (`tersimpan`), yang disematkan di depan; kartu berkas dengan pohon mini, ukuran/
   sudut tidak seragam, penanda "belum lengkap". Kosong → tidak dirender. Tag madzhab disiapkan datanya tetapi baru
   tampil setelah Sub-proyek B.
4. **Terakhir dibuka** — riwayat 14 hari (`MASA_BERANDA`) dikelompokkan Hari ini / Kemarin / Pekan ini; tautan teks
   "Simpan jadi eksperimen" meminta nama. Pencarian muncul bila entri > 8.
5. **Strip latihan** — 3 soal belum dikerjakan (`PintasanSoal`), dibuka sebagai eksperimen.
6. **Aksi teks** — Skenario baru, Impor file, Lihat semua riwayat.
7. **Jejak lab** — satu baris ringkas (jumlah eksperimen); muncul hanya bila ada data.

## Data
- Nama = `judul` pada `RiwayatTersimpan` (`packages/data/src/antarmuka.ts`), tabel `riwayat_hitung`. Sudah sinkron ke
  akun lewat antrean (`tersimpan.ts`, `akun/antrean.ts`). `judul` default = `ringkasKasus(kasus).judul`, bisa diganti
  pengguna lewat dialog "Beri nama".
- Tambah `disematkan: boolean` (opsional di tipe, default `false`) dan kolom `disematkan boolean not null default false`
  pada `riwayat_hitung` lewat migrasi baru. Data lama aman. Migrasi baru diterapkan ke Supabase hanya setelah
  konfirmasi pemilik.
- Tombol Simpan di Hasil meminta nama (isian sudah terisi default); hasil masuk Rak. `riwayat.ts` ("terakhir dibuka",
  perangkat saja, 30 hari) tidak berubah bentuk.
- Tamu: tersimpan di perangkat; setelah login memakai penggabungan `akun/gabung.ts` yang ada.
- Pengelompokan per hari adalah fungsi murni terpisah (mudah dites).

## Gerak dan suara
- Hanya `transform` dan `opacity`; pohon > 40 orang cukup memudar; mati total pada `prefers-reduced-motion`.
- Suara: belum ada sistem suara di kode (hanya dirancang di `rencana-pengalaman-dan-fitur.md` §1.2). Tidak dibangun di
  sub-proyek ini; ditunda sampai sistem suara dibangun sebagai fitur sendiri.

## Teks
Semua teks baru lewat `t()` dan `pnpm diksi:tambah`; tanpa hardcode. RTL/Arab ikut diperiksa.

## Pengujian
- Unit: pengelompokan per hari, penyematan/urutan Rak, penamaan, default judul.
- Komponen: tiap bagian tidak dirender saat datanya kosong; hero dua keadaan.
- Sinkron: `disematkan` ikut antrean dan gabung.
- Browser: desktop, HP, RTL, gerak dikurangi.

## Di luar cakupan
Perbandingan madzhab, "bagaimana kalau", kasus khusus sebagai percobaan (B); tautan ke Belajar (C); suara; Mode Cerita AI.

## Titik yang perlu dikonfirmasi saat implementasi
- Daftar chip Mulai cepat (susunan apa saja) dan field kasus yang diisi.
- Apakah Simpan di Hasil dan Rak menyatu penuh, atau Rak hanya memuat yang diberi nama.
