# Konsep: Web Dua Bahasa (Indonesia + Arab)

Status: langkah 1–3 dari "Urutan kerja" sudah jalan untuk beranda, ArifLab, wizard, hasil (kamus UI di `apps/web/src/konten/kamusArab.ts`, dijaga test `kamusArab.test.ts`; halaman Belajar/Latihan/Rujukan belum) (`id+ar`, penjelasan langkah berbahasa Arab di `packages/explain/src/arab.ts`). Redaksi Arab masih draf, menunggu cek tim keilmuan.

## Tujuan

Membantu orang **belajar**, bukan sekadar menerjemahkan UI. Pembelajar faraidh membaca kitab
(al-Lahim, dst.) dalam bahasa Arab, sedangkan aplikasi berbahasa Indonesia. Jembatannya adalah
**istilah**: pengguna melihat الأخت الشقيقة di samping "saudara perempuan kandung", عَول di samping
"'aul", sehingga lama-lama terbiasa membaca bab faraidh di kitab.

## Tiga mode tampilan

| Mode | Isi | Untuk siapa |
|---|---|---|
| `id` (bawaan) | seperti sekarang | orang awam yang ingin menghitung |
| `id+ar` | teks Indonesia, **istilah & peran diberi padanan Arab** di sampingnya / di bawahnya | pelajar (mode utama fitur ini) |
| `ar` | seluruh UI, narasi, dan materi dalam bahasa Arab, `dir="rtl"` | penutur/pelajar Arab lanjutan |

Rekomendasi: **kerjakan `id+ar` dulu**. Mode `ar` penuh jauh lebih mahal (lihat Tahap 3) dan
manfaat belajarnya sebagian besar sudah didapat dari `id+ar`.

## Apa yang sudah ada

- `packages/content/src/glossary.ts`: tiap istilah sudah punya kolom `arab` dari KB bab 15.
  → sumber padanan Arab untuk istilah, **tanpa data baru**.
- `packages/explain/src/people.ts`: `LABEL_PERAN` (kunci ahli waris → sebutan Indonesia).
  Narasi menyusun `Potongan` (segmen terstruktur), bukan string mentah → cocok untuk disisipi
  segmen Arab.
- `apps/web/src/preferensi.ts`: tempat menyimpan pilihan bahasa (localStorage + cadangan memori).
- Teks UI terkumpul di `apps/web/src/konten/*.ts` → sudah terpisah dari komponen.

## Tahap 1 — `id+ar` untuk istilah & peran (kecil)

1. **Preferensi**: tambah `bahasa: 'id' | 'id+ar'` di `preferensi.ts`; tombol pilih di pengaturan/header.
2. **Peran ahli waris**: tambah `LABEL_PERAN_ARAB: Record<KunciAhliWaris, string>`
   (ابن، بنت، زوج، أخت شقيقة، …). Diambil dari KB bab 3 / glosarium bab 15, **bukan dikarang**;
   yang belum ada di KB → dikosongkan dan ditandai untuk tim keilmuan.
3. **Istilah dalam narasi & materi**: `Potongan` jenis `istilah` sudah membawa `id` glosarium →
   komponen web cukup menampilkan `glosarium[id].arab` bila mode `id+ar`. Tidak ada perubahan di engine.
4. **Tampilan**: `<span lang="ar" dir="rtl" class="arab">` di dalam kalimat Indonesia
   (browser menangani bidi; `lang` penting untuk pembaca layar dan font).
   Font Arab: satu webfont (mis. Amiri / Noto Naskh Arabic) di `token.css`, ukuran sedikit lebih besar.

Hasil: kartu ahli waris, tabel hasil, narasi langkah, glosarium, dan materi menampilkan padanan Arab.
Engine, math, dan test regresi bab 16 **tidak tersentuh**.

## Tahap 2 — Materi dengan kutipan Arab (konten, bukan kode)

- Tim keilmuan boleh menulis kutipan kitab/dalil di `docs/materi/*.md` memakai blok baru
  ```` ```arab ```` (teks Arab + opsional terjemah). Parser `materi.ts` menambah satu jenis blok.
- Ayat/hadits hanya dari `docs/kb` atau `docs/rujukan` — aturan "KB sumber kebenaran" tetap berlaku.

## Tahap 3 — Mode `ar` penuh (besar; urutan terbaru lihat "Urutan kerja")

Perlu:
- Kamus UI: `konten/*.ts` diubah jadi `Record<Bahasa, …>` atau berkas `konten/ar/*.ts` paralel.
- Narasi Arab di `packages/explain`: tata bahasa Arab (mudzakkar/muannats, mutsanna, jamak) tidak bisa
  hasil terjemah kata per kata → butuh generator narasi terpisah (`narasi-ar.ts`), bukan tabel string.
- Materi & soal versi Arab ditulis ulang oleh tim keilmuan.
- Tata letak RTL: `dir="rtl"` di `<html>`, CSS diganti ke properti logis
  (`margin-inline-start` bukan `margin-left`), ikon panah dicerminkan.
- Angka: angka Arab (٠١٢٣) — diputuskan 2026-09-26.

Perkiraan: beberapa kali lipat Tahap 1+2. Layak hanya bila memang ada target pengguna berbahasa Arab.

## Tidak diubah

- Engine tetap menghasilkan data (`LangkahJejak`, kunci seperti `ANAK_PR`); bahasa urusan `explain` & `web`.
- Tidak memakai pustaka i18n (react-i18next dsb.) untuk Tahap 1–2: cukup satu preferensi dan satu tabel label.
  Pertimbangkan ulang bila Tahap 3 dikerjakan.

## Keputusan (2026-09-26)

1. **Target utama: santri pondok** yang belajar faraidh sepenuhnya berbahasa Arab.
   → Mode `ar` bukan lagi "tunda"; urutan kerja diubah (lihat bawah).
2. **Tasykil bisa dipilih pengguna** (berharakat / gundul). Teks Arab selalu *disimpan berharakat*;
   versi gundul = buang harakat saat tampil (`/[\u064B-\u0652\u0670]/g`), jadi cukup satu sumber data.
3. Posisi padanan Arab: bebas → sebaris di samping istilah (paling sederhana).
4. **Tim keilmuan** memverifikasi semua teks Arab (label peran, kolom `arab` glosarium, narasi Arab).

## Urutan kerja (setelah keputusan)

1. Tahap 1 `id+ar` + saklar tasykil — cepat, langsung terpakai.
2. **Hasil & langkah hitung dalam bahasa Arab** — prioritas bagi santri: tabel masalah
   (أصل المسألة، العول، التصحيح، السهام) dan narasi langkah seperti di kitab. Generator narasi Arab
   terpisah di `packages/explain`, memakai `LangkahJejak` yang sama.
3. UI penuh `ar` + RTL.
4. Materi & soal versi Arab (konten tim keilmuan).

## Catatan implementasi mode `ar`

- `t('teks Indonesia', { sisipan })` di `apps/web/src/terjemah.ts`; kunci kamus = teks Indonesia apa adanya, yang belum diterjemahkan tampil Indonesia.
- Ganti bahasa memuat ulang halaman, jadi `t()` boleh dipakai di konstanta `konten/*`.
- CSS memakai properti logis (`margin-inline-start`, `text-align:start`), `<html dir="rtl">` saat bahasa Arab.
- Angka tampil sebagai angka Arab (`angka()`), isian menerima ١٢٣ maupun 123 (`angkaLatin()`).
