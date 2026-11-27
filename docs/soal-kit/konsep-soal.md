# Konsep soal

## 1. Soal menguji memakai kaidah

Pelajaran faraidh menyiapkan pelajar untuk menghitung (`docs/materi-kit/konsep-materi.md`), jadi soal menilai
kemampuan yang sama: **memutuskan sesuatu pada sebuah kasus**. Pertanyaan yang baik meminta pelajar menentukan
siapa yang gugur, berapa bagian seseorang, kapan 'aul terjadi, atau penyebut akhirnya, bukan menyebutkan ulang
definisi.

- **Kasus dulu.** Kalimat soal menyebut susunan ahli waris yang konkret, lalu satu pertanyaan.
- **Definisi dibatasi.** Dalam satu paket, paling banyak seperlima soal yang menanyakan pengertian, jumlah, atau
  sebutan (modul 1 dan 2 boleh lebih, karena isinya memang pengantar). Soal definisi tetap harus punya pengecoh
  yang beralasan.
- **Satu soal, satu kemampuan.** Kalau soal baru benar karena pelajar memeriksa hajb, lalu menghitung 'aul, lalu
  membulatkan, pecah menjadi tiga soal atau naikkan tingkatnya dan beri pengecoh di tiap tahap. Kemampuan itu
  dinyatakan lewat `topik`.
- **Satu jawaban pasti.** Jawaban benar harus pasti menurut KB [SYF]. Soal yang jawabannya bergantung pada pilihan
  madzhab menyebut madzhabnya di kalimat soal ("Menurut madzhab Syafi'i, ...").

## 2. Topik: token label bank soal

Tiap soal menyatakan kemampuan yang diujinya dengan satu sampai tiga **token label**, bahasa yang sama dengan bank
soal hitung (daftar dan artinya di `packages/latihan/src/bank/labelSoal.ts`, `ARTI_TOKEN_LABEL`). Contoh:
`hajb:SAUDARA_SEIBU`, `aul:6>10`, `radd`, `tashih`, `inkisar:2`, `bernama:akdariyyah`, `kakekSaudara`.

Dua manfaat: soal pilihan ganda dan soal hitung bisa dicari dengan filter yang sama, dan pemeriksa memastikan
kasus soal benar-benar menghasilkan label itu di engine (soal "tentang 'aul 6 ke 7" tidak boleh memakai kasus yang
ternyata tidak 'aul).

Pokok bahasan yang tidak lahir dari jejak engine (tirkah, wasiat, penghalang waris, takharuj, murtad, dan
sebagainya) memakai `konsep:<kata>`, misalnya `konsep:urutan-tirkah`. Token ini tidak dicocokkan engine.

## 3. Tingkat

Tingkat menentukan XP dan bobot di Latihan. Pegangan untuk penulis (boleh berbeda dari tingkat otomatis soal hitung
di bank, karena yang dinilai di sini cara berpikirnya):

| Tingkat | Ciri |
|---|---|
| `dasar` | Satu kaidah, 2 sampai 4 ahli waris, satu langkah keputusan. Pengecohnya salah paham yang paling umum. |
| `menengah` | Dua kaidah bekerja bersama (hajb lalu 'aul, ashabah bil ghair lalu tashih), atau pengecoh yang menuntut membedakan dua keadaan yang mirip. |
| `sulit` | Tiga kaidah atau lebih, kasus bernama, kakek bersama saudara, atau keluarga lanjutan; pelajar harus memeriksa urutan tahap dengan teliti. |

Sebaran per modul ada di `kerangka-soal.md`.

## 4. Angka berasal dari engine

Soal yang menyebut **bagian, saham, atau penyebut** (1/6, 3/7, "ashl 24", "5 saham") memakai kasus yang angkanya
dihitung engine. Penulis tidak menghitung sendiri lalu berharap benar; yang dilakukan:

1. Tulis susunan ahli waris di blok soal (`pewaris`, `ahli waris`), atau pakai kode soal bank (`kode-bank: G1-B-...`).
2. Tulis `harapan` dari hitungan sementara.
3. Jalankan `pnpm soal:cek`. Kalau `harapan` berbeda, pemeriksa mencetak angka engine ("Engine: ..."). Salin angka itu
   dan sesuaikan kalimat soal, alasan pilihan, dan pembahasan.

Soal yang menyebut angka tanpa kasus ditolak, kecuali angkanya bukan saham waris dan diberi alasan lewat
`tanpa-kasus:` (misalnya batas wasiat 1/3). Pemeriksa menampilkannya sebagai peringatan supaya peninjau melihatnya.

Saat memakai kode bank: kode itu menetapkan susunan ahli waris yang sudah dijamin bisa dihitung engine dan
sudah berlabel. Gunakan bila kamu ingin soal pilihan ganda dan soal hitung membahas kasus yang sama.

## 5. Kaitan ke modul

Tiap paket dibuat untuk satu modul kurikulum (`modul:` di kepala berkas, 1 sampai 15) dan dirujuk dari pelajaran
modul itu: alasan pilihan boleh menaut ke bagian pelajaran dengan `[[>5-1-hajb#5e]]`. Slug pelajaran diambil dari
`docs/materi-kit/kerangka-kurikulum.md`. Nomor bagian dicek bila berkas pelajarannya sudah ada di `konten/materi/`.
