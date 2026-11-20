# Rencana implementasi: penilaian, keterlibatan, kelas, dan SaaS (dokumen induk)

Tanggal: 2026-11-20. Status: **usulan urutan, menunggu pemilik** (gerbang keputusan di bagian 7).

Dokumen ini menjawab tiga hal:
1. Apa saja yang perlu disiapkan supaya semua yang sudah disepakati bisa dibangun.
2. Mana yang dikerjakan **sebelum** menyelesaikan jenis soal latihan yang tersisa, mana yang **sesudahnya**.
3. Mana yang **sebelum AMIN**, mana yang **sesudah AMIN**.

## 0. Cara membaca

- **Isi fitur** (perilaku, aturan, angka) tetap di dokumen sumbernya. Dokumen ini dan anak-anaknya hanya mengatur
  **urutan, letak kode, langkah, uji, dan kriteria selesai**. Bila berbeda: spec menang untuk perilaku, dokumen ini menang
  untuk urutan.
  - `spec-model-percobaan-dan-penilaian.md` (selanjutnya **spec**): mode, kejadian, XP, keterlibatan, kelas, fase P0–P8.
  - `spec-hasil-revamp-dan-tabel-latihan.md` (selanjutnya **spec tabel**): tabel faraidh latihan B1–B10.
  - `audit-arsitektur-kesiapan-kelas.md` (selanjutnya **audit**): temuan T1–T16, keamanan K1–K8, UU PDP.
  - `riset-ux-kelas-lms-skala-soal-monetisasi-2026-11-20.md` (selanjutnya **riset kelas**): keputusan D1–D22, roadmap R0–R9.
  - `riset-pasar-faraidh-saas-2026-11-20.md`: prospek pasar.
- **Kode yang bentrok.** Audit memakai P1–P10 untuk temuan UU PDP, sedangkan spec memakai P0–P8 untuk fase. Di rencana ini
  temuan UU PDP ditulis **PDP-1 … PDP-10** (sama dengan audit 9b P1–P10), dan fase ditulis **fase P0 … fase P8**.
- Label bukti: **[Fakta]** dicek di repo hari ini (berkas:baris), **[Dugaan]** belum dicek, **USULAN** boleh diganti pemilik.
- Perkiraan orang-hari adalah **dugaan** untuk satu pengembang dibantu agen, gunanya membandingkan, bukan janji jadwal.

### Dokumen anak

| Berkas | Isi | Gelombang |
|---|---|---|
| `01-keamanan-dan-pdp.md` | K1, K2, K4–K6; PDP-1 … PDP-10 (kebijakan privasi, persetujuan, hapus/unduh akun, retensi, insiden, region, DPIA) | G0, G3, syarat G5 dan G7 |
| `02-fondasi-penilaian.md` | Spike edge function, paket `@waris/latihan`, S1–S6, format kasus soal, `IdSoal` | G1 |
| `03-jenis-soal-latihan.md` | Munasakhat, dzawil arham, mafqud, khuntsa, haml [SYF]/[HNB], gharqa; hero B8; hapus `KartuTebak` | G2 |
| `04-kejadian-server-dan-xp.md` | Tabel `percobaan_soal`, XP baru, `bobotXp`, perbaikan T2 | G3 |
| `05-ujian-dan-keterlibatan.md` | Soal buta, mode Ujian, kemahiran, level A1–C2, profil 5 dimensi, rekor dan lencana, soal hari ini | G3, G6 |
| `06-kelas.md` | Mode tugas, `sesi_soal`, kelas inti, verifikasi pengajar, soal bangkitan dan tugas otomatis, sesi langsung | G4 (soal bangkitan), G7 |
| `07-saas-lanjutan.md` | Lembaga dan monetisasi, alat ukur keberhasilan, rekomendasi perlakuan, ticketing | G8 |

---

## 1. Posisi hari ini [Fakta, dicek 2026-11-20]

**Tabel latihan.** Soal biasa sudah memakai tabel faraidh (spec tabel B1–B6, B9; commit `4fb3abc`, `4f655c4`, `4412246`,
`4862fc3`). Prasyarat engine E1–E5 selesai (`6c15729`, `826c49e`, `8c814cd`, `708f464`). Yang belum: jenis soal lain
(spec tabel bagian 4 langkah 5), hero B8, dan penghapusan `KartuTebak.tsx`/`tebak.ts` (langkah 6).
`susunTabelSoal` masih mengembalikan `TIDAK_DIDUKUNG` untuk semua jenis selain biasa (`apps/web/src/hasil/tabelLatihan.ts:53`).

