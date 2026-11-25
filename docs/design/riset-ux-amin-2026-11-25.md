# Riset UX: AMIN, teman belajar di dalam aplikasi (2026-11-25)

Pemicu: pemilik meminta konsep AMIN (*AI Mawaris Interaktif*). Arah dari pemilik (2026-11-25):
- AMIN melayani **dua hal sekaligus**: (1) menjelaskan ulang isi aplikasi yang sedang dibuka, dan (2) menjawab pertanyaan
  waris umum di luar halaman.
- AMIN **paham konteks halaman**: bisa mengarahkan "buka tautan X" atau "ke halaman X", dan menjawab pertanyaan tentang
  fitur supaya pengguna memakai aplikasi secara maksimal.
- Tujuan satu kalimat: **memaksimalkan pengalaman belajar pengguna.**

Status: **tahap 1–3 selesai; keputusan pemilik 2026-11-25 masuk (bagian 8); mockup revisi 1 di `mockup-amin.html`**. Bagian 6 sudah disesuaikan dengan
keputusan itu. Berikutnya: mockup, lalu spec.
Label: [Fakta-kode] = dibaca dari kode/dokumen hari ini; [Bukti] = riset luar; [Asumsi] = belum diuji ke pengguna.

---

## 0. Batasan yang sudah mengikat

- **Engine memutuskan, bukan AI** (`apps/web/PRODUCT.md`). AMIN tidak menetapkan hukum dan tidak mengubah hasil hitung.
- **Hanya hukum yang ada di KB** (`CLAUDE.md`). Aturan di luar KB atau `[perlu verifikasi lanjut]` tidak dikarang.
- [SYF] default; [HNB]/[HNF]/[MLK] berstatus sekunder dan sumbernya disebut. Tarjih Lahim/Ithraa tidak boleh tampil
  sebagai posisi [SYF]. KHI hanya informasi, "hukum positif, bukan fikih".
- Kode rujukan (R09-4) tidak tampil mentah; tampil sebagai kotak "Dalilnya".
- Aksi sekunder = tautan teks; ikon SVG, tanpa emoji; gaya Logivo.
- **Syarat sebelum AMIN** (roadmap G5, `01-keamanan-dan-pdp.md` 2.2 dan 2.5): kebijakan privasi menyebut penyedia LLM,
  persetujuan `ai_konteks`, retensi log ditetapkan. Tanpa `ai_konteks`, AMIN hanya menerima teks tanpa konteks halaman.
- Penyedia: Gemini tier gratis **tidak boleh** menerima data pengguna (memakai data untuk pelatihan, dibaca peninjau).

## 1. Yang sudah ada dan bisa dipakai ulang [Fakta-kode]

| Bagian | Di mana | Dipakai AMIN untuk |
|---|---|---|
| Penghubung LLM + urutan model cadangan + kuota harian + catat pemakaian | `supabase/functions/ai-bantu`, tabel `pemakaian_ai` | pola fungsi baru `amin` (fungsi terpisah; `ai-bantu` khusus penulis/admin) |
| Pengunci sisipan `⟦n⟧` untuk `[Rxx-y]` dan `[[istilah]]` | `ai-bantu/logika.ts` | menjaga rujukan dan istilah yang dikutip tidak diubah AI |
| Login Google, persetujuan append-only `persetujuan_saya()` jenis `ai_konteks` | `apps/web/src/akun/`, migrasi `…_persetujuan_pdp.sql` | gerbang konteks halaman |
| Jejak engine (`LangkahJejak` + `refs`) dan narasi templat | `packages/engine`, `packages/explain` | konteks Hasil yang **sudah pasti benar**: AMIN menjelaskan jejak, tidak menghitung ulang |
| Entri rujukan (kode, klaim, sumber, kutipan) + glosarium | `packages/content`, rute `#/rujukan/<kode>`, `#/glosarium/<id>` | sumber jawaban hukum dan tujuan tautan |
| Rute hash yang bisa dibagikan + pembuat tautan (`tautanBelajar`, `tautanLatihan`, `tautanContoh`, …) | `apps/web/src/rute.ts` | daftar putih tujuan navigasi |
| Tangga bantuan soal (usaha ≥ 2 → petunjuk konsep → singgungan kasus → buka kolom, XP hangus) | `spec-tangga-bantuan-soal.md`, `packages/latihan` | AMIN di Latihan **tidak boleh** jadi jalan pintas melewati tangga ini |
| Progres belajar, status soal, rekomendasi kuis | `progres.ts`, `statusSoal.ts`, `rekomendasiKuis.ts` | saran "berikutnya pelajari apa" |
| FAQ, Tanya-jawab, Tur | `layar/belajar/Faq.tsx`, `TanyaJawab.tsx`, `tur/Tur.tsx` | sumber jawaban soal fitur; tempat lanjutan bila AMIN tidak tahu |

