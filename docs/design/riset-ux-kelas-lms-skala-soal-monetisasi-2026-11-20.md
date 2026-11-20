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
| **Pengajar Gratis** | pengajar perorangan | 1 kelas aktif per periode, ≤ 20 pelajar (keputusan pemilik, D2), tugas dari soal kurasi + pola (soal sama untuk semua), rekap nilai dasar | Rp0 |
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

---

## 12. Keputusan pemilik (2026-11-20, malam)

| # | Keputusan | Dampak |
|---|---|---|
| D1 | Setuju usulan O1–O7 (bagian 10), kecuali yang diubah di bawah | spec bagian 5 berlaku |
| D2 | **Pengajar Gratis maksimal 20 pelajar** (bukan 40) | tabel 6c |
| D3 | Sasaran utama **B2B** (pengajar Pro dan lembaga); publik tetap gratis | bagian 6 |
| D4 | **Skor parsial** untuk Latihan dalam tugas **dan** Ujian, berdasarkan kolom, baris, dan tahapan | bagian 13d; spec 5.1 |
| D5 | **Nama tingkat "Dicoba / Paham / Kuasai" tidak disetujui** | opsi di bagian 13e |
| D6 | **Batas waktu Ujian opsional**: diatur pengajar di tugas; di latihan mandiri pelajar boleh memasang sendiri untuk berpacu dengan waktu | spec 1.1, 5.1 |
| D7 | **Rekor dan lencana** dipertimbangkan; bisa diperlihatkan ke dosen, selain milik pribadi | bagian 13b |
| D8 | Variasi soal per pelajar diatur pengajar per tugas (sudah KL4) | – |
| D9 | **Akses mode pengajar lewat pengajuan dan verifikasi** (mis. surat keterangan dosen), bukan otomatis | bagian 13c |
| D10 | **Pengajar diberi data dan statistik** untuk memilih perlakuan (treatment) yang tepat: tingkat tiap pelajar, lalu **rekomendasi perlakuan** di tampilan pengajar (roadmap akhir) | bagian 13a; roadmap R8 |

Jawaban untuk pertanyaan D3: **ya, B2B.** Alasannya (bagian 6b): pasar konsumen faraidh kecil dan musiman, sedangkan
nilai yang dibayar (soal setara tanpa batas, nilai per langkah, data untuk mengajar) dirasakan pengajar dan lembaga.
Fitur publik yang gratis tetap penting sebagai pintu masuk: pengajar mengenal aplikasi dari kalkulator dan materinya,
pelajar sudah terbiasa sebelum kelas memakainya.

---

## 13. Tambahan riset

### 13a. Data dan statistik untuk pengajar (D10)

