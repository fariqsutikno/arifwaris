---
target: Lab Hitung (ArifLab) + Beranda
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:/home/fariqsutikno/Kuliah/0. Tugas Akhir/projects/apps/web/src/layar/Wizard.tsx"
target_fingerprint: "sha256:9ab30926e0fb529aed913b24d17dd90b2db838b150fff6870b8424e24cf07b23"
target_path: /home/fariqsutikno/Kuliah/0. Tugas Akhir/projects/apps/web/src/layar/Wizard.tsx
timestamp: 2026-09-30T14-20-28Z
slug: src-layar-wizard-tsx
---
# Critique: Lab Hitung (ArifLab #/hitung) + Beranda — 2026-09-30
Method: dual-agent (A design review · B detector+browser)

## Heuristics (24/40, Acceptable)
1 Visibilitas 2 — babak tak di stepper; centang langkah belum dibuka; scroll tak reset
2 Dunia nyata 2 — "Nenek terhalang oleh Ibu" (orang sama); saham jami'ah ke awam
3 Kendali 3
4 Konsistensi 2 — "Lanjutkan kasus" ke pemilih; "Kondisi khusus" dua makna; Periksa tanpa stepper
5 Pencegahan 3
6 Kenali 2 — aksi hasil ponsel ikon saja; konteks babak hilang di hasil
7 Fleksibilitas 2 — tanpa madzhab/entri cepat/tabel munasakhat
8 Minimalis 2 — sidebar hasil 7 kartu + legenda 8 + 16 pil
9 Pulih galat 3
10 Bantuan 3 — dok FAQ menutupi konten

## Verdict
Metafora Peta Jalur berhenti di pintu kalkulator. AwalHitung & Hasil generik (grid kartu, tumpukan sidebar). Peluang: babak munasakhat = simpul transfer ambar.
Detector: TSX 0; CSS 160 (1 layout-transition komponen.css:142; 159 drift DESIGN.md). Browser: kontras 1.6:1 a.aw-btn-primary mode gelap (komponen.css:701 color:inherit mengalahkan :16). Bayangan bar-bawah jalur.css:133 tanpa pasangan gelap.

## Priority issues
- [P1] Konteks munasakhat hilang: BarBawah.tsx:11 abaikan babak; sidebar "Anak lk ×2"; LangkahBabak.tsx:38 label (Kerabat); mahjub relatif tanpa keterangan; "Normal ('adilah)". Fix: babak cabang di stepper, label per babak, hasil per sumber, tabel munasakhat.
- [P1] Entry dua lompatan: Beranda → keAwalHitung (Aplikasi.tsx:129); draf kosong masuk riwayat. Fix: lanjutkan() langsung, Mulai → langkah 1, hapus AwalHitung.
- [P1] Langkah 4 kelebihan muatan (pertanyaan pemicu 12px komponen.css:202); langkah 5 salah nama. Fix: pertanyaan penutup layar sendiri, mawani' masuk Keluarga, hapus langkah 5.
- [P1] Kontras CTA utama mode gelap 1.6:1.
- [P2] Hasil tak dibangun di sekitar Nama—Rp; dok FAQ menutupi nominal; header 1280 buang Rujukan; dua bar bawah ponsel; target sentuh 36px.

## Persona red flags
Jordan: "Lab" jargon, 14 pilihan, 12px pertanyaan duka, 31/180, ♂/♀. Casey: dua bar bawah, ikon tanpa label, scrollY=184, babak tak terlihat. Sam: Kerabat lain disabled (LangkahAhliWaris.tsx:53), h1→h3, glyph ▾, <44px. Ustadz: tanpa madzhab (jalankan.ts:29), tanpa tabel per masalah, "Normal ('adilah)", tanpa status sumber.

## Minor
Stepper.tsx:18 centang; H1 babak 2 sama; KHI gono-gini framing; 23 titik kosong Latihan; transisi kartu ganti skema; tombol berbingkai untuk aksi sekunder (lihat semua soal, Buka/Lanjut riwayat, Ubah harta, Ubah data).

## Questions
Apa pembenaran AwalHitung? Wizard sebenarnya 4 langkah? Kenapa munasakhat tampil sama dengan kasus biasa? Register nada terpisah untuk momen duka? Awam perlu pemilih madzhab atau cukup "ada pendapat lain" di hasil? Tampilan mana rumah langkah Keluarga bila cerita/pohon/daftar menulis graf yang sama?
