# Spec: harta sudah dibagi sebagian (item 7b, 2026-11-25)

Fitur: ahli waris yang sudah menerima sebagian harta **sebagai bagian warisannya** melihat sisa hak, sisa kas, dan kelebihan.
Dasar: `riset-harta-sebagian.md` (skenario, verifikasi Raudhah), KB bab 11.3 [KH] [R11-5] dan 11.4 [R11-4], `mockup-harta-sebagian.html`.
Gaya: `spec-tangga-bantuan-soal.md`.

**Penanda status** dipakai di seluruh dokumen:
- **[PEMILIK]** keputusan pemilik yang sudah ada (riset/KB/CLAUDE.md).
- **[USULAN]** diambil sesi pemula tanpa persetujuan pemilik; perlu konfirmasi (bagian 11).
- **[TERBUKA]** belum diputuskan siapa pun; ada di daftar pertanyaan bagian 11.

## 0. Status pekerjaan

| Bagian | Status |
|---|---|
| KB 11.3/11.4, R11-4, R11-5 | Selesai (`9b868d6`) |
| Engine `hitungSisaHak` ([sisaHak.ts](../../packages/engine/src/stages/sisaHak.ts)) + tes | Selesai (`323f02f`) |
| Kartu [SisaHakKartu.tsx](../../apps/web/src/hasil/SisaHakKartu.tsx) di Hasil, 10 kunci `hasil.sisa_hak.*` | Selesai (`342de81`), versi dasar |
| Simpan isian, pintu wizard, kasus lain, piutang, jejak/narasi | **Belum** (bagian 5–9) |

## 1. Tujuan dan pengguna

- Pengguna: keluarga yang sudah menyerahkan sebagian uang/harta ke satu atau beberapa ahli waris sebelum pembagian selesai
  ("Ibu sudah pegang 30 juta, sisanya bagaimana?"). Bukan peneliti fikih; **tanpa kode teknis** (R11-x, JSON) di layar [PEMILIK, memori "Admin tanpa kode teknis"].
- Pekerjaan (JTBD): saat sebagian sudah diserahkan, aku ingin tahu **berapa lagi** yang harus diterima tiap orang dan berapa yang masih ada
  di kas, tanpa menghitung ulang dari nol.
- Bukan tujuan: menilai sah/tidaknya penyerahan, mengatur pengembalian kelebihan, hibah, pinjaman (kecuali bagian 9), takharuj (jalur sendiri, R11-2/R11-3).
- Makna "sudah menerima" = **bagian warisan di muka**; final vs uang muka dilebur menjadi satu isian (hitungannya sama) [USULAN, riset 6.1 rekomendasi a].

## 2. Aturan fikih dan hitung (tetap, dari KB)

Satu-satunya rumus (bab 11.3, [KH], tanpa khilaf madzhab, jadi berlaku di semua ruleset):
`sisa hak = n − d`; `sisa kas = T − Σd`; `Σ sisa hak + sisaLainnya = sisa kas` (assertion; `sisaLainnya` = selisih pembulatan + sisa yang keluar).
`T` = tirkah bersih **awal**. Hutang yang muncul belakangan tetap didahulukan, dihitung dari `T` awal [R11-5].
Saham, ashl, tashih tidak berubah. Pembulatan memakai `n` yang sudah dibulatkan per satuan; `d` tidak dibulatkan.

## 3. Perilaku di layar Hasil (sudah ada; ringkasan perilaku yang dijaga)

- Tautan teks "Sudah ada yang menerima sebagian?" di bawah daftar pembagian; membuka isian rupiah per penerima (aksi sekunder = tautan, bukan tombol berbingkai [PEMILIK]).
- Tabel 4 kolom: orang, bagian, sudah diterima, sisa; catatan sisa kas.
- Penerima = ahli waris yang mendapat bagian (`ringkasan.penerima`); orang di luar itu tidak punya isian.
- Hasil dihitung ulang tiap ketikan (fungsi murni, tanpa debounce; angka `bigint`).
- Tidak dirender bila: harta kosong, kasus menunggu/ditahan, mode Belajar (soal latihan). Kartu tanpa isi tidak dirender [PEMILIK, memori "UI hanya yang relevan"].
- Teks petunjuk di kartu melarang mengisi hibah/pinjaman: "isi hanya yang diserahkan sebagai bagian warisan" [USULAN: larangan lewat teks, bukan validasi].