[Fakta-sumber] Tinjauan sistematis dasbor untuk pengajar menemukan sebagian besar dasbor hanya **meningkatkan
kesadaran** dan **jarang memberi wawasan yang bisa ditindaklanjuti**; pengajar kesulitan menafsirkan data yang tidak
dibingkai sebagai tindakan dan meminta dasbor yang menyarankan apa yang sebaiknya dilakukan; bukti dampak ke praktik
mengajar masih terbatas (Kaliisa, Jivet & Prinsloo 2023,
[ETHE](https://link.springer.com/10.1186/s41239-023-00394-6); studi CADA,
[PMC8982662](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8982662/)).

Artinya untuk kita [Dugaan]: dasbor angka saja tidak cukup; setiap tampilan data pengajar harus menjawab "lalu
saya harus apa?". Itu sejalan dengan D10.

| Lapis | Isi | Kapan |
|---|---|---|
| **Data per tugas** | status kiriman, ringkasan per kolom/tahapan, isian tiap pelajar (KL6) | R4 |
| **Tingkat tiap pelajar** | matriks pelajar × topik (tingkat kemahiran, nama di 13e), dihitung dari kejadian tugas; ringkasan per pelajar "Mahir 6 · Bisa 3 · Mulai 2 dari 11 topik yang sudah ditugaskan" (bukan satu angka tunggal yang menyesatkan); tren per pekan | R6 |
| **Kelompok kesalahan** | pelajar dikelompokkan menurut pola kesalahan yang sama (mis. "salah di Asal masalah akhir pada soal 'aul": 9 orang) | R6 |
| **Rekomendasi perlakuan** | per kelompok: materi yang sesuai bab/topik, tugas susulan dari pola yang sama, soal untuk sesi langsung berikutnya; pengajar memilih dan menerapkan dengan satu langkah ("Beri tugas susulan ke 9 pelajar ini") | R8 |

Aturan:
- Rekomendasi **berbasis aturan yang terbaca** dulu (kolom salah → topik → materi/pola), bukan model kotak hitam;
  setiap saran menampilkan alasannya ("karena 9 dari 25 salah di kolom …").
- **Pengajar yang memutuskan**; sistem tidak menerapkan perlakuan otomatis atau mengubah nilai (UU PDP Pasal 10, audit P9).
- Sumber data bawaan **hanya tugas kelas itu**. Kemajuan mandiri pelajar ikut dihitung **hanya bila pelajar
  mengizinkan per kelas** ("Bagikan kemajuan latihan mandiriku ke pengajar kelas ini"), bisa ditarik kapan saja, dan
  persetujuannya tercatat (audit 9c butir 2). Alasan: latihan mandiri adalah ruang aman untuk salah (riset 1 bagian 9).
- Tidak ada label bernada vonis ("lemah", "malas"); kategori menggambarkan langkah, bukan orang.

### 13b. Rekor dan lencana (D7)

[Fakta-sumber] Meta-analisis khusus lencana digital (Law dkk. 2024) menemukan pengaruh signifikan pada **capaian
belajar**, tetapi pengaruh pada **motivasi tidak meyakinkan**; efek lebih kuat di pendidikan tinggi dan untuk durasi
1–9 pekan ([Educational Technology & Society, DOAJ](https://www.doaj.org/article/098444d5c28243b0a504d88eceecd739)).
Tinjauan 23 studi: hasil beragam, sebagian tanpa manfaat atau negatif (Roy & Clark 2019, dikutip di sumber yang sama);
kerangka desain lencana: [PMC6658268](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6658268/).

| Ide | Paham | Dampak | Risiko |
|---|---|---|---|
| 13b-1. Lencana jumlah (100 soal, 30 hari streak) | ✓ | rendah | farming, mengukur aktivitas bukan paham (riset 1 HMW-3) |
| **13b-2. Lencana bukti**: diberikan saat syarat pemahaman terpenuhi, mis. tingkat tertinggi di semua topik satu bab ("Tuntas bab 'Aul"), atau benar tanpa dibuka di semua jenis soal khusus | ✓ | sedang–tinggi | rendah |
| **13b-3. Rekor**: nilai Ujian terbaik per bab/paket, waktu terbaik untuk Ujian berwaktu yang dipilih sendiri | ✓ | sedang | rendah bila pribadi |
| 13b-4. Lencana dan rekor tampil otomatis ke pengajar | ✓ | sedang | tekanan sosial, privasi |

**[Rekomendasi] 13b-2 + 13b-3.** Halaman pribadi **Pencapaian** (lencana bukti + rekor). Lencana **kebiasaan** (streak)
tetap pribadi dan tidak pernah tampil ke pengajar. Lencana bukti dan rekor **boleh diperlihatkan ke pengajar kelas
tertentu bila pelajar memilih** (persetujuan per kelas, sama dengan 13a). Lencana tidak memberi XP tambahan
(menghindari hadiah bertumpuk, riset 1 E6) dan tidak masuk nilai kelas (K9).

### 13c. Akses mode pengajar lewat verifikasi (D9)

Tujuan verifikasi [Dugaan, perlu dikonfirmasi pemilik]: (1) mencegah "kelas palsu" yang mengumpulkan data pelajar
(termasuk di bawah umur; UU PDP Pasal 25), (2) menjaga draf tugas dan statistik pelajar hanya untuk pengajar sungguhan,
(3) menjaga kualitas pemakai fitur berbayar. Catatan jujur: aturan penilaian dan kunci jawaban **tidak bisa
dirahasiakan sepenuhnya**, karena aplikasi ini juga kalkulator (audit 8c butir 12); yang dilindungi verifikasi adalah
data pelajar, draf tugas, dan statistik kelas.

| Ide | Paham | Dampak | Usaha | Risiko |
|---|---|---|---|---|
| 13c-1. Chat dulu ke admin (manual sepenuhnya) | ✓ | sedang | nol | tidak terskala; tidak tercatat |
| **13c-2. Formulir "Ajukan akses pengajar"**: nama, lembaga, jabatan/mata kuliah, tautan profil resmi (mis. PDDikti/SINTA/situs lembaga) dan **unggah surat keterangan atau kartu dosen**; ditinjau admin di portal; status Menunggu/Disetujui/Ditolak dengan alasan | ✓ | tinggi | sedang | dokumen = data pribadi (UU PDP) |
| **13c-3. Jalur cepat domain lembaga**: email Google berdomain lembaga mitra (mis. Google Workspace kampus) diverifikasi lebih cepat, tetap disetujui admin | ✓ | tinggi | kecil | domain mahasiswa dan dosen sering sama → tetap butuh persetujuan |
| 13c-4. Admin lembaga menyetujui pengajarnya sendiri | ✓ | tinggi | sedang | baru ada di paket Lembaga (R7) |

**[Rekomendasi] 13c-2 + 13c-3 sekarang (saat kelas dibangun), 13c-4 saat paket Lembaga.** Asisten tidak perlu
verifikasi: diundang pengajar per kelas dengan hak terbatas (spec 5.2).

Perlindungan dokumen verifikasi: disimpan di penyimpanan privat (hanya admin peninjau), tujuan tunggal (verifikasi),
dihapus **30 hari** sesudah keputusan (USULAN), persetujuan pemrosesan diminta di formulir (UU PDP Pasal 20–22), dan
yang disimpan sesudahnya hanya status + siapa menyetujui + kapan.

Hak "boleh membuat kelas" adalah **status akun** (disetujui sebagai pengajar), terpisah dari peran per kelas
(`anggota_kelas.peran`) dan dari peran portal konten (`peran_pengguna`); jangan memakai enum `peran` (audit T5).

### 13d. Skor parsial: kolom, baris, tahapan (D4)

[Fakta-sumber] Penilaian bertahap dengan **error carried forward** (kesalahan awal tidak dihukum lagi di langkah
berikutnya yang benar menurut nilai yang salah itu) lazim di ujian matematika/sains dan didukung alat e-asesmen
([Wikipedia: ECF](https://en.wikipedia.org/wiki/Error_Carried_Forward),
[Numbas: adaptive marking](https://numbas.org.uk/?p=864),
[Inspera: ECF](https://support.inspera.com/hc/en-us/articles/20617570619805)).

Model [Rekomendasi]:
- **Sel** = satu orang (baris) di satu kolom, ditambah **kepala kolom** (asal masalah/jami'ah) sebagai satu sel. Sel
  bersama dinilai sekali (B4). Sel jangkar dan sel terkunci tidak dinilai.
- **Skor kolom** = sel benar / sel dinilai di kolom itu (memakai aturan sebanding B6 butir 4).
- **Tahapan** = kelompok kolom menurut langkah pipeline (bab 00.2), mis. soal biasa: (1) **Bagian** (hajb dan furudh),
  (2) **Asal masalah** (ashl dan saham awal), (3) **Asal masalah akhir** ('aul/radd/tashih). Munasakhat menambah pengali
  dan jami'ah; taqdir menambah kolom per kemungkinan, pengali, jami'ah, mauquf. Pemetaan kolom → tahapan ditulis di
  `susunTabelSoal` (satu sumber), bukan di layar.
- **Skor butir** = Σ bobot tahapan × rata-rata skor kolom di tahapan itu. Bobot bawaan rata per tahapan; **pengajar boleh
  mengubah bobot tahapan per tugas** (mis. menekankan tashih).
- **Latihan dalam tugas**: skor diambil dari keadaan isian saat Periksa (semua kolom dinilai di belakang layar, walau
  layar Latihan tetap berhenti di kolom pertama yang salah), sesuai `ambilNilai` (pertama/terbaik/terakhir). Lihat
  jawaban → butir 0 kecuali pengajar mengizinkan.
- **Ujian**: skor dari satu Kirim, semua kolom.
- **Error carried forward** (opsi tugas, menyusul): kolom sesudahnya dinilai terhadap isian pelajar sendiri sejauh yang
  bisa dihitung dengan kaidah hisab murni [KH] (mis. asal masalah dari pecahan yang dipilih pelajar, saham = bagian ×
  asal masalah) di `packages/math`, **tanpa** keputusan fikih baru. Bawaan: mati (dinilai terhadap kunci).
- Pelajar melihat rincian skornya per tahapan sesudah nilai dirilis ("Bagian 4/4 · Asal masalah 3/4 · Asal masalah akhir
  1/4").

### 13e. Nama tingkat kemahiran (D5): opsi

Syarat dari UX: dipahami pemula tanpa penjelasan, tidak bernada vonis (dibaca pengajar juga, 13a), tidak bentrok dengan
"Tingkat" soal (dasar/menengah/sulit) dan "Peringkat".

| Opsi | Contoh | Kelebihan | Kekurangan |
|---|---|---|---|
| T1 | **Mulai · Bisa · Mahir** | pendek, jelas, positif | "Bisa" agak umum |
| T2 | **Mubtadi' · Mutawassith · Muntahi** | khas tradisi pesantren, cocok dengan dunia kitab | tidak semua pemula paham; perlu masuk glosarium dulu (bab 15) |
| T3 | Ikon **bintang 0–3** per topik + teks kecil "2 dari 3" | universal, ringkas di matriks pengajar | kurang bermakna tanpa teks; terasa seperti game |
| T4 | **Perlu latihan · Cukup · Kuat** | langsung menunjuk tindakan untuk pengajar | "Perlu latihan" terasa menilai bagi pelajar |
| T5 | Tanpa nama: **bilah bukti** "2 dari 3 bukti" | jujur dan terukur | lebih abstrak |

[Rekomendasi] **T1** untuk pelajar dan pengajar (satu istilah di dua sisi), dengan ikon tiga titik terisi sebagai
penanda visual di matriks pengajar. Syarat tiap tingkat tetap seperti spec 4A.3 (tingkat dua = benar tanpa dibuka;
tingkat tiga = bukti kedua di Ujian atau soal lain bertopik sama ≥ 1 hari kemudian). **Butuh pilihan pemilik.**

### 13f. Batas waktu (D6)

- Tugas: `batasWaktuMenit` opsional per tugas; dihitung **server** sejak `sesi_soal` dibuat; lewat batas → kiriman
  ditolak atau ditandai terlambat sesuai kebijakan. Aturan tampil sebelum mulai (M3).
- Mandiri: di mode Ujian pelajar boleh menyalakan **Pakai waktu** dan memilih durasi; hitung mundur hanya tampil bila
  dinyalakan (menjawab kekhawatiran riset 1 A8 bahwa hitung mundur yang dipaksakan menekan). Waktu terbaik masuk rekor
  pribadi (13b). XP tidak berubah karena waktu.

### 13g. Pengajar Gratis 20 pelajar (D2)

Tabel 6c diperbarui: **Pengajar Gratis = 1 kelas aktif per periode, maksimal 20 pelajar.** Cukup untuk mencoba dengan
satu kelompok kecil; kelas perkuliahan penuh (30–60) mendorong ke Pro atau Lembaga.

---

## 14. Keputusan pemilik lanjutan dan desain turunannya (2026-11-20, malam)

| # | Keputusan |
|---|---|
| D11 | Nama tiga tingkat kemahiran: **Beginner · Intermediate · Advanced** (pengecualian kosakata yang disengaja pemilik; tetap lewat diksi supaya bisa diterjemahkan) |
| D12 | Retensi dokumen verifikasi pengajar **30 hari** sesudah keputusan |
| D13 | Bobot tahapan bawaan **diatur sesuai effort** (13d), pengajar tetap boleh mengubah per tugas |
| D14 | **Lencana dan rekor selalu terlihat oleh pengajar** kelas yang diikuti, sebagai prestasi yang bisa dipertimbangkan dosen untuk nilai tambahan |
| D15 | Lencana berupa **penyelesaian dan kecepatan**, mis. "menyelesaikan semua soal bab 'aul", "mengerjakan soal faraidh dalam 1 menit"; bukan sekadar "tuntas bab" |
| D16 | **Isi soal tidak boleh bocor sebelum soal dibuka** (siapa saja ahli warisnya), supaya tidak bisa dikerjakan dulu di kalkulator |

### 14a. Audit: isi soal bocor sebelum dibuka (D16)

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| L8 | **Tinggi** | **Judul soal = daftar ahli waris** ("Istri, ayah, ibu, anak laki-laki", "Suami, ibu, saudari kandung, saudari sebapak"). Judul tampil di daftar soal dan di pratinjau Soal acak, dan bisa dicari. Pelajar bisa menghitung di kalkulator sebelum membuka soal; lencana kecepatan dan tugas berwaktu jadi tidak bermakna | [Fakta-kode] `apps/web/src/snapshot.json` (`soal_hitung.isi.judul`); `layar/belajar/DaftarSoalHitung.tsx:115` (`<b>{soal.judul}</b>`), `:39` (pencarian judul); `layar/belajar/SoalAcak.tsx:59` |
| L9 | Sedang | Topik sudah benar disembunyikan sampai soal selesai; pola yang sama perlu diterapkan ke judul | [Fakta-kode] `DaftarSoalHitung.tsx:118` (`selesai && soal.topik`) |

[Rekomendasi] **Aturan "buta sebelum dibuka"**:
- Sebelum soal dibuka, daftar soal, pratinjau acak, daftar tugas, dan notifikasi hanya menampilkan **identitas netral**:
  nomor/kode soal, bab, tingkat, jenis soal (biasa/munasakhat/…), dan status. **Tidak** menampilkan ahli waris, jumlah
  orang, harta, atau topik.
- Judul berisi ahli waris tampil **sesudah soal selesai atau dibuka jawabannya** (seperti topik sekarang). Pencarian
  sebelum selesai hanya pada bab/tingkat/jenis/kode.
- Waktu pengerjaan diukur **server** sejak soal dibuka (`sesi_soal` dibuat saat halaman soal dibuka, bukan saat Kirim).
  Karena ahli waris baru terlihat sesudah dibuka, menghitung di kalkulator ikut memakan waktu yang diukur.
- Untuk soal pola, judul dibangkitkan dari benih dan juga tunduk aturan ini.
- Pengajar tetap melihat isi lengkap saat menyusun tugas.

Batas jujur: sesudah dibuka, pelajar tetap bisa memindahkan kasus ke kalkulator di tab lain (audit 8c butir 12). Aturan
ini tidak mencegahnya, tetapi waktu yang terukur ikut termakan, jadi lencana kecepatan tetap bermakna.

### 14b. Lencana penyelesaian dan kecepatan (D14, D15)

Desain ini menggantikan rekomendasi 13b sejauh berbeda.

| Jenis | Contoh | Syarat (USULAN) | Catatan anti-curang |
|---|---|---|---|
| **Penyelesaian bab** | "Menyelesaikan semua soal bab 'Aul" | setiap soal kurasi bab itu **benar tanpa dibuka**; untuk bab yang memakai pola: setiap pola bab itu punya ≥ 1 soal benar tanpa dibuka | dihitung dari percobaan yang **dinilai server**; soal yang dibuka jawabannya tidak dihitung |
| **Kecepatan** | "Soal dasar dalam 1 menit" | benar penuh tanpa dibuka, **waktu server** dari soal dibuka sampai Kirim ≤ ambang per tingkat/jenis: dasar 1 menit, menengah 2 menit, sulit 3 menit; kasus khusus per jenis (ditetapkan dari data waktu nyata sesudah peluncuran) | hanya dalam mode **Ujian** (sekali kirim, tanpa umpan bertahap) dan **daring** (waktu server); berlaku "buta sebelum dibuka" (14a) |
| **Ketepatan** | "10 soal Ujian berturut-turut benar penuh" | dari Kirim Ujian berurutan | dinilai server |
| Rekor | nilai Ujian terbaik per bab, waktu tercepat per tingkat | dari percobaan dinilai server | – |
| Kebiasaan | streak | tetap pribadi | tidak tampil ke pengajar |

Penilaian kritis atas D15 [Dugaan]: lencana volume dan kecepatan berisiko mendorong farming dan menebak cepat (riset 1
HMW-3, E4). Risiko itu dikendalikan dengan tiga syarat di atas: **tanpa dibuka**, **Ujian** (tidak bisa
menebak-periksa-ulang), dan **dinilai server**. Lencana tidak memberi XP tambahan.

**Terlihat pengajar (D14)**: halaman pelajar di kelas menampilkan lencana dan rekornya. Karena ini mencakup prestasi dari
latihan mandiri, saat bergabung ke kelas pelajar diberi tahu dengan jelas: "Pengajar kelas ini dapat melihat lencana dan
rekormu" (UU PDP Pasal 21; persetujuan tercatat saat gabung, Pasal 22). Kemajuan mandiri lain (isian, kesalahan,
tingkat per topik dari latihan mandiri) **tetap** hanya terlihat dengan izin pelajar (13a).

**Nilai tambahan dari dosen**: pengajar boleh memberi nilai tambahan per pelajar di kelas dengan alasan (mis. "lencana
Tuntas 'Aul"), dicatat append-only seperti koreksi nilai dan ikut di rekap/ekspor sebagai kolom terpisah.

Syarat teknis: lencana yang tampil ke pengajar hanya dari percobaan **yang dinilai ulang server**. Model kejadian
(spec 2) memungkinkan ini tanpa mengubah alur luring: setiap kejadian mandiri yang tersinkron membawa isian, jangkar,
dan versi, sehingga server bisa menilainya ulang saat diterima. Lencana kecepatan butuh waktu mulai dari server, jadi
hanya bisa didapat saat daring.

### 14c. Bobot tahapan sesuai effort (D13)

Satu aturan untuk semua jenis soal, supaya mudah dijelaskan ke pengajar:

| Tahapan | Isi | Bobot bawaan | Alasan effort |
|---|---|---|---|
| **Keputusan fikih** | kolom Bagian / Didudukkan sebagai / Bagian per kemungkinan / keputusan gharqa | **40%** | inti mata kuliah: hajb, furudh, ashabah, ta'shib; satu keputusan per ahli waris, kesalahan konsep paling sering di sini |
| **Hisab dasar** | asal masalah dan saham awal (per mas'alah atau per kemungkinan) | **30%** | prosedur hisab [KH] per kolom |
| **Penyatuan** | asal masalah akhir ('aul/radd/tashih), pengali, jami'ah, mauquf | **30%** | langkah paling panjang dan rawan salah hitung, tetapi turunan dari dua tahapan sebelumnya |

- Di dalam satu tahapan, bobot dibagi rata antarkolom yang dinilai.
- Tahapan yang tidak ada pada suatu jenis soal → bobotnya dibagi proporsional ke tahapan lain (mis. dzawil arham tanpa
  penyatuan → 57% / 43%).
- Pengajar boleh mengubah per tugas; bawaan ditampilkan sebagai "40 · 30 · 30".

### 14d. Nama tingkat (D11)

`Beginner · Intermediate · Advanced` dipakai untuk pelajar dan pengajar. Di kode: `tingkatKemahiran: 1 | 2 | 3` (nama
Indonesia di kode menurut CLAUDE.md; label layar dari diksi). Tidak bentrok dengan "Tingkat" soal (dasar/menengah/sulit),
tetapi keduanya bisa tampil berdampingan; di layar, label kemahiran selalu didahului kata yang jelas (mis. "Kemahiranmu:
Intermediate") supaya tidak tertukar.

---

## 15. Keputusan pemilik lanjutan: level ala placement test, tes awal/akhir, rekor, pantauan periode (2026-11-20)

| # | Keputusan |
|---|---|
| D17 | Selain kemahiran per topik (Beginner · Intermediate · Advanced), ada **level keseluruhan ala placement test bahasa Inggris** (A1, A2, B1, … ) dengan **kriteria dan indikator** yang jelas |
| D18 | Ada **tes awal (pre-test) dan tes akhir (post-test)** |
| D19 | Rekor "benar berturut-turut" harus besar (mis. **20**), bukan 3, karena ini rekor |
| D20 | Dosen bisa memantau **siapa yang sering mengerjakan latihan di luar tugas**, selama dikerjakan **dalam periode kelas**; **rekor dan lencana yang tampil di kelas harus dicapai dalam periode itu** |
| D21 | Ambang lencana kecepatan harus **benar-benar ekstrem** |

### 15a. Level A1–C2 dengan kriteria dan indikator (D17)

Acuan bentuk: kerangka CEFR memakai enam level A1–C2 dengan deskriptor "dapat melakukan …". Kita meniru **bentuknya**
(enam level kumulatif + indikator yang bisa diamati), **bukan isinya**. Urutan level mengikuti struktur bab KB; urutan
ini adalah **keputusan pedagogis yang wajib divalidasi tim keilmuan** (bukan aturan fikih, tetapi tetap tidak dikarang
sendiri).

| Level | Kriteria (dapat …) | Cakupan bab KB (USULAN, validasi tim keilmuan) |
|---|---|---|
| **A1** | mengenali ahli waris dan bagian pasti (furudh) pada kasus sederhana tanpa hajb rumit | 03, 04 |
| **A2** | menentukan ashabah dan hajb dengan benar | 05, 06 |
| **B1** | menghitung asal masalah, 'aul, dan radd; menangani masalah khusus furudh | 07, 09 |
| **B2** | melakukan tashih; menyelesaikan jadd wal ikhwah | 08, 10 |
| **C1** | menyelesaikan munasakhat dan dzawil arham | 12, 14 |
| **C2** | menyelesaikan kasus khusus (haml, mafqud, khuntsa, gharqa) | 13a–13d |

**Indikator** (fungsi murni atas kejadian yang dinilai server, USULAN):
- Pelajar berada di level L bila **semua topik level ≤ L** minimal **Intermediate** dan **≥ 70% topik level L**
  **Advanced** (kemahiran per topik, spec 4A.3).
- Turun level hanya bila kemahiran topik turun (salah di Ujian sesudah Advanced), tidak karena tidak aktif.
- Setiap level menampilkan indikatornya ke pelajar dan pengajar ("B1: 5 dari 7 topik Advanced; perlu 'aul dan radd").

Hubungan dua skala: **kemahiran** per topik (Beginner/Intermediate/Advanced) adalah bahan; **level** A1–C2 adalah
ringkasan keseluruhan pelajar. Pengajar melihat keduanya (spec 5.4c).

**Placement test** (mandiri, opsional): 10–15 soal Ujian, mulai di B1, naik bila benar penuh dan turun bila tidak
(tangga sederhana), hasil = level awal. Soal dari pola (benih acak), buta sebelum dibuka (14a).

### 15b. Tes awal dan tes akhir (D18)

- Pengajar membuat **Tes awal** di awal periode dan **Tes akhir** di akhir periode dari **cetak biru yang sama** (daftar
  pola + jumlah soal per pola), dengan **benih berbeda**, sehingga soalnya setara tapi tidak sama (pola soal, bagian 5).
- Mode Ujian, satu kali, skor parsial (13d), batas waktu opsional.
- Laporan per pelajar dan per kelas: skor awal, skor akhir, level awal dan akhir, dan **gain ternormalisasi**
  `g = (akhir − awal) / (100 − awal)` (ukuran yang lazim dipakai untuk membandingkan peningkatan pre/post; Hake 1998).
  Per kolom/tahapan juga, supaya pengajar tahu langkah mana yang paling meningkat.
- Tes awal/akhir **tidak memberi XP dan tidak masuk lencana** (supaya diukur apa adanya); nilai masuk kelas hanya bila
  pengajar menghendaki.
- Data ini juga menjadi bahan **alat ukur keberhasilan** (R8): peningkatan nyata per kelas dan per lembaga.

### 15c. Rekor dan lencana (D19, D21)

- **Rekor beruntun**: lencana di **20**, **50**, dan **100** Ujian berturut-turut benar penuh tanpa dibuka (salah satu
  memutus rangkaian). Hanya dari percobaan yang dinilai server.
- **Kecepatan ekstrem**:
  - Ambang sementara sebelum ada data (USULAN): soal biasa **dasar ≤ 30 detik, menengah ≤ 45 detik, sulit ≤ 60 detik**,
    diukur server sejak soal dibuka sampai Kirim, benar penuh, mode Ujian. Perkiraan dasar: soal dasar 4 ahli waris ≈ 4
    pilihan + ±10 angka; orang yang langsung tahu jawabannya butuh ±25 detik hanya untuk mengisi, jadi 30 detik adalah
    batas yang hanya dicapai yang benar-benar menguasai.
  - Sesudah peluncuran: ambang = **persentil 1** waktu benar penuh per tingkat/jenis soal, dihitung ulang tiap periode,
    tidak pernah di bawah **batas masuk akal** (waktu fisik minimum mengisi semua kotak). Waktu di bawah batas masuk akal
    **tidak otomatis mendapat lencana**, tetapi ditandai untuk ditinjau (indikasi otomatisasi).
  - Kasus khusus (munasakhat, taqdir, dst.) memakai ambang dari data saja.

### 15d. Pantauan pengajar dalam periode (D20)

Keputusan ini **menggantikan** aturan 13a bahwa kemajuan mandiri hanya terlihat dengan izin pelajar, untuk data
berikut:
- Per pelajar, **dalam rentang periode kelas** (`periode_mulai`–`periode_selesai`, waktu server): jumlah soal latihan
  di luar tugas, hari aktif, perubahan level/kemahiran, lencana dan rekor yang **dicapai dalam periode itu**.
- **Tidak** termasuk isian dan kesalahan rinci latihan mandiri (minimisasi data, UU PDP Pasal 16 ayat (2)); itu tetap
  hanya dengan izin pelajar.
- Halaman Pencapaian pribadi tetap menampilkan semua waktu; tampilan kelas hanya periode itu.
- Diberitahukan jelas saat bergabung: "Pengajar kelas ini dapat melihat aktivitas latihanmu selama periode kelas
  (jumlah soal, hari aktif, level, lencana, dan rekor)"; persetujuan tercatat (Pasal 21–22). Bila pelajar ikut dua
  kelas di periode yang sama, kedua pengajar melihat data yang sama untuk periode masing-masing.