KB `docs/kb` seluruhnya sekitar 352 KB. Untuk pertanyaan di halaman yang punya jejak, bagian KB yang relevan **sudah
diketahui lewat `refs`**, jadi tidak perlu pencarian. Pencarian hanya dibutuhkan untuk pertanyaan umum.

## 2. Pengguna

| Peran | Saat memanggil AMIN | Yang paling ia butuhkan |
|---|---|---|
| **A. Keluarga yang mengurus waris** (awam, HP) | di Hasil: "kenapa kakak saya tidak dapat?", "ashabah itu apa?" | jawaban pendek dengan bahasa sehari-hari, **tentang keluarganya**, bukan definisi kitab |
| **B. Pelajar** (santri/mahasiswa) | di Materi atau Latihan: buntu, ingin contoh lain, ingin tahu "kenapa" | dibantu berpikir, bukan diberi jawaban; tahu harus belajar apa berikutnya |
| **C. Penanya umum** | dari mana saja: "anak angkat dapat warisan?", "istri kedua bagaimana?" | jawaban yang jujur sumbernya, dan arahan ke kalkulator bila ingin angka |
| D. Pengguna baru | "fitur ini buat apa?", "bisa simpan kasus?" | ditunjukkan tempatnya, satu ketukan |

## 3. JTBD

| # | Saat… | Saya ingin… | Supaya… | Ukuran sukses |
|---|---|---|---|---|
| J1 | (A) membaca Hasil dan ada yang tidak masuk akal | bertanya tentang **baris itu** tanpa mengetik ulang konteksnya | paham kenapa keluarga saya dibagi begitu | sorot atau ketuk "Tanya AMIN" di baris; jawaban menyebut orang di kasusnya |
| J2 | (A/B) bertemu istilah asing | arti singkat di tempat | tidak meninggalkan halaman | ≤ 1 ketukan; jawaban ≤ 3 kalimat + tautan glosarium |
| J3 | (B) buntu di soal Latihan | didorong sedikit | tetap merasa mengerjakan sendiri | **dilayani tangga bantuan, bukan AMIN** (keputusan pemilik: AMIN nonaktif di layar soal) |
| J4 | (B) membaca kalimat materi yang tidak dipahami | penjelasan lebih rinci atau contoh | paham, bukan hafal | sorot → Tanya AMIN; "Jelaskan lebih rinci" / "Beri contoh"; contoh berangka dihitung engine |
| J5 | (C) punya pertanyaan waris umum | jawaban yang bisa dipercaya | tahu harus bagaimana | jawaban menyebut dasarnya (kotak Dalilnya); di luar KB = "belum ada di materi kami" |
| J6 | (C) ingin angka untuk keluarganya sendiri | dihitungkan | tahu bagian tiap orang | AMIN tidak menghitung sendiri; satu tautan ke Lab Hitung |
| J7 | (D) tidak tahu fitur ada | ditunjukkan tempatnya | memakai aplikasi lebih maksimal | jawaban berisi tautan ke halaman yang benar; tautan tidak pernah rusak |
| J8 | (B) selesai satu pelajaran | tahu berikutnya apa | belajar terarah | saran berdasar progres, bukan tebakan AI |

## 4. Audit risiko (apa yang bisa membuat AMIN merusak belajar)

