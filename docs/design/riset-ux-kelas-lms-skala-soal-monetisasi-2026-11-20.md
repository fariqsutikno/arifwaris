# Riset UX: kelas sebagai LMS, skala jutaan soal, dan monetisasi SaaS (2026-11-20)

Arahan pemilik (2026-11-20):
1. Kelas berfungsi sebagai **LMS** untuk perkuliahan interaktif. Ada **pengajar**. Pelajar bergabung lewat **kode yang
   dibagikan pengajar** atau **undangan**. Tugas dan penugasan ada di dalam kelas.
2. Satu pelajar bisa ikut **beberapa kelas sekaligus**, dalam **periode tertentu**; mahasiswa bisa **mengulang** mata
   kuliah yang sama di periode lain.
3. Pelajar melihat **tugas, mengerjakan, dan melihat nilai**. Pengajar bisa menugaskan **semua soal latihan** yang ada.
4. Ke depan web menyediakan **puluhan ribu sampai jutaan soal faraidh** yang dibangkitkan (generate) pada waktunya.
5. Siap **monetisasi**; model belum terbayang, minta usulan dan riset kebiasaan umum.
6. Pengalaman di kelas bebas dirancang.
7. Roadmap akhir: **alat ukur keberhasilan** dan **ticketing**, karena akan menjadi **SaaS**.
8. **Login dengan Google dipertahankan.**

Dokumen terkait: `riset-ux-model-percobaan-dan-keterlibatan-2026-11-20.md` (riset 1), `spec-model-percobaan-dan-penilaian.md`
(spec), `audit-arsitektur-kesiapan-kelas.md` (audit; bagian 8 keamanan, 9 UU PDP).

Penanda: **[Fakta-kode]**, **[Fakta-sumber]** (tautan di tempat; angka vendor = klaim vendor), **[Dugaan]**,
**[Rekomendasi]**. **Tidak ada wawancara pengajar atau mahasiswa**; profil di bagian 1 adalah asumsi dan diuji di
bagian 11.

---

## 0. Batasan

- Login hanya Google (keputusan pemilik). Akun Google kampus (Workspace for Education) dan akun pribadi sama-sama bisa.
- Fikih hanya dari KB; kunci dari engine. Generator soal **tidak boleh** membangkitkan kasus di luar KB atau yang berstatus
  blocked/`TIDAK_DIDUKUNG` (CLAUDE.md).
- Mekanik game hanya di jalur mandiri; layar kelas netral (riset 1 bagian 9).
- Keamanan dan UU PDP untuk kelas mengikat (audit 8c, 9c).
- Tanpa mockup di sesi ini.

---

## 1. Pengguna

### 1a. Siapa (asumsi)

| Peran | Gambaran | Kebiasaan yang relevan |
|---|---|---|
| **Pengajar** (utama untuk kelas) | Dosen mata kuliah Fiqh Mawaris/Faraidh di fakultas syariah (PTKIN/PTS), ustadz di ma'had/pesantren, guru MA keagamaan. Mengajar 1–4 kelas paralel per semester, 20–60 mahasiswa per kelas | Sudah memakai Google Classroom/LMS kampus (Moodle, e-learning kampus) dan grup WhatsApp. Memeriksa latihan faraidh di kertas: lama, dan kesalahan langkah sulit dilacak. Mengisi nilai ke sistem akademik kampus di akhir semester |
| **Pelajar/mahasiswa** (utama) | Mahasiswa semester 3–6, sebagian mengulang. Banyak di HP | Ikut 1–3 kelas di aplikasi ini sekaligus bila ada lebih dari satu mata kuliah atau pengajar memakai aplikasi; ingin tahu tenggat, nilai, dan di mana salahnya |
| Asisten pengajar | Asisten dosen yang membantu memeriksa/menjawab | Butuh hak melihat nilai, tidak menghapus kelas |
| **Admin lembaga** (pembeli SaaS) | Kaprodi/fakultas/yayasan pesantren yang membayar lisensi | Butuh daftar pengajar, jumlah pelajar aktif, tagihan resmi, dokumen privasi (DPA) |
| Pelajar mandiri | Pengguna yang sudah ada (riset 1) | Tidak terdampak, kecuali soal makin banyak |

### 1b. Kosakata pengguna

