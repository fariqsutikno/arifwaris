# 03. Menyelesaikan jenis soal latihan (G2)

Induk: `00-induk.md` bagian 4 G2. Perilaku dan angka kunci: spec tabel B2–B9 (terutama tabel B7 dan batas soal di bawahnya).
Prasyarat: G1 selesai (`02`): paket `@waris/latihan`, `nilaiSemuaKolom`, kontrak `PercobaanTabel`, format kasus berkas.
Perkiraan: 14–23 orang-hari + waktu tim keilmuan.

**Selesai bila:**
- [ ] Ketujuh jenis (munasakhat, dzawil arham, mafqud, khuntsa, haml [SYF], haml [HNB], gharqa) punya minimal 2 soal terbit
      yang lolos uji konten (`02` bagian 6.4) dan tampil sebagai tabel faraidh.
- [ ] Tiap tab mockup `mockup-tabel-faraidh-final.html` dibandingkan berdampingan (laptop + HP 375 px) dengan soal yang sama.
- [ ] Hero latihan B8 dan "Soal berikutnya" jalan.
- [ ] `KartuTebak.tsx`, `tebak.ts`, `__tests__/tebak.test.ts`, dan adaptor kejadian lama (`02` langkah 4) terhapus.
- [ ] Semua uji `packages/engine`, `packages/latihan`, `apps/web` lulus; regresi bab 16 tetap lulus.

---

## 1. Langkah yang sama untuk tiap jenis

1. **Soal.** Tim keilmuan menulis minimal 2 soal berbentuk berkas (`02` bagian 6.2). Soal pertama = contoh yang angkanya
   sudah ada di spec tabel B7 (sumber KB di kolom "Contoh kunci"), soal kedua dari KB bab yang sama atau bab 16. Tidak ada
   soal yang dikarang di luar KB. Batas soal latihan B7 berlaku (munasakhat ≤ 3 mayit, mafqud/khuntsa ≤ 1 orang, haml satu
   kandungan; haml [SYF] dipilih yang bagian tetapnya sama di semua kemungkinan lahir hidup yang digabung, KB 13a.5).
2. **Susun tabel.** Berkas `packages/latihan/src/tabel/susun<Jenis>.ts`: kolom dan baris dari keluaran engine sesuai B7,
   tiap kolom berisi `idJudul`, `tahapan`, `dimensi` (Q-matriks `02` bagian 3.2). `susun.ts` memilih fungsi menurut
   `HasilTampil.jenis`. Data yang belum ada di keluaran engine → tambah di engine dengan rujukan `[Rxx-y]` dan uji
   (spec tabel bagian 3), **jangan dihitung di paket latihan**.
3. **Uji kunci.** `susun<Jenis>.test.ts` memakai angka B7 sebagai fixture: kepala tiap kolom, kunci tiap sel, kelompok sel
   bersama, pengali, mauquf. Ditambah: `nilaiSemuaKolom` dengan isian = kunci → semua benar; dengan kepala kelipatan →
   benar + `bentuk`; `pilihJangkar` 100 kali tidak pernah di kolom pilihan, kepala, pengali, sel bersama, atau kolom terkunci.
4. **Komponen.** Hanya tambahan yang dibutuhkan jenis itu (tabel di bagian 2). Teks baru lewat `pnpm diksi:tambah`.
5. **Hasil.** Izinkan mode belajar untuk jenis itu: sekarang taqdir, menunggu, dan gharqa dikecualikan
   (`apps/web/src/layar/Hasil.tsx:149-150`). Pengecualian dicabut per jenis saat `susunTabelSoal` sudah mendukungnya;
   `menunggu` (janin ditunggu) tetap dikecualikan karena tidak dibagi.
6. **Bandingkan** dengan tab mockup, laptop dan HP 375 px, lalu commit (satu commit per jenis untuk susun + uji, satu per
   jenis untuk komponen).