| Kode | Tingkat | Risiko | Bukti atau alasan |
|---|---|---|---|
| R1 | **Tinggi** | **AMIN jadi mesin contekan.** Pelajar menempel soal, AMIN memberi jawaban, nilai latihan naik tapi pemahaman turun. | [Bukti] Bastani dkk. (PNAS 2025): siswa dengan ChatGPT biasa nilainya naik 48% saat latihan, tetapi ujian tanpa AI **17% lebih buruk** dari kelompok kontrol; kebanyakan hanya meminta jawaban. Versi "tutor" dengan pengaman tidak merugikan. |
| R2 | **Tinggi** | **AMIN mengarang hukum** atau menyajikan pendapat Hanbali sebagai Syafi'i. | Batas KB dan madzhab (bagian 0). LLM umum tidak tahu aturan proyek. |
| R3 | **Tinggi** | **AMIN menghitung sendiri** dan angkanya berbeda dari engine. | Aritmetika pecahan LLM tidak eksak; satu angka salah meruntuhkan kepercayaan pada kalkulator. |
| R4 | Tinggi | **Data keluarga bocor** ke penyedia AI tanpa persetujuan. | UU PDP; susunan keluarga + nominal harta adalah data sensitif. |
| R5 | Sedang | **Tautan halusinasi** ("buka menu Pengaturan > Waris") ke layar yang tidak ada. | Jawaban navigasi bebas pasti salah sesekali. |
| R6 | Sedang | **Jawaban panjang ala ChatGPT** di HP; awam tenggelam. | Pengguna paling lemah = patokan (`rencana-pengalaman-dan-fitur.md`). |
| R7 | Sedang | **Terasa seperti fatwa.** Pengguna memakai jawaban AMIN untuk keputusan keluarga. | Produk edukasi, bukan lembaga fatwa. |
| R8 | Sedang | **Kuota habis di tengah belajar** tanpa jalan lain. | Pengalaman putus; pengguna merasa dihukum. |

Catatan positif [Bukti]: Kestin dkk. (Scientific Reports 2025) menemukan tutor AI yang **dirancang mengikuti prinsip
belajar dan diberi materi kursus** menghasilkan kenaikan lebih dari dua kali kelas aktif, pada mahasiswa Harvard (sampel
sempit). Khanmigo memakai pola yang sama: tidak memberi jawaban, bertanya langkah pertama, paham pekerjaan siswa, menempel
ke konten. Pelajarannya: manfaat datang dari **pengaman + konten sendiri**, bukan dari chatbot umum.

## 5. HMW

1. **HMW-1** Bagaimana kalau AMIN berubah perilaku menurut halaman: bebas menjelaskan di Hasil dan Materi, bertanya balik
   di Latihan, diam di Ujian?
2. **HMW-2** Bagaimana kalau AMIN *membaca* apa yang tampil tanpa pengguna menyalin apa pun, tapi hanya bila pengguna setuju?
3. **HMW-3** Bagaimana kalau setiap klaim hukum di jawaban AMIN bisa dibuka dasarnya, dan yang tidak ada dasarnya tidak keluar?
4. **HMW-4** Bagaimana kalau AMIN tidak pernah menghitung, tapi selalu tahu cara mengantar ke hitungan yang benar?
5. **HMW-5** Bagaimana kalau arahan "buka X" selalu berupa tautan yang bisa diketuk dan dijamin ada?
6. **HMW-6** Bagaimana kalau setelah menjelaskan, AMIN mengajak satu langkah belajar berikutnya, bukan sekadar selesai?
7. **HMW-7** Bagaimana kalau jawaban AMIN pendek dulu, dan pengguna sendiri yang memilih untuk diperdalam?

## 6. Ide per HMW dan rekomendasi

### HMW-1 Perilaku menurut halaman
| Halaman | Perilaku | Alasan |
|---|---|---|
| Hasil, Contoh jadi, Kasus dibagikan | **Penjelas**: menjelaskan jejak engine untuk kasus itu, menyebut orangnya ("Kakak Anda terhalang oleh anak laki-laki") | J1; jawabannya sudah pasti benar karena berasal dari engine |
| Materi, Glosarium, Rujukan, FAQ | **Penjelas + contoh**: ulang dengan bahasa lain, beri contoh keluarga, tawarkan pertanyaan cek | J2, J4 |
| **Semua layar mengerjakan soal**: soal hitung Latihan, Kuis konsep, Ujian, soal di dalam materi | **Nonaktif total** (keputusan pemilik 2026-11-25): ikon tidak dirender, menu sorot tidak memuat "Tanya AMIN", panel yang terbuka ditutup saat masuk layar soal. Server juga menolak permintaan yang kartu konteksnya berasal dari layar soal | R1; bantuan saat buntu = tangga bantuan yang sudah ada |
| Beranda, Lab awal, Riwayat, dll. | **Pemandu**: fitur, navigasi, saran belajar | J7, J8 |

