# Portal admin — telaah umpan balik pengguna & rencana perbaikan

Tanggal: 2026-09-28 · Cabang: `admin/manusiawi` · Status: **draf, menunggu keputusan di bagian C**

Dokumen ini menelaah 24 keluhan pengguna tentang portal admin (`apps/admin`), mencari akar masalahnya di kode,
lalu menyusun perbaikan bertahap. Belum ada kode yang diubah.

---

## A. Temuan: keluhan → akar masalah → arah perbaikan

### A1. Alur kerja & aksi

| # | Keluhan | Akar masalah (kode) | Arah perbaikan |
|---|---------|---------------------|----------------|
| 1 | Bulk cuma bisa pilih, aksinya tidak jelas | `DaftarKonten.tsx`: aksi massal hanya **Ajukan** & **Setujui**, dan bilah aksi baru muncul setelah ada yang dicentang. Kalau yang dipilih tidak memenuhi syarat, tombolnya mati tanpa penjelasan. | Bilah aksi selalu tampil di mode Pilih. Aksi lengkap per peran: Terbitkan (admin), Kirim untuk review, Setujui, Kembalikan (satu catatan untuk semua), Pindahkan ke Sampah, Pulihkan. Tiap tombol menulis alasannya, mis. "2 dari 5 bisa disetujui · 3 sudah terbit". |
| 2 | Aksi di konten tidak ada, cuma "baca"; reviewer bingung | Baris daftar hanya berisi tautan judul. `EditorEntri.tsx` **tidak punya tombol Setujui/Kembalikan**; reviewer yang membuka entri hanya melihat form baca-saja, dan aksinya ada di layar lain (Antrean review). | (a) Menu ⋯ di tiap baris: Sunting, Lihat di web, Setujui/Kembalikan (reviewer), Pindahkan ke Sampah. (b) Editor untuk entri yang *menunggu review* menampilkan perbandingan + Setujui/Kembalikan di tempat, sama dengan Antrean review (pakai ulang komponennya). |
| 12 | Beda "Terbitkan" dan "Simpan dulu" tidak jelas | Dua tombol tanpa keterangan. | Ganti label: **Simpan draf** ("belum tampil di web, bisa dilanjutkan") dan **Terbitkan sekarang** / **Kirim untuk review**. Satu baris keterangan di bawah tombol, dan dialog konfirmasi terbit berisi ringkasan perubahan (lihat #13). |
| 13 | Tidak ada "lihat perubahan sebelum & sesudah" | Perbandingan hanya ada di Riwayat (bawah halaman), dan hanya untuk revisi yang *sudah tersimpan*. Perubahan yang sedang diketik tidak bisa dibandingkan. | Tombol **Lihat perubahan** di bilah aksi editor: form sekarang vs versi tayang, memakai `Perbandingan.tsx` + `banding.ts` yang sudah ada. Otomatis tampil di dialog konfirmasi Terbitkan/Kirim. |
| 14 | Tidak ada riwayat materi | Riwayat **ada** (`RiwayatRevisi.tsx`), tapi (a) letaknya di paling bawah, di bawah tombol; (b) tiap versi hanya bisa dibandingkan dengan versi *tayang*, bukan dengan versi sebelumnya, jadi alur "awalnya begini → diperbaiki begini" tidak terbaca; (c) konten hasil impor hanya punya satu revisi. | Pindahkan Riwayat ke tab/panel sendiri di editor. Tiap versi: bandingkan dengan versi sebelumnya, "Lihat isi versi ini", "Pakai versi ini sebagai draf" (membuat draf baru dari versi lama; tidak menimpa). |
| 21 | Bidang terkunci masih tampak bisa diedit | `FormKonten.tsx` memakai `readOnly`, jadi tampilan input sama persis dengan yang bisa diketik. | Gaya terkunci: latar abu, ikon gembok di dalam bidang, kursor `not-allowed`, teks keterangan di bawahnya. Tetap `readOnly` (bukan `disabled`) supaya nilainya bisa disalin & dibaca pembaca layar. |

### A2. Tampilan & kenyamanan

| # | Keluhan | Akar masalah | Arah perbaikan |
|---|---------|--------------|----------------|
| 8 | Pratinjau terpotong, tidak bisa diklik, tidak bisa diperbesar | (a) Pratinjau berbagi lebar dengan form (`lg:grid-cols-2`) dan dibatasi `max-h`, padahal layar web dirancang untuk lebar penuh. (b) **Tautan di dalam pratinjau mengubah `location.hash` portal**, jadi mengklik apa pun di pratinjau memindahkan portal ke beranda (atau memicu peringatan "belum disimpan"). | Tombol **Perbesar** membuka pratinjau layar penuh (dialog lebar penuh, bisa HP/desktop). Klik tautan `#/…` di dalam pratinjau dicegat: tidak mengubah rute portal, cukup ditandai "tautan ke halaman lain". |
| 11 | Banyak bidang terpotong, harus scroll | Textarea tetap `rows={3}`; tabel diksi & hasil cari memotong teks (`line-clamp-2`, sel sempit). | Textarea tumbuh mengikuti isi (CSS `field-sizing: content`, cadangan tinggi minimum). Teks panjang di daftar ditampilkan utuh (wrap), bukan dipotong. |
| 18 | Warna kolom kiri & kanan di daftar ahli waris beda | `EditorKasus.tsx`: grid 2 kolom memakai `odd:bg-muted/40`. Di grid 2 kolom, item ganjil selalu jatuh di kolom kiri, jadi **seluruh kolom kiri abu, kolom kanan putih**. | Buang zebra. Susun ahli waris per kelompok (pasangan, keturunan, orang tua & kakek-nenek, saudara, paman & sepupu) dengan kartu seragam; ahli waris yang jumlahnya > 0 diberi sorotan. |
| 19 | Harta perlu "Rp" dan titik ribuan otomatis | `InputBigint` menampilkan angka mentah. | Input rupiah: awalan "Rp", pemisah ribuan saat mengetik. Cek dulu apakah wizard web (`LangkahHarta`) sudah punya fungsi format yang bisa dipakai ulang. |
| 16 | "Harus sama dengan daftar kitab di KB bab 17.2" membingungkan | Teks bantuan `formulir.ts` & `panduan.ts` masih menyebut KB, bab, slug, Refs, engine. | Hapus aturan yang bisa dijaga mesin dari teks bantuan: judul kitab jadi **dropdown dari daftar kitab** (tidak mungkin salah); potongan ayat syahid dicek otomatis terhadap teks ayat. Audit semua label: "engine" → "kalkulator", "Refs" → "rujukan", "slug" → "alamat tautan". |
| 17 | "Engine tidak bisa menghitung kasus ini: engine: TIDAK_DIDUKUNG" | `hitungHarapan` (`web/layar/belajar/contoh.ts`) membuang `alasan` dari hasil engine dan hanya meneruskan kode status. | Teruskan `alasan` + rujukan dari engine, lalu tulis dalam kalimat: "Kalkulator belum mendukung kasus ini: {alasan}". Untuk `PERLU_INPUT`: sebutkan data apa yang kurang. Kasus tanpa ahli waris: "Pilih minimal satu ahli waris." |
| 17b | Soal hitung: kenapa masih mengisi saham, padahal ada kalkulator | Saham "harapan" disimpan sebagai kunci jawaban & dipakai tes regresi; portal memintanya diketik atau diisi lewat tombol. | Saham dihitung **otomatis** tiap kali ahli waris/harta berubah dan ditampilkan sebagai tabel hasil (bukan input). Isian manual hanya di bagian lipat "Periksa manual" untuk kasus dari kitab yang ingin dicocokkan. Data yang disimpan tetap sama. |

### A3. Data yang tampak "kosong"

| # | Keluhan | Akar masalah | Arah perbaikan |
|---|---------|--------------|----------------|
| 4 | Glosarium & ahwal datanya sedikit | **Glosarium**: istilah Indonesia (± 60 baris) dibaca dari `docs/kb/15_glosarium.md` saat build dan tidak masuk database. Jenis `glosarium_ar` di database hanya menyimpan **terjemahan Arab**, dan jumlahnya saat ini 0. Tab Glosarium di portal hanya menampilkan jenis itu, jadi tampak kosong. **Ahwal**: baru 7 ahli waris yang punya entri. | Tab Glosarium menampilkan **semua istilah KB**, masing-masing dengan status "versi Arab: ada / belum". Klik "Tambah versi Arab" membuka form dengan istilah terisi. Ahwal: tampilkan semua ahli waris; yang belum ada ditulis "Belum diisi · Tambah". (Keputusan C2: apakah makna/arti awam Indonesia boleh disunting di portal.) |
| 15 | FAQ & tanya jawab perlu dikelompokkan | Daftar portal masih datar; hanya materi yang dikelompokkan per modul. (Web FAQ sudah dikelompokkan per kelompok.) | Daftar FAQ dikelompokkan per `kelompok`, dengan pola yang sama seperti materi per modul. Tanya jawab belum punya bidang kategori, jadi perlu bidang `kelompok` baru (lihat C4), lalu dikelompokkan di portal & web. |

### A4. Konten & struktur

| # | Keluhan | Akar masalah | Arah perbaikan |
|---|---------|--------------|----------------|
| 3 | Syahid perlu induk (ayat/hadis/kitab) → turunan hukum, dengan identitas & arti | Skema `syahid` datar: `{surah, ayat, hukum, syahid, rujukan}`, satu baris per hukum. Web sudah punya tab **Hukum / Arti / Tafsir** per ayat, tapi Arti & Tafsir masih "belum diisi" (TODO di `Rujukan.tsx`). Teks ayat lengkap ada di KB 1.2, hadis di KB 17.3; **terjemahan tidak ada di KB**. | Jenis konten baru **Dalil** (induk): jenis (ayat / hadis / atsar / kitab), identitas (QS. An-Nisa: 11 · HR. Bukhari no. … · nama kitab & halaman), teks Arab (dipilih dari KB, tidak diketik), **arti** (Indonesia), sumber terjemahan, tafsir ringkas opsional. Syahid menjadi **turunan**: pilih dalil induk → tandai potongan teksnya → tulis hukumnya. Editor menampilkan induk beserta daftar hukum di bawahnya. Web: tab Arti terisi, dan saat bahasa Arab dipilih, arti tetap tampil. Migrasi: 16 syahid lama dikelompokkan otomatis ke induk berdasarkan surah+ayat. |
| 9 | Kuis: ganti "kenapa pilihan lain salah" dengan penjelasan per pilihan; apakah tampil di web? | Skema kuis: `pengecoh` = satu teks untuk semua pilihan. Web (`KartuSoalKuis.tsx`) **sudah menampilkan** `pengecoh` dan `catatan` setelah menjawab. | Skema: tambah `alasanPilihan` (satu penjelasan per pilihan, sejajar dengan `pilihan`). Editor: kotak "Kenapa pilihan ini salah/benar" di bawah tiap pilihan. Web: setelah menjawab, pilihan yang dipilih langsung menampilkan penjelasannya, dan tiap pilihan lain bisa dibuka. `pengecoh` lama tetap dibaca sampai dipindahkan (C3). |
| 5 | "Pakai templat" diperbanyak | Templat baru ada di satu bidang (penyelesaian tanya jawab). | Templat untuk: isi pelajaran (masalah → aturan + dalil → contoh → cek pemahaman), jawaban FAQ (jawaban langsung → dalil → catatan), cerita kasus tanya jawab, pembahasan kuis, ringkasan modul, dan baris ahwal umum (sendirian / bersama anak / terhalang). Templat ditulis tim, bukan dikarang: isinya kerangka kalimat, bukan hukum. |
| 20 | Sisip istilah/rujukan: bisa langsung edit di tempat | Dialog sisip hanya memilih. Istilah & rujukan Indonesia bersumber dari KB (bukan database), jadi memang tidak bisa disunting di portal. | Dialog sisip menampilkan kartu isi istilah/rujukan yang dipilih. Bagian yang bisa disunting di portal (versi Arab istilah, arti dalil) disunting langsung dari dialog tanpa pindah halaman. Bagian dari KB ditandai "diubah lewat KB oleh tim keilmuan". (C5.) |

### A5. Teks aplikasi (keluhan 6, 7, 10)

Keadaan sekarang, dilihat dari sisi admin:

- Ada **empat tab**: Sunting di layar, Teks edukasi (114), Diksi (703), Cheatsheet. "Teks edukasi" dan "diksi" adalah
  pembedaan teknis (paragraf penjelasan di kalkulator vs label tombol/judul per halaman). Admin tidak perlu tahu bedanya.
- "Diksi" juga terdengar seperti glosarium. Bedanya: glosarium = **istilah fikih** beserta maknanya; diksi = **kata-kata
  antarmuka** (label tombol, judul, petunjuk).
- Sunting di layar baru mencakup 7 layar (beranda, 3 langkah kalkulator, hasil, belajar, latihan). Belum ada materi,
  FAQ, tanya jawab, glosarium, rujukan, akun, peringkat, riwayat, dan tur.
- 703 diksi ditampilkan semua, termasuk "Kembali", "Simpan", angka, dan placeholder yang tidak perlu disunting.

Arah perbaikan:

1. **Satu pintu "Teks aplikasi"** berisi dua cara: *Sunting di layar* (utama) dan *Daftar teks* (untuk teks yang tidak
   tampil, mis. tur). Tab Teks edukasi & Diksi digabung; sumbernya (tabel mana) diurus mesin, tidak ditampilkan.
2. **Kurasi**: Daftar teks bawaannya hanya memuat teks yang layak disunting, yaitu paragraf penjelasan, judul halaman,
   petunjuk, dan pesan kosong/galat. Label pendek generik (≤ 2 kata: "Kembali", "Simpan", …) disembunyikan di
   "Tampilkan semua teks" khusus admin.
   Aturan kurasi = daftar halaman + panjang teks, ditulis sebagai data (lihat C6).
3. **Lebih banyak layar**: tambahkan materi (satu pelajaran contoh), FAQ, tanya jawab, glosarium, rujukan, peringkat,
   akun (tanpa login: layar tamu), tur (sebagai layar statis per langkah).
4. **Penjelasan manusiawi** di kepala halaman: "Teks aplikasi = kata-kata di tombol, judul, dan penjelasan di aplikasi.
   Untuk istilah fikih, buka Glosarium."
5. Dialog sunting: tampilkan "tampil di: Beranda · Hasil" dan pratinjau kalimatnya sebelum disimpan.

### A6. AI (Gemini) — keluhan 10

Tidak ada integrasi LLM saat ini. Batasan dari pengguna dan dari CLAUDE.md:
- AI **tidak boleh** membuat hukum, fatwa, atau klaim fikih di materi/FAQ/tanya jawab. Di sana AI hanya boleh
  merapikan bahasa, dan saran kelengkapannya berupa daftar topik yang dikerjakan penulis sendiri.
- Untuk **kuis** (pilihan, jawaban, pembahasan) AI boleh membuat draf.

Rancangan:

| Fitur | Di mana | Keluaran | Pengaman |
|-------|---------|----------|----------|
| **Rapikan teks** | Tombol di setiap bidang teks panjang/blok | Teks baru ditampilkan sebagai perbandingan (dicoret/disorot). Penulis memilih Terima atau Buang. | Prompt: hanya ejaan, tata bahasa, dan kejelasan, tanpa menambah atau menghapus klaim. Kode rujukan & istilah sisipan dikunci (diganti token sebelum dikirim, dikembalikan sesudahnya). Hasil yang mengubah/menghapus token ditolak otomatis. |
| **Draf soal kuis** | Form kuis: "Buat draf dengan AI" dari pertanyaan + bab | Pilihan A–D, jawaban benar, penjelasan per pilihan, pembahasan | Konteks = teks KB bab terkait (grounding). Hanya boleh mengutip kode rujukan yang ada di bab itu (divalidasi). Entri otomatis diberi tanda "Dibantu AI · perlu dicek" dan **wajib lewat review**, termasuk bila penulisnya admin. |
| **Saran kelengkapan** | Panel Info editor materi/FAQ | Daftar poin, mis. "belum ada contoh kasus", "istilah X dipakai tanpa penjelasan" | Hanya saran, tidak pernah menulis ke isi. |

Arsitektur: kunci API **tidak boleh** ada di bundel web/admin (Vite membocorkan semua `VITE_*`). Panggilan lewat
**Supabase Edge Function** `ai-bantu` yang memegang `GEMINI_API_KEY` sebagai secret, memeriksa sesi + peran (penulis/admin),
membatasi kuota per pengguna per hari, dan mencatat pemakaian. Riwayat revisi mencatat "dibantu AI".

---

## B. Rencana bertahap

Urutan: yang paling sering dikeluhkan dan paling murah dikerjakan lebih dulu. Tiap fase = satu PR, dengan tes
per layar (vitest + testing-library, pola `apps/admin/src/__tests__`), dan dicommit per perubahan.

### Fase 1: Rapikan yang terasa langsung (tanpa ubah skema)
1. Kolom ahli waris soal hitung: buang zebra, kelompokkan, sorot yang terisi. (#18)
2. Input rupiah dengan "Rp" + titik ribuan. (#19)
3. Saham soal hitung dihitung otomatis dan tampil sebagai tabel; isian manual dipindah ke "Periksa manual". (#17b)
4. Pesan kalkulator yang bisa dipahami: teruskan `alasan` engine lewat `hitungHarapan`. (#17)
5. Bidang terkunci bergaya terkunci. (#21)
6. Tombol Simpan draf / Terbitkan sekarang + keterangan. (#12)
7. Audit bahasa teknis di label/bantuan/pesan galat; kitab jadi dropdown; cek potongan ayat otomatis. (#16)
8. Textarea tumbuh sesuai isi; teks di daftar tidak dipotong. (#11)
9. Pratinjau: tombol Perbesar (layar penuh) + cegat tautan di dalam pratinjau. (#8)

### Fase 2: Alur kerja editor & daftar
1. Menu ⋯ per baris + aksi reviewer di editor (Setujui/Kembalikan dengan perbandingan). (#2)
2. Aksi massal lengkap per peran, dengan alasan bila tombol tidak berlaku. (#1)
3. "Lihat perubahan" di editor + ringkasan perubahan di dialog Terbitkan/Kirim. (#13)
4. Riwayat jadi tab: bandingkan dengan versi sebelumnya, lihat isi versi, pakai versi lama sebagai draf. (#14)
5. Pengelompokan daftar FAQ per kelompok. (#15, bagian FAQ)
6. Templat tambahan. (#5)

### Fase 3: Data & skema (perlu keputusan C1–C5)
1. Glosarium: semua istilah KB tampil + status versi Arab; ahwal: semua ahli waris tampil. (#4)
2. Kuis: `alasanPilihan` per pilihan (skema Zod + migrasi SQL + editor + web `KartuSoalKuis`). (#9)
3. Dalil induk + syahid turunan, arti & tafsir, migrasi 16 syahid, web Rujukan. (#3)
4. Tanya jawab: bidang `kelompok`, pengelompokan di portal & web. (#15)
5. Sisip istilah/rujukan: kartu isi + sunting bagian yang milik portal langsung dari dialog. (#20)

### Fase 4: Teks aplikasi dirombak (#6, #7, #10-teks)
Satu pintu, kurasi, layar tambahan, penjelasan, dialog sunting yang menampilkan lokasi tampil.

### Fase 5: AI Gemini (#10)
Edge Function `ai-bantu` (secret, cek peran, kuota, log) → Rapikan teks → Draf soal kuis → Saran kelengkapan.

### Setelah itu: diskusi sinkron web ↔ portal (dicatat, belum dikerjakan)
Temuan awal untuk dibahas:
- Web memuat konten dari snapshot bawaan + cache. Sinkron berjalan di latar dan **baru tampil di muat berikutnya**
  (`apps/web/src/konten/sinkron.ts`), jadi perubahan dari portal terasa "tidak masuk" pada kunjungan pertama.
- Pratinjau & Sunting di layar di portal memakai snapshot bawaan build, bukan isi database terbaru.
- Istilah "Riwayat" bentrok: di web artinya riwayat hitung pengguna, di portal artinya riwayat revisi konten.
- Teks yang ditulis langsung di kode web (bukan diksi/teks edukasi) tidak bisa diubah dari portal. Perlu diinventarisasi.

---

## C. Keputusan yang dibutuhkan

- **C1. Dalil induk**: induknya hanya ayat, atau juga hadis, atsar, dan kitab? Terjemahan diambil dari mana
  (usulan: Terjemah Kemenag, sumbernya dicantumkan)? KB tidak memuat terjemahan, jadi arti = konten portal, bukan KB.
- **C2. Glosarium Indonesia**: makna, arti awam, dan contoh tetap dari KB (baca-saja di portal) atau dipindah ke
  database supaya bisa disunting? Usulan: makna tetap KB; arti awam & contoh boleh dipindah ke portal.
- **C3. Pengecoh lama** (11 soal kuis): tampilkan sebagai "catatan lama" sampai penulis memindahkannya ke penjelasan per
  pilihan, atau dihapus saja?
- **C4. Kategori tanya jawab**: bidang `kelompok` bebas seperti FAQ (pilih yang ada atau ketik baru)?
- **C5. Sisip istilah/rujukan**: yang dimaksud "edit langsung" itu bagian mana? Isi Indonesia keduanya dari KB (tidak
  bisa diubah di portal); yang bisa: versi Arab istilah dan arti dalil.
- **C6. Kurasi teks aplikasi**: setuju dengan aturan "sembunyikan label ≤ 2 kata kecuali admin buka semua"?
- **C7. AI**: kunci di Supabase Edge Function oke? Siapa yang boleh memakai (penulis + admin)? Kuota harian? Draf kuis
  dari AI selalu wajib lewat review?
