---
name: Arif Waris
description: Kalkulator waris dan belajar faraidh yang tampil sebagai peta jalur, dua lintas berwarna dengan stasiun bernomor.
colors:
  surface: "#f3f7fa"
  surface-raised: "#ffffff"
  surface-sunken: "#e6eef4"
  divider: "#d9e4ec"
  outline: "#b4c5d3"
  control-edge: "#6b8397"
  motif-dot: "#cfdce6"
  ink: "#102a43"
  ink-muted: "#4f6478"
  hitung-teal: "#0a7c88"
  hitung-teal-soft: "#dcf1f3"
  belajar-blue: "#1f66d1"
  belajar-blue-soft: "#dbeafb"
  transfer-amber: "#f0b429"
  attention-sand: "#fff0c7"
  danger: "#c62a2f"
  danger-soft: "#fde5e3"
  focus: "#1a56db"
  group-pasangan: "#d3e2fb"
  group-keturunan: "#cdeee6"
  group-leluhur: "#e1dcf7"
  group-saudara: "#ffe6cc"
  night-surface: "#0e1b28"
  night-raised: "#152636"
  night-ink: "#e6eef5"
  night-hitung: "#4fd1c5"
  night-belajar: "#7aa2ff"
typography:
  display:
    fontFamily: "Barlow Semi Condensed, Barlow, system-ui, sans-serif"
    fontSize: "clamp(38px, 5.6vw, 64px)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow Semi Condensed, Barlow, system-ui, sans-serif"
    fontSize: "clamp(28px, 4vw, 38px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Barlow Semi Condensed, Barlow, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.25
  arabic:
    fontFamily: "Noto Kufi Arabic, serif"
    fontSize: "inherit"
    fontWeight: 400
rounded:
  sm: "8px"
  md: "12px"
  lg: "18px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "28px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.hitung-teal}"
    textColor: "{colors.surface-raised}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 22px"
  button-secondary:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.hitung-teal}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 8px"
  chip:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 18px"
  board-peta:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "22px 24px 6px"
  step-sheet:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "32px 36px 40px"
---

# Design System: Arif Waris

## Overview

**Creative North Star: "Peta Jalur"**

Kasus waris digambarkan seperti diagram jalur KRL/MRT dan papan penunjuk stasiun. Ground putih dingin, tinta biru-malam, dua lintas berwarna: teal untuk Hitung, biru untuk Belajar. Setiap langkah wizard, setiap modul, dan setiap langkah hasil adalah stasiun bernomor di sebuah garis; pengguna selalu tahu posisi dan langkah berikutnya.

Kesannya bersih, adem, sedikit futuristik, dan padat informasi tanpa ramai. Kedalaman datang dari garis tipis (1px) dan bayangan lembut berblur, bukan kontur tebal. Sistem ini menggantikan dunia neobrutalis lama (kontur 2px, bayangan keras); sisa-sisanya dianggap drift, bukan acuan.

**Key Characteristics:**
- Garis jalur berujung bulat (3-4px), simpul stasiun berupa cincin (border 3px, isi putih; terisi saat selesai).
- Dua warna jalur yang tidak dipertukarkan; ambar hanya untuk perhatian dan titik transfer.
- Tipografi condensed tabular untuk judul, angka, dan pecahan; Barlow untuk isi.
- Mode terang dan gelap mengikuti `prefers-color-scheme`, dengan token yang sama.
- Aksi sekunder berupa teks atau ikon, bukan tombol berbingkai; hanya aksi utama yang terisi (keputusan produk).

## Colors

Palet dingin biru-hijau dengan satu aksen hangat yang langka.