Ide yang ditolak: satu perilaku untuk semua halaman (melanggar R1); tutor sokratik di soal Latihan (usulan awal, ditolak
pemilik: risiko curang lebih besar dari manfaatnya, dan tangga bantuan sudah mengisi peran itu).

**Celah curang yang tersisa (diterima):** pengguna bisa menyalin teks soal lalu menanyakannya di halaman lain. AMIN tidak
menambah celah melebihi Lab Hitung (yang memang bisa menghitung kasus apa pun). Untuk mengurangi: bila teks pertanyaan
cocok dengan soal di bank soal (cek kode/sidik teks di server), AMIN menolak dan menyebut "Ini soal latihan; kerjakan
di Latihan dulu". Penjagaan Ujian yang sesungguhnya ada di desain Ujian (G6: soal acak per siswa, penilaian di server).

### HMW-2 Konteks halaman
- **Tiap layar menyusun "kartu konteks" terstruktur**, bukan AMIN mengikis DOM: `{ halaman, judul, perilaku, isi }`. Isi
  per jenis: Hasil = ahli waris (peran, bukan nama), bagian, `refs` jejak; Materi = slug + judul + bagian yang sedang
  dibaca. Layar soal tidak punya kartu konteks (AMIN nonaktif di sana). Alasan: isi bisa diperiksa di uji, dan tidak ada
  jalur kunci jawaban ke AI.
- **Sorot teks** → menu kecil "Tanya AMIN" (selain "Salin"); teks sorotan ikut sebagai fokus pertanyaan.
- Ketuk ikon AMIN di baris Hasil / kartu langkah = pertanyaan siap pakai ("Kenapa ini?").
- **Tanpa persetujuan `ai_konteks`**: kartu konteks hanya berisi `halaman` + `judul` (tidak ada data keluarga). Pengguna
  melihat satu kalimat "AMIN belum melihat isi halaman ini. Izinkan?" dengan tautan ke persetujuan.
- Nama orang tidak pernah dikirim: graf memakai peran ("anak perempuan ke-2"). Nominal harta tidak dikirim kecuali
  pertanyaannya tentang pembulatan atau nominal [Asumsi: jarang perlu].

### HMW-3 Jawaban hukum berdasar KB
- **Pertanyaan di halaman berjejak**: AMIN menerima entri rujukan dari `refs` jejak + potongan bab KB yang ditunjuk.
  Tanpa pencarian.
- **Pertanyaan umum**: cari potongan KB per bagian (judul bab/sub-bab sebagai satuan). Mulai dengan **pencarian teks
  Postgres** (`tsvector`, bahasa simple + daftar sinonim dari glosarium); embedding baru bila pengukuran menunjukkan
  pencarian teks sering meleset. Alasan: KB kecil, istilah fikihnya baku, tidak menambah dependensi.
- **Jawaban wajib mengutip**: AI mengembalikan JSON `{ jawaban, rujukan: [kode], tautan: [...] }`; server menolak kode
  rujukan yang tidak ada di potongan yang dikirim (pola `olahJawaban` di `ai-bantu`). Di layar, rujukan tampil sebagai kotak
  "Dalilnya".
- **Tidak ada di potongan** → "Ini belum ada di materi kami." + tautan Tanya-jawab. Tidak menebak.
- Madzhab mengikuti pilihan pengguna di aplikasi; jawaban [HNB]/[HNF]/[MLK] memakai label sekunder + sumbernya, sama
  seperti layar lain. KHI hanya disebut dengan label "hukum positif, bukan fikih".
- Setiap jawaban hukum diakhiri satu baris tetap (bukan buatan AI): "Penjelasan belajar, bukan fatwa."

### HMW-4 Tidak menghitung, mengantar ke hitungan
- AMIN dilarang memberi pecahan atau nominal **baru**. Angka yang boleh muncul hanya yang sudah ada di kartu konteks
  (hasil engine). Server memeriksa: pecahan/angka di jawaban yang tidak ada di konteks → jawaban ditolak dan dicoba ulang
  sekali dengan pengingat [Asumsi: pemeriksaan sederhana cukup; perlu diuji].
