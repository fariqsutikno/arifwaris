# Rencana UI langkah 5: tampilan sisanya untuk fitur engine (2026-11-16)

Status: **draf, menunggu keputusan pemilik**. Belum ada kode yang ditulis.

## Audit singkat (apa yang sudah ada)

| Butir | Engine | apps/web / apps/admin | Celah |
|---|---|---|---|
| (a) Pilihan madzhab | `ATURAN` 4 ruleset, langkah jejak `KHILAF_MADZHAB`, gerbang `TIDAK_DIDUKUNG` | `jalankan.ts` mengunci `ruleset: 'syafii'`; teks "menurut madzhab Syafi'i" di Beranda & Hasil | **Belum ada sama sekali** |
| (b) Kasus khusus bab 13 | haml, mafqud, khuntsa, gharqa (PR #18) | Dialog keadaan orang sudah punya: dalam kandungan, hilang, khuntsa, wafat bersamaan; `HasilKasusKhusus`, `belumPasti`, kisah Periksa | Hampir tidak ada; cukup diperiksa ulang di browser bila madzhab bisa diganti (haml [HNB] = 6 taqdir, [SYF] berbeda) |
| (c) Pohon bebas | sudah di `main` (branch `pohon-bebas` tidak punya commit di luar `main`) | Label bertingkat dipakai di `PilihInduk`/checklist | Perlu dipastikan: bisakah menambah kerabat **lebih dalam** dari daftar kunci (mis. cucu dari cucu, anak dari anak paman) di kanvas. Kalau tidak bisa → celah utama (c) |
| (d) Editor templat narasi | templat `narasi.*` di database (diksi) | "Teks aplikasi" di admin sudah menyunting semua diksi, `{sisipan}` ditandai "diisi otomatis" | Templat narasi kemungkinan jatuh ke kelompok "Belum diketahui" (lokasi dipindai dari `t()` di web, narasi dipakai lewat explain); sisipan tampil sebagai nama variabel |

Kesimpulan: pekerjaan nyata ada di (a), lalu (c) bila celahnya terbukti, lalu perapian kecil (d). (b) cukup diverifikasi.

## Usulan desain

### (a) Pilihan madzhab
**Keputusan pemilik 2026-11-16** (prototipe `prototipe-pilihan-madzhab.html`): Hasil biasa = alternatif A
(tautan "ganti madzhab" + dialog); mode Belajar = alternatif C (tabel "Kata madzhab lain", hanya orang yang berbeda),
disembunyikan selama pengguna masih menebak supaya tidak membocorkan jawaban.

- `Kasus` mendapat `madzhab?: Ruleset` (tidak ada = `syafii`). Ikut tersimpan & dibagikan bersama kasus.
- **Tempat memilih: di Hasil**, bukan di isian (isian hanya fakta; madzhab bukan fakta keluarga).
  Hero Hasil: "Menurut madzhab Syafi'i" + tautan "ganti madzhab" → dialog 4 pilihan (Syafi'i bawaan di atas).
- Bila bukan Syafi'i, di bawah hero satu baris: "Menurut nukilan Lahim dan Ithraa (sumber sekunder, belum
  dicocokkan ke kitab induk madzhab itu)." Tanpa kode `K03-1` di layar.
- Orang yang bagiannya berbeda karena khilaf (langkah `KHILAF_MADZHAB`): penanda kecil "berbeda dari Syafi'i" di barisnya,
  penjelasan pakai Details (▸) "Kenapa berbeda?" berisi isi titik khilaf dari KB 18 (teks diksi, bukan hardcode).
- Hasil `TIDAK_DIDUKUNG` dari gerbang: kartu biasa "Kasus ini belum bisa dihitung menurut madzhab X" + alasannya + tautan
  "kembali ke Syafi'i".
- Teks Beranda "menurut madzhab Syafi'i" diganti "menurut madzhab Syafi'i (bisa dibandingkan dengan Hanbali, Hanafi, Maliki)".

### (c) Pohon bebas
**Keputusan pemilik 2026-11-16** (prototipe `prototipe-pohon-bebas.html`): keturunan sudah bertingkat bebas; celahnya
kerabat jauh (anak keponakan/sepupu, paman ayah). Dibangun A + C tanpa mode/sakelar: A di wawancara Keluarga
(keponakan/sepupu ditandai wafat → bagian "Anak X" muncul, berulang; paman ayah baris tetap), C di pohon layar penuh
(tombol + di bawah orang wafat) sebagai jalan pintas. Satu graf, keduanya saling mencerminkan.
Paman ayah (keputusan 2026-11-16): lewat kakek: kakek ditandai wafat → bagian "Saudara laki-laki kakek" (tampil hanya bila
berpengaruh), mengikuti pola bagian "Anak X".

- Periksa dulu di kanvas. Bila menambah kerabat jauh belum bisa: di menu ⋯ tiap orang tambah "tambah anak"
  (laki-laki/perempuan, kelamin wajib ditanya), labelnya otomatis bertingkat gaya fikih ("anak laki-laki dari anak laki-laki paman").
- Tidak ada pohon bebas untuk jalur atas (orang tua kakek dst.) di luar yang engine dukung.

### (d) Editor templat narasi
**Keputusan pemilik 2026-11-16** (prototipe `prototipe-editor-narasi.html`; sempat dibatalkan lalu dipulihkan setelah
jelas ini hanya untuk portal admin): A + B. A = sunting di penjelasan kasus contoh (klik kalimat → kotak ubah, sisipan
jadi label manusiawi, rujukan tampil "rujukan", pratinjau nilai contoh); B = daftar lengkap per tahap untuk kalimat yang
tidak muncul di kasus contoh. Simpan = draf lewat alur ajuan/review yang ada.

- Templat `narasi.*` dikelompokkan di daftar "Teks aplikasi" sebagai layar "Penjelasan hasil", diurutkan mengikuti
  tahap (ahli waris → hajb → bagian → 'aul/radd → nominal).
- Sisipan diberi nama manusiawi ("nama ahli waris", "pecahan bagian") lewat satu kamus kecil; nama variabel tidak tampil.
- Pratinjau memakai kasus contoh supaya admin melihat kalimat jadi.

## Pertanyaan untuk pemilik
1. Madzhab dipilih **di Hasil** (usulan) atau di awal isian?
2. Perlu tampilan **perbandingan berdampingan** 4 madzhab untuk satu kasus, atau cukup ganti-lalu-lihat + penanda "berbeda dari Syafi'i"? (Usulan: cukup penanda; perbandingan penuh menyusul bila diminta.)
3. Setuju (b) tidak diberi UI baru, hanya diverifikasi?

## Urutan kerja setelah disetujui
TDD per butir, commit per perubahan: (a) model + jalankan → hero & dialog → penanda khilaf → TIDAK_DIDUKUNG;
(c) verifikasi lalu bangun bila perlu; (d) kelompok + nama sisipan + pratinjau; verifikasi browser sekali; PR.
