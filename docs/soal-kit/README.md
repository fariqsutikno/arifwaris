# Paket penulisan soal pilihan ganda

Paket instruksi untuk model lain (Codex) yang menulis soal pilihan ganda faraidh, setara dengan `docs/materi-kit/`
untuk materi. Titik masuknya `SKILL.md`. Hasilnya berupa berkas Markdown yang diperiksa mesin (`pnpm soal:cek`),
terutama supaya **setiap angka pada soal sama dengan hasil engine**.

| Berkas | Isi |
|---|---|
| `SKILL.md` | Instruksi utama dan alur kerja per paket soal |
| `konsep-soal.md` | Apa yang diuji soal, satu soal satu kemampuan, tingkat, kaitan ke modul dan label bank |
| `pengecoh.md` | Salah paham nyata per topik, dasar KB-nya, dan cara menulis alasan pilihan |
| `format-soal.md` | Sintaks berkas (satu-satunya sumber; dipakai parser pemeriksa), kode soal, kasus untuk verifikasi angka, laporan |
| `kerangka-soal.md` | Jumlah dan sebaran soal awal per modul, topik wajib |
| `panduan-gaya-soal.md` | Tambahan gaya khusus soal; selebihnya ikut `docs/materi-kit/panduan-gaya.md` |
| `daftar-periksa.md` | Periksa sebelum menyerahkan |
| `contoh/` | Dua paket jadi: modul 5 (hajb) dan modul 6 ('aul), angkanya sudah dicocokkan engine |

## Memakai dengan Codex

Salin atau tautkan folder ini sebagai skill (misalnya `~/.codex/skills/tulis-soal-faraidh/`), atau minta Codex
membaca `docs/soal-kit/SKILL.md` di awal sesi. Contoh perintah:

> Baca docs/soal-kit/SKILL.md lalu tulis paket soal modul 5 sesuai kerangka.

Letak kiriman: `konten/soal/modul-NN/<nama-paket>.md`. Pemeriksa:

```bash
pnpm soal:cek konten/soal            # semua paket (tambah --json untuk keluaran mesin)
pnpm soal:cek docs/soal-kit/contoh   # kedua contoh lolos
```

## Yang diperiksa mesin dan yang tidak

Diperiksa: sintaks, kode soal (skema `P-NN-NNN`, unik se-repo), kode rujukan KB, istilah glosarium, tautan
pelajaran, token topik, **topik cocok dengan label yang dihasilkan engine**, **saham dan penyebut di `harapan`
sama dengan engine**, soal bermuatan angka wajib berkasus, petunjuk jawaban yang terlalu jelas (pilihan benar paling
panjang, semua jawaban benar di urutan yang sama, frasa "semua benar").

Belum diperiksa mesin (tanggung jawab penulis dan peninjau fikih):
- kebenaran fikih dari kalimat soal dan alasan pilihan di luar angka (dicocokkan ke KB oleh penulis);
- angka kasus **lanjutan** (munasakhat, gharqa, mafqud, khuntsa, haml, dzawil arham): pemeriksa baru mencocokkan
  label, belum saham. Soal lanjutan karena itu ditulis tanpa angka pecahan (lihat `format-soal.md` bagian 4).

## Setelah lolos pemeriksa

`pnpm soal:impor <berkas|folder>... [--kering]` memasukkan paket yang lolos `soal:cek` ke bank `soal_kuis`
(`sumber = 'paket:<nama>'`) sebagai revisi **diajukan**. Soal lalu melewati review dua tahap di portal: reviewer
mencentang checklist 5 butir dan menandai *diperiksa*, lalu tim keilmuan menyetujui. Soal baru tampil setelah
disetujui. Isi yang sama dilewati; soal yang sedang direview tidak ditimpa.