**Bank soal hanya bisa menyimpan kasus biasa.** Ini temuan terpenting untuk urutan.
- `SoalHitung.kasus` bertipe `ContohKasus` = `pewaris` + daftar kunci ahli waris + `harta` (`packages/content/src/materi.ts:15-22`).
  Bentuk ini **tidak bisa** menyatakan urutan wafat (munasakhat), orang hilang, khuntsa, janin, wafat bersamaan, maupun
  kerabat dzawil arham (kunci dzawil arham tidak ada di `apps/web/src/checklist.ts`).
- Isi bank sekarang: 23 soal hitung (`H-01` … `H-23`, bab 4–10) dan 11 soal kuis (`apps/web/src/snapshot.json`).
  **Belum ada satu pun soal** untuk bab 12, 13, atau 14.
- Akibatnya, "menyelesaikan jenis soal latihan" bukan hanya pekerjaan tampilan: perlu **format kasus soal baru**, lalu
  **soal yang ditulis dan ditinjau tim keilmuan** untuk tiap jenis, baru tabelnya.

**Penilaian dan pemanggil engine tinggal di web dan tidak murni** (audit T1).
`tabelLatihan.ts:7-8` mengimpor `format.ts` dan `terjemah.ts`; `kasus.ts:5` mengimpor `terjemah.ts` (hanya untuk pesan
galat); `checklist.ts:11` mengimpor `terjemah.ts`; `jalankan.ts:11` memakai `VERSI_KB = '1.0.0-dev'` tetap. Server belum
bisa menilai karena semua jalur soal → engine → tabel ada di `apps/web`.

**Server.** Belum ada tabel kejadian percobaan; XP dihitung dari `log_kegiatan` yang ditulis klien (audit T2). Dua edge
function (`ai-bantu`, `kirim-push`), belum ada yang mengimpor `@waris/*` (audit T14). Migrasi produksi menyimpang dari repo
(audit K2). 15 berkas uji pgTAP di `supabase/tests/database/`.

**Cabang yang belum digabung.** `rencana/munasakhat-arham-gharqa` (R12-5/R12-6, commit terakhir 2026-11-09) belum ada di
`main` (tidak ada `R12-5` di `packages/engine/src`). Bila digabung, munasakhat bisa memuat dzawil arham dan gharqa; tabel
latihan untuk kombinasi itu belum dirancang (lihat `03` bagian 2).

**AMIN.** Belum ada kode. Menurut urutan pemilik: Hasil + mode fokus → verifikasi madzhab → harta dibagi sebagian → KHI →
lengkapi materi dan latihan soal → **AMIN** → sistem kelas → mode cerita AI. Login Google sudah ada (`apps/web/src/akun/`).

---

## 2. Inventaris: semua yang disepakati dan di mana dikerjakan

