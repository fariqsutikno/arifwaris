# Revamp Rujukan (web)

## Tujuan
Rujukan menjadi tempat menelusuri dan memeriksa dalil dengan cepat, bukan daftar kartu. Gaya Belajar/Logivo
(hero gelap, ubin pastel, tanpa metafora game; tombol berbingkai hanya untuk aksi utama; kartu kosong tidak dirender).

## Cakupan
Hanya `apps/web`: daftar kategori, halaman satu dalil (`#/rujukan/<kode>`), penampil kitab (`#/rujukan/kitab/<n>`).
Editor rujukan di `apps/admin` dan aturan KB tidak berubah. Rute (`rute.ts`) dipertahankan agar tautan lama tetap hidup.

## Rancangan
1. **Awal Rujukan** (`#/rujukan`): hero gelap kecil dengan kolom cari (klaim, surah, judul kitab; client-side
   atas `RUJUKAN`/`DAFTAR_AYAT`/`DAFTAR_KITAB`). Di bawahnya ubin pastel per kategori (ikon, nama, jumlah) menggantikan
   sidebar + `Laci`. Hasil cari tampil sebagai daftar tautan ke `#/rujukan/<kode>`.
2. **Di dalam kategori** (`#/rujukan/<kategori>`): baris tab kategori di atas (bisa digulir, tanpa scrollbar). Filter bab KB berupa teks/tautan.
   Label kecil `perlu verifikasi` dan `dha'if`. (Filter madzhab dan label `sekunder` dicabut: `EntriRujukan` tidak punya datanya.)
3. **Kartu dalil**
   - Ayat: teks Arab besar, hukum yang bisa disorot (perilaku syahid sekarang dipertahankan). Tab Arti/Tafsir
     hanya dirender bila isinya ada; sekarang kosong, jadi tersembunyi.
   - Hadits: teks, takhrij, status sebagai label.
   - Kitab: sampul gaya rak berkas; "Baca di sini" = aksi utama, "Situs sumber" = tautan teks.
4. **Satu dalil**: klaim sebagai judul; dalil Arab, sumber, dan daftar tempat dalil dipakai (bab + hukum yang bergantung
   padanya) dengan tautan balik.
5. **Penampil kitab**: PDF memenuhi layar; bilah atas tipis (kembali, judul, situs sumber).

## Di luar cakupan
- Mengisi arti/tafsir ayat: pekerjaan terpisah lewat MCP Qur'an/tafsir terverifikasi, bukan dari ingatan.
- Perubahan model konten (`packages/content`) kecuali bila "dipakai untuk" menuntut indeks balik; bila perlu, fungsi
  murni baru di `apps/web/src/konten`, bukan di engine.

## Struktur kode
`Rujukan.tsx` (211 baris, banyak tanggung jawab) dipecah per layar di `apps/web/src/layar/rujukan/`:
`Awal`, `Kategori`, `KartuDalil` (ayat/hadits/kitab), `DetailDalil`, `PenampilKitab`, plus `cari.ts` (fungsi murni
pencarian/filter). CSS baru di berkas `gaya/rujukan.css`; kelas rujukan lama di `komponen.css` dihapus bersama kode lamanya.
Teks baru lewat kamus (`t(...)`, `pnpm diksi:tambah`), tidak hardcode.

## Pengujian
- Unit test `cari.ts` (cocok klaim/surah/kitab, filter bab dan madzhab, hasil kosong).
- Tab Arti/Tafsir tidak dirender saat isi kosong.
- Verifikasi di browser: awal, kategori, satu dalil, penampil kitab; lebar ponsel; mode gelap; tautan lama masih terbuka.
