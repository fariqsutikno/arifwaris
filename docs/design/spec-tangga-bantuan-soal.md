# Spec: tangga bantuan soal hitung (2026-11-23)

Menggantikan "Lihat jawaban" (dialog tahan, semua jawaban sekaligus) di soal latihan bertabel. Mode Ujian tidak berubah.
Status: **konsep disetujui pemilik 2026-11-23**; mockup `mockup-tangga-bantuan.html` revisi 2; kode belum disentuh.

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

## 5. XP (server, `xp_soal_baru`) — revisi 2026-11-23
Dibingkai sebagai **untung**, bukan potongan. Alasan:
- *Loss aversion* (Kahneman & Tversky): kehilangan terasa sekitar dua kali lebih berat daripada untung yang sama besar.
  "−3 XP" di setiap tombol terasa seperti hukuman, sedangkan "bonus mandiri" yang tidak didapat terasa seperti peluang.
- *Help avoidance* (Aleven dkk., kajian *help seeking* di lingkungan belajar interaktif): kalau bantuan mahal, pelajar
  yang paling butuh justru menghindarinya, lalu menyerah atau menebak. Harga bantuan harus kecil dan sekali saja.
- Salah adalah bagian dari belajar (*desirable difficulties*, Bjork). Memotong XP per salah membuat orang takut menekan
  Periksa, padahal Periksa itulah umpan baliknya.

Aturannya:
- Benar tanpa membuka kolom = **XP dasar** (60% bobot).
- **Bonus mandiri** (40% bobot) hanya kalau benar tanpa petunjuk **dan** Periksa salah tidak lebih dari 3 kali. Batas 3
  menutup celah menebak kolom pilihan satu per satu (biasanya 6–8 pilihan), tanpa menghukum salah biasa.
- Petunjuk berapa pun hanya melepas bonus (sekali), tidak ada potongan per petunjuk.
- Buka kolom sebelum benar pertama = 0 XP selamanya.
- Hitungan dilakukan di semua sesi sebelum benar pertama; Kosongkan tidak memutihkan.

Di layar hanya ada satu penanda di kepala tabel: "12 XP · ☆ +8 mandiri". Saat bonus lepas, chip itu dicoret. Tidak ada
harga di setiap tombol.

## 5a. Tampilan petunjuk — revisi 2026-11-23
- Tidak ada daftar tiga anak tangga. Setelah 2 usaha, umpan merah mendapat satu tautan **Lihat petunjuk**.
- Kartu kuning "Petunjuk · kolom Bagian" berisi petunjuk 1. Di bawahnya hanya satu aksi berikutnya: "Masih buntu?
  Petunjuk berikutnya", lalu setelah petunjuk 2 "Tunjukkan jawaban kolom Bagian" (merah). Petunjuk yang sudah dibuka
  tetap tampil bertumpuk di kartu yang sama.
- Umpan salah menunjuk **kolom**, tidak menunjuk baris ("Kolom **Bagian** belum tepat semua"); seluruh kolom diberi warna
  merah. Menunjuk baris membuat kolom dengan dua pilihan (misalnya istri 1/4 atau 1/8) langsung tertebak. (Revisi 3.)
- Petunjuk menyenggol, tidak menjurus. Petunjuk 1 = konsep umum dari jenis jejak, tanpa nama orang dan tanpa nilai
  ("Bagian tetap seseorang bisa mengecil karena ahli waris lain ikut hadir"). Petunjuk 2 = menyempit ke siapa yang perlu
  dicek ("Coba lihat lagi bagian istri"), tetap tanpa nilai. Yang paham akan berkata "oh iya"; yang menebak tetap
  tidak tahu nilainya. Tautan materi ke bab yang sesuai jejak (di sini hajb nuqshan).