| Kelompok | Keputusan | Paket kerja | Dokumen | Gelombang |
|---|---|---|---|---|
| Keamanan produksi | audit K1, K2, K4–K6 | matikan login Email, migrasi penyelaras, pengerasan fungsi | 01 | G0 |
| UU PDP | audit 9c butir 1–9 | papan peringkat opt-in, kebijakan privasi + persetujuan, hapus/unduh akun, retensi, runbook insiden, region, DPIA, kebijakan usia | 01 | G3 (dasar), G7 (DPIA, usia) |
| Model penilaian murni | spec K2, K4, K11; S1–S3; audit T1, T8 | `@waris/latihan`: `nilaiSemuaKolom` per sel + ECF, putusan Latihan/Ujian, jangkar sebagai prop, `PercobaanTabel` | 02 | G1 |
| Data percobaan | spec K3, S4–S6; audit T3, T4, T7, T9 | kejadian lokal dengan `IdSoal`, revisi, versi; `benar` tidak mundur | 02 | G1 |
| Format soal | riset kelas 5b; temuan bagian 1 | format kasus soal untuk semua jenis + `IdSoal` + `muatSoal` | 02 | G1 |
| Jenis soal | spec tabel B7, B8 | 6 jenis soal + gharqa, hero latihan, hapus `KartuTebak` | 03 | G2 |
| XP jujur, tanpa kebenaran dari klien | spec K5–K7, 2.6, bagian 3; audit T2, T12; keputusan pemilik 2026-11-20 | `percobaan_soal` hanya ditulis server, edge function `catat-percobaan` menilai semua kejadian (mandiri juga), kuis dan pelajaran lewat server, XP dari baris server, `bobotXp` di revisi soal | 04 | G3 |
| Soal buta | D16; spec 4A.9 | daftar soal tanpa bocoran susunan keluarga | 05 | G3 |
| Mode Ujian | spec K1, 1.1; D6 | tombol Kirim, skor parsial, waktu opsional | 05 | G6 |
| Keterlibatan | spec K12–K15, 4A; D11, D14–D22 | kolom benar, soal serupa, kemahiran B/I/A, soal hari ini, level A1–C2, tes awal/akhir, profil 5 dimensi, rekor 20/50/100, lencana penyelesaian dan kecepatan | 05 | G6 |
| Soal penalaran | D22; riset kelas 16d | 3 jenis soal tertutup (pilih alasan, temukan kesalahan, transfer) | 05 | skema di G4, isi di G4–G6 |
| Penilaian server | spec K10, 2.6, fase P1 + P3; audit T14 | `catat-percobaan` untuk mandiri (G3); mode tugas + `sesi_soal` (G7) | 04, 06 | spike di G1, mandiri di G3, tugas di G7 |
| Kelas LMS | spec K17, bagian 5; D1–D10, D12–D13, D20 | kelas per periode, kode/tautan, tugas, skor parsial 40/30/30, nilai, koreksi, rilis, ekspor, arsip, verifikasi pengajar, pantauan periode | 06 | G7 |
| Soal bangkitan (jutaan soal) | riset kelas 5b; spec 2.6 butir 7, 5.1; keputusan pemilik 2026-11-20 | pola ditinjau → skrip membangkitkan dengan engine → katalog `soal_bangkitan` terbuka di Latihan; tugas otomatis "buatkan pakai engine" | 06 bagian 3 | format di G1, katalog di G4, tugas otomatis di G7 |
| Sesi langsung | spec P4c | Realtime, agregat tanpa nama | 06 | G7 |
| Monetisasi | D2, D3; riset kelas 6c–6d | lembaga, `hakFitur`, paket, pembayaran, invoice | 07 | G8 |
| Alat ukur | spec 4A.7; R8 | dasbor internal belajar + bisnis | 07 | G8 |
| Rekomendasi perlakuan | D10 | saran perlakuan di tampilan pengajar | 07 | G8 |
| Ticketing | R9 | laporan masalah, antrean, basis pengetahuan, status | 07 | G8 |
| Nyawa | spec K8 | ditunda (fase P5 opsional) | – | tidak dijadwalkan |

---

## 3. Aturan penjadwalan

Tiga golongan dari audit bagian 7 tetap berlaku:
- **A. Biaya naik tiap hari** (kerusakan tidak bisa diulang): keamanan, UU PDP, kualitas data percobaan. → secepatnya.
- **B. Biaya naik tiap kali kode bertambah**: kontrak komponen dan modul penilaian sebelum jenis soal lain meniru pola lama.
  → sebelum jenis soal berikutnya.
- **C. Biaya sama atau lebih murah nanti**: tabel kelas, layar pengajar, edge function penilaian. → saat kelas dibangun.

Ditambah dua aturan baru dari temuan bagian 1:
- **D. Format yang akan diisi banyak konten harus final sebelum konten diproduksi.** Format kasus soal, `IdSoal`,
  `bobotXp`, dan skema soal penalaran harus siap **sebelum** langkah pemilik "lengkapi materi dan latihan soal". Mengubah
  format sesudah ratusan soal ditulis berarti migrasi konten yang sudah ditinjau tim keilmuan.
- **E. Fitur yang mengirim data pengguna ke pihak ketiga baru menunggu kebijakan privasi dan persetujuan.** AMIN mengirim
  konteks halaman (bisa berisi susunan keluarga dan harta) ke penyedia LLM, jadi kebijakan privasi yang menyebut penyedia
  itu dan persetujuan pengguna harus ada **sebelum AMIN** (UU PDP Pasal 20–22, 51, 56; audit 9b PDP-1, PDP-10).

