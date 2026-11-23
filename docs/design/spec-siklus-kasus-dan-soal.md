# Spec: siklus kasus dan soal latihan ("dua benda, dua rumah")

Status: **disetujui pemilik 2026-11-23** (pilihan 1b, 5b, 3b, tanpa 4b, 3c; Lab Hitung opsi 1: tampilan Lab tetap).
Dasar: `riset-ux-siklus-kasus-dan-soal-2026-11-23.md`. Acuan visual: `mockup-siklus-kasus-dan-soal.html`.
Lanjutan dari PR #55 (tambalan: soal tidak jadi kasus terakhir); spec ini menggantikan tambalan `bukaRiwayat` di sana.

## 0. Prinsip
1. **Kasus** tinggal di Kasusmu (riwayat + tersimpan). **Soal** tinggal di Latihan (progres + isian per kode soal).
2. Tempat menentukan mode: dibuka dari Latihan/pintasan soal = soal; dari Kasusmu/Lab/Beranda/Riwayat = kasus.
3. Soal/contoh menjadi kasus hanya lewat **salinan** ("Jadikan kasus sendiri").
4. Tampilan yang ada **tidak diubah** kecuali yang disebut di bawah (Lab Hitung, rak Kasusmu, ubin, hero tetap).

## 1. Penyimpanan

| ID | Keputusan |
|---|---|
| P1 | Sesi bersumber `latihan` **tidak** memanggil `catatRiwayat`, `catatBilaBelumAda`, maupun `simpanLokal` (`Aplikasi.tsx`). Sesi `materi` juga tidak masuk riwayat. |
| P2 | `bacaKasusKu` (`kasusmu.ts`), `HalamanRiwayat`, `DaftarKasus`, dan entri terbaru di Beranda menyaring entri lama ber-`sumber.jenis` `latihan`/`materi` (disembunyikan, tidak dihapus). Satu fungsi saring di `riwayat.ts` dipakai semua tempat. |
| P3 | Isian tebakan soal hitung disimpan lokal per kode soal: modul baru `apps/web/src/isianSoal.ts` (`bacaIsianSoal(kode)`, `simpanIsianSoal(kode, isian)`, `hapusIsianSoal(kode)`), kunci `arif-waris:isian-soal`, nilai `{ isian: IsianTabel, diubahPada: number }`. Lewat `penyimpanan.ts` (bacaMentah/simpanMentah). Tidak disinkron ke akun (fase ini). |
| P4 | `TabelLatihan` memuat isian awal dari `bacaIsianSoal` dan menyimpan setiap perubahan (ditunda ±400 ms tidak wajib; boleh langsung). Dihapus saat soal benar, saat "Kosongkan", dan saat "Lihat jawaban". |
| P5 | Status soal **turunan** (fungsi murni di `layar/belajar/statusSoal.ts`): `belum` (tanpa progres, tanpa isian), `terputus` (ada isian tak kosong, belum selesai), `benar` (progres.benar), `lihatJawaban` (ada progres, tidak benar). Satu sumber untuk semua tampilan. "Selesai" = `benar` atau `lihatJawaban` (sama dengan `judulSoalTampil` sekarang). |

## 2. Membuka