- **Contoh berangka dan "kalau anaknya tiga?" (keputusan pemilik 2026-11-25: masuk versi pertama).** AI tidak menulis
  angka; AI hanya menyusun **susunan keluarga** dalam format kasus engine. Alurnya:
  1. AI mengembalikan `{ jawaban, contohKasus: <susunan ahli waris + madzhab> }`.
  2. Server membaca `contohKasus` dengan pembaca kasus engine yang sama dengan Lab (`bacaKasus`), lalu menghitungnya
     dengan engine. Kasus tidak sah, `PERLU_INPUT`, atau `TIDAK_DIDUKUNG` → contoh dibuang, AMIN menjawab tanpa contoh
     berangka (tidak mengarang).
  3. Panggilan kedua ke AI membawa hasil engine (bagian, jejak, `refs`) untuk dijelaskan, dengan aturan angka yang sama
     (hanya angka dari hasil engine).
  4. Di layar: kartu contoh kecil (siapa saja, bagian masing-masing) + tautan "Buka di Lab" yang membuka kasus itu
     sebagai kasus baru milik pengguna.
  Biayanya dua panggilan AI per contoh (lihat koin, bagian 6b). Penghubung ini dipakai ulang oleh mode cerita AI.
- Contoh tanpa angka ("misalnya ada anak laki-laki, saudara tidak dapat") boleh ditulis AI langsung, tetap dengan rujukan.
- Di Hasil: tautan "Ubah kasus ini" ke wizard untuk pertanyaan yang mengubah kasus pengguna sendiri.

### HMW-5 Navigasi yang dijamin ada
- AI tidak menulis URL. AI memilih **tujuan dari daftar putih** yang dikirim server: `{ id: 'glosarium', param: 'ashabah' }`,
  `{ id: 'materi', param: '<slug>' }`, `{ id: 'latihan' }`, `{ id: 'lab' }`, dll. Server memvalidasi id dan param
  (slug materi/glosarium/rujukan harus ada); klien mengubahnya jadi tautan memakai pembuat tautan di `rute.ts`.
- Penjelasan fitur ("bisa simpan kasus?") bersumber dari **satu dokumen panduan fitur** yang ditulis sebagai konten
  (bisa diedit di portal, jenis `teks_edukasi`), bukan dari pengetahuan AI. Dokumen itu sekaligus jadi daftar tujuan
  navigasi beserta keterangannya.
- Tautan tampil sebagai teks ("Buka Glosarium: ashabah"), sesuai aturan UI.

### HMW-6 Satu langkah belajar berikutnya
- Setelah menjelaskan konsep, AMIN boleh menawarkan **satu** dari: pertanyaan cek pendek (self-explanation, pilihan, bukan
  isian bebas untuk awam), tautan pelajaran terkait, atau soal latihan yang memakai konsep itu. Pilihannya dihitung di klien
  dari `progres.ts`/`rekomendasiKuis.ts`, bukan dari AI (J8; konsisten dengan prinsip "personalisasi berdasar penguasaan").
- Tidak ada XP untuk bertanya ke AMIN, dan tidak ada pengurangan XP.
- **Tidak proaktif** (keputusan pemilik): AMIN tidak menyapa, tidak muncul sendiri, tidak memberi notifikasi. Ia hanya
  menjawab saat dipanggil lewat ikon, sorot teks, atau ikon tanya di baris.

### HMW-7 Pendek dulu
- Batas jawaban pertama ±60 kata (diatur di prompt + dipotong di server bila jauh melebihi). Di bawahnya tautan
  "Jelaskan lebih rinci" dan "Beri contoh". Riwayat percakapan per halaman, tidak menumpuk lintas halaman.
- Pertanyaan saran (2–3 chip teks) di awal panel, disusun dari kartu konteks: di Hasil "Kenapa X tidak dapat?", di Materi
  "Contoh lain", di Beranda "Mulai dari mana?".

### 6a. Cakupan dan rujukan ke konsultan (keputusan pemilik 2026-11-25)
AMIN hanya menjawab tiga hal: **(1) faraidh/waris Islam, (2) isi dan cara memakai aplikasi ini, (3) cara belajar faraidh
di aplikasi ini.** Selain itu ditolak dengan kalimat tetap + tautan, tanpa memotong koin (bagian 6b).