---

## 4. Urutan gelombang

```
G0 keamanan produksi ──────────────── (kapan saja, paling cepat)
G1 fondasi penilaian ─┐
                      ├─► G2 jenis soal latihan ─► G3 data server + PDP dasar + soal buta
                      │                                   │
     (sejajar: Hasil+mode fokus, verifikasi madzhab, 7b, KHI — berkas berbeda)
                                                          ▼
                                     G4 lengkapi materi & latihan soal (urutan pemilik)
                                                          ▼
                                     G5 AMIN (urutan pemilik)  ║  G6 Ujian + keterlibatan (boleh sejajar)
                                                          ▼
                                     G7 kelas (mode tugas → kelas inti → tugas otomatis → sesi langsung)
                                                          ▼
                                     G8 SaaS (lembaga & monetisasi → alat ukur → ticketing) → mode cerita AI
```

### G0. Keamanan produksi (sekarang; 1–2 hari + izin pemilik)
K1 matikan penyedia login Email di dasbor; K2 migrasi penyelaras; K4–K6 pengerasan fungsi. Tidak bergantung apa pun dan
tidak menyentuh berkas latihan, jadi bisa dikerjakan bersamaan dengan pekerjaan lain. Rincian: `01` bagian 1.

### G1. Fondasi penilaian (**sebelum** jenis soal latihan berikutnya; 6–9 hari)
1. Spike: edge function menjalankan engine dan menilai satu tabel soal (1 hari). Hasilnya menentukan letak paket.
2. Paket `@waris/latihan` berisi jalur murni soal → kasus → engine → tabel → nilai (S1, S2).
3. Komponen tabel memakai kontrak `PercobaanTabel` dan jangkar dari luar (S3).
4. Kejadian lokal, `benar` tidak mundur, versi engine dari build (S4–S6).
5. Format kasus soal yang bisa menyatakan semua jenis + `IdSoal` + `muatSoal`.

**Kenapa sebelum jenis soal berikutnya:** tiap jenis soal menambah satu fungsi susun tabel dan memakai kontrak komponen.
Bila dibangun di pola lama, S1–S3 harus diubah di 7 tempat, bukan 1 (audit 7, golongan B: 2–3× lebih mahal). Dan jenis soal
berikutnya **tidak bisa** dibuat tanpa format kasus soal baru (bagian 1). Rincian: `02`.

### G2. Menyelesaikan jenis soal latihan (14–23 hari + waktu tim keilmuan)
Urutan: munasakhat → dzawil arham → mafqud → khuntsa → haml [SYF] → haml [HNB] → gharqa, lalu hero B8 dan hapus
`KartuTebak`. Tiap jenis: soal ditulis dan ditinjau (minimal 2 per jenis, supaya "soal serupa" punya isi), fungsi susun
tabel dengan uji kunci dari spec tabel B7, tampilan dibandingkan berdampingan dengan tab mockup. Rincian: `03`.

### G3. Data server, UU PDP dasar, soal buta (**sesudah** jenis soal selesai, sebelum konten massal; 13–20 hari)
- Fase P1: tabel `percobaan_soal` yang **hanya ditulis server**; edge function `catat-percobaan` menilai setiap kejadian
  (mandiri juga) dengan validasi ketat spec 2.6; kuis dan pelajaran lewat server; XP dari baris server dengan `bobotXp`
  dari revisi soal; T2 tertutup penuh (`04`). Penilaian server mandiri dimajukan dari G7 atas keputusan pemilik
  2026-11-20 (tidak menerima kebenaran dari klien).
- UU PDP dasar: papan peringkat opt-in, kebijakan privasi + persetujuan terekam, hapus dan unduh akun (`01` bagian 2).
- Soal buta sebelum dibuka (`05` bagian 1). Tidak bergantung G1/G2; spec memasukkannya ke fase P0, jadi boleh dikerjakan
  kapan saja begitu mockup-nya disetujui. G3 adalah batas paling lambat.
- Aksi kejadian `buka` ikut migrasi `percobaan_soal` (`05` bagian 2), supaya lencana kecepatan nanti punya waktu server
  tanpa migrasi kedua.