| ID | Pintu | Perilaku |
|---|---|---|
| B1 | Latihan / pintasan soal Lab / acak / soal berikutnya, status `belum`/`terputus` | mode tebak (seperti sekarang); isian dipulihkan (P4) |
| B2 | Pintu yang sama, status selesai | **pembahasan**: hasil terbuka (`tujuan: 'hitung'`, tanpa tebak), dengan tautan teks "Kerjakan ulang" (hapus isian, buka tebak; tidak memberi XP sesuai spec K5) dan "Jadikan kasus sendiri" |
| B3 | Kasusmu / Riwayat / Lanjutkan Lab / Beranda | hanya kasus (soal sudah tersaring, P2). Hapus logika `bukaRiwayat` khusus latihan dari PR #55 karena tidak diperlukan lagi |
| B4 | Materi "Coba di kalkulator" | hasil hanya-baca (seperti sekarang) + tautan "Jadikan kasus sendiri" |
| B5 | "Jadikan kasus sendiri" | `bukaDiHitung(salinan, { jenis: 'sendiri' })` dengan `idSesi` baru; kasus masuk riwayat seperti kasus biasa. Soal/contoh asli tidak berubah. Hanya tersedia di soal selesai dan contoh materi (bukan soal belum selesai) |
| B6 | Muat ulang di tengah soal | boleh tetap memakai URL kalkulator yang ada; karena P1 sesi soal tidak masuk riwayat, pemulihan URL untuk soal cukup membuka kembali soalnya bila `pulihDariUrl` sudah mendukung, kalau tidak, kembali ke Latihan. Jangan sampai soal terbuka sebagai kasus. |

## 3. Tampilan yang berubah

| ID | Tempat | Perubahan |
|---|---|---|
| T1 | Beranda | dua panel lanjutkan terpisah, masing-masing hanya bila ada: "Lanjutkan kasus" (kasus terakhir, seperti sekarang) dan "Lanjutkan soal" (soal `terputus` terbaru: "Soal K-12 · bab", "n dari m isian tersimpan"). Gaya mengikuti panel yang ada |
| T2 | Daftar Latihan (`DaftarSoalHitung` `BarisSoal`) | `.status-soal-baru` diperluas ke 4 keadaan: putus-putus (belum, sudah ada), cincin jingga `--aksen` terisi sesuai porsi isian (terputus, baris disorot `--aksen-soft`), hijau + centang (benar, sudah ada), abu + ikon mata (lihat jawaban, netral). `aria-label` = teks status. Keterangan baris: "Terputus, n dari m isian" (tebal jingga tua) / "Sudah, benar" / "Sudah, lihat jawaban". Kata tombol: Kerjakan / Lanjutkan / Pembahasan. Di atas daftar: baris "Lanjutkan yang terputus" bila ada |
| T3 | Ubin "Berlatih dengan soal" di Lab (`PintasanSoal`) | tetap menampilkan soal belum selesai; terputus ikut tampil dengan cincin jingga. Judul tetap soal buta (`judulSoalTampil`) |
| T4 | Hasil soal selesai | label/keterangan "Soal latihan · pembahasan", tautan Kerjakan ulang & Jadikan kasus sendiri (tautan teks, bukan tombol berbingkai) |
| T5 | Keluar dari soal | kalimat dialog `umum.soal_ini_bisa_kamu_buka_lagi` diganti "Tebakanmu tersimpan. Lanjutkan kapan saja dari Latihan." (lewat kamus terjemah) |
| T6 | Komentar basi `AwalHitung.tsx:4-6` (sakelar Belajar) diperbarui |

Semua kalimat baru lewat kamus terjemah (`t(...)`), mengikuti cara kunci yang ada; jangan hardcode. Ikon SVG, bukan emoji.

## 4. Uji (wajib)
- `statusSoal`: 4 keadaan + isian kosong dianggap belum.
- `isianSoal`: simpan, baca, hapus; JSON rusak → null.
- Saring riwayat: entri `latihan`/`materi` tidak muncul di `bacaKasusKu` dan Riwayat.
- Alur `Aplikasi`: kerjakan soal → isi satu kotak → kembali ke Lab → tidak ada soal di hero/Kasusmu; buka lagi soalnya dari Latihan → isian kembali.
- Soal selesai dibuka dari Latihan → tanpa tebak, ada "Kerjakan ulang" dan "Jadikan kasus sendiri"; jadikan kasus → muncul di Kasusmu sebagai kasus sendiri.
- Ganti test PR #55 yang bergantung pada tambalan `bukaRiwayat` bila perlu.
- `pnpm run typecheck` dan `pnpm --filter web test` hijau.

## 5. Di luar cakupan
Sinkron isian ke akun; "Jadikan soal" dari kasus (pengajar); rute URL khusus soal; kelas/tugas.
