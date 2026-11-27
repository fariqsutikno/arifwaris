# Daftar periksa sebelum menyerahkan satu paket soal

## Isi
- [ ] Setiap kaidah dan angka fikih ada di bab KB yang disebut di `sumber`. Tidak ada yang dari ingatan umum.
- [ ] Posisi utama madzhab Syafi'i. Soal khilaf menyebut madzhabnya; tarjih Lahim atau Ithraa tidak menjadi jawaban [SYF].
- [ ] Tidak ada hikmah atau alasan yang dikarang; tidak ada soal dari titik `[perlu verifikasi lanjut]`.
- [ ] Satu jawaban benar yang pasti menurut KB.
- [ ] Topik wajib modul (`kerangka-soal.md`) tercakup, atau yang belum tercakup dicatat di `LAPORAN.md`.

## Soal yang baik
- [ ] Soal meminta **memakai** kaidah pada kasus; soal definisi paling banyak seperlima paket (modul 1 dan 2 boleh lebih).
- [ ] Satu soal satu kemampuan; `topik` menyatakannya (satu sampai tiga token).
- [ ] Setiap pilihan salah mewakili salah paham nyata (`pengecoh.md`) dan angkanya bisa dicapai lewat kesalahan itu.
- [ ] Setiap pilihan, benar maupun salah, punya alasan yang meluruskan, dengan tautan ke pelajaran bila ada.
- [ ] Pilihan sejajar dalam bentuk dan panjang; pilihan benar bukan yang terpanjang; letak jawaban benar bervariasi.
- [ ] Tanpa "semua benar", "semua salah", negasi ganda, atau jebakan bahasa.
- [ ] Tingkat sesuai `konsep-soal.md` bagian 3.

## Angka
- [ ] Setiap soal yang menyebut bagian, saham, atau penyebut punya kasus (`pewaris` + `ahli waris` + `harapan`, atau `kode-bank`).
- [ ] `tanpa-kasus` hanya untuk angka yang bukan saham waris, dengan alasan, dan dicatat di `LAPORAN.md`.
- [ ] Angka di `tanya`, pilihan, alasan, dan pembahasan sama dengan hasil engine yang dicetak pemeriksa.
- [ ] Soal lanjutan (kode bank lanjutan) tidak memuat angka pecahan.

## Bahasa
- [ ] Kalimat baku dan lengkap, EYD V dan KBBI, tanpa tanda pisah panjang (`panduan-gaya.md`, `panduan-gaya-soal.md`).
- [ ] Satu istilah untuk satu konsep; istilah fikih sesuai glosarium (`[[istilah]]` di kemunculan pertama bila perlu).
- [ ] Nada tenang dan berwibawa; tanpa cerita, perasaan, atau dramatisasi.

## Teknis
- [ ] `pnpm soal:cek <berkas>` lolos tanpa galat; peringatan sudah ditinjau.
- [ ] Kode soal `P-NN-NNN` unik, berlanjut dari nomor terbesar di modul itu, dan `NN` sama dengan modul.
- [ ] Nama paket = nama berkas; berkas ada di `konten/soal/modul-NN/`.
- [ ] `LAPORAN.md` modul ditulis (format di `format-soal.md` bagian 7).