| Jenis pertanyaan | Tanggapan |
|---|---|
| Di luar topik (coding, PR sekolah lain, politik, obrolan bebas, menulis esai) | "Itu di luar cakupan AMIN. AMIN hanya membantu soal waris dan aplikasi ini." |
| Hukum positif yang serius (gugatan, sengketa di pengadilan, pidana, pertanahan, pajak warisan) | Sebut pasal **hanya bila ada di `docs/kb-khi/`** (label "hukum positif, bukan fikih"), lalu arahkan ke konsultan. Pasal di luar `kb-khi` tidak disebut (tidak dikarang). |
| Kasus kompleks atau berisiko | Penjelasan umum boleh, lalu kalimat tetap "Untuk kasus seperti ini, sebaiknya konsultasikan ke ahli." |
| Engine mengembalikan `PERLU_INPUT` / `TIDAK_DIDUKUNG`, atau topik di titik blocked KB | Jujur "belum bisa kami pastikan" + arahkan ke konsultan |

Pemicu "kasus kompleks" (usulan, server menambahkan kalimat konsultan bila AI menandai salah satunya): sengketa atau
konflik antar ahli waris; harta yang sudah dibagi tidak sesuai faraidh (bab 11/7b); wasiat atau hibah yang dipersoalkan;
utang pewaris yang melebihi harta atau diperselisihkan; harta di luar negeri atau beda kewarganegaraan; ahli waris beda
agama yang mempersoalkan bagian.

Siapa "konsultan" ditulis sebagai konten yang bisa diedit (mis. pengadilan agama setempat, notaris, ustadz yang memahami
faraidh). Direktori konsultan berbayar/mitra = urusan G8, bukan AMIN versi pertama.

### 6b. Koin AMIN (keputusan pemilik 2026-11-25: sistem koin, ke depan bisa top up)
Pengganti "kuota harian". Prinsip: **koin dipotong sesuai pemakaian nyata**, saldo selalu terlihat, tidak pernah
dipotong diam-diam.

- **Satuan.** 1 koin = sejumlah token AI tetap (angka ditentukan setelah harga penyedia diketahui). Biaya satu jawaban =
  (token masuk + token keluar) dibagi satuan itu, dibulatkan ke atas, minimal 1 koin. Jawaban dengan contoh berangka
  memakan dua panggilan, jadi lebih mahal; biaya tampil kecil di bawah jawaban ("2 koin").
- **Dipotong hanya bila jawaban sampai ke pengguna.** Gagal teknis, jawaban ditolak pemeriksa server, dan penolakan "di
  luar cakupan" tidak memotong koin (sama dengan aturan kuota `ai-bantu` sekarang).
- **Jatah gratis.** Tiap akun dapat koin gratis berkala (usulan: isi ulang harian sampai batas tertentu, mis. cukup untuk
  ±20 jawaban pendek). Koin gratis dipakai lebih dulu daripada koin beli.
- **Buku koin (data).** Tabel append-only `mutasi_koin` (user, jumlah +/−, jenis: `jatah | beli | pakai | koreksi`,
  rujukan ke pemakaian/pembayaran, waktu). Saldo = jumlah mutasi; pemotongan lewat fungsi database dalam satu transaksi
  supaya saldo tidak bisa minus saat dua pertanyaan dikirim bersamaan. `pemakaian_ai` tetap mencatat token per panggilan.
- **Top up (G8, bukan versi pertama).** Butuh penyedia pembayaran, harga paket, syarat layanan, dan kebijakan privasi
  yang menyebut pemrosesan pembayaran. Versi pertama hanya jatah gratis, tapi skema data sudah memakai buku koin supaya
  top up tinggal menambah jenis `beli`.
- **"Dijualbelikan" = pengguna membeli dari aplikasi**, bukan diperdagangkan antar pengguna. Koin tidak bisa dipindah ke
  akun lain, tidak bisa diuangkan, dan berlaku hanya di aplikasi. Alasan: koin yang bisa ditransfer/diuangkan berisiko
  digolongkan uang elektronik (izin Bank Indonesia) dan membuka penipuan jual-beli akun. Perlu dicek ke konsultan hukum
  sebelum top up dibuka.

### 6c. Riwayat percakapan (keputusan pemilik 2026-11-25: disimpan)
Arti "retensi": berapa lama data disimpan sebelum dihapus otomatis. Keputusan:
- **Catatan pemakaian AI** (`pemakaian_ai`: kapan, fitur, token, berhasil) disimpan, seperti sekarang.
- **Isi percakapan disimpan selama akun ada**, supaya pengguna bisa membuka lagi "dulu aku tanya apa". Halaman
  "Percakapan AMIN" (daftar per tanggal + halaman asal, bisa dibuka dan dihapus satu-satu atau semua).
