# Paket penulisan materi

Paket instruksi untuk model lain (Codex) yang menulis materi pelajaran. Titik masuknya `SKILL.md`.

| Berkas | Isi |
|---|---|
| `SKILL.md` | Instruksi utama dan alur kerja per pelajaran |
| `konsep-materi.md` | Orientasi (menyiapkan pelajar untuk menghitung), jenis isi, unsur wajib |
| `alur-belajar.md` | Cara menyusun supaya alurnya mengalir |
| `panduan-gaya.md` | Kaidah bahasa (EYD, KBBI, SPOK), nada, dan contoh |
| `format-materi.md` | Sintaks berkas (satu-satunya sumber; dipakai juga oleh parser aplikasi) |
| `kerangka-kurikulum.md` | 15 modul, 54 pelajaran: slug, sumber KB, pertanyaan pemandu, poin wajib |
| `daftar-periksa.md` | Periksa sebelum menyerahkan |
| `contoh/` | Dua pelajaran jadi: 5.1 Hajb dan 6.2 'Aul |

## Memakai dengan Codex

Salin atau tautkan folder ini sebagai skill (misalnya `~/.codex/skills/tulis-materi-faraidh/`), atau cukup minta
Codex membaca `docs/materi-kit/SKILL.md` di awal sesi. Contoh perintah:

> Baca docs/materi-kit/SKILL.md lalu tulis modul 1 sesuai kerangka.

Pemeriksa `pnpm materi:cek` dan blok baru di aplikasi dibangun menurut `docs/design/spec-blok-materi.md` (fase F1
dan F2). Sebelum F1 selesai, Codex tetap bisa menulis; pemeriksaan dijalankan setelah pemeriksa tersedia.
