# Spec: tangga bantuan soal hitung (2026-11-23)

Menggantikan "Lihat jawaban" (dialog tahan, semua jawaban sekaligus) di soal latihan bertabel. Mode Ujian tidak berubah.
Status: **konsep disetujui pemilik 2026-11-23**; mockup belum dibuat; kode belum disentuh.

## 1. Masalah sekarang
- Lihat jawaban tersedia sejak detik pertama, cukup ditahan, dan membuka semua kolom sekaligus. Pelajar yang buntu di satu
  kolom kehilangan seluruh soal, padahal sebagian besar sudah bisa ia kerjakan.
- Periksa tak terbatas dan umpan menunjuk kolom salah: kolom pilihan bisa ditebak satu per satu tanpa biaya, XP tetap penuh.
- Tidak ada bantuan di antara "coba sendiri" dan "jawaban penuh". Menurut riset tutor cerdas (Baker dkk., *gaming the
  system*), celah inilah yang membuat orang menekan tombol sampai jawaban keluar.

## 2. JTBD
- Saat buntu di satu langkah, aku ingin **didorong sedikit**, bukan diberi jawaban, supaya aku tetap merasa mengerjakan sendiri.
- Saat benar-benar tidak tahu, aku ingin **melihat jawaban langkah itu saja**, lalu melanjutkan sisanya sendiri.
- Saat sudah menyerah, aku ingin **melihat semuanya dengan cepat**, tanpa membuka kolom satu per satu.
- Sebagai pemilik: XP harus mencerminkan seberapa mandiri soal itu dikerjakan, dan aturannya transparan.

## 3. HMW
- Bagaimana kalau bantuan *datang* setelah pelajar berusaha, bukan tersedia sejak awal?
- Bagaimana kalau bantuan bertingkat per kolom, dari konsep umum ke singgungan kasus, baru jawaban?
- Bagaimana kalau harga setiap bantuan terlihat sebelum diambil, sehingga pilihan itu disadari, bukan dihukum diam-diam?
- Bagaimana kalau soal yang selesai dengan bantuan diajak untuk diulang nanti, supaya pelajar ingin kembali?

## 4. Alur
```
Mulai  →  isi  →  Periksa ─ benar ─→ selesai (predikat)
                     │
                   salah / belum lengkap (≥1 kolom terisi) = 1 usaha
                     │
             usaha ≥ 2  →  tautan "Butuh bantuan?" di kolom pertama yang salah/kosong
                     │
   Tangga per kolom:
     1  Petunjuk konsep      (umum, tanpa angka kasus)
     2  Singgungan kasus     ("Ingat, di kasus ini ada …")
     3  Buka jawaban kolom   (pertama kali di soal ini: ketik "hangus" → XP soal = 0)
                     │
     setelah XP hangus  →  tautan "Buka sisanya"
```
- **Usaha** = Periksa dengan hasil salah, atau belum lengkap asalkan minimal satu kolom terisi. Jalan keluar bagi yang buntu
  di kolom pertama: Periksa dengan kolom pertama terisi sebagian sudah dihitung usaha.
- Tangga selalu di **kolom pertama yang belum benar** (dari `putusanLatihan`). Setelah kolom itu benar atau dibuka, tangga
  pindah ke kolom berikutnya dan mulai lagi dari anak tangga 1; tidak ada syarat 2 usaha lagi.
- Ketik "hangus" hanya sekali per percobaan soal, saat XP benar-benar akan hilang. Kalau soal ini sudah pernah benar (XP
  sudah didapat) atau XP sudah hangus, buka kolom tanpa mengetik.
- "Lihat semua jawaban" dihapus. "Buka sisanya" hanya tampil setelah XP hangus.
- Kosongkan / Kerjakan ulang = percobaan baru: hitungan usaha dan anak tangga kembali ke nol. XP tetap mengikuti aturan
  server (benar pertama saja).

## 5. XP (server, `xp_soal_baru`)
Benar pertama memberi `bobot × faktor`, dengan:
- `faktor = max(40%, 100% − 15% × (Periksa salah + petunjuk diambil))` sebelum benar pertama;
- buka kolom sebelum benar pertama = 0 XP selamanya (sama seperti lihat jawaban sekarang).

