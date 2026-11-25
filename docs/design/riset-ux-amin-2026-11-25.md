# Riset UX: AMIN, teman belajar di dalam aplikasi (2026-11-25)

Pemicu: pemilik meminta konsep AMIN (*AI Mawaris Interaktif*). Arah dari pemilik (2026-11-25):
- AMIN melayani **dua hal sekaligus**: (1) menjelaskan ulang isi aplikasi yang sedang dibuka, dan (2) menjawab pertanyaan
  waris umum di luar halaman.
- AMIN **paham konteks halaman**: bisa mengarahkan "buka tautan X" atau "ke halaman X", dan menjawab pertanyaan tentang
  fitur supaya pengguna memakai aplikasi secara maksimal.
- Tujuan satu kalimat: **memaksimalkan pengalaman belajar pengguna.**

Status: **tahap 1–3 (pengguna, JTBD, audit, HMW, ide, rekomendasi)**. Mockup dan spec menunggu pilihan pemilik di bagian 8.
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
| J3 | (B) buntu di soal Latihan | didorong sedikit | tetap merasa mengerjakan sendiri | AMIN bertanya balik; tidak pernah menyebut isi kolom sebelum tangga bantuan membukanya |
| J4 | (B) sudah benar tapi tidak yakin kenapa | penjelasan langkah yang barusan | paham, bukan hafal | AMIN menjelaskan jejak soal setelah selesai, lalu menawarkan satu pertanyaan cek |
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
| Latihan, soal belum selesai | **Tutor sokratik**: bertanya balik, menunjuk konsep, **tidak pernah** menyebut isi kolom. Petunjuk lebih dalam diarahkan ke tangga bantuan yang sudah ada (biaya XP tetap berlaku) | R1; tangga bantuan sudah disetujui, AMIN tidak boleh jadi pintu belakang |
| Latihan, soal sudah selesai atau kolom sudah dibuka | **Penjelas** untuk soal itu | J4 |
| Ujian | **Tidak tersedia** (tombol AMIN disembunyikan, alasannya disebut sekali) | integritas nilai |
| Beranda, Lab awal, Riwayat, dll. | **Pemandu**: fitur, navigasi, saran belajar | J7, J8 |

Ide yang ditolak: satu perilaku untuk semua halaman (melanggar R1); mematikan AMIN di seluruh Latihan (hilang manfaat
tutor yang justru paling berharga di sana).

### HMW-2 Konteks halaman
- **Tiap layar menyusun "kartu konteks" terstruktur**, bukan AMIN mengikis DOM: `{ halaman, judul, perilaku, isi }`. Isi
  per jenis: Hasil = ahli waris (peran, bukan nama), bagian, `refs` jejak; Materi = slug + judul + bagian yang sedang
  dibaca; Latihan = kode soal, kolom yang sudah benar, anak tangga bantuan saat ini (tanpa kunci kolom yang belum dibuka).
  Alasan: kunci jawaban tidak pernah ikut terkirim (R1), dan isi bisa diperiksa di uji.
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
- Pertanyaan "kalau anaknya tiga?" → "Coba di Lab Hitung" sebagai tautan. Di Hasil: tautan "Ubah kasus ini" ke wizard.
  (Menyusun kasus dari cerita = mode cerita AI, fase akhir; tidak di AMIN versi pertama.)

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
- Tidak ada XP untuk bertanya ke AMIN, dan tidak ada pengurangan XP (kecuali lewat tangga bantuan yang memang berbiaya).

### HMW-7 Pendek dulu
- Batas jawaban pertama ±60 kata (diatur di prompt + dipotong di server bila jauh melebihi). Di bawahnya tautan
  "Jelaskan lebih rinci" dan "Beri contoh". Riwayat percakapan per halaman, tidak menumpuk lintas halaman.
- Pertanyaan saran (2–3 chip teks) di awal panel, disusun dari kartu konteks: di Hasil "Kenapa X tidak dapat?", di Materi
  "Contoh lain", di Beranda "Mulai dari mana?".

## 7. Bentuk di layar (untuk mockup, belum digambar)