**Kenapa sesudah G2, bukan sebelum:** P1 membaca `bobotXp` per jenis soal dan menyimpan kejadian dari semua jenis; lebih
murah menulis migrasi XP sekali setelah semua jenis punya kejadian yang seragam. Kejadian sudah tersimpan lokal dan
mengantre sejak G1 (S4), jadi tidak ada data yang hilang selama menunggu.
**Kenapa sebelum G4:** aturan D. **Kenapa UU PDP di sini, bukan di G0:** butuh keputusan pemilik (kontak pengendali, isi
kebijakan, region) dan teks yang ditinjau; papan opt-in boleh lebih awal bila pemilik setuju.

G3 tidak menyentuh berkas Hasil/engine yang sedang dipakai alur "Hasil + mode fokus", verifikasi madzhab, 7b, dan KHI,
jadi bisa berjalan bersamaan dengan langkah-langkah itu.

### G4. Lengkapi materi dan latihan soal (urutan pemilik, sebelum AMIN)
Konten ditulis memakai format G1 dan metadata G3. Isinya:
1. Skema **soal penalaran** (3 jenis, `05` bagian 6) di awal G4 supaya penulis bisa mulai; tampilannya boleh di G6.
2. **Soal bangkitan** (`06` bagian 3.1–3.4): pola ditulis dan ditinjau tim keilmuan, skrip membangkitkan soal dengan engine,
   katalog `soal_bangkitan` terbuka di Latihan. Dikerjakan sesudah G3 karena penilaian server harus sudah jalan sebelum
   soal sebanyak itu dibuka. Gerbang: paket Supabase (katalog sejuta soal ±100 MB, tidak muat paket gratis).
3. Soal kurasi tambahan sesuai target `05` bagian 6.4.
Orang-hari untuk kode soal bangkitan: 6–9 (generator, skrip, katalog, daftar di Latihan); konten bergantung tim keilmuan.

### G5. AMIN (urutan pemilik)
Rencana ini tidak merancang AMIN. Yang harus sudah ada dari rencana ini sebelum AMIN dimulai:
1. Kebijakan privasi memuat penyedia LLM, tujuan, dan lokasi; persetujuan "kirim konteks halaman ke AI" terpisah dan bisa
   ditarik (aturan E; `01` bagian 2.2).