Periksa salah dan petunjuk dihitung di semua sesi sebelum benar pertama; Kosongkan tidak mengembalikannya. Kalau tidak,
Kosongkan menjadi cara memutihkan potongan.
Teks di layar: XP soal ini tampil kecil di dekat tombol ("XP soal ini: 85"), dan setiap anak tangga menyebut harganya
sebelum diambil ("Petunjuk, −15 XP"). Tidak ada potongan yang tersembunyi.

## 6. Isi petunjuk
Fikih harus bisa ditelusuri ke KB. Tidak ada kalimat yang dikarang per soal.
- **Konsep (anak tangga 1)**: satu templat per `idJudul` kolom (`asalMasalah`, `bagian`, `didudukkanSebagai`, `pengali`,
  `jamiah`, …), diksi `hitung.bantuan.konsep.<idJudul>`, dengan tautan ke pelajaran yang membahasnya.
- **Singgungan (anak tangga 2)**: dari `LangkahJejak` hasil engine, jadi selalu sesuai kasus dan ber-refs:
  - `didudukkanSebagai`, baris terhalang → `HAJB_HIRMAN.hajib`: "Ingat, di kasus ini ada {hajib}."
  - `bagian`, fardh berkurang → `HAJB_NUQSHAN.penyebab`: "Perhatikan siapa yang membuat bagian {nama} berkurang."
  - `asalMasalah` / `asalMasalahAkhir` → `AUL` / `RADD` / `KASUS_KHUSUS`: "Jumlah bagiannya melebihi/kurang dari asal masalah."
  - `pengali` → `PERBANDINGAN_NISAB` tujuan `inkisar`: "Ada kelompok yang sahamnya tidak terbagi rata."
  - Kolom tanpa jejak yang cocok: lewati anak tangga 2.
  Singgungan menyebut **apa yang perlu diperhatikan**, tidak pernah nilai sel.
- **Buka kolom (anak tangga 3)**: kunci kolom itu tampil seperti mode kunci sekarang; isian yang berbeda dicoret.

## 7. Supaya ingin kembali
- Predikat per soal, kata tanpa medali (memori: latihan aksi terlihat jelas): **Mandiri** (tanpa bantuan),
  **Dibantu** (pakai petunjuk), **Dibuka** (ada kolom yang dibuka).
- Soal Dibantu/Dibuka diberi penanda "Ulangi nanti" di daftar Latihan. Kerjakan ulang yang berhasil Mandiri mengganti
  predikatnya (XP tetap mengikuti aturan server).
- Umpan saat benar menyebut kemajuannya: "Kolom hajb kali ini tanpa petunjuk."
- Gerak tipis saat tautan bantuan muncul (memori: UI tidak flat), tanpa suara mengagetkan.

## 8. Data dan kode
- `KejadianPercobaan.aksi` + `'petunjuk' | 'bukaKolom'`, dengan `bantuan: { idKolom, tingkat: 1 | 2 }` / `{ idKolom }`.
  Migrasi: perluas cek `aksi` di `percobaan_soal`, ubah `xp_soal_baru`, dan tambah tes pgTAP.
- `TabelLatihan`: buang `saatLihatJawaban`; tambah state tangga per kolom; mode kunci per kolom (sekarang semua-atau-tidak).
- `packages/latihan`: fungsi murni `singgunganKolom(idJudul, jejak) → Singgungan | null` (data, bukan kalimat).
- Diksi baru lewat `pnpm diksi:tambah`.
- Gharqa: tangga hanya berlaku di tabel harta; langkah keputusan (3 pilihan) tetap tanpa bantuan. Gharqa juga belum
  menyimpan isian; diselesaikan bersamaan.

## 9. Celah yang diketahui (diterima)
- Membuka jawaban saat offline di perangkat lain lalu benar di perangkat ini bisa tetap memberi XP (server memakai waktu
  diterima). Dampaknya kecil.
- Kasus yang sama bisa dimasukkan ke Kalkulator. Ini latihan, bukan ujian; pengamannya mode Ujian.

## 10. Langkah berikutnya
1. Mockup statis (keadaan: awal, salah 1×, tautan bantuan, petunjuk 1, petunjuk 2, dialog ketik "hangus", kolom dibuka,
   Buka sisanya, selesai + predikat), lalu pemilik memilih.
2. Server: migrasi + tes XP.
3. Web: tangga di `TabelLatihan`, singgungan di `packages/latihan`, diksi.