| Dipakai | Hindari | Alasan |
|---|---|---|
| **Kelas** | Course, Room, Grup | bahasa kampus/pesantren |
| **Kode kelas**, **Tautan undangan**, **Undang lewat email** | Enroll, Join code | pola Google Classroom yang sudah dikenal |
| **Periode** (mis. "Ganjil 2026/2027") | Term, Batch | kampus memakai semester; pesantren memakai tahun ajaran → label bebas diisi pengajar |
| **Pengajar**, **Asisten**, **Pelajar** | Guru/Dosen/Murid (sebagai peran sistem) | satu istilah netral untuk semua jenjang; nama jabatan bebas di profil kelas |
| **Tugas**, **Tenggat**, **Nilai**, **Rekap nilai** | Assignment, Deadline, Gradebook, Skor | bahasa kelas |
| **Belum dikerjakan / Sedang dikerjakan / Sudah dikirim / Terlambat / Dinilai** | Pending, Submitted, Late | status yang terbaca |
| **Sesi langsung** (latihan bersama di ruang kelas) | Live quiz, Game | menghindari kesan permainan di kelas bernilai |
| **Arsip** (kelas periode lalu) | Hapus | kelas lama tetap bisa dibuka |
| **Lembaga** | Tenant, Organisasi | bahasa pembeli |

---

## 2. Audit: yang ada vs yang dibutuhkan LMS

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| L1 | **Kritis untuk LMS** | **Bank soal terlalu kecil untuk penugasan semester.** 23 soal hitung terbit; **tiap topik hanya punya satu soal**. Pengajar yang memberi tugas mingguan akan kehabisan soal dalam beberapa pekan, dan soal yang sama dipakai semua kelas tiap semester (jawaban beredar) | [Fakta-kode] `apps/web/src/snapshot.json`: `soal_hitung` 23, 23 topik berbeda, semuanya 1 soal |
| L2 | **Kritis untuk skala** | **Seluruh konten dibundel ke aplikasi.** `snapshot.json` 671 KB berisi semua konten terbit; web memasangnya saat dimuat dan menyinkron perubahan. Jutaan soal tidak mungkin dibundel atau disinkron ke perangkat | [Fakta-kode] `apps/web/src/konten/sumber.ts:8` (`import bawaan from '../snapshot.json'`); ukuran berkas |
| L3 | Tinggi | **Satu soal = satu entri konten dengan revisi yang ditinjau satu per satu.** Cocok untuk 23 soal, tidak untuk ribuan: tinjauan syariah per soal tidak terskala | [Fakta-kode] `supabase/migrations/20260926000001_konten.sql:22-45` (`entri_konten`, `revisi`) |
| L4 | Tinggi | Belum ada kelas, periode, keanggotaan, tugas, nilai | audit T5 |
| L5 | Sedang | Belum ada konsep **lembaga** dan **hak akses berbayar** (entitlement); semua fitur sama untuk semua orang | tidak ada tabel/fungsi terkait |
| L6 | Sedang | Penilaian di klien; kunci bisa diturunkan di perangkat karena aplikasi juga kalkulator | audit 8c butir 12 |
| L7 | Rendah | Login Google saja: cocok untuk kampus yang memakai Google Workspace; kampus yang memakai Microsoft 365 butuh akun Google pribadi | keputusan pemilik; dicatat sebagai batas |

Yang **bisa dipakai ulang**: engine murni (kunci dan penilaian bisa dijalankan server), tabel faraidh B (tampilan
pengerjaan), model kejadian percobaan (spec 2), RLS pola milik sendiri, Google login, push.

---

## 3. JTBD

### Pengajar

| # | Saat… | Saya ingin… | Supaya… | Ukuran sukses |
|---|---|---|---|---|
| G1 | awal semester | membuat kelas untuk periode ini dan membagikan kode di grup WA/kelas | semua mahasiswa masuk dalam satu pertemuan | ≥ 90% mahasiswa bergabung di pertemuan pertama; < 3 menit membuat kelas |
| G2 | menyiapkan tugas mingguan | memilih soal menurut bab/topik/tingkat/jenis, atau meminta "10 soal 'aul tingkat menengah" tanpa mencari satu per satu | tugas siap dalam menit, tidak berjam | < 5 menit membuat tugas |
| G3 | khawatir contek-mencontek | memberi soal **berbeda per mahasiswa** yang setara tingkat kesulitannya | nilai mencerminkan kemampuan | opsi variasi per pelajar |
| G4 | sesudah tenggat | melihat siapa belum mengirim dan **kolom/langkah mana yang paling banyak salah** | membahas yang tepat di pertemuan berikutnya | satu layar ringkasan per tugas |
| G5 | di ruang kelas | mengerjakan soal bersama, melihat hasil kelas seketika, dan membahas | kuliah interaktif | sesi langsung berjalan tanpa jeda > 2 detik |
| G6 | akhir semester | mengekspor rekap nilai ke sistem akademik kampus | tidak mengetik ulang | ekspor CSV/XLSX sesuai urutan NIM |
| G7 | semester berikutnya | memakai ulang tugas tahun lalu untuk kelas baru, dengan soal yang berbeda | hemat waktu tanpa membocorkan jawaban | salin kelas/tugas ke periode baru |
| G8 | ada mahasiswa yang keberatan atas nilai | melihat isiannya dan mengoreksi nilai dengan alasan | adil dan tercatat | koreksi dengan jejak |

### Pelajar