## 4. Aturan input dan galat

| Keadaan | Perlakuan | Dasar |
|---|---|---|
| Isian kosong atau 0 | Dianggap belum menerima (tidak masuk `sudahDiterima`) | perilaku sekarang |
| `d` negatif | `PERLU_INPUT` (pertanyaan per orang); UI hanya menerima digit, jadi hanya terjadi lewat berkas | `periksaPenerimaan` |
| Isian untuk orang yang bukan penerima | `PERLU_INPUT` | idem |
| `Σd > T` | `PERLU_INPUT` bersifat umum (bukan per orang): pesan galat merah, tabel tidak ditampilkan | KB 11.3 |
| `d_i > n_i` (**kelebihan**) | Ditampilkan: sel sisa diganti "Lebih Rp X"; catatan netral bahwa hal ini perlu disepakati keluarga atau ditanyakan ke pengadilan. **Tanpa saran pengembalian** | KB 11.3 (tak ada nash) [PEMILIK via KB; wording TERBUKA #4] |
| `Σ sisa hak positif > sisa kas` (**kas kurang**) | Ditampilkan sebagai catatan; tidak dibagi ulang diam-diam | idem |
| Nilai barang (rumah, emas) | Pengguna mengisi nilai rupiah yang **disepakati sekarang**; engine tidak menaksir. Rumah yang "hanya ditempati" belum diterima | riset 4.3 [USULAN; TERBUKA #3] |
| Pengguna mengisi harta **yang tersisa**, bukan awal | Dicegah lewat label: kartu menyebut "harta awal" (`hasil.sisa_hak.petunjuk`); `T` selalu = tirkah bersih di Hasil, tidak diisi ulang di kartu | riset 4.3 |

Invarian dilanggar (`Σ sisaHak + sisaLainnya ≠ sisaKas`) = `throw`, bukan galat pengguna [CLAUDE.md prinsip 7].

## 5. Cakupan kasus

| Jenis hasil | 7b | Catatan |
|---|---|---|
| Biasa (`jenis === 'biasa'`) | **Ya** (sudah) | |
| Munasakhat | **Ditahan** sampai pemilik memutuskan (TERBUKA #5). Rekomendasi: aktifkan penyajian saja | KB 11.3: nominal tidak berubah; tidak ada nash (Raudhah dicek, nihil) |
| Taqdir (haml, mafqud, khuntsa) | **Tidak** | Hasilnya banyak "dunia"; nominal per orang belum final. Sisa hak mengikuti dunia yang dipilih = keputusan baru. Tampilkan tautan nonaktif/tak ada |
| Gharqa | **Tidak** | idem (tabel per harta) |
| Dzawil arham | **Tidak** (belum dikaji) | pipeline berbeda; tunggu permintaan |
| Takharuj | **Tidak**; jalur sendiri | R11-2/R11-3 |
| Mode Belajar/soal latihan | **Tidak** | |

Dengan kasus yang tidak dicakup, kartu **tidak dirender** (bukan dirender lalu menolak). Madzhab: tidak butuh overlay (aritmetika);
berlaku untuk semua ruleset yang mengembalikan `OK` [USULAN, riset 4.2; TERBUKA #8].

## 6. Penyimpanan isian bersama kasus

Sekarang: `useState` lokal, hilang saat muat ulang [USULAN, perlu dikonfirmasi: TERBUKA #10].
Yang diusulkan: simpan **di dalam `Kasus`** (satu sumber kebenaran, ikut berkas/tautan bagikan/riwayat/kasusmu):

- Bidang baru opsional di `Kasus` ([kasus.ts](../../packages/latihan/src/kasus.ts)): `sudahDiterima?: Record<IdOrang, bigint>` (satuan terkecil). Kosong/tak ada = perilaku sekarang, **tanpa regresi**.
- Serialisasi `keJson`/`dariJson`: `bigint` sebagai string digit, mengikuti cara `satuanPembulatan`/`tirkah` disimpan. Naikkan `versi` hanya bila pembaca versi lama menolak bidang asing; bila tidak, bidang opsional cukup tanpa naik versi.
- Pembaca berkas (`bacaBerkasKasus`) memvalidasi: ID harus ada di graf, nilai ≥ 0, digit saja. Berkas rusak = `GalatKasus`, bukan crash.
- `rapikanKeadaan`/ubah graf: bila orang dihapus atau tidak lagi penerima, isiannya **dibuang** (bukan dibiarkan menggantung); bila `Σd > T` karena harta diubah, kartu menampilkan galat (bagian 4), data tidak dihapus.
- Tautan bagikan (`kasus_dibagikan`): bidang ikut tersimpan; **tidak ada migrasi SQL** bila kolomnya JSON. Cek dulu; bila skema memetakan kolom per bidang, buat migrasi.
- Privasi: jumlah yang diterima per orang adalah data keluarga; ikut aturan kasus yang sama (lokal dulu; server hanya bila kasus disimpan/dibagikan).

## 7. Pintu wizard "Sebagian sudah diserahkan"

Konteks: dialog keadaan orang sudah punya jawaban `hartaSudahDibagi` (untuk ahli waris wafat **sesudah harta dibagi**, `wafatSesudahDibagi`), dan
`mockup-sudah-dibagi.html` hanya memuat: belum (baru), belum (bertahun), sudah pernah dibagi, tidak tahu. **Tidak ada "sebagian"** [fakta].

Dua pilihan, pemilik memilih (TERBUKA #7):
- **A. Tautan di Hasil saja** (sekarang) [USULAN, rekomendasi bertahan]: nol perubahan wizard; satu aksi sekunder; cocok karena "sebagian" tidak mengubah hasil hukum, hanya lapis nominal.
- **B. Pilihan kelima di pintu** "Sebagian sudah diserahkan": membuka isian per ahli waris **setelah** hasil ada, karena butuh daftar penerima dan nominal. Artinya pintu hanya menandai niat dan mengarahkan ke Hasil dengan kartu terbuka. Biayanya: satu cabang wizard + tes alur; manfaatnya: ditemukan oleh pengguna yang menjawab "sebagian".

Bila B: tidak menyentuh arti `wafatSesudahDibagi`; "sebagian" ≠ "sudah semua" (L3 riset berlapis: seluruhnya dibagi = mayit kedua dianggap hidup; **sebagian: KB diam**, jangan disamakan).

## 8. Jejak dan narasi

Prinsip 6 CLAUDE.md: keputusan = `LangkahJejak` (data), narasi di `packages/explain` lewat diksi `narasi.*`.
- Tahap 6b memancarkan `LangkahJejak` baru `sisa_hak` (data: `perOrang` {nominal, sudahDiterima, sisaHak}, `sisaKas`, `sisaLainnya`, `kelebihan`, `kasKurang`; `refs: ['R11-5']` + `KH`). Saat ini `hitungSisaHak` mengembalikan angka tanpa jejak.
- `packages/explain`: templat `narasi.sisa_hak.*` (ringkas; satu kalimat per kelebihan/kas kurang). Kalimat baru **tidak di-hardcode**:
  `pnpm diksi:tambah <file.json>` (kunci snake_case, tanpa huruf besar).
- UI memakai kunci diksi `hasil.sisa_hak.*` yang sudah ada; narasi jejak tampil hanya di Periksa/Jejak bila kasus punya `sudahDiterima`.
- Teks UI tanpa kode (R11-x) untuk awam; kode rujukan hanya di mode peneliti/panel sumber yang sudah ada.

## 9. Piutang ahli waris (bab 11.4)

Status: KB sudah ada (R11-4, [SYF] saja), engine **belum**. Seluruhnya bersyarat keputusan pemilik (TERBUKA #2); rekomendasi: **tunda**, tapi spec ini mengikat rancangannya agar tidak berubah nanti.

- Input tambahan: per ahli waris, `hutangKePewaris: bigint`, dan pertanyaan **"Penghutang setuju dipotong?"** (setuju / menolak mengakui atau pailit / mengakui dan mampu, tidak setuju).
- Piutang dihitung sebagai bagian tirkah (barang + piutang): `S` = bagian si penghutang dari **seluruh** tirkah, `H` = hutangnya.
- Tiga keadaan (tabel KB 11.4), fungsi murni baru di Tahap 6c `hitungPiutangAhliWaris`:
  - `S = H`: bagian dibuang, barang dibagi atas saham lain; tidak menerima, tidak membayar.
  - `S > H`: bagian dikurangi `H`; sisanya `S − H` dari barang.
  - `S < H`: bagian dibuang, barang dibagi atas saham lain; si penghutang membayar `H − S`, dibagi ke ahli waris lain sesuai saham.
- Aturan input: syarat belum jelas → `PERLU_INPUT` (bukan asumsi) [KB 11.4]. "Mengakui dan mampu tetapi tidak setuju" → `TIDAK_DIDUKUNG` dengan penjelasan "harus saling rela" (bukan dipotong sepihak).
- Madzhab non-[SYF] → `TIDAK_DIDUKUNG` (bab 18.4).
- Jangan campur dengan `sudahDiterima`: `d` = uang yang diterima sebagai warisan; `H` = utang. Dua isian, dua tabel, dua cabang kode.
- Contoh uji = contoh KB 11.4 (empat anak, barang 12 + piutang 8, `S`=5, `H`=8 → membayar 3).
- Anotasi kode `// [R11-4] ...` pada tiap cabang.

## 10. Tes dan kriteria selesai

Sudah: tes engine (contoh KB + property identitas), 10 kunci diksi.
Tambahan per tugas (bagian 12):
- Kasus: serialisasi bolak-balik `sudahDiterima`; berkas dengan ID tak dikenal / negatif ditolak; kasus tanpa bidang = hasil lama (regresi).
- Kartu: isian terbawa setelah muat ulang dan setelah ganti madzhab; hilang saat penerima dihapus; galat `Σd > T`; kelebihan; kas kurang; tidak muncul pada taqdir/gharqa.
- Jejak: `LangkahJejak` `sisa_hak` ada dan diuji; narasi lewat diksi (tes `diksi.test.ts` tidak gagal karena kunci baru). Satu tes `diksi.test.ts` yang sudah gagal berasal dari sesi lain (`BlokIsi.tsx`): bukan bagian 7b.
- Piutang (bila diaktifkan): tiga keadaan + contoh KB + property `Σ bagian akhir = tirkah awal`; uji negatif untuk `PERLU_INPUT`.
- `pnpm -r typecheck` dan `pnpm -r test` hijau selain tes pihak lain; verifikasi tampilan 375 px dan laptop.

**Selesai** = isian tersimpan bersama kasus; kartu hanya pada kasus yang dicakup; jejak + narasi lewat diksi; semua tes bagian 10 lulus; tidak ada kode teknis di teks pengguna; tidak ada aturan fikih di luar KB.

## 11. Keputusan pemilik (2026-11-25: "sesuai rekomendasi")

**Semua butir di bawah DISETUJUI sesuai kolom rekomendasi** (status [TERBUKA]/[USULAN] di bagian lain kini [PEMILIK]). Konsekuensi: T1, T2, T3, T4, T5 (munasakhat, penyajian saja) boleh dikerjakan; T6 (pintu B) tidak; T7/T8 (piutang) ditunda.

| # | Pertanyaan | Rekomendasi |
|---|---|---|
| 1 | "Sudah menerima" = hanya bagian warisan di muka; hibah/pinjaman ditolak lewat teks petunjuk (bukan validasi). Setuju? | Ya (hibah = bab 01.6; pinjaman = bagian 9) |
| 2 | Piutang ahli waris (11.4): tunda atau masukkan sekarang? | Tunda sampai 7b dasar dipakai; rancangan bagian 9 sudah siap |
| 3 | Nilai barang yang diserahkan | Pengguna isi rupiah yang disepakati sekarang, engine tidak menaksir |
| 4 | Wording kelebihan | Netral, "perlu disepakati keluarga atau ditanyakan ke pengadilan", tanpa saran pengembalian |
| 5 | Munasakhat dengan penerimaan sebagian | Aktifkan, penyajian saja (nominal tidak berubah, KB 11.3, 12.3) |
| 6 | Ahli waris baru setelah sebagian dibagi | Cukup hitung ulang + sisa hak + tanda kelebihan; pengembalian tetap di luar sistem |
| 7 | Pintu wizard | A: tautan di Hasil saja (bertahan); B hanya bila pengguna nyata tidak menemukan tautan |
| 8 | Multi-madzhab | Tanpa overlay (aritmetika); berlaku bagi semua ruleset berstatus OK |
| 9 | Takharuj terpisah dari 7b | Ya |
| 10 | Isian tersimpan bersama kasus (bagian 6) atau tetap hilang saat muat ulang | Tersimpan di `Kasus`; kehilangan angka saat muat ulang membuat fitur tidak berguna untuk kasus panjang |
| 11 | Taqdir/gharqa tidak dicakup (bagian 5) | Ya, sampai ada permintaan |

## 12. Pecahan tugas dan model (untuk delegasi)

Alasan model: **Sonnet** untuk perubahan lintas file dengan keputusan lokal (kasus, UI, tes); **Haiku** hanya untuk yang mekanis
dan sepenuhnya dispesifikasi (menambah kunci diksi dari daftar, mengganti teks); **Opus** tidak dipakai di sini karena fikih sudah
tertulis di KB dan tidak ada yang dikarang; Opus hanya untuk review akhir diff inti bila pemilik minta.

| ID | Tugas | Model | Bergantung pada | Alasan |
|---|---|---|---|---|
| T1 | `Kasus.sudahDiterima` + serialisasi + validasi baca + pembuangan saat graf berubah + tes (bagian 6, 10) | Sonnet | keputusan #10 | Menyentuh `packages/latihan` dan beberapa pembaca; butuh membaca pola `satuanPembulatan` |
| T2 | `SisaHakKartu` baca/tulis `kasus.sudahDiterima`, hilang saat penerima dihapus; tes kartu | Sonnet | T1 | Perubahan UI + state + tes |
| T3 | `LangkahJejak` `sisa_hak` di engine + tes | Sonnet | tidak ada | Kontrak jejak punya aturan sendiri (data, `refs`) |
| T4 | Templat `narasi.sisa_hak.*` di `packages/explain` + file JSON untuk `pnpm diksi:tambah` + jalankan skrip | Haiku | T3 (bentuk data) | Mekanis: kalimat dan kunci ditetapkan di spec ini, skrip menyalin ke snapshot |
| T5 | Munasakhat: izinkan kartu pada `jenis === 'munasakhat'` (bagian 5) + tes | Sonnet | keputusan #5 | Perlu memahami `hasilBiasa` vs `rantai` di Hasil.tsx |
| T6 | Pintu wizard pilihan B (bagian 7) | Sonnet | keputusan #7 = B | Cabang wizard + tes alur |
| T7 | Piutang: engine Tahap 6c + tes tiga keadaan + `PERLU_INPUT` | Sonnet | keputusan #2 = masukkan | Aritmetika bigint dan invarian; fikih sudah di KB |
| T8 | UI piutang (input + pertanyaan setuju) | Sonnet | T7 | |
| T9 | Verifikasi tampilan 375 px dan laptop, ringkas bukti | Haiku | T2 | Mekanis: ikuti daftar periksa, laporkan |

Urutan: T1→T2 dan T3→T4 dapat berjalan paralel (file berbeda); T5–T8 menunggu keputusan pemilik.
Aturan semua tugas: commit hanya file sendiri; jangan sentuh `materi.css`, `Peraga.tsx`, `Aplikasi.tsx`/`rute.ts` perubahan sesi lain; kode fikih memakai anotasi `[R11-x]`.
