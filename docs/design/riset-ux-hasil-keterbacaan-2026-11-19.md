# Riset UX layar Hasil: keterbacaan, tombol ubah, pecahan vs persen (2026-11-19)

Status: usulan, menunggu pilihan pemilik. Belum ada kode UI yang diubah.
Acuan: `mockup-hasil-per-kasus.html`. Ukuran diukur di aplikasi (`localhost:5173`, root 16px).

## 1. Audit (temuan)

| # | Temuan | Bukti terukur |
|---|---|---|
| A1 | Teks pokok terlalu kecil | nama orang 15px, pecahan baris 14px, label 15px, chip hero 13px, catatan 12px |
| A2 | Tabel mendominasi pohon dan daftar | sel tabel 16-17px tebal (700); kartu pohon 16px tapi isi kedua (pecahan, Rp) lebih kecil; daftar "Siapa menerima berapa" 14-15px |
| A3 | Hierarki terbalik: angka mentah (asal masalah, tashih, saham) lebih menonjol daripada jawaban (siapa dapat berapa) | kolom angka 17px/700 |
| A4 | Aksi "Ubah" tampil sebagai teks bergaris bawah di 5+ tempat (Ubah data, ganti madzhab, Ubah harta, Ubah Ahli waris, Ubah pembulatan) | `.tautan-aksi` dan `.tautan-hero` 15px/600 |
| A5 | "Ubah data" dan "ganti madzhab" ditaruh di hero tanpa alasan tugas: pengguna belum tahu apa yang diubah, dan madzhab adalah pengaturan, bukan aksi sesudah hasil | letak: bawah judul hero, sebaris dengan Ekspor |
| A6 | Judul generik: "Siapa menerima berapa", "Jenis masalah", "Tentang kasus ini", "Pohon keluarga dan tabel faraidh" tidak mengatakan apa yang pengguna dapat dari blok itu | judul kartu 19px, subjudul kecil |
| A7 | Pecahan dan persen berdampingan ("1/8 · 12,5%") di tiap baris: dua ukuran untuk satu hal, tanpa tahu mana yang dipakai untuk apa | `KartuPembagian.tsx:123`; toggle Fardh/Saham sudah ada tapi persen tetap ikut |

## 2. JTBD

- J1. Saat hasil muncul, aku mau langsung tahu bagianku dan keluargaku (siapa dapat berapa rupiah) tanpa membaca tabel.
- J2. Saat ragu, aku mau tahu mengapa angkanya begitu, tanpa kehilangan tempat.
- J3. Saat salah isi, aku mau memperbaiki bagian yang salah saja (harta, ahli waris, madzhab) dan melihat dampaknya.
- J4. Saat membandingkan dengan ustadz, aku mau angka yang dipakai ustadz (pecahan) dan angka yang kupahami (rupiah).

## 3. HMW

- HMW1: Bagaimana membuat jawaban (nama, pecahan, rupiah) jadi hal terbesar di layar, dan tabel jadi bukti pendukung?
- HMW2: Bagaimana membuat aksi ubah dikenali sekilas tanpa menjejalkan teks bergaris?
- HMW3: Bagaimana menaruh pengaturan (madzhab) di tempat orang mencari, dengan alasan jelas?
- HMW4: Bagaimana judul blok menjawab "aku dapat apa dari sini?"
- HMW5: Bagaimana pecahan dan persen masing-masing punya tugas, bukan dua kali cerita yang sama?

## 4. Ide dan skor (Paham, Dampak, Usaha; 1-3, usaha 3 = murah)

### HMW1 skala dan hierarki
- 1a. Skala tipografi baru: isi 17px, nama 18px/600, rupiah 20px/700, label 15px; angka tabel 16px/500 abu tua, hanya baris Jumlah tebal. Skor 3·3·2. Direkomendasikan.
- 1b. Nama, pecahan, rupiah di daftar jadi satu baris besar; tabel disembunyikan di balik "Lihat perhitungan". Skor 3·3·1.
- 1c. Hanya naikkan semua ukuran 1px. Skor 2·1·3. Tidak menyelesaikan A2/A3.

### HMW2 tombol ubah
- 2a. Ikon pensil SVG (bukan emoji) 32px, area ketuk 40px, label aksesibel "Ubah harta", muncul di pojok kanan baris yang bersangkutan. Skor 3·3·3. Direkomendasikan.
- 2b. Pensil hanya saat hover. Skor 1·1·3. Tidak jalan di HP.
- 2c. Satu tombol "Ubah" membuka menu pilihan (harta, ahli waris, madzhab). Skor 2·2·2.

Catatan bentrok: CLAUDE.md memutuskan aksi sekunder pakai teks/tautan, bukan tombol berbingkai. Pensil tanpa bingkai (ikon polos) tetap sejalan dan sesuai kritik pemilik hari ini.

### HMW3 letak Ubah data dan madzhab
- 3a. Hapus "Ubah data" dari hero. Pensil menempel di blok yang berubah (harta di baris harta, ahli waris di daftar penerima). Madzhab jadi chip di hero: "Syafi'i ✎" yang memang membuka pilihan madzhab. Skor 3·3·2. Direkomendasikan.
- 3b. Satu bilah "Kasusmu" di atas dengan tiga ringkasan terubah (Harta, Ahli waris, Madzhab) masing-masing berpensil. Skor 3·2·2.
- 3c. Biarkan di hero, perbaiki gaya saja. Skor 1·1·3.

### HMW4 judul
- 4a. Judul jadi kalimat jawaban: "Bagian tiap ahli waris" (daftar), "Cara membagi: dari 8 jadi 24 bagian" (tabel, tertulis dari data), "Kasus ini termasuk apa" (jenis masalah). Judul tabel dan pohon dipisah supaya tiap blok punya satu tugas. Skor 3·2·3. Perlu diksi baru lewat `pnpm diksi:tambah`.
- 4b. Judul berpertanyaan ala mockup ("Siapa dapat berapa?"). Skor 3·2·3. Cocok dengan gaya modal baru ("Kenapa 1/8, bukan 1/4?").

### HMW5 pecahan vs persen
Temuan: persen tidak dipakai untuk menghitung maupun dicocokkan ke ustadz; hanya tambahan angka. Pecahan = bahasa fikih (J4); rupiah = bahasa awam (J1).
- 5a. Tampil default: nama · pecahan (besar) · rupiah (paling besar). Persen dibuang dari baris; persen hanya muncul sebagai lebar pita (PitaBagian) dan di modal orang sebagai satu baris pendukung. Skor 3·3·3. Direkomendasikan.
- 5b. Pilihan tampilan satu-satu (toggle Fardh | Saham | Persen) memilih satu angka, bukan tiga. Fardh/Saham sudah ada; tinggal tambah Persen dan hapus yang berpasangan. Skor 2·2·2.
- 5c. Pecahan dengan tooltip persen saat disentuh. Skor 2·1·3. Tidak jalan di HP.

## 5. Usulan paket

1a + 2a + 3a + 4b + 5a. Urutan kerja: (1) token ukuran dan tabel, (2) pensil dan pindah letak, (3) judul dan buang persen dari baris. Diksi judul lewat snapshot. Uji: tes web yang menyebut 'ganti madzhab' dan 'Ubah harta' sebagai nama tombol perlu disesuaikan (nama aksesibel tetap boleh sama).

## 6. Belum diverifikasi
- Ukuran di layar 375px dan 1920px (pengukuran memakai panel 1024px).
- Apakah ukuran dasar sekarang sudah diubah sesi UI sejak merge `08fe3ef`.
- Uji kegunaan nyata; skor di atas penilaian saya, bukan data pengguna.