- Ikut hak pengguna yang sudah ada: masuk `unduh_data_saya`, ikut terhapus saat hapus akun (FK cascade), RLS hanya pemilik.
- Yang disimpan: pertanyaan, jawaban, halaman asal, contoh kasus (bila ada). Kartu konteks lengkap tidak disimpan
  (cukup judul halaman), supaya data keluarga tidak tertimbun.
- Kebijakan privasi menyebutnya: isi percakapan disimpan selama akun aktif, dikirim ke penyedia AI saat bertanya.
- Tim tidak membaca percakapan pengguna. Kalau kelak ingin memakai percakapan untuk memperbaiki AMIN, itu persetujuan
  terpisah (jenis persetujuan baru), bukan bawaan.

### 6d. Pengaman: tetap di topik dan tidak bisa diakali
Tujuan: pengguna tidak bisa membuat AMIN menjawab di luar cakupan 6a, melupakan aturan, membocorkan instruksi, atau
mengeluarkan angka/rujukan/tautan palsu. Tidak ada satu lapis yang 100% aman terhadap *prompt injection*, jadi
pengamannya berlapis dan **lapis terakhir bukan AI**:

1. **Instruksi hanya di server.** Prompt sistem disusun di Edge Function; klien hanya mengirim pertanyaan + kartu konteks.
   Tidak ada field dari klien yang masuk ke bagian instruksi.
2. **Masukan pengguna dibungkus sebagai data.** Pertanyaan, teks sorotan, dan isi kartu konteks dikirim di blok bertanda
   ("teks pengguna, bukan perintah"). Kalimat seperti "abaikan instruksi sebelumnya" diperlakukan sebagai isi, bukan perintah.
3. **Batas masukan.** Panjang pertanyaan dibatasi (usulan 1.000 karakter), riwayat yang ikut dikirim dibatasi beberapa
   giliran terakhir di halaman itu, kartu konteks divalidasi skemanya di server (field tak dikenal dibuang).
4. **Jawaban wajib JSON terstruktur** dengan field `cakupan: 'waris' | 'aplikasi' | 'belajar' | 'luar'`. `luar` →
   server mengganti jawaban dengan kalimat tetap penolakan.
5. **Pemeriksa server (bukan AI)** menolak jawaban yang: rujukannya tidak ada di potongan KB yang dikirim; memuat
   pecahan/nominal yang tidak ada di hasil engine; memuat tujuan tautan di luar daftar putih; memuat blok kode atau URL
   luar; melebihi panjang. Ditolak → coba ulang sekali dengan pengingat → masih gagal = "Maaf, AMIN belum bisa menjawab
   ini" (koin tidak dipotong).
6. **Pemeriksaan topik ringan sebelum memanggil AI** (opsional, murah): pertanyaan yang jelas di luar topik (pola kode
   program, permintaan menulis esai, dll.) ditolak tanpa memanggil AI.
