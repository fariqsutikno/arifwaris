---
version: 1
slug: "src-aplikasi-tsx"
primary_target: "src/Aplikasi.tsx"
related_targets: []
---

# Surface brief: Arif Waris web (seluruh aplikasi)

Mode: Operate (kalkulator, wizard, hasil) dengan lapisan Read (Belajar, Glosarium, Rujukan).

Diperbarui 2026-10-01. Arah "Peta Jalur" (stasiun/jalur kereta) dibatalkan pemilik 2026-09-30 dan tidak berlaku lagi.
Dunia visual yang berlaku: gaya Logivo (acuan `docs/design/mockup-hasil-gaya-logivo.html`). Arah pengembangan dan urutan
kerja: `docs/design/rencana-pengalaman-dan-fitur.md` (disetujui pemilik 2026-10-01).

Kesan yang diminta pemilik: bersih, modern, hangat dan hidup tetapi tetap tenang; tidak flat (gerak dan suara tipis,
tidak semua kotak sejajar, ada karakter, bisa dipegang). Ponsel dan laptop setara. Hanya tema terang.

## Direction contract

THESIS: Pohon keluarga yang hidup. Harta turun lewat silsilah dan tiap angka bisa ditelusuri ke orang dan alasannya;
yang dihidupkan adalah pohon dan aliran harta di dalamnya, kartu hanya lembar pendamping. Tanpa metafora atau istilah baru.

OWN-WORLD: Latar sage, bingkai krem bersudut besar, hero gelap hijau-teal dengan cahaya hangat berisi pohon dalam kotak
kaca (susunan hero tetap, keputusan pemilik), kartu putih tembus, pill hitam hanya untuk aksi utama. Parkinsans untuk
judul, Host Grotesk untuk isi. Bahasa garis: utuh = nasab, bercincin = nikah, putus-putus = tanpa nasab atau tidak
mewarisi. Avatar inisial berwarna per orang. Ikon SVG satu ketebalan, tanpa emoji.

DEPTH: Tiga lapis. Panggung (gelap, pohon), lembar (krem, dibaca pelan), melayang (naik dari benda yang diketuk).

MOTION: Satu momen utama, aliran harta dari almarhum ke tiap penerima saat Hasil dibuka; sisanya pendukung. Hanya
transform dan opacity; mati bila gerak dikurangi; satu preferensi untuk seluruh aplikasi.

SOUND: Empat bunyi pendek disintesis di perangkat. Bawaan menyala di mode Belajar, mati di mode Hitung kasus.

RULES: Bagian yang tidak ada isinya untuk kasus itu tidak dirender. Urutan mengikuti alur berpikir pengguna. Aksi
sekunder berupa teks atau tautan. Tanpa perayaan di mode Hitung kasus.