2. Retensi log percakapan AMIN ditetapkan (`01` bagian 2.5).
3. Hasil spike G1 (engine di edge function). Bila AMIN perlu mengutip angka engine di server ("tidak menghitung sendiri,
   kutip engine"), jalurnya sudah terbukti.
4. Pola kuota per akun memakai `pemakaian_ai` yang sudah ada (`supabase/functions/ai-bantu/index.ts`), bukan sistem kuota
   baru. `hakFitur` (G8) nanti menyerap kuota ini.

### G6. Mode Ujian dan keterlibatan (sesudah G4; boleh sejajar dengan G5; 12–18 hari + mockup)
Mode Ujian dulu (dibutuhkan kelas), lalu umpan kolom benar, soal serupa, kemahiran B/I/A, rekor dan lencana, soal hari ini,
level A1–C2, tes awal/akhir, profil 5 dimensi. Semuanya fungsi murni atas kejadian (`05`). Butuh soal yang cukup (G4),
karena kemahiran dan profil tidak bermakna dengan 23 soal. Berkasnya (latihan, belajar, profil) berbeda dari AMIN
(chatbot), jadi bisa dikerjakan bersamaan.

### G7. Kelas (sesudah AMIN; 18–30 hari)
Mode tugas di `catat-percobaan` dan `sesi_soal` (fase P3; fungsi dan bundelnya sudah ada sejak G3) → kelas inti (fase P4) → tugas otomatis dari katalog soal bangkitan → sesi langsung (fase P4c).
Syarat masuk: G3 selesai, DPIA, keputusan usia pelajar, keputusan region (pindah region **sebelum** data kelas masuk lebih
murah). Rincian: `06`.

### G8. SaaS (sesudah kelas dipakai pilot; 20–30 hari)
Lembaga dan monetisasi → alat ukur keberhasilan + rekomendasi perlakuan → ticketing. Lalu mode cerita AI (urutan pemilik).
Rincian: `07`.

---

## 5. Jawaban langsung untuk pertanyaan pemilik

### 5.1 Sebelum vs sesudah menyelesaikan jenis soal latihan

| Pekerjaan | Sebelum jenis soal berikutnya | Sesudah semua jenis soal | Alasan |
|---|---|---|---|
| G0 keamanan (K1, K2, K4–K6) | ✔ (kapan saja) | | risiko tiap hari, tidak terkait latihan |
| Spike edge function | ✔ | | menentukan letak paket penilaian |
| `@waris/latihan` + S1–S3 | ✔ | | tiap jenis soal meniru kontrak ini |
| S4–S6 kejadian lokal | ✔ | | data yang terkumpul sejak hari ini bisa dinilai ulang |
| Format kasus soal + `IdSoal` | ✔ | | jenis soal lain tidak bisa ditulis tanpanya |
| Fase P1 (`percobaan_soal`, penilaian server, XP baru, `bobotXp`) | | ✔ | migrasi XP sekali untuk semua jenis; sebelum itu kejadian aman di antrean lokal |
| UU PDP dasar | | ✔ (papan opt-in boleh lebih awal) | butuh keputusan dan teks pemilik |
| Soal buta | boleh, bila mockup sudah disetujui | ✔ paling lambat | tidak bergantung jenis soal; hanya butuh mockup |
| Mode Ujian, keterlibatan | | ✔ (sesudah G4) | butuh semua jenis soal + konten cukup |
| Soal bangkitan | | ✔ (G4, sesudah G3) | penilaian server harus jalan sebelum soal sebanyak itu dibuka |
| Kelas, tugas otomatis, SaaS | | ✔ (sesudah AMIN) | golongan C |

### 5.2 Apakah menunggu AMIN?

**Tidak untuk G0–G4.** Pekerjaan itu tidak bergantung AMIN, dan sebagian besar justru menjadi **syarat** AMIN (privasi,
spike edge function, format soal untuk materi yang dibaca AMIN lewat RAG).

**Ya untuk kelas (G7) dan SaaS (G8)**, sesuai urutan pemilik. Alasannya:
1. Golongan C tidak lebih mahal bila ditunda, dan kebutuhannya akan lebih jelas setelah wawancara dosen (riset pasar
   bagian 8 menyarankan wawancara dosen dan kaprodi sebelum membangun).
2. Infrastruktur yang dibangun untuk AMIN (edge function dengan `@waris/*`, kuota per akun, kebijakan privasi untuk
   prosesor pihak ketiga) dipakai ulang oleh kelas.

**Satu pengecualian yang patut ditimbang:** kalender akademik. Kelas baru berguna bila siap **sebelum semester dimulai**
(umumnya Februari–Maret dan Agustus–September [Dugaan, kalender tiap kampus berbeda]). Bila ada dosen yang bersedia menjadi
pilot di semester tertentu, kelas inti versi pilot (fase P3 + P4 tanpa sesi langsung dan lembaga) bisa
didahulukan sebelum AMIN. Biayanya: AMIN mundur ±5–7 minggu. Ini keputusan pemilik (gerbang G7 di bagian 7).

---

## 6. Perkiraan usaha (dugaan, orang-hari)

| Gelombang | Isi | Orang-hari | Bergantung pada orang lain |
|---|---|---|---|
| G0 | keamanan produksi | 1–2 | izin pemilik untuk dasbor dan produksi |
| G1 | fondasi penilaian | 6–9 | – |
| G2 | 7 jenis soal + B8 | 14–23 | tim keilmuan menulis dan meninjau soal; mockup khuntsa |
| G3 | P1 (dengan penilaian server), PDP dasar, soal buta | 13–20 | teks kebijakan privasi, kontak pengendali, mockup soal buta |
| G4 | soal bangkitan (kode) + konten | 6–9 untuk kode | tim keilmuan; paket Supabase |
| G5 | AMIN | di luar rencana ini | – |
| G6 | Ujian + keterlibatan | 12–18 | mockup, validasi peta level oleh tim keilmuan |
| G7 | kelas | 18–30 | dosen pilot, DPIA, keputusan usia dan region |
| G8 | SaaS | 20–30 | gerbang pembayaran, keputusan harga |

G0–G3 ≈ 34–54 orang-hari sebelum konten massal. Sebagai pembanding, audit bagian 7 memperkirakan golongan A + B ±1,5–2
minggu; selisihnya adalah format kasus soal dan tujuh jenis soal yang memang sudah ada di rencana pemilik.

---

## 7. Gerbang keputusan pemilik

Pekerjaan sebuah gelombang tidak dimulai sebelum gerbangnya terjawab. Nomor merujuk dokumen asalnya.

| Gerbang | Pertanyaan | Usulan |
|---|---|---|
| G0 | audit 10.6: matikan login Email di dasbor? audit 10.7: jalankan migrasi penyelaras ke produksi? | ya, keduanya |
| G1 | audit 6.3: letak penilaian dan pemanggil engine | paket baru `@waris/latihan` (`02` bagian 2) |
| G1 | Format kasus soal: soal jenis baru disimpan sebagai **berkas kasus** (format yang sama dengan Simpan ke berkas), soal biasa lama tetap `ContohKasus` | ya (`02` bagian 5) |
| G2 | spec tabel 6: angka khuntsa belum ada di mockup; tampilan mengikuti Mafqud | buat tab Khuntsa di mockup dulu |
| G2 | Gabung `rencana/munasakhat-arham-gharqa` sebelum atau sesudah tabel munasakhat? | sesudah; tabel munasakhat dibuat untuk munasakhat biasa dulu (`03` bagian 2) |
| G3 | audit 10.9: papan peringkat opt-in | ya, boleh lebih awal dari G3 |
| G3 | Siapa pengendali data dan kontaknya di kebijakan privasi? | pemilik isi |
| G3 | audit 10.10: proyek `ap-south-1` = produksi? pindah region sebelum kelas? | pemilik jawab; pindah sebelum G7 bila ya |
| G3 | spec 8.1, 8.3, 8.26: nama mode, bobot XP, daftar soal buta | **diputuskan 2026-11-20**: Latihan/Ujian; bobot usulan 3.2; soal buta kode/bab/tingkat/jenis, mockup dulu |
| G3 | spec 8.6: latihan mandiri dinilai server? | **diputuskan 2026-11-20: ya**, semua kejadian dinilai server (spec 2.6, `04`) |
| G4 | spec 8.30: siapa menulis pengecoh soal penalaran dan daftar kesalahan umum? | **masih menunggu** pemilik menunjuk |
| G6 | spec 8.2, 8.11, 8.12, 8.14, 8.25, 8.27–8.29 | **diputuskan 2026-11-20**: mockup Ujian dulu; tandai kolom benar tanpa potong XP; soal serupa + materi sesudah dibuka; soal hari ini tanpa bonus; 30/45/60 detik lalu kalibrasi; peta level ditinjau tim keilmuan; ambang usulan sebagai titik awal |
| G7 | Pilot kelas sebelum AMIN demi kalender semester? | pemilik putuskan (bagian 5.2) |
| G7 | spec 8.5, 8.7, 8.8 | **diputuskan 2026-11-20**: pembuat kelas = akun berizin admin selama pilot, nama sesama pelajar tidak tampil bawaan; kunci lama + pemberitahuan pengajar; fase pertama ≥ 18 tahun |
| G7 | audit 10.8 kalkulator saat tugas | *open book* (usulan) |
| – | spec 8.4 nyawa | **diputuskan 2026-11-20**: ditunda; bila dibangun hanya mode Tantangan daring |
| G8 | harga dan paket (riset pasar: paket prodi Rp2,5–3 juta per semester, dugaan) | uji ke dosen dan kaprodi dulu |

---

## 8. Risiko rencana

| Risiko | Akibat | Penanganan |
|---|---|---|
| Spike gagal: engine tidak bisa dibundel ke Deno, atau terlalu lambat/besar | penilaian server tidak bisa memakai paket yang sama | spike di G1 sebelum paket dibuat; cadangan: bundel esbuild ke satu berkas ESM (audit T14), atau fungsi Node di penyedia lain. Diputuskan sebelum G1 langkah 2 |
| Tim keilmuan menjadi leher botol soal G2 | G2 molor | tiap jenis cukup 2 soal untuk lolos G2; sisanya di G4. Soal bisa diambil dari contoh KB bab 12–14 yang angkanya sudah dipakai di spec tabel B7 |
| Format berkas kasus berubah versi | soal lama tidak terbaca | format berkas sudah berversi (`kasus.ts:181`, versi 1–4); pembaca tetap menerima versi lama, uji untuk tiap versi |
| `rencana/munasakhat-arham-gharqa` digabung di tengah G2 | susun tabel munasakhat harus menangani kombinasi baru | susun tabel mengembalikan `TIDAK_DIDUKUNG` untuk munasakhat yang memuat dzawil arham atau gharqa sampai dirancang |
| Data lokal membengkak sebelum fase P1 | localStorage penuh | batas 500 kejadian terakhir di antrean (spec 6.2) |
| Klien versi lama masih menulis `log_kegiatan` langsung saat hak tulisnya dicabut | XP dari klien lama hilang | cabut hak tulis bersamaan rilis klien baru; entri yang ditolak masuk antrean gagal, tidak macet (`04` bagian 3–4) |
| Pengerjaan sejajar dengan sesi lain di berkas yang sama (`Hasil.tsx`) | konflik | G1 langkah 3 dan G2 menyentuh `Hasil.tsx`; jangan sejajarkan dengan integrasi mode fokus kecuali dalam worktree terpisah dan digabung berurutan |

---

## 9. Keamanan dan anti-manipulasi: di mana diatur

Ringkasan untuk menjawab "apa saja yang sudah diamankan". Rinciannya di dokumen yang disebut.

| Ancaman | Pengaman | Di mana | Gelombang |
|---|---|---|---|
| Mendaftar dengan email orang lain, membaca kasus berbagi-email, mengambil alih akun | matikan login Email; fungsi berbagi hanya percaya provider Google | `01` 1.1 | G0 |
| Fungsi portal dipanggil tanpa login; `search_path`; penulis memalsukan pembuat draf | cabut `anon`, `set search_path`, hak `update` per kolom | `01` 1.3 | G0 |
| Migrasi produksi berbeda dari repo | migrasi penyelaras + cek sebelum push | `01` 1.2 | G0 |
| Klien mengaku benar, memalsukan XP/papan | klien tidak bisa menulis tabel kejadian atau `log_kegiatan`; server menilai semua | spec 2.6; `04` 1–3 | G3 |
| Isian karangan (kolom/baris palsu, pecahan di kotak bulat, mengisi sel jangkar, jangkar pilihan sendiri) | validasi isian terhadap tabel susunan server | `04` 2.2 butir 5 | G3 |
| Kiriman ulang, Kirim Ujian dua kali, balapan | idempoten per id; indeks unik; transaksi | `04` 1, 2.2 | G3, G7 |
| Banjir permintaan | batas laju per menit dan per hari | `04` 2.2 butir 2; `06` 2.1 | G3, G7 |
| Jam perangkat dimajukan/dimundurkan | semua waktu dari `now()` server; lencana kecepatan dari `buka` server | spec 2.6; `05` 2 | G3, G6 |
| Soal karangan klien, katalog diubah dari luar, pelajar memilih soal tugas | server hanya menerima `soalId` dari katalog terbit dan membangkitkannya ulang; katalog tanpa hak tulis klien; soal tugas dipilih server | `06` 3.6; `04` 2.2 | G4, G7 |
| Pelajar membaca nilai/isian pelajar lain; pengajar membaca kelas lain atau latihan mandiri | RLS + `peran_di_kelas()`; tanpa parameter `user_id` | `06` 2.1, 2.5 | G7 |
| Pengajar mengubah nilai diam-diam | nilai append-only, koreksi beralasan | spec 5.1; `06` 2 | G7 |
| Pelanggaran UU PDP | opt-in papan, kebijakan privasi, persetujuan terekam, hapus/unduh akun, retensi, runbook, DPIA | `01` 2 | G3, G7 |

**Yang tidak bisa dijamin teknologi:** engine berjalan di perangkat, jadi pelajar selalu bisa menghitung kunci sendiri
atau membuka jawaban tanpa mengirim kejadiannya. Server menjamin *apa yang dihitung*, bukan *bahwa pelajar tidak
mencontek* (spec 2.6, audit 8c butir 12). Karena itu tugas diperlakukan *open book*.