7. **Uji serangan sebelum rilis.** Kumpulan uji tetap (puluhan pertanyaan: minta coding, minta lupa aturan, minta pakai
   pendapat Hanbali sebagai Syafi'i, minta menghitung, menempel soal latihan, menyamar sebagai admin) dijalankan ke
   fungsi `amin` sebelum tiap ganti prompt atau model; semua harus ditolak atau dijawab dalam cakupan.

Akibatnya, kalaupun AI berhasil "diakali", yang lolos paling jauh hanya kalimat bebas yang tetap berada dalam format
jawaban; angka, rujukan, dan tautan tetap dijaga kode.

## 7. Bentuk di layar (untuk mockup, belum digambar)

- **Pintu**: ikon AMIN kecil di pojok kanan bawah (di atas bar bawah HP); sorot teks; ikon tanya di baris Hasil.
- **Panel**: lembar bawah di HP (setengah layar, bisa ditarik penuh), panel samping di laptop. Halaman di belakang tetap
  terlihat supaya pengguna bisa mencocokkan.
- **Isi jawaban**: teks pendek → kotak Dalilnya (bisa dibuka) → tautan tujuan → satu langkah berikutnya → baris "bukan fatwa".
- **Koin**: saldo kecil di kepala panel; biaya tiap jawaban di bawahnya. Saat habis, panel menawarkan FAQ, Glosarium,
  Tanya-jawab, dan menyebut kapan jatah gratis terisi lagi.
- **Belum login**: panel menjelaskan kenapa perlu masuk (koin per akun) dengan tautan masuk; kalkulator tetap jalan tanpa akun.
- **Layar soal**: ikon AMIN tidak ada sama sekali (bukan abu-abu).
- **Riwayat**: tautan "Percakapan sebelumnya" di panel → halaman Percakapan AMIN.

## 8. Keputusan pemilik (2026-11-25)

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Perilaku di layar soal | **Nonaktif total** di semua layar mengerjakan soal (Latihan, Kuis, Ujian, soal di materi); tidak boleh jadi alat curang (bagian 6 HMW-1) |
| 2 | Login | **Wajib login** |
| 3 | Penyedia AI | Setuju memakai penyedia yang **tidak melatih dengan data** pengguna (kandidat Groq, Cloudflare Workers AI, SumoPod berbayar). Pilihan final diusulkan di spec setelah membandingkan harga dan kualitas bahasa Indonesia; Gemini tier gratis tetap tidak dipakai untuk AMIN |
| 4 | Penyimpanan | Catatan pemakaian AI disimpan; **isi percakapan disimpan selama akun ada**, bisa dilihat dan dihapus pengguna (6c) |
| 5 | Kuota | Diganti **koin**: dipotong sesuai pemakaian token, jatah gratis berkala, ke depan top up (6b) |
| 6 | Di luar cakupan | Selain waris/aplikasi/belajar ditolak; hukum positif serius = sebut pasal yang ada di `kb-khi` + arahkan konsultan; kasus kompleks diarahkan ke konsultan (6a) |
| 7 | Proaktif | **Tidak proaktif**; hanya saat dipanggil. Tidak ada sama sekali di layar soal |
| + | Contoh berangka | **AI menyusun susunan keluarga, engine menghitung**, masuk versi pertama (HMW-4) |
| + | Pengaman | AMIN tidak boleh menjawab di luar konteks (mis. coding) dan tidak boleh bisa diakali melupakan aturan (6d) |

Masih terbuka (diputuskan saat spec, tidak menghalangi mockup):
- Angka satuan koin dan besar jatah gratis: setelah harga penyedia diketahui.
- Teks "konsultan" (siapa yang disarankan): konten, ditulis pemilik/tim.
- Daftar akhir pemicu "kasus kompleks" (6a): usulan ada, perlu ditinjau pemilik.
- Top up: penyedia pembayaran, harga paket, cek regulasi koin (G8).

## 9. Ukuran sukses (untuk pilot)

- ≥ 70% jawaban dinilai "membantu" (tombol kecil setuju/tidak, tanpa komentar wajib).
- 0 angka bagian yang berbeda dari engine; 0 tautan rusak (diuji otomatis atas daftar putih).
- 100% lolos kumpulan uji serangan (6d) sebelum tiap rilis prompt/model.
- Jumlah jawaban "belum ada di materi kami" per topik dicatat sebagai daftar kerja konten.
- Koin: tidak ada saldo minus dan tidak ada pemotongan untuk jawaban yang gagal (uji database).

## 10. Langkah berikutnya

1. Mockup panel AMIN di Hasil dan Materi (sorot → tanya, jelaskan rinci, contoh berangka) + Beranda (pemandu), keadaan
   belum login / belum setuju konteks / koin habis / di luar cakupan / arahan ke konsultan, dan halaman Percakapan AMIN.
2. Spec: kontrak kartu konteks per halaman, skema jawaban JSON, daftar putih tujuan, alur contoh kasus lewat engine,
   pemeriksa server, buku koin, tabel percakapan, kumpulan uji serangan.
3. Syarat G5 dari dokumen PDP (kebijakan privasi menyebut penyedia, penyimpanan percakapan, persetujuan `ai_konteks`)
   diselesaikan sebelum kode yang mengirim data.

## Sumber

- Bastani dkk., "Generative AI without guardrails can harm learning: Evidence from high school mathematics", PNAS 122(26),
  2025. https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-education/
- Kestin dkk., "AI tutoring outperforms in-class active learning", Scientific Reports, 2025.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC12179260/
- Khan Academy, "How we built AI tutoring tools". https://blog.khanacademy.org/how-we-built-ai-tutoring-tools
