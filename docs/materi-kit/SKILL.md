---
name: tulis-materi-faraidh
description: Menulis pelajaran e-learning faraidh (waris Islam) untuk aplikasi ini, satu berkas Markdown per pelajaran sesuai kerangka 15 modul. Pakai saat diminta menulis, menulis ulang, atau memperbaiki materi pelajaran di konten/materi/.
---

# Menulis materi faraidh

Kamu menulis buku pelajaran faraidh digital untuk mahasiswa dan orang awam. Tujuannya: setelah membaca, mereka
**bisa menghitung** kasus waris dan paham kapan memakai setiap kaidah. Isi fikih hanya dari knowledge base di
`docs/kb/`.

## Baca dulu (urut)

1. `docs/materi-kit/konsep-materi.md`: apa yang harus dicapai setiap pelajaran dan unsur wajibnya.
2. `docs/materi-kit/alur-belajar.md`: cara menyusun supaya alurnya mengalir.
3. `docs/materi-kit/panduan-gaya.md`: kaidah bahasa: kalimat baku dan lengkap (EYD, KBBI, SPOK), runtut dengan kata penghubung.
4. `docs/materi-kit/format-materi.md`: sintaks berkas. Ketat.
5. `docs/materi-kit/kerangka-kurikulum.md`: slug, sumber KB, pertanyaan pemandu, dan poin wajib tiap pelajaran.
6. Dua contoh jadi: `docs/materi-kit/contoh/5-1-hajb.md` dan `docs/materi-kit/contoh/6-2-aul.md`. Tiru kedalaman,
   alur, dan nadanya, bukan urutan bagiannya.

## Alur kerja per pelajaran

1. Ambil baris pelajaran di kerangka. Baca seluruh bab dan subbab KB di kolom Sumber, termasuk tabel "Dasar dan
   Rujukan" dan kasus terkait di `docs/kb/16_kasus_uji.md`.
2. Baca pelajaran prasyarat yang sudah ditulis di `konten/materi/`, supaya istilah dan tautannya konsisten.
3. Susun kerangka bagian (`##`, `###`) dulu: gambaran masalah, konsep, kaidah, cara berpikir, contoh, kesalahan
   umum, cek pemahaman, ringkasnya.
4. Tulis berkasnya di `konten/materi/modul-NN/<slug>.md`.
5. Jalankan `pnpm materi:cek <berkas>`. Perbaiki sampai lolos. Kalau angka contoh berbeda dengan engine, yang
   benar engine: perbaiki cerita dan `harapan`, jangan memaksa angka.
6. Baca ulang dengan `daftar-periksa.md`. Hapus kalimat yang tidak menambah apa-apa.
7. Setelah satu modul selesai, tulis `konten/materi/modul-NN/LAPORAN.md` (format di `format-materi.md` bagian 6),
   lalu commit dengan pesan `materi(modul-NN): <ringkas>`.

## Aturan keras

- Jangan mengarang hukum, alasan, hikmah, riwayat, atau nama kitab yang tidak ada di KB.
- Madzhab Syafi'i adalah posisi utama. Tarjih Lahim atau Ithraa yang condong Hanbali tidak boleh disajikan sebagai
  posisi Syafi'i.
- Yang berstatus `[perlu verifikasi lanjut]` di KB tidak ditulis sebagai hukum.
- Jangan mengubah berkas di luar `konten/materi/`. Kalau butuh istilah glosarium, blok baru, atau berkas kasus Lab,
  tulis permintaannya di `LAPORAN.md`.
- Jangan mengubah slug yang sudah ada.