| # | Saat… | Saya ingin… | Supaya… | Ukuran sukses |
|---|---|---|---|---|
| M1 | menerima kode/tautan dari pengajar | bergabung dengan satu langkah memakai akun Google | langsung masuk | ≤ 2 ketukan sesudah login |
| M2 | ikut beberapa kelas | melihat semua tugas dari semua kelas, terurut tenggat | tidak ada yang terlewat | satu daftar "Tugas" lintas kelas |
| M3 | mengerjakan tugas | tahu aturannya (mode, berapa kali boleh, sampai kapan) sebelum mulai | tidak kaget | aturan tampil di atas tugas |
| M4 | sesudah nilai keluar | melihat nilai dan pembahasan per kolom (sesuai izin pengajar) | belajar dari salah | nilai + pembahasan per tugas |
| M5 | mengulang mata kuliah | kelas baru terpisah dari kelas lama, tetapi riwayat lama masih bisa dilihat | tidak tercampur | kelas lama di "Arsip" |
| M6 | ingin berlatih untuk ujian | latihan mandiri tambahan di luar tugas, tidak terlihat pengajar | aman untuk salah | jalur mandiri tetap ada (riset 1) |

### Admin lembaga

| # | Saat… | Saya ingin… | Supaya… | Ukuran sukses |
|---|---|---|---|---|
| A1 | membeli lisensi | membayar untuk semua pengajar di prodi dan mendapat tagihan resmi | administrasi keuangan beres | invoice atas nama lembaga |
| A2 | awal semester | menambah/menghapus pengajar | lisensi terpakai tepat | daftar pengajar |
| A3 | audit internal | melihat dokumen privasi dan perjanjian pemrosesan data | patuh UU PDP | DPA tersedia |

Fitur tanpa JTBD yang **tidak** diusulkan: papan peringkat kelas (riset 1 bagian 7), obrolan kelas (WhatsApp sudah
dipakai), forum, unggah berkas tugas esai (di luar fokus faraidh).

---

## 4. HMW dan ide

Kriteria: **Paham**, **Dampak**, **Usaha**, **Risiko** (privasi/keamanan/pedagogi).

### HMW-1 Bergabung ke kelas dengan mudah tapi aman (G1, M1)

| Ide | Paham | Dampak | Usaha | Risiko |
|---|---|---|---|---|
| 1a. **Kode kelas** 6–7 karakter huruf+angka (pola Google Classroom) | ✓ | tinggi | kecil | rendah dengan batas laju (audit 8c butir 11) |
| 1b. **Tautan undangan** berisi kode | ✓ | tinggi | kecil | sama dengan 1a |
| 1c. Undang lewat email (daftar email mahasiswa) | ✓ | sedang | sedang (kirim email = prosesor baru) | menyimpan email yang belum mendaftar (UU PDP) |
| 1d. Permintaan gabung disetujui pengajar | ✓ | sedang | kecil | rendah |
| 1e. Impor daftar dari sistem akademik | ✗ | tinggi | besar (integrasi per kampus) | sedang |

