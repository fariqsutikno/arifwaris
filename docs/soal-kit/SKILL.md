---
name: tulis-soal-faraidh
description: Menulis paket soal pilihan ganda faraidh (waris Islam) untuk bank soal aplikasi ini, satu berkas Markdown per paket di konten/soal/modul-NN/, dengan angka yang diverifikasi engine. Pakai saat diminta menulis, menulis ulang, atau memperbaiki soal pilihan ganda faraidh.
---

# Menulis soal pilihan ganda faraidh

Kamu menulis soal latihan untuk mahasiswa dan orang awam yang belajar faraidh. Soal yang baik menguji apakah
pelajar **bisa memakai kaidah pada sebuah kasus**, dan setiap pilihan salah memperlihatkan salah paham yang
benar-benar terjadi. Isi fikih hanya dari knowledge base di `docs/kb/`, dan setiap angka bagian harus lolos
pemeriksa engine.

## Baca dulu (urut)

1. `docs/soal-kit/konsep-soal.md`: apa yang diuji, tingkat, kaitan ke modul dan label bank.
2. `docs/soal-kit/pengecoh.md`: salah paham nyata per topik dan cara menulis alasan pilihan.
3. `docs/soal-kit/format-soal.md`: sintaks berkas dan cara memverifikasi angka. Ketat.
4. `docs/soal-kit/kerangka-soal.md`: jumlah, sebaran tingkat, dan topik wajib tiap modul.
5. `docs/soal-kit/panduan-gaya-soal.md`, lalu `docs/materi-kit/panduan-gaya.md` (kaidah bahasa yang sama dengan materi).
6. Dua contoh jadi: `docs/soal-kit/contoh/hajb-dasar.md` dan `docs/soal-kit/contoh/aul-dasar.md`.
7. Pelajaran modul yang sama di `konten/materi/` (bila ada) dan baris modul itu di
   `docs/materi-kit/kerangka-kurikulum.md`, supaya istilah dan tautan `[[>slug#bagian]]` konsisten.

## Alur kerja per paket

1. Ambil baris modul di `kerangka-soal.md`. Baca bab KB di kolom sumbernya, termasuk tabel "Dasar dan Rujukan"
   dan kasus terkait di `docs/kb/16_kasus_uji.md`.
2. Daftarkan dulu **kemampuan** yang akan diuji (satu per soal) dan salah paham yang menyertainya, sebelum menulis
   kalimat soal. Pilih topik dari token label (`format-soal.md` bagian 5).
3. Tulis soalnya. Untuk soal yang menyebut bagian atau saham, tulis kasusnya (`pewaris`, `ahli waris`, `harapan`)
   atau pakai `kode-bank` dari bank soal. Jangan menebak angka: jalankan pemeriksa dan salin angka engine.
4. Tulis di `konten/soal/modul-NN/<nama-paket>.md`. Nomor kode soal melanjutkan nomor terbesar di modul itu
   (`P-05-007` setelah `P-05-006`).
5. Jalankan `pnpm soal:cek <berkas>`. Perbaiki sampai tanpa galat. Kalau angka berbeda dengan engine, yang benar
   engine: ubah soal, alasan, dan `harapan`, jangan memaksa angka.
6. Baca ulang dengan `daftar-periksa.md`. Hapus soal yang bisa dijawab tanpa memakai kaidah.
7. Setelah satu modul selesai, tulis `konten/soal/modul-NN/LAPORAN.md` (format di `format-soal.md` bagian 7), lalu
   commit dengan pesan `soal(modul-NN): <ringkas>`.

## Aturan keras

- Jangan mengarang hukum, alasan, hikmah, riwayat, atau nama kitab yang tidak ada di KB.
- Madzhab Syafi'i adalah posisi utama. Tarjih Lahim atau Ithraa yang condong Hanbali tidak boleh menjadi jawaban
  benar untuk soal bermadzhab Syafi'i. Soal khilaf menyebut madzhabnya di kalimat soal.
- Yang berstatus `[perlu verifikasi lanjut]` di KB tidak dijadikan soal.
- Jangan menulis soal tentang KHI (bukan fikih; hanya panel informasi di aplikasi).
- Satu soal, satu jawaban benar yang pasti menurut KB.
- Jangan mengubah berkas di luar `konten/soal/`. Kalau butuh token label, istilah glosarium, atau kasus yang
  belum didukung pemeriksa, tulis permintaannya di `LAPORAN.md`.