Pekerjaan sejajar: berkas `susun<Jenis>.ts` dan ujinya bisa dikerjakan beberapa sesi sekaligus (berkas berbeda), tetapi
perubahan `susun.ts`, `TabelLatihan.tsx`, dan `Hasil.tsx` digabung berurutan.

---

## 2. Per jenis (urutan pengerjaan)

| # | Jenis | Data engine | Tambahan komponen | Soal pertama (B7) | Perkiraan |
|---|---|---|---|---|---|
| 1 | Munasakhat | E4 (`8c814cd`): tabel, pengali, dan masalah per mas'alah | kolom **terkunci** (Mas'alah 1, tidak dinilai, tidak bisa jadi jangkar); banyak kepala kolom; baris **Pengali** di kepala tabel (B3); kolom Jami'ah; `pengaliHarusnya` dari kepala yang diisi pelajar (B6 langkah 6) | KB 12.6 contoh 2: 24; ibu 1/3, saudara Ashabah; 3: 1, 2; pengali 3, 7; jami'ah 72: 16, 56 | 3–4 |
| 2 | Dzawil arham (tanzil [SYF]) | E5 (`708f464`): kursi tiap kerabat dan tabel perantara | kolom **Didudukkan sebagai** dengan daftar pilihan per soal (dari engine, bukan daftar tetap) | KB 14.6 baris 1: saudara kandung Ashabah 5, saudara seibu 1/6 1, saudara sebapak Terhalang 0; asal masalah 6 | 2–3 |
| 3 | Mafqud | E3 (`826c49e`): `DuniaTaqdir` dengan pengali dan tabel per kemungkinan | pasangan kolom per kemungkinan (`Bagian · {kemungkinan}`, `{kemungkinan}`); baris **Ditahan (mauquf)** (miring, latar abu); kolom `Jami'ah · diberikan sekarang` | KB 13b.6 F1: hidup 12 (ibu 1/6 2, saudara 5, hilang 5), wafat 3 (ibu 1/3 1, saudara 2); pengali 1, 4; jami'ah 12: 2, 5; mauquf 5 | 3 |
| 4 | Khuntsa | E3 | sama dengan mafqud, kemungkinan "ia laki-laki" / "ia perempuan" | dari KB 13c.4 (**angka belum masuk mockup**: buat tab Khuntsa di mockup dulu, gerbang G2) | 1–2 |
| 5 | Haml [SYF] | E1 + E2 (`6c15729`): empat kemungkinan; kelompok ashabah bersama haml berhenti di asal masalah | `gabungDari` pada kolom kemungkinan "laki-laki" dan "perempuan berbilang" (sel bersama di kolom yang bukan kolom pertama) | KB 13a.7 H1 [SYF]: 3 (1, 2) · 6 (1, 5 bersama) · 18 (3, 10, 5) · 6 (1, 5 bersama); pengali 6, 3, 1, 3; jami'ah 18: ibu 3, saudara 0; mauquf 15 | 2–3 |
| 6 | Haml [HNB] | E3; ruleset `hanbali` dari `kasus.madzhab` di berkas | enam kemungkinan; tidak ada tambahan baru selain lebar tabel (uji HP 375 px: geser di wadah, kolom nama lengket) | KB 13a.7 H1: 3, 12, 18, 18, 24, 6; pengali 24, 6, 4, 4, 3, 12; jami'ah 72: ibu 12, saudara 20; mauquf 40 | 1–2 |
| 7 | Gharqa | `hitungGharqa` (`HasilGharqa`) | **langkah keputusan** sebelum tabel: pilihan `Yang terakhir mewarisi` / `Tidak saling mewarisi` / `Ditahan sampai jelas` (kolom `pilih` dengan tahapan keputusanFikih); lalu satu tabel biasa per harta, atau tanpa angka bila ditahan. h1 `Putuskan dulu, lalu isi tabel tiap harta` | KB 13d.2: tidak diketahui sama sekali → Tidak saling mewarisi | 2–3 |