[Fakta-sumber] Google Classroom memakai tiga jalan: kode 6–7 karakter, tautan, dan undangan email; kode bisa direset
pengajar ([Google: kode kelas](https://support.google.com/edu/classroom/answer/15605102),
[tautan](https://support.google.com/edu/classroom/answer/15604494),
[undangan email](https://support.google.com/edu/classroom/answer/15605645)).

**[Rekomendasi] 1a + 1b sekarang** (kode dan tautan, bisa direset dan dimatikan, opsional 1d untuk kelas tertutup).
1c menyusul saat SaaS lembaga. 1e tidak dibangun.

### HMW-2 Periode, banyak kelas, dan mengulang (M2, M5, G7)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| **2a. Kelas melekat pada satu periode** (label bebas + tanggal mulai/selesai). Sesudah tanggal selesai kelas otomatis masuk Arsip (bisa dibuka, tidak bisa diberi tugas baru). Mengulang = bergabung ke kelas periode baru; riwayat kelas lama terpisah | ✓ | tinggi | kecil |
| 2b. Satu kelas abadi, periode sebagai filter | sedang | sedang | sedang (nilai lintas periode tercampur) |
| 2c. Periode dikelola lembaga (kalender akademik pusat) | ✓ | tinggi untuk lembaga | sedang; menyusul bersama SaaS lembaga |

**[Rekomendasi] 2a** + "Salin ke periode baru" (menyalin tugas sebagai draf dengan benih soal baru). Satu pelajar boleh di
banyak kelas, termasuk dua kelas mata kuliah sama di periode berbeda; tidak boleh dua kali di kelas yang sama.

### HMW-3 Menugaskan dari ribuan sampai jutaan soal (G2, G3, G7, L1–L3)

| Ide | Paham | Dampak | Usaha | Risiko |
|---|---|---|---|---|
| 3a. Pengajar memilih dari bank soal manual | ✓ | rendah (L1: 23 soal) | kecil | jawaban beredar |
| **3b. Pola soal (generator)**: tim keilmuan menulis **pola** (susunan ahli waris dengan rentang jumlah, harta, keadaan), ditinjau **sekali per pola**; tiap soal = `pola + versi + benih`, dibangkitkan deterministik, kunci dari engine | ✓ (pengajar memilih pola dan jumlah) | **tinggi** | sedang | soal setara? (lihat 5) |
| 3c. Soal dibangkitkan AI bebas | ✓ | tinggi | sedang | **fikih tidak terjamin** (melanggar "fikih hanya dari KB"); ditolak |
| 3d. Pengajar menulis soal sendiri lewat kalkulator ("jadikan soal") | ✓ | sedang | kecil (kalkulator sudah ada) | kunci tetap dari engine; boleh, hanya untuk kelasnya |

**[Rekomendasi] 3b sebagai tulang punggung + 3d sebagai pelengkap; 3a tetap untuk soal kurasi.** Lihat bagian 5.

### HMW-4 Pengajar tahu di mana kelasnya salah (G4, G8)

[Fakta-sumber] LMS besar menyediakan analisis butir (tingkat kesulitan, daya beda) dan Gradescope menampilkan statistik
per soal dan per konsep yang ditandai pengajar
([Gradescope: statistik](https://guides.gradescope.com/hc/en-us/articles/22059823947917),
[Gradescope: "The average student does not exist"](https://medium.com/gradescope-blog/the-average-student-does-not-exist-bc885a818145),
[Blackboard: item analysis](https://help.blackboard.com/Learn/Instructor/Original/Tests_Pools_Surveys/Item_Analysis)).
Kebutuhan pengajar faraidh lebih spesifik: **langkah** mana yang salah.

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| **4a. Ringkasan tugas per kolom**: untuk tiap jenis kolom (Bagian, Asal masalah, Asal masalah akhir, pengali, jami'ah) persen pelajar yang benar; klik → daftar pelajar yang salah dan isiannya | ✓ | tinggi | kecil (data sudah ada di kejadian) |
| 4b. Analisis butir statistik (daya beda) | ✗ untuk sebagian pengajar | sedang | sedang |
| 4c. Kesalahan umum yang dikenali (mis. "lupa 'aul", "tashih belum dikali") | ✓ | tinggi | besar (butuh klasifikasi dari KB) |

**[Rekomendasi] 4a sekarang; 4c sebagai riset lanjutan bersama tim keilmuan.**

### HMW-5 Pengalaman di ruang kelas (G5)

| Ide | Paham | Dampak | Usaha | Risiko |
|---|---|---|---|---|
| 5a. Tidak ada; kelas hanya tugas | ✓ | rendah | nol | – |
| **5b. Sesi langsung**: pengajar memilih satu soal dan menampilkannya di proyektor ("layar pengajar"); pelajar membuka dari kelas di HP dan mengisi tabel; layar pengajar menampilkan **hasil kelas per kolom secara langsung, tanpa nama** (mis. "Asal masalah: 18 dari 25 benar"), lalu pengajar membuka pembahasan langkah demi langkah | ✓ | **tinggi** (retrieval + umpan langsung, riset 1 E1; diskusi berbasis kesalahan nyata) | sedang (Realtime) | rendah bila tanpa peringkat |
| 5c. Kuis bergaya permainan dengan peringkat tercepat (pola Kahoot/Wayground) | ✓ | sedang | sedang | **tekanan sosial**, menghargai kecepatan bukan ketepatan langkah (riset 1 P5, bagian 7) |

[Fakta-sumber] Wayground (Quizizz) dan Kahoot gratis untuk pengajar dengan batas peserta per sesi; lisensi sekolah
berbayar ([Wayground plans](https://wayground.com/home/en/plans),
[Kahoot EDU feature matrix](https://kahoot.com/feature-matrix-highered-edu/)).

**[Rekomendasi] 5b** sesudah tugas berjalan. Nama hanya terlihat di perangkat pengajar; layar proyektor hanya agregat.
Tidak ada peringkat kecepatan.

### HMW-6 Nilai yang bisa dipercaya dan dipakai (G6, G8, M4)

**[Rekomendasi]** Nilai dihitung server (spec 5.4), nilai efektif = koreksi pengajar terakhir atau hasil server
(audit 8c butir 5), rekap per kelas diekspor CSV/XLSX dengan kolom NIM (diisi pelajar di profil kelas, opsional),
pengajar memilih kapan nilai dan pembahasan terlihat pelajar (`segera` / `sesudah tenggat` / `saat dirilis`).

### Prinsip turunan

1. **Pola, bukan soal, yang ditinjau.** Tinjauan syariah terskala karena dilakukan per pola.
2. **Soal = alamat deterministik** (`pola@versi#benih`), tidak disimpan satu per satu.
3. **Kelas = periode.** Mengulang berarti kelas baru.
4. **Layar kelas netral**, sesi langsung tanpa peringkat.
5. **Pengajar melihat langkah, bukan hanya angka.**
6. **Fitur dibuka lewat satu fungsi hak akses**, bukan `if (pro)` tersebar (bagian 6).

---

## 5. Skala jutaan soal: pola soal deterministik

### 5a. Bukti luar

- [Fakta-sumber] Pembangkitan butir otomatis berbasis templat (*automatic item generation*) dipakai di asesmen skala
  besar; satu studi kasus 23 templat: 9 menghasilkan butir setara tanpa perubahan, 5 butuh revisi kecil, sisanya revisi
  besar; kesetaraan dicek dengan analisis DIF ([NYU IFP](https://ifp.nyu.edu/?p=1647275)). Varian butir bisa berbeda
  tingkat kesulitannya walau dari templat sama ([PMC10496230](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10496230/)).
- [Fakta-sumber] TemplateGSM membangkitkan lebih dari 7 juta soal matematika dari templat berparameter, memverifikasi
  tiap soal dengan eksekusi kode dan menolak yang gagal ([arXiv 2411.18104](https://pdf.arxiv.org/pdf/2411.18104)).
  Verifikasi simbolik/kode untuk soal isomorf: [ACL Anthology 2025](https://aclanthology.org/2025.emnlp-industry.97.pdf).

Kita punya keunggulan yang jarang: **pemeriksa jawaban sudah ada dan murni**, yaitu engine. Setiap soal hasil pola
diverifikasi engine (status OK, bukan `PERLU_INPUT`/`TIDAK_DIDUKUNG`/blocked, `susunTabelSoal` mendukung, batas B7
terpenuhi). Soal yang gagal tidak pernah tampil.

### 5b. Model [Rekomendasi]

```
PolaSoal (konten, ditinjau tim keilmuan, berversi seperti revisi lain):
  slug, versi, jenisSoal, bab, topik, tingkat, bobotXp
  susunan: daftar slot ahli waris dengan rentang jumlah (mis. ISTRI 1..4, ANAK_LK 0..3, ANAK_PR 1..3)
  syarat: batasan tambahan (mis. "harus terjadi 'aul", "tanpa tashih"), dinyatakan sebagai pemeriksaan atas keluaran engine
  harta: rentang dan satuan
  teks: templat kalimat soal (diksi)
  refs: rujukan KB yang diuji (wajib, pola revisi yang ada)

IdSoal = SlugSoalKurasi | `${slugPola}@${versi}#${benih}`
bangkitkanSoal(pola, benih) -> Kasus | GAGAL     // murni; acak dari benih (PRNG deterministik), tanpa Math.random
verifikasiSoal(pola, kasus) -> OK | alasan        // engine + susunTabelSoal + syarat pola
```

- **Tidak ada jutaan baris.** Yang disimpan hanya pola (puluhan sampai ratusan) dan kejadian yang menyebut `IdSoal`.
  "Jutaan soal" = ruang benih × pola, dibangkitkan saat dibutuhkan, di klien maupun server, hasil identik.
- **Katalog** untuk pengajar dan pelajar = daftar pola dengan metadata (bab, topik, jenis, tingkat), bukan daftar soal.
  Pencarian/saring pada pola. Pratinjau = beberapa benih contoh.
- **Soal serupa** (spec 4A.2) = pola sama, benih lain. Prasyarat "≥ 2 soal per topik" (riset 1 bagian 11) terpenuhi
  otomatis.
- **Variasi per pelajar** (G3): benih = turunan dari (tugas, pelajar), disimpan di `sesi_soal`. Pengajar memilih "soal
  sama untuk semua" atau "berbeda per pelajar". Karena varian bisa berbeda tingkat kesulitan (5a), statistik per pola dari
  kejadian dipakai untuk menandai pola yang variannya terlalu beragam.
- **Versi pola**: perubahan pola = versi baru; kejadian lama tetap merujuk versi lama (sama dengan revisi soal di spec 2).
- **Snapshot** (L2): bawa definisi pola (kecil), bukan soal. Soal kurasi yang sekarang tetap dibundel.
- **Letak kode**: generator dan verifikasi di paket bersama yang juga dipakai server (audit T1b), bukan di `apps/web`.
- **Fikih**: pola hanya menyusun **input** kasus; semua keputusan fikih tetap di engine. Pola yang menyentuh titik blocked
  ditolak oleh verifikasi (engine mengembalikan `TIDAK_DIDUKUNG`).

**Yang perlu diputuskan sekarang (murah)**: format `IdSoal` di kejadian percobaan memakai string yang bisa menampung
kedua bentuk (spec 2.1 `soalId`, bukan `soalSlug`). Generator sendiri dibangun "pada waktunya" (arahan pemilik).

---

## 6. Monetisasi

### 6a. Yang lumrah [Fakta-sumber]

| Model | Contoh | Catatan |
|---|---|---|
| **Freemium konsumen** | Duolingo: 11,5 juta pelanggan berbayar dari 135,3 juta MAU, penetrasi 9,0% MAU 12 bulan (Q3 2025, klaim perusahaan) | [Duolingo 8-K Q3 2025](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25share.htm). Penetrasi setinggi itu butuh skala dan pemasaran besar |
| Freemium + gratis untuk pendidik | Brilliant: Premium berbayar; pendidik K-12 dan murid mereka bisa mendapat Premium gratis | [Brilliant help](https://brilliant.org/help/pricing-and-plans/) |
| **Gratis untuk pengajar, berbayar untuk lembaga** | Wayground (Quizizz): Basic gratis untuk pengajar (batas peserta/aktivitas); paket sekolah/distrik dengan harga penawaran | [Wayground plans](https://wayground.com/home/en/plans) |
| Per pengajar (host) per bulan | Kahoot EDU: tarif per host, ditagih tahunan; Premium lembaga dengan harga khusus | [Kahoot EDU](https://kahoot.com/feature-matrix-highered-edu/), [Kahoot campus](https://kahoot.com/upgrade/premiumplus-campus/) |
| **Per pelajar per tahun (lembaga)** | Canvas: langganan berdasarkan jumlah mahasiswa, tarif per orang turun bila jumlah naik (harga penawaran); MoodleCloud mulai sekitar USD 130–200 per 50 pengguna per tahun (sumber pihak ketiga, tidak konsisten) | [Vendr: Canvas](https://www.vendr.com/marketplace/canvas), [Capterra: model harga LMS](https://www.capterra.com/resources/lms-pricing-models-guide/) |
| Paket akun untuk sekolah (Indonesia) | Ruangguru: paket sekolah per jumlah akun (30/100/300 akun, setahun), relationship manager untuk paket besar; harga lewat penjualan | [Ruangguru program sekolah](https://www.ruangguru.com/program/deep-learning), [harga konsumen](https://ruangguru.com/blog/perpanjang-paket-ruangbelajar) |

### 6b. Penilaian untuk kita [Dugaan]

- Pasar konsumen faraidh **kecil dan musiman** (orang membuka kalkulator saat ada kematian di keluarga). Memasang pagar
  bayar di kalkulator atau jawaban fikih **merusak kepercayaan** dan misi; juga rawan dikritik karena menyangkut urusan
  agama keluarga yang berduka.
- Pembeli yang realistis adalah **lembaga pendidikan** (prodi syariah, pesantren, MA) dan **pengajar** yang ingin
  menghemat waktu memeriksa. Nilai yang mereka bayar: soal tak terbatas yang setara, nilai otomatis per langkah, rekap,
  sesi langsung, dan kepatuhan privasi.
- Iklan pihak ketiga **ditolak**: mengganggu fokus belajar, menambah pelacak (bertentangan dengan minimisasi data UU PDP),
  dan konteks berduka.

### 6c. Usulan model [Rekomendasi, angka = USULAN untuk divalidasi]

| Paket | Untuk | Isi | Harga USULAN |
|---|---|---|---|
| **Gratis selamanya** | semua orang | Kalkulator lengkap, materi, latihan mandiri dengan pola soal (kuota wajar per hari, mis. 20 soal pola + semua soal kurasi), XP/streak | Rp0 |
| **Pengajar Gratis** | pengajar perorangan | 1 kelas aktif per periode, ≤ 40 pelajar, tugas dari soal kurasi + pola (soal sama untuk semua), rekap nilai dasar | Rp0 |
| **Pengajar Pro** | pengajar perorangan | kelas tak terbatas, variasi soal per pelajar, ringkasan per kolom, sesi langsung, ekspor nilai, salin ke periode baru | ±Rp150.000 per pengajar per semester |
| **Lembaga** | prodi/fakultas/pesantren | semua fitur Pro untuk semua pengajar lembaga, admin lembaga, invoice, DPA, dukungan prioritas, (nanti) periode terpusat | ±Rp15.000–25.000 per pelajar aktif per semester, minimum tertentu |
| (Opsional nanti) **Pelajar Plus** | pelajar mandiri berat | kuota soal pola tanpa batas, mode Tantangan (bila dibangun), riwayat lengkap | kecil, bulanan |

Alasan: mengikuti pola yang terbukti di pendidikan (gratis untuk pengajar → lembaga membayar), pelajar dalam kelas
**tidak pernah membayar** (yang membayar lembaga atau pengajar), dan misi publik (kalkulator + belajar) tetap gratis.
Angka harga hanya titik awal; uji kesediaan membayar dengan 5–8 pengajar dan 2 kaprodi (bagian 11).

**Pembayaran** [Dugaan]: lewat gerbang pembayaran Indonesia dengan halaman bayar milik penyedia (QRIS, virtual account);
aplikasi tidak pernah menyimpan data kartu. Lembaga dengan invoice dan transfer. Kepatuhan syariah akad dan transaksi
**di luar cakupan KB**; minta tinjauan ahli sebelum menetapkan skema.

### 6d. Dampak arsitektur yang murah disiapkan sekarang

- **Hak akses sebagai data**: satu fungsi `hakFitur(pengguna, fitur, konteks) -> boolean | batas` yang membaca paket aktif
  (pengguna atau lembaga). UI dan server memanggil fungsi yang sama; tidak ada `if (pro)` tersebar. Dibangun saat
  monetisasi; sekarang cukup **tidak menulis pagar fitur di tempat acak**.
- **Lembaga** sebagai pemilik opsional kelas (`kelas.lembaga_id` boleh kosong). RLS kelas sudah berbasis keanggotaan,
  jadi menambah lembaga tidak mengubah kebijakan pelajar.
- **Kuota** (mis. soal pola per hari untuk Gratis) dihitung server dari kejadian (spec 2), bukan penghitung klien.

---

## 7. Pengalaman kelas: alur utama [Rekomendasi]

### Pengajar
1. **Buat kelas**: nama mata kuliah, periode (label + tanggal), kelas paralel (A/B) opsional → kode dan tautan muncul.
2. **Bagikan** kode/tautan ke grup WA; pelajar yang bergabung muncul di daftar.
3. **Buat tugas**: pilih soal kurasi atau pola (saring bab/topik/jenis/tingkat), jumlah soal, mode (Latihan/Ujian),
   batas percobaan, tenggat, soal sama/berbeda per pelajar, kapan nilai dan pembahasan terlihat → Terbitkan.
4. **Pantau**: per tugas, status pelajar (Belum/Sedang/Sudah dikirim/Terlambat) dan ringkasan per kolom.
5. **Sesi langsung** di ruang kelas: pilih soal → layar pengajar (agregat tanpa nama) → bahas.
6. **Koreksi** nilai bila perlu (alasan wajib); **rilis** nilai.
7. **Akhir periode**: ekspor rekap; kelas otomatis Arsip; "Salin ke periode baru".

### Pelajar
1. Login Google → masukkan kode atau buka tautan → **Gabung** (≤ 2 ketukan).
2. Menu **Kelas** baru di navigasi (di samping Belajar): daftar kelas aktif, lalu **Tugas** lintas kelas terurut tenggat.
3. Buka tugas → aturan di atas → kerjakan di tabel faraidh (mode sesuai tugas) → **Kirim** (butuh daring; luring =
   "Belum terkirim").
4. **Nilai** per tugas dan rekap per kelas, pembahasan sesuai izin pengajar.
5. Kelas periode lalu di **Arsip**.

Status tugas pelajar (dari kejadian + kebijakan, fungsi murni): `belum` → `sedang` (ada sesi soal) → `dikirim` →
`dinilai`; `terlambat` bila dikirim sesudah tenggat dan kebijakan menerimanya; `tertutup` bila tenggat lewat tanpa kiriman.

---

## 8. Roadmap SaaS (urutan; akhir = alat ukur dan ticketing)

| Fase | Isi |
|---|---|
| R0 | Keamanan K1–K2 dan UU PDP dasar (audit 9c butir 1–3) |
| R1 | Model kejadian + `IdSoal` + penilaian murni bersama (spec P0–P1, S1–S6) |
| R2 | Mode Ujian, keterlibatan mandiri (spec P2, P2b) |
| R3 | Penilaian server, `sesi_soal`, edge function (spec P3) |
| R4 | **Kelas inti**: kelas + periode + kode/tautan + tugas dari soal kurasi + nilai + rekap/ekspor + arsip (spec P4) |
| R5 | **Pola soal (generator)** + verifikasi engine + katalog pola + variasi per pelajar; tinjauan pola oleh tim keilmuan |
| R6 | Sesi langsung (Realtime), ringkasan per kolom lanjutan, salin ke periode baru, asisten pengajar |
| R7 | **Lembaga dan monetisasi**: lembaga, admin lembaga, paket dan hak akses, pembayaran, invoice, DPA, undangan email |
| R8 | **Alat ukur keberhasilan**: dasbor internal untuk ukuran riset 1 bagian 8 (retensi, penyelesaian jujur, tanda menebak, kesalahan berulang per konsep) + ukuran bisnis (aktivasi pengajar, kelas aktif, pelajar aktif per lembaga, konversi Gratis → Pro, perpanjangan lembaga) |
| R9 | **Ticketing dan dukungan**: laporan masalah dalam aplikasi (dengan konteks layar, tanpa data kasus kecuali diizinkan), antrean tiket untuk tim, SLA per paket, basis pengetahuan; halaman status layanan |

R8 dan R9 di akhir sesuai arahan pemilik; data mentahnya (kejadian) sudah terkumpul sejak R1, jadi dasbor tidak kehilangan
riwayat.

---

## 9. Hubungan dengan dokumen lain

- Spec bagian 5 (kelas) diperbarui mengikuti bagian 3–7 riset ini (periode, gabung, tugas dari pola, variasi per pelajar,
  status tugas, nilai terlihat pelajar, sesi langsung, lembaga).
- Spec bagian 2: `soalSlug` → `soalId` (`IdSoal`).
- Audit bagian 8c (keamanan kelas) dan 9 (UU PDP) tetap berlaku; tambahan: NIM di profil kelas = data pribadi umum,
  opsional, hanya terlihat pengajar kelas itu.

---

## 10. Pilihan untuk pemilik

| # | Pilihan | Rekomendasi | Alternatif |
|---|---|---|---|
| O1 | Cara gabung | Kode + tautan (bisa direset/dimatikan), opsional persetujuan pengajar | + undangan email sekarang |
| O2 | Periode | Kelas melekat pada satu periode, arsip otomatis, salin ke periode baru | kelas abadi dengan filter periode |
| O3 | Sumber soal tugas | Soal kurasi + pola soal (generator) + "jadikan soal" dari kalkulator | soal kurasi saja sampai generator siap |
| O4 | Variasi soal per pelajar | Pilihan pengajar per tugas | selalu sama untuk semua |
| O5 | Pengalaman di kelas | Sesi langsung tanpa peringkat, agregat di proyektor | gaya Kahoot dengan peringkat kecepatan |
| O6 | Monetisasi | Gratis untuk publik dan pengajar dasar; Pengajar Pro; Lembaga per pelajar aktif; tanpa iklan | freemium konsumen sebagai sumber utama |
| O7 | Nama peran | Pengajar / Asisten / Pelajar | Dosen / Mahasiswa (khusus kampus) |

---

## 11. Asumsi dan cara menguji

Asumsi: pengajar faraidh memakai Google Classroom/LMS kampus dan grup WA; memeriksa latihan di kertas memakan waktu
besar; lembaga mau membayar untuk penilaian otomatis per langkah; pelajar dalam kelas tidak mau membayar.

Wawancara (30 menit, 5–8 pengajar dari kampus dan pesantren, 2 kaprodi):
1. Ceritakan minggu terakhir memberi latihan faraidh: dari membuat soal sampai memberi nilai. Bagian mana paling lama?
2. Bagaimana mahasiswa yang mengulang ditangani sekarang?
3. Tunjukkan contoh ringkasan per kolom (kertas): apakah ini mengubah apa yang dibahas di kelas?
4. Soal berbeda per mahasiswa: perlu? Khawatir soal tidak setara?
5. Siapa yang memutuskan membeli alat untuk kelas, dan berapa anggaran per semester yang wajar? (Tanyakan kebiasaan, bukan
   "maukah membayar X".)
6. Untuk kaprodi: dokumen apa yang dibutuhkan untuk pengadaan (invoice, kontrak, DPA)?

---

## Sumber

- Google Classroom: [kode kelas](https://support.google.com/edu/classroom/answer/15605102), [tautan kelas](https://support.google.com/edu/classroom/answer/15604494), [undangan email](https://support.google.com/edu/classroom/answer/15605645), [ringkasan untuk wali](https://support.google.com/edu/classroom/answer/6388126)
- Gradescope: [statistik soal](https://guides.gradescope.com/hc/en-us/articles/22059823947917), [The average student does not exist](https://medium.com/gradescope-blog/the-average-student-does-not-exist-bc885a818145)
- Blackboard: [Item analysis](https://help.blackboard.com/Learn/Instructor/Original/Tests_Pools_Surveys/Item_Analysis)
- Automatic item generation: [NYU IFP case study](https://ifp.nyu.edu/?p=1647275), [PMC10496230](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10496230/), [TemplateGSM, arXiv 2411.18104](https://pdf.arxiv.org/pdf/2411.18104), [CBIT, ACL Anthology 2025](https://aclanthology.org/2025.emnlp-industry.97.pdf)
- Duolingo: [Form 8-K Q3 2025](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25share.htm)
- Brilliant: [Pricing & Plans](https://brilliant.org/help/pricing-and-plans/)
- Wayground (Quizizz): [Plans](https://wayground.com/home/en/plans)
- Kahoot: [EDU feature matrix](https://kahoot.com/feature-matrix-highered-edu/), [Campus](https://kahoot.com/upgrade/premiumplus-campus/)
- LMS: [Vendr: Canvas](https://www.vendr.com/marketplace/canvas), [Capterra: LMS pricing models](https://www.capterra.com/resources/lms-pricing-models-guide/)
- Ruangguru: [program sekolah](https://www.ruangguru.com/program/deep-learning), [harga paket 2025/2026](https://ruangguru.com/blog/perpanjang-paket-ruangbelajar)