- **Pintu**: ikon AMIN kecil di pojok kanan bawah (di atas bar bawah HP); sorot teks; ikon tanya di baris Hasil.
- **Panel**: lembar bawah di HP (setengah layar, bisa ditarik penuh), panel samping di laptop. Halaman di belakang tetap
  terlihat supaya pengguna bisa mencocokkan.
- **Isi jawaban**: teks pendek → kotak Dalilnya (bisa dibuka) → tautan tujuan → satu langkah berikutnya → baris "bukan fatwa".
- **Status**: sisa kuota tampil hanya saat tinggal sedikit; saat habis, panel menawarkan FAQ, Glosarium, dan Tanya-jawab.
- **Belum login**: panel menjelaskan kenapa perlu masuk (kuota per akun) dengan tautan masuk; kalkulator tetap jalan tanpa akun.

## 8. Keputusan yang menunggu pemilik

1. **Perilaku di Latihan** (HMW-1): tutor sokratik yang tidak membuka isi kolom dan mengarah ke tangga bantuan.
   Setuju? Alternatif: AMIN mati di soal yang belum selesai.
2. **Login**: wajib login untuk AMIN (rekomendasi, kuota per akun, sama dengan mode cerita), atau tamu diberi 3 pertanyaan
   per hari per perangkat (lebih mudah dicoba, tapi mudah disalahgunakan)?
3. **Penyedia AI** untuk data pengguna: kandidat yang tidak melatih dengan data (Groq, Cloudflare Workers AI, SumoPod
   berbayar). Perlu dipilih sebelum kebijakan privasi diisi.
4. **Retensi log percakapan**: tidak disimpan sama sekali (rekomendasi untuk versi pertama: hanya catat pemakaian di
   `pemakaian_ai`, tanpa isi), atau simpan 90 hari untuk memperbaiki jawaban?
5. **Kuota harian** pengguna biasa (usulan awal: 20 pertanyaan; angka final setelah tahu biaya penyedia).
6. **Pertanyaan umum di luar halaman** sudah disetujui; apakah ada topik yang dikecualikan sejak awal (mis. sengketa
   keluarga, hukum pidana/perdata di luar waris), dijawab "di luar cakupan AMIN"?
7. **Sapaan proaktif**: AMIN hanya muncul saat dipanggil (rekomendasi), atau boleh menyapa sekali di saat tertentu
   (mis. setelah 2 kali Periksa salah)? Proaktif berisiko tumpang tindih dengan tangga bantuan.

## 9. Ukuran sukses (untuk pilot)

- ≥ 70% jawaban di Hasil dinilai "membantu" (tombol kecil setuju/tidak, tanpa komentar wajib).
- 0 angka bagian yang berbeda dari engine; 0 tautan rusak (diuji otomatis atas daftar putih).
- Di Latihan: proporsi soal yang benar **tanpa** AMIN/tangga bantuan pada percobaan berikutnya tidak turun dibanding
  sebelum AMIN (penjaga R1).
- Jawaban "belum ada di materi kami" dicatat jumlahnya per topik (tanpa isi pertanyaan bila log tidak disimpan) sebagai
  daftar kerja konten.

## 10. Langkah berikutnya

1. Pemilik menjawab bagian 8.
2. Mockup panel AMIN di tiga halaman (Hasil, Materi, Latihan) + keadaan belum login / belum setuju / kuota habis.
3. Spec: kontrak kartu konteks per halaman, skema jawaban JSON, daftar putih tujuan, aturan pemeriksaan server, uji.
4. Syarat G5 dari dokumen PDP (kebijakan privasi + penyedia + retensi) diselesaikan sebelum kode yang mengirim data.

## Sumber

- Bastani dkk., "Generative AI without guardrails can harm learning: Evidence from high school mathematics", PNAS 122(26),
  2025. https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-education/
- Kestin dkk., "AI tutoring outperforms in-class active learning", Scientific Reports, 2025.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC12179260/
- Khan Academy, "How we built AI tutoring tools". https://blog.khanacademy.org/how-we-built-ai-tutoring-tools
