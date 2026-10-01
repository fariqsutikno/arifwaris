# Acuan UX: wizard sampai Hasil (satu sumber kebenaran)

Tanggal: 2026-10-01 · Status: **berlaku**. Dokumen ini menjadi acuan tunggal alur dari masuk ArifLab sampai Hasil.
Bila bentrok dengan mockup atau spec lama (`mockup-*.html`, `2026-09-30-*`, `2026-10-01-perjalanan-keresahan-design.md`),
**dokumen ini menang**; yang lama hanya referensi. Dasarnya: audit UX 2026-09-30 (`apps/web/.impeccable/critique/`),
riset `riset-ux-input-kematian-berlapis.md`, dan audit browser 2026-10-01 (desktop 1440 px dan HP 390 px).

Mengapa dokumen ini ada: UI sempat berantakan karena mockup dan spec saling menimpa (v4 biru-outline, Logivo, tiga Beranda,
tiga tata letak Hasil) dan tidak ada gambar yang disetujui untuk wizard bergaya Logivo. Gaya visual = Logivo (`PRODUCT.md`).

## Prinsip (beban kognitif)

1. **Satu keputusan per layar.** Pertanyaan = judul terbesar; jawaban di bawahnya. Penjelasan satu kalimat di lembar, bukan di pita gelap.
2. **Kasus biasa tidak bertambah layar.** Satu almarhum, semua hidup, tanpa hal khusus = Almarhum → Harta → Keluarga (daftar, keadaan) → Periksa → Hasil.
3. **Hal langka di balik satu gerbang.** Wafat/hilang, hamil, beda agama ditawarkan sebagai kartu centang dalam satu layar; tak ada yang dicentang = biasa.
   Kartu yang mustahil berlaku tidak ditampilkan.
4. **Bawaan tidak tampil seperti keputusan.** Utang/wasiat dan nama kasus hanya tautan "+"; pilihan ya/tidak berbawaan dihindari.
5. **Isian pertama terlihat tanpa menggulir (HP 390×844), satu bar bawah, target sentuh ≥ 44 px, tanpa konten tertutup.**
6. **Tidak ada jalan buntu.** "Tidak tahu" disimpan apa adanya dan dihitung sebagai kemungkinan (bukan ditolak).
7. **Jargon hanya di lapis dalam.** Lapis 1 Hasil: nama, Rp, kalimat biasa. Istilah teknis (tabel faraidh, jenis kasus) terlipat, terbuka di mode Belajar.
8. **Aplikasi tidak memilih bila KB tidak menentukan.** Kemungkinan ditampilkan berdampingan; madzhab yang belum dikaji tampil "Belum dikaji" tanpa angka.

## Peta layar

| # | Layar | Isi | Catatan |
|---|---|---|---|
| 1 | Almarhum | jenis kelamin (tanpa bawaan), nama opsional | |
| 2 | Harta | total/rinci; tautan "+ Ada utang, biaya pemakaman, atau wasiat?" | gono-gini = catatan |
| 3a | Keluarga · daftar | "Siapa saja keluarga {nama} yang masih hidup waktu beliau wafat?" | babak lanjutan: pembuka satu paragraf, "dari orang yang sudah ada", kerabat lain ringkas |
| 3b | Keluarga · keadaan | "Ada keadaan khusus di keluarga {nama}?" kartu centang | beda agama hanya di babak terakhir |
| 4 | Periksa | cerita per babak + harta + madzhab (ganti) + nama kasus (tautan) | konfirmasi saja |
| 5 | Hasil | pita gelap + pohon, Pembagian, Tidak mendapat bagian, Harta, Habis ini ngapain?, cara menghitung (terlipat) | HP: pohon lewat tombol |

Urutan layar ada di `layar/wizard/navigasi.ts` (fungsi murni, dites). Keadaan: `langkah`, `babak`, `bagian` (`daftar|keadaan`);
URL `#/hitung/<id>/langkah/3/<babak>/keadaan` (daftar tidak menulis bagian, tautan lama tetap berlaku).

## Hasil

- **Kemungkinan** (`kemungkinan.ts`): urutan wafat "tidak tahu" disimpan di `Kasus.belumPasti`; paling banyak 2 hal (4 kemungkinan);
  pemilih di atas jawaban; selisih terhadap pilihan pertama; bila tidak berpengaruh hanya satu catatan. "Wafat bersamaan" antar-almarhum tetap belum didukung (celah E1).
- **Madzhab** (`madzhab.ts`): `Kasus.ruleset` (Syafi'i = bawaan, tidak ditulis). Tautan "Bandingkan pendapat lain" hanya bila ada yang berbeda/tak bisa dihitung.
- **Hasil khusus** (janin, hilang, kelamin ganda, wafat bersamaan): memakai kerangka yang sama (`KerangkaHasilKhusus`); pohon = graf saja.
- **Cetak**: "Cetak lembar untuk rapat keluarga" = satu halaman A4 (CSS `@media print`).

## Belum dikerjakan (dan alasannya)

- **Kenapa dapat/tidak untuk non-ahli-waris** (menantu, besan, anak angkat): perlu jejak engine `BUKAN_AHLI_WARIS` dan kalimat final dari tim keilmuan
  (spec 10-01 bag. 4); aturan tidak boleh dikarang di UI.
- **Daftar barang harta bertumpuk dari beberapa almarhum** (`Kasus` v4), **jalur silsilah turun-temurun**, **sunting lewat pohon**: fitur besar, spec 10-01 bag. 2, 5.
- **Kemungkinan jenis C** (dua almarhum wafat bersamaan) menunggu keputusan keilmuan.
- RTL/Arab penuh belum diperiksa.

## Cara memeriksa

Jalankan `pnpm --filter @waris/web dev`, buka di 1440×900 dan 390×844. Periksa tiap layar: isian pertama terlihat tanpa menggulir, satu bar bawah,
tidak ada kontrol < 44 px, dialog muncul sebagai overlay (bukan terkurung kartu). Kasus uji dibuat lewat fungsi aplikasi sendiri
(`checklist.ts`, `keadaanOrang.ts`) lalu disimpan ke `localStorage` kunci `arif-waris:kasus`.