Catatan per jenis:
- **Munasakhat dan cabang `rencana/munasakhat-arham-gharqa`.** Cabang itu (R12-5/R12-6, belum di `main`) membuat
  munasakhat bisa memuat dzawil arham dan gharqa. `susunMunasakhat` mendukung munasakhat **biasa** saja; bila ada mas'alah
  yang memuat dzawil arham atau langkah gharqa → `TIDAK_DIDUKUNG`, dengan uji. Tabel untuk kombinasi itu perlu desain dan
  mockup sendiri (bukan bagian G2).
- **Dzawil arham.** `hitungDzawilArham` mengembalikan `jenis: 'biasa'` di `HasilTampil` (`apps/web/src/jalankan.ts:55`);
  `susun.ts` membedakannya dari data tanzil di keluaran engine, bukan dari `jenis`.
- **Taqdir (mafqud, khuntsa, haml).** Kunci kolom "diberikan sekarang" dan mauquf dari engine; pengali dinilai dari kepala
  isian pelajar seperti munasakhat. ECF hanya kolom asal masalah per kemungkinan (`02` bagian 3.3).
- **Gharqa.** Penilaian dua tahap: keputusan dinilai dulu (kolom pilihan biasa); tabel harta baru dinilai bila keputusan
  benar. Untuk Latihan ini otomatis karena putusan berhenti di kolom pertama yang salah.

---

## 3. Hero latihan B8 (1 hari)

Sesuai spec tabel B8:
- Bilah: tautan `Latihan` (panah kiri, kembali ke daftar soal) · kanan `Soal {i} dari {n} · {bab}` (+ madzhab bila bukan
  [SYF]). `i` dan `n` dari urutan daftar soal yang sama dengan `DaftarSoalHitung.tsx` (satu sumber urutan; jangan menyusun
  ulang di hero).
- `h1`: `Isi tabel pembagiannya` (gharqa: teks di tabel bagian 2).
- Sesudah "Benar semua." atau jawaban dibuka: tombol utama **Soal berikutnya** (ikon panah kanan) di bawah umpan.
- Teks lewat diksi. Uji komponen: tombol muncul hanya sesudah benar/dibuka; soal terakhir → kembali ke daftar.

## 4. Hapus jalur lama (0,5 hari)

Setelah semua soal terbit tampil sebagai tabel (uji konten `02` 6.4 menjamin `susunTabelSoal` mendukung semuanya):
hapus `hasil/KartuTebak.tsx`, `hasil/tebak.ts`, `__tests__/tebak.test.ts`, adaptor kejadian kartu lama, cabang
`KartuTebak` di `hasil/KartuPembagian.tsx:111`, dan props tebakan yang diteruskan `Hasil.tsx` ke `KartuPembagian`
(`sedangMenebak`, `saatTebakanBenar`, `saatMencobaMenjawab`, ±baris 338). Dua hal yang ikut tersangkut [Fakta]:
`UmpanBalikBenar` diekspor dari `KartuTebak.tsx` dan diimpor `KartuPembagian.tsx:18` (pindahkan dulu bila masih dipakai),
dan `__tests__/diksi.test.ts:54` mengimpor `bacaPecahan` dari `tebak.ts`. Cari sisa dengan `grep -rn "tebak" apps/web/src`.

---

## 5. Jangan
- Menambah kartu, tombol, warna, ikon, animasi, atau teks yang tidak ada di mockup/spec (spec tabel bagian 5).
- Mengetik kunci di konten soal atau menghitungnya di web/paket latihan.
- Membuat soal dari kasus yang menyentuh titik blocked (laqith R13-14) atau `[perlu verifikasi lanjut]`.
- Mengerjakan jenis berikutnya sebelum jenis sebelumnya dibandingkan dengan mockup-nya.