- "Buka sisanya" dinamai **Buka semua kolom**, hanya muncul setelah ada kolom dibuka (XP sudah hilang).
- Daftar Latihan memakai gaya baris yang ada sekarang (DaftarSoalHitung). Tambahannya hanya keterangan
  (mandiri / dengan petunjuk / satu kolom dibuka) dan penanda **layak diulang**. Judul tetap buta sampai selesai
  (`judulSoalTampil`). Predikat berupa kalimat di layar selesai ("Dua dari tiga kolom kamu selesaikan sendiri"),
  bukan label.

## 6. Isi petunjuk
Fikih harus bisa ditelusuri ke KB. Tidak ada kalimat yang dikarang per soal.
(Revisi 3: menyenggol, tidak menjurus.) Keduanya diturunkan dari `LangkahJejak` baris yang salah, jadi sesuai kasus dan ber-refs.
Pola (revisi 4, pilihan pemilik "C + 2"):
- **Petunjuk 1** = istilah fikih (bertooltip, `ui/Tooltip.tsx`, isi dari glosarium bab 15) + pertanyaan yang mengajak
  berpikir ("siapa/apa yang berubah…?"). Tidak menyebut nama orang, tidak menyebut nilai.
- **Petunjuk 2** = ajak melihat lagi **bagian mana** + **apa yang perlu dipertimbangkan**. Boleh menyebut nama/kelompok,
  tidak pernah nilai. Bila beberapa baris salah, yang disebut hanya baris salah pertama.

| Jejak / kolom | Petunjuk 1 | Petunjuk 2 |
|---|---|---|
| `HAJB_NUQSHAN`, penyebab far'u warits (kolom Bagian) | Ingat **far'u warits**. Siapa saja yang bagiannya berubah kalau mereka ada? | Lihat lagi bagian **{nama}**. Apakah sudah mempertimbangkan far'u warits di kasus ini? |
| `HAJB_NUQSHAN`, penyebab jumlah saudara (kolom Bagian) | Ingat, **jumlah saudara** almarhum juga bisa mengubah bagian. Siapa yang bagiannya berubah kalau saudaranya dua atau lebih? | Lihat lagi bagian **{nama}**. Berapa saudara almarhum di kasus ini? |
| `HAJB_HIRMAN` (kolom Bagian / Didudukkan sebagai) | Ingat **hajb hirman**. Siapa yang mungkin tertutup sama sekali di kasus ini? | Lihat lagi **{nama}**. Adakah ahli waris lain yang lebih dekat ke almarhum? |
| Asal masalah (`KELAS_MASALAH` adilah) | Ingat **ashlul mas'alah**. Bagian siapa saja yang ikut menentukannya? | Lihat lagi penyebut di kolom Bagian. Apakah semuanya habis membagi asal masalahmu? |
| Asal masalah akhir, `AUL` | Ingat **'aul**. Apa yang terjadi pada asal masalah kalau bagian-bagiannya melebihi harta? | Jumlahkan saham semua ahli waris. Lebih besar dari asal masalah, atau tidak? |
| Asal masalah akhir, `RADD` | Ingat **radd**. Ke mana sisa harta pergi kalau tidak ada ashabah? | Jumlahkan saham, lalu bandingkan dengan asal masalah. Siapa yang tidak ikut menerima sisa? |
| Pengali / asal masalah akhir, `PERBANDINGAN_NISAB` inkisar | Ingat **inkisar**. Kelompok mana yang sahamnya harus dibagi ke beberapa orang? | Lihat lagi saham **{kelompok}**. Bisakah dibagi rata ke jumlah **ru'us**-nya? |
| `ASHABAH` bil ghair (kolom saham) | Ingat **ashabah bil ghair**. Bagaimana sisa dibagi kalau laki-laki dan perempuan berbagi? | Lihat lagi saham **{nama}** dan **{nama2}**. Apakah perbandingannya sudah sesuai? |
| Lainnya | templat umum per `idJudul` kolom | Lihat lagi kolom **{kolom}** baris **{nama}**. |

Semua kalimat = draf; dicocokkan ke KB (bab 4, 5, 9, 10) sebelum masuk diksi.
- Tautan materi: bab yang sesuai jenis jejak.
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