### Primary
- **Teal Jalur Hitung** (#0a7c88; gelap #4fd1c5): jalur Hitung, tombol utama, stasiun aktif/selesai di stepper, tautan teks, kolom sorot tabel. Tint: **Teal Kabut** (#dcf1f3).

### Secondary
- **Biru Jalur Belajar** (#1f66d1; gelap #7aa2ff): jalur Belajar, nomor modul, progres, hero belajar. Tint: **Biru Kabut** (#dbeafb).

### Tertiary
- **Ambar Transfer** (#f0b429): titik transfer pada logo dan cincin sorot tur. Tint **Pasir Perhatian** (#fff0c7) untuk label perhatian.

### Neutral
- **Putih Dingin** (#f3f7fa) latar halaman; **Putih Lembar** (#ffffff) papan, lembar langkah, kartu; **Kabut Cekung** (#e6eef4) area cekung dan tombol sekunder.
- **Tinta Biru-Malam** (#102a43) teks; **Tinta Redup** (#4f6478) teks sekunder.
- **Garis Tipis** (#d9e4ec) pembatas kartu/panel; **Tepi Kontrol** (#6b8397) batas kontrol interaktif (3:1); **Titik Motif** (#cfdce6).
- **Bahaya** (#c62a2f) dengan tint #fde5e3; **Fokus** (#1a56db, gelap #8db2ff), cincin fokus 3px.
- Pastel kelompok ahli waris: pasangan #d3e2fb, keturunan #cdeee6, leluhur #e1dcf7, saudara #ffe6cc. Palet sorot langkah hitung (pewaris, ahli waris, penyebab, mahjub, bukan, fardh, ashabah) punya token `--sorot-*` sendiri, sama di pohon, tabel, dan legenda.

### Named Rules
**The Two Lines Rule.** Teal = Hitung, biru = Belajar. Tidak ada warna jalur ketiga; elemen lintas memakai `--jalur` yang diturunkan dari konteks.

**The Amber Is Attention Rule.** Ambar hanya untuk perhatian dan titik transfer. Bukan warna tombol, tautan, atau dekorasi.

## Typography

**Display Font:** Barlow Semi Condensed (fallback Barlow, system-ui)
**Body Font:** Barlow (fallback system-ui)
**Arabic:** Noto Kufi Arabic, dipaksa lewat `:lang(ar)` di mana pun Arab muncul.

**Character:** Condensed seperti papan stasiun untuk judul dan angka; Barlow yang ramah untuk isi. Angka lining, tabular pada nomor stasiun.

### Hierarchy
- **Display** (700, clamp(38px, 5.6vw, 64px), 1.02, -0.02em): judul Beranda, maks 14ch.
- **Headline** (700, clamp(28px, 4vw, 38px), 1.1): pertanyaan utama tiap langkah wizard; judul langkah 28px/34px.
- **Title** (600, 17-22px, 1.2): judul papan peta, nama lintas, judul dialog.
- **Body** (400, 17px, 1.6): isi; lead 19px berbatas 52ch; keterangan 14-15px.
- **Label** (600, 13-15px): label stasiun, tab, chip, stiker. Tanpa huruf kapital semua dan tanpa letterspacing khusus.

### Named Rules
**The Signboard Numerals Rule.** Angka, pecahan, dan nomor stasiun memakai Barlow Semi Condensed, tabular.

## Layout

Lebar konten maksimum 1200px. Beranda: hero dua kolom (1.05fr / 1fr, gap 48px), runtuh ke satu kolom di 900px. Wizard: lembar langkah putih di kiri, panel samping 320px di layar lebar (>900px), bar aksi bawah menempel. Ritme jarak 8/12/20/28/40px; sasaran sentuh minimal 44px. Breakpoint yang dipakai: 480, 560, 640, 720, 900, 1180px. Ponsel dan laptop setara: label stasiun disembunyikan di ponsel kecuali yang aktif.

## Elevation & Depth

Hibrida datar: garis tipis 1px (`--divider`) untuk pemisah, bayangan lembut berblur untuk papan dan lembar. Tanpa bayangan keras dan tanpa pendar.

### Shadow Vocabulary
- **Pop** (`0 1px 2px rgba(16,42,67,.06), 0 8px 22px -10px rgba(16,42,67,.22)`): papan peta, tur.
- **Pop kecil** (`0 1px 2px rgba(16,42,67,.08), 0 3px 10px -4px rgba(16,42,67,.18)`): tombol utama, lembar langkah, kartu pilihan, node hasil.
- **Bar bawah** (`0 -8px 24px -16px rgba(16,42,67,.25)`): bar aksi wizard.

### Named Rules
**The Soft Depth Rule.** Bayangan selalu berblur dan bernada biru-malam; tidak pernah offset keras tanpa blur.

## Shapes

Sudut lembut: 8px (kecil), 12px (tombol, kontrol), 18px (papan, lembar), pil 999px (chip). Garis jalur berujung bulat; simpul berupa lingkaran bercincin. Kontrol berbatas 1px `--kontrol`; kartu berbatas 1px `--divider`. Ikon garis satu gaya (24 viewBox, stroke 2.2, ujung bulat).

## Components

### Buttons
- **Shape:** sudut 12px, tinggi 48px (kecil 44px), Barlow 600 16px.
- **Primary:** isi teal, teks putih, bayangan pop kecil; hover menggelap 12% ke tinta.
- **Secondary:** isi Kabut Cekung, teks tinta.
- **Ghost:** transparan, teks/tautan bergaris bawah 1px (menebal 2px saat hover). Untuk aksi sekunder.
- Disabled: opacity .45. Fokus: cincin 3px `--focus`, offset 2px.

### Chips
Pil 44px, batas `--kontrol`; terpilih = isi teal, teks putih.

### Navigation (Bilah atas)
Item tinggi 64px, teks redup; halaman aktif mendapat garis jalur 3px di dasar dan simpul cincin 10px (warna jalur: teal Hitung, biru Belajar, tinta lainnya). Logo di kiri; di ponsel logo, akun, dan bahasa satu baris.

### Stepper wizard (komponen khas)
Daftar stasiun horizontal: lingkaran 34px bercincin 3px; garis penghubung 3px menyala teal sampai stasiun terjauh yang boleh dibuka; selesai = terisi teal; aktif = putih dengan halo 4px `--primary-soft`. Di ponsel hanya nama stasiun aktif tampil.

### Papan Peta Jalur (komponen khas)
Papan putih dengan dua lintas (Hitung, Belajar/Latihan) dipisah garis tipis. Tiap lintas: tanda ikon 30px berwarna jalur, rel 4px dengan stasiun 14px (sudah = terisi, kini = separuh + halo), keterangan, dan tautan aksi berwarna jalur. Satu-satunya gerak: rel tergambar sekali saat dibuka (0,55s, dinonaktifkan pada reduced motion).

### Logo dan Motif
Tanda 48px: kotak teal 13px-radius dengan garis lengkung bersimpul dan satu simpul ambar. Motif: kisi titik 28px berwarna `--motif`, dipakai sebagai latar dekoratif.

### Inputs
Isian putih berbatas 1px `--kontrol`, radius 8-12px, fokus cincin 3px; galat berwarna bahaya dengan teks tebal.

## Do's and Don'ts

### Do:
- **Do** wariskan `--jalur` dari konteks (hitung = teal, belajar = biru) untuk rel, tanda, dan tautan aksi.
- **Do** pakai ikon SVG garis satu gaya; teks Arab selalu Noto Kufi Arabic.
- **Do** jadikan aksi sekunder teks atau ghost; tombol terisi hanya untuk aksi utama.
- **Do** beri batas kontrol 3:1 (`--kontrol`) dan sasaran sentuh 44px.
- **Do** sediakan pasangan gelap untuk setiap token warna baru.

### Don't:
- **Don't** kembali ke kontur tebal 2px atau bayangan keras tanpa blur.
- **Don't** pakai emoji sebagai ikon.
- **Don't** pakai ambar untuk tombol, tautan, atau hiasan.
- **Don't** menyusun kartu berbingkai seragam sebagai pola halaman.
- **Don't** menambah warna jalur ketiga atau gradien dan pendar.

## Drift tidak dikanonkan
Sisa kode lama yang masih ada di build: `.aw-cnt button` berwarna literal #ffffff/#111322 (tidak mengikuti mode gelap), konfeti berborder #111322, warna tingkat #6ee7a8/#ffc266 literal, `.judul-beranda` di komponen.css (letter-spacing -2px, ditimpa jalur.css), dan kelas `aw-btn-sun` yang kini berisi teal-soft. Ini bukan aturan sistem.
