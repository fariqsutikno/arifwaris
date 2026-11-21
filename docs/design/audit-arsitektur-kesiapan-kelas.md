# Audit arsitektur: kesiapan untuk fitur kelas

Tanggal: 2026-11-20. Basis: branch `main` lokal (commit `4862fc3`). Tanpa perubahan kode.
Pendamping: `spec-model-percobaan-dan-penilaian.md` (bagian dan butir S1–S6 dirujuk dari sana).

**Fitur kelas** yang diaudit: pengajar membuat kelas, pelajar bergabung, pengajar menerbitkan penugasan soal tabel
faraidh dengan kebijakan (mode, batas percobaan, tenggat, cara ambil nilai), nilai dihitung server, pengajar melihat
nilai kelasnya.

Penanda: **[Fakta]** = terbaca di kode dengan `file:baris`. **[Fakta-prod]** = dibaca dari proyek Supabase produksi
(penasihat keamanan Supabase, daftar migrasi, dan kueri metadata hanya-baca; tidak ada data pribadi yang dibaca, hanya
hitungan agregat). **[Dugaan]** = kesimpulan yang belum diverifikasi dengan menjalankan sesuatu; ditulis apa yang perlu
dicek.

Pembaruan 2026-11-20 (sore): ditambah bagian 7 (sekarang atau nanti: mana yang lebih murah), 8 (keamanan: IDOR dan
celah lain, termasuk pencatatan nilai), dan 9 (privasi dan UU PDP). **Dua temuan keamanan di produksi (K1, K2) sebaiknya
ditangani hari ini, sebelum pekerjaan lain.**

---

## 1. Ringkasan

Fondasi yang **sudah siap**: engine murni dan deterministik; konten berversi per revisi dengan revisi beku; pola RLS
"baris milik sendiri" + fungsi `security definer` yang rapi dan teruji pgTAP; `log_kegiatan` sudah append-only dengan
waktu server; XP/streak dihitung di server.

Yang **menghambat kelas** ada lima (blocker, B):

1. Logika yang harus dijalankan server (pemilihan orkestrator, kunci dan penilaian tabel) tinggal di `apps/web` dan
   menyentuh diksi/`localStorage` (T1).
2. Percobaan tidak dicatat sebagai kejadian lengkap: tanpa isian, jangkar, mode, revisi soal, versi engine (T7, T8, T9).
3. Tidak ada identitas kelas/pengajar, dan enum `peran` yang ada **tidak boleh** dipakai untuknya (T5).
4. Edge function belum pernah mengimpor paket workspace; cara menjalankan engine di Supabase belum terbukti (T14).
5. Tidak ada mekanisme nilai server; semua putusan benar/salah berasal dari klien (T2 adalah gejala yang sama).

Yang **perlu diperbaiki sekarang walau tanpa kelas**: XP bisa dipalsukan lewat insert langsung (T2) dan diperoleh
sesudah membuka jawaban (T3).

---

## 2. Peta modul sekarang

```
packages/math     ← murni [Fakta: packages/math/src/index.ts:1]
packages/engine   ← murni, bergantung math; tidak ada Date/Math.random di src [Fakta: grep, lihat T15]
packages/explain  ← murni
packages/content  ← tipe & skema konten (zod), bank soal
packages/data     ← antarmuka repositori + implementasi Supabase + snapshot
apps/web
  jalankan.ts            pemilihan orkestrator engine            ← seharusnya bersama (T1)
  hasil/tabelLatihan.ts  kunci + penilaian tabel                 ← seharusnya bersama (T1)
  progres.ts / tersimpan.ts / riwayat.ts / preferensi.ts         ← penyimpanan lokal (localStorage via penyimpanan.ts)
  akun/antrean.ts, sinkron.ts, gabung.ts                         ← sinkron ke @waris/data
supabase/migrations       skema + RLS + fungsi XP/streak
supabase/functions        ai-bantu, kirim-push (Deno)
```

Arah ketergantungan antar paket sesuai CLAUDE.md (math → engine satu arah; content/explain berdiri sendiri). Kebocoran
ada **di dalam `apps/web`**: modul yang seharusnya murni mengimpor modul UI/penyimpanan.

---

## 3. Temuan

Skala: Dampak (D) dan Biaya (B) 1–3. Prioritas = D tinggi dan B rendah dulu. Kolom "Kelas": **Blocker** = kelas tidak bisa
dibangun benar tanpa ini; **Sebelum** = sebaiknya sebelum kelas; **Boleh tunggu**.

| Kode | Temuan | D | B | Kelas |
|---|---|---|---|---|
| T1 | Penilaian dan dispatcher engine di `apps/web`, menyentuh diksi/localStorage | 3 | 2 | **Blocker** |
| T2 | `log_kegiatan.benar` ditulis klien → XP dan papan peringkat bisa dipalsukan | 3 | 2 | Sebelum (perbaiki sekarang) |
| T3 | XP bisa didapat sesudah Lihat jawaban; membuka tanpa mencoba tidak tercatat | 2 | 1 | Sebelum (perbaiki sekarang) |
| T4 | `progres_latihan.benar` = percobaan terakhir; gabung memakai maks jumlah coba | 2 | 1 | Sebelum |
| T5 | Tidak ada model kelas/pengajar; enum `peran` milik portal dan terikat RLS konten | 3 | 2 | **Blocker** (pekerjaan baru) |
| T6 | `baca_kasus_dibagikan` (`security definer`): aman, dua catatan kecil | 1 | 1 | Boleh tunggu |
| T7 | Identitas soal kehilangan `revisiId` di web; kunci bergantung versi engine | 3 | 1 | **Blocker** |
| T8 | Jangkar dipilih `Math.random` di komponen dan tidak dicatat | 2 | 1 | **Blocker** |
| T9 | `VERSI_KB` tetap `'1.0.0-dev'`; tidak ada versi engine di hasil | 2 | 1 | **Blocker** (murah) |
| T10 | Antrean menimpa per kunci; cocok untuk keadaan, bukan kejadian | 2 | 1 | Sebelum |
| T11 | "Terbaru menang" memakai jam perangkat; perangkat berjam maju mengunci baris | 2 | 2 | Boleh tunggu |
| T12 | XP dihitung ulang atas seluruh log tiap panggilan; bobot dibaca dari revisi terbit saat ini | 2 | 2 | Sebelum (bersama spec P1) |
| T13 | Rekor kuis dan jejak aktivitas hanya lokal | 1 | 1 | Boleh tunggu |
| T14 | Edge function belum pernah memakai paket workspace | 3 | 2 | **Blocker** (perlu spike) |
| T15 | Determinisme engine dan uji: siap; perlu fixture bersama SQL/TS | 2 | 1 | Sebelum |
| T16 | `layar/Hasil.tsx` 510 baris memegang alur latihan, XP, dialog, simpan | 1 | 2 | Boleh tunggu |

### T1. Logika penilaian dan dispatcher engine tinggal di web dan tidak murni

- [Fakta] `apps/web/src/hasil/tabelLatihan.ts:7-8` mengimpor `namaOrang` dari `../format` dan `angkaLatin` dari
  `../terjemah`. `apps/web/src/terjemah.ts:6-7` mengimpor `konten/sumber` (snapshot diksi) dan `preferensi`
  (`localStorage`). Jadi `susunTabelSoal`/`nilaiTabel` tidak bisa diimpor di server tanpa ikut menarik diksi dan
  penyimpanan peramban, walau logikanya sendiri murni.
- [Fakta] Pemilihan orkestrator (gharqa → taqdir → munasakhat → biasa/dzawil arham) ada di `apps/web/src/jalankan.ts`
  (komentar baris 2), begitu pula `keInputEngine` (baris 24-33). Server yang menilai penugasan harus memakai urutan yang
  persis sama; salinan kedua akan menyimpang.
- Dampak: server tidak bisa menilai dengan kode yang sama dengan klien → nilai kelas tidak bisa dipercaya atau aturan
  diduplikasi.
- Perbaikan: (a) sekarang, S2 di spec: oper nama dan `angkaLatin` dari luar sehingga `tabelLatihan.ts` hanya bergantung
  pada `@waris/engine`; (b) saat P3, pindahkan `jalankan.ts` (tanpa tipe tampilan) dan `tabelLatihan.ts` ke satu paket
  bersama (usulan nama `packages/latihan`, karena isinya penilaian, bukan fikih; engine tetap hanya fikih). `jalankan.ts`
  boleh juga masuk `packages/engine` sebagai orkestrator teratas, karena isinya keputusan alur bab 12–14; pilih satu
  (pertanyaan P3 di bagian 6).

### T2. XP dan papan peringkat bisa dipalsukan

- [Fakta] `supabase/migrations/20260927000003_akun.sql:39`: `grant insert (id, jenis, slug, benar) on log_kegiatan to
  authenticated`. Kebijakan insert hanya memeriksa `user_id = auth.uid()` (baris 35).
- [Fakta] `20260927000006_peringkat.sql:84-90`: XP konten diberikan pada log `benar` pertama per `(jenis, slug)` yang
  terbit.
- Akibat: pengguna login mana pun bisa memanggil REST `log_kegiatan` dengan `benar: true` untuk setiap slug terbit dan
  memperoleh XP maksimum, lalu naik ke puncak papan peringkat publik (`papan_peringkat` di-grant ke `anon`).
- Untuk kelas: tidak langsung blocker bila nilai kelas dinilai server (spec K10), tetapi pola yang sama (klien
  melaporkan benar) **tidak boleh** dipakai untuk penugasan.
- Perbaikan bertahap: (1) murah: batasi laju (mis. trigger menolak > N log per menit per pengguna) dan cocokkan dengan
  `progres_latihan`; ini hanya menyulitkan. (2) benar: XP soal tabel dihitung dari `percobaan_soal.hasil_kolom` (selalu hitungan server)
  (spec P1/P3, pertanyaan spec 6). Kuis konsep pilihan ganda bisa dinilai di SQL (`indeksBenar` ada di revisi) bila
  klien mengirim `jawaban` alih-alih `benar`.

### T3. Celah XP sesudah Lihat jawaban

- [Fakta] `apps/web/src/layar/Hasil.tsx:164`: `bukaJawaban` memanggil `saatDikerjakan(false)` hanya bila `sudahMencoba`;
  membuka jawaban tanpa mencoba tidak mencatat apa pun.
- [Fakta] `peristiwa_xp` (`20260927000006_peringkat.sql:84-90`) tidak melihat log `benar=false` sebelumnya.
- Akibat: buka jawaban (tanpa mencoba: tak tercatat; atau sesudah mencoba: `benar=false`) → buka soal yang sama lagi →
  isi kunci yang tadi dilihat → `benar=true` → XP penuh. Ini bertentangan dengan keputusan "Lihat jawaban = 0 XP".
- Perbaikan: S5 di spec (catat lihat jawaban selalu) + aturan XP spec 3.1 butir 2 (lihat jawaban sebelum benar pertama =
  0 XP selamanya). Di skema lama: tambah `jenis = 'soal'` dengan penanda `dibuka` di `log_kegiatan` (kolom baru
  `dibuka boolean`) bila P1 belum dekat.

### T4. Keadaan latihan yang mundur

- [Fakta] `apps/web/src/progres.ts:48-53`: `catatLatihan` menulis `benar` dari percobaan terakhir; soal yang pernah benar
  lalu salah kembali tidak bercentang.
- [Fakta] `apps/web/src/akun/gabung.ts:16`: penggabungan dua perangkat mengambil `Math.max(jumlahCoba)`, bukan jumlah.
- Perbaikan: S5 (benar tidak pernah mundur). Jumlah coba diturunkan dari kejadian (spec 2.3).

### T5. Identitas dan peran: belum ada pengajar/pelajar, dan jangan memakai enum `peran`

- [Fakta] `20260926000001_konten.sql:7`: `create type peran as enum ('admin', 'penulis', 'reviewer')`; `peran_saya()`
  (baris 78-80) dipakai RLS konten.
- [Fakta] `20260926000004_rls.sql:20`: `baca on entri_konten ... using (revisi_terbit_id is not null or peran_saya() is
  not null)`; pola yang sama untuk `revisi`, `diksi`, `revisi_diksi`. Artinya **peran apa pun** di `peran_pengguna` bisa
  membaca draf konten.
- Akibat bila `pengajar` ditambahkan ke enum: semua pengajar bisa membaca draf soal dan materi yang belum ditinjau,
  termasuk kunci soal yang belum terbit.
- Perbaikan: peran kelas di `anggota_kelas.peran` (spec 5.1), fungsi `peran_di_kelas(kelas_id)` terpisah. Siapa boleh
  membuat kelas: pertanyaan spec 5.
- Akun: [Fakta] login hanya Google (spec akun "Bukan tujuan"); cukup untuk kelas. Nama tampilan ada di `profil`
  (`20260927000006_peringkat.sql:7-13`), bisa dipakai di daftar anggota.

### T6. `baca_kasus_dibagikan` dan model berbagi tautan

[Fakta] `20261003000001_bagikan_kasus.sql:25-45`. Diperiksa:
- `security definer` dengan `set search_path = public` (aman dari pembajakan search_path); `revoke ... from public`
  lalu grant eksplisit ke `anon, authenticated` (baris 44-45). Baik.
- Tabel tidak dibuka ke `anon` (baris 22); pembacaan hanya per slug, jadi daftar kasus tidak bisa disisir. Slug acak 8
  karakter base36 (`apps/web/src/layar/DialogBagikan.tsx:19`), ±2,8 × 10¹² kemungkinan. Baik.
- Kasus privat orang lain dilaporkan `tidak_ada` (baris 32-34). Baik.
- Catatan 1 [Fakta]: kasus berakses `email` membalas `tidak_boleh`/`perlu_masuk` (baris 38-40), jadi keberadaan slug
  itu terungkap. Dampak kecil (isi tidak bocor); diterima, tetapi sebaiknya tercatat sebagai keputusan.
- Catatan 2: pemeriksaan akses `email` membandingkan `auth.jwt() ->> 'email'` (baris 29, 37). Ini **bukan lagi
  catatan kecil**: produksi punya identitas penyedia `email` yang dikonfirmasi otomatis. Lihat temuan keamanan **K1**
  (bagian 8).
- Untuk kelas: model berbagi kasus **tidak cocok** untuk penugasan (ia membagikan kasus hitungan pemilik, bukan soal
  dengan kunci); jangan dipakai ulang. Polanya (fungsi `security definer` per pintu, RLS milik sendiri) dipakai ulang.

### T7. Identitas dan versi soal

- [Fakta] Revisi konten beku sesudah diajukan (`20260926000001_konten.sql:104-114`, trigger `bekukan`); `KontenTerbit`
  membawa `revisiId` (`packages/data/src/antarmuka.ts:7-9`).
- [Fakta] Web membuangnya: `cariSoalHitung` mengembalikan `SoalHitung` (isi saja) (`apps/web/src/konten/sumber.ts:39`),
  dan pencatatan memakai `soal.kode` saja (`apps/web/src/Aplikasi.tsx:250-253`).
- [Fakta] Kunci tabel tidak tersimpan di konten; diturunkan engine saat dibuka (spec B1). Jadi kunci = f(revisi soal,
  versi engine). Keduanya harus tercatat untuk menilai ulang.
- [Fakta] `versi_konten` hanya satu penghitung global (`20260926000001_konten.sql:16-20`): cukup untuk sinkron, tidak
  cukup sebagai versi soal.
- Perbaikan: bawa `revisiId` bersama soal sampai ke Hasil dan kejadian (spec S4). Penugasan mengunci revisi (spec 5.1).

### T8. Jangkar acak tidak tercatat

- [Fakta] `apps/web/src/hasil/TabelLatihan.tsx:39`: `useState(() => pilihJangkar(tabel, Math.random))`. `pilihJangkar`
  sendiri sudah menerima `acak` tersuntik (`tabelLatihan.ts:86`), jadi perbaikannya kecil.
- Jangkar mengubah penilaian (kepala kolom berjangkar harus persis sama, `tabelLatihan.ts:128`), jadi tanpa jangkar
  tercatat isian tidak bisa dinilai ulang dan klien bisa memilih jangkar sendiri.
- Perbaikan: S3 (jangkar jadi prop, dicatat di kejadian); penugasan: jangkar dari server (spec 5.4).

### T9. Versi engine/KB

- [Fakta] `apps/web/src/jalankan.ts:11`: `const VERSI_KB = '1.0.0-dev'`, diteruskan ke `InputEngine.versiKb` (baris 31).
  Nilainya tidak pernah berubah, jadi tidak bisa membedakan hasil sebelum/sesudah perubahan engine (mis. E2 mengubah kunci
  haml [SYF]).
- Perbaikan: S6. Versi diambil saat build (versi `package.json` engine + hash commit pendek), satu konstanta yang
  diekspor engine; web dan edge function memakai yang sama.

### T10. Antrean sinkron: keadaan vs kejadian

- [Fakta] `apps/web/src/akun/antrean.ts:33-40`: entri baru membuang entri lama berkunci sama. Benar untuk keadaan
  (`tersimpan`, `latihan`), dan `kegiatan` sudah berkunci id sendiri (baris 98) sehingga tidak saling menimpa.
- [Fakta] Antrean berhenti di kegagalan pertama untuk menjaga urutan (baris 59-81). Satu entri yang selalu ditolak server
  (mis. melanggar `check`) akan **menahan semua entri sesudahnya selamanya**. [Dugaan] belum ada penanganan entri
  "racun"; perlu dicek apakah ada galat permanen yang bisa terjadi. Untuk kejadian percobaan (ukuran dibatasi `check`)
  risikonya naik.
- [Fakta] `antre` tidak melakukan apa pun bila perangkat belum memegang akun (baris 34). Percobaan sebelum login tidak
  terkirim, tetapi digabung saat login lewat `gabung` (hanya keadaan, bukan log). Kejadian lokal perlu ikut digabung
  saat login (spec 2.3).
- Perbaikan: entri `percobaan` berkunci id; tambahkan "buang dan catat" untuk galat 4xx permanen.

### T11. "Terbaru menang" bergantung jam perangkat

- [Fakta] `20260927000003_akun.sql:6-12`: trigger `tolak_data_lebih_lama` membandingkan kolom waktu yang dikirim klien;
  `apps/web/src/tersimpan.ts:61-66` memajukan waktu agar selalu lebih baru dari yang lama.
- Akibat [Dugaan, mengikuti logika trigger]: satu perangkat dengan jam maju (mis. tahun depan) menulis baris; perangkat
  lain dengan jam benar tidak bisa memperbarui baris itu sampai jamnya menyusul, dan pembaruannya dibuang diam-diam.
  `tersimpan.ts` menanganinya untuk tersimpan (waktuMaju dari waktu lama), `progres.ts` tidak.
- Untuk kelas: jangan dipakai untuk apa pun yang bernilai; kejadian penugasan memakai `diterima_pada` server.

### T12. Biaya dan stabilitas hitungan XP

- [Fakta] `kegiatan_sah` (`20260927000006_peringkat.sql:56-66`) menggabung tiap log dengan revisi **terbit saat ini**
  untuk membaca tingkat; `papan_peringkat_pada` memanggil `peristiwa_xp(null)` (semua pengguna) dan `streak_pada(null, …)`
  tiap panggilan.
- Akibat: XP lama berubah bila tingkat disunting (diakui di spec streak); hitungan membesar sebanding seluruh log.
- Perbaikan: bobot dari revisi di kejadian (spec 3.2); ringkasan harian terwujud (materialized view atau tabel ringkasan
  yang diperbarui trigger) bila papan lambat. Bukan blocker; kerjakan bersama spec P1.

### T13. Data yang hanya lokal

- [Fakta] Rekor dan skor paket kuis hanya lokal (`apps/web/src/progres.ts:4`, kunci `arif-waris:rekor-paket`).
- [Fakta] Jejak aktivitas `catatAktivitas` lokal (`apps/web/src/preferensi.ts:73-76`).
- [Fakta] Riwayat "Terakhir dibuka" lokal dan kedaluwarsa 30 hari (`apps/web/src/riwayat.ts:1-5`); `tersimpan.ts`
  disinkron.
- Untuk kelas: tidak satu pun dibutuhkan; nilai kelas dari server. Rekor Ujian tabel diturunkan dari kejadian (spec 2.3).

### T14. Menjalankan engine di edge function

- [Fakta] `supabase/functions/ai-bantu/index.ts:7-8` mengimpor `jsr:` dan berkas relatif `.ts`; tidak ada fungsi yang
  mengimpor `@waris/*`.
- [Dugaan] Deno di Supabase tidak membaca workspace pnpm. Pilihan: (a) bundel paket bersama ke satu berkas ESM dengan
  esbuild sebelum `supabase functions deploy`; (b) import map ke berkas sumber relatif (`../../../packages/...`), bila
  CLI menyertakan berkas di luar folder fungsi (kemungkinan tidak). Perlu **spike** kecil: edge function yang
  menjalankan satu kasus bab 16 dan membandingkan dengan hasil vitest.
- [Dugaan] `bigint` dan ukuran bundel engine tidak menjadi masalah di Deno; batas CPU edge function perlu diukur untuk
  kasus taqdir besar (batas "dunia" engine sudah ada, engine-contract).

### T15. Determinisme dan uji

- [Fakta] Pencarian `Date.now|new Date|Math.random` di `packages/engine/src`, `packages/math/src`, `packages/explain/src`
  hanya menemukan komentar larangan di `packages/math/src/index.ts:1`. Engine siap dijalankan ulang di server.
- [Fakta] `pilihJangkar` sudah menerima `acak` (`tabelLatihan.ts:86`); `pilihAcak` soal juga (`layar/belajar/soalAcak.ts:26`).
- [Fakta] Uji: 15 berkas pgTAP di `supabase/tests/database` (termasuk RLS `03_rls`, akun `04_akun`, bagikan `15_bagikan`);
  113 berkas di `apps/web/src/__tests__` ditambah uji per modul.
- Kurang: (1) fixture bersama untuk aturan XP yang ditulis di SQL dan TS (satu JSON dibaca pgTAP dan vitest); (2) uji
  "nilai server = nilai klien" untuk tiap tabel B7; (3) pgTAP lintas peran kelas (pelajar A ↛ B, pengajar X ↛ Y,
  pengajar ↛ kejadian mandiri).

### T16. `Hasil.tsx` menanggung banyak alasan berubah

- [Fakta] `apps/web/src/layar/Hasil.tsx` 510 baris; memegang keadaan latihan (`jawabanTerbuka`, `sudahMencoba`,
  `tebakanBenar`, baris 160-169), dialog Lihat jawaban (baris 415-425), simpan otomatis, lembar Bagikan.
- Untuk kelas: penugasan menambah satu alasan berubah lagi (tenggat, batas percobaan, Kirim ke server). Usulan: saat P2/P4,
  pisahkan "sesi soal" (keadaan latihan + pencatatan kejadian) ke hook `useSesiSoal` agar Hasil hanya merangkai.
  Bukan blocker; jangan dipecah sebelum ada kebutuhan nyata.

---

## 4. Penyimpanan lokal vs server: ringkasan

| Data | Lokal | Server | Sinkron | Cocok untuk kelas? |
|---|---|---|---|---|
| Kasus tersimpan | `arif-waris:tersimpan` | `riwayat_hitung` | antrean, terbaru menang | tidak dipakai |
| Terakhir dibuka | `riwayat.ts` | – | – | tidak dipakai |
| Progres belajar | `arif-waris:progres-belajar` | `progres_belajar` | antrean | tidak dipakai |
| Progres latihan | `arif-waris:progres-latihan` | `progres_latihan` | antrean, terbaru menang | jadi cache tampilan saja |
| Kegiatan (XP, streak) | – | `log_kegiatan` (append-only) | antrean berkunci id | pola benar; isi kurang |
| Rekor kuis, aktivitas | lokal saja | – | – | tidak dipakai |
| **Percobaan soal** (baru) | `arif-waris:percobaan` | `percobaan_soal` | antrean berkunci id, gabung himpunan | **ya** |
| **Kelas, penugasan, nilai** (baru) | cache baca saja | tabel baru | baca langsung; Kirim lewat edge function | **ya** |

Semua akses lokal lewat `apps/web/src/penyimpanan.ts` (cadangan memori bila `localStorage` gagal). Satu pintu ini baik;
modul baru wajib memakainya.

---

## 5. Urutan perbaikan yang direkomendasikan

Diperbarui sesudah bagian 7–9: keamanan dan UU PDP didahulukan.

| Urutan | Kerjakan | Temuan | Status |
|---|---|---|---|
| 0a | **Hari ini**: matikan penyedia login Email di dasbor (atau wajibkan konfirmasi email) | K1 | sekarang, 5 menit, di dasbor |
| 0b | Selaraskan migrasi produksi dengan repo (`ajuan_diksi` belum terpasang; sisa `rujukan_kb` masih ada) | K2 | sekarang, kecil |
| 0c | Pengerasan murah: cabut `execute` fungsi portal dari `anon`, `set search_path` di 18 fungsi, batasi kolom `update` pada `revisi` | K4, K5, K6 | sekarang, kecil |
| 0d | Papan peringkat menjadi opt-in; kebijakan privasi + pemberitahuan saat login; hapus akun + unduh data | P1–P4 | sekarang, kecil–sedang |
| 1 | S5: catat Lihat jawaban selalu; `benar` tidak mundur | T3, T4 | sekarang, kecil |
| 2 | S1–S3: penilaian semua kolom, modul penilaian tanpa diksi/localStorage, jangkar sebagai prop + kontrak `PercobaanTabel` | T1(a), T8 | sekarang, sebelum jenis soal lain |
| 3 | S4 + S6: kejadian lokal dengan `revisiId`, jenis soal, versi engine | T7, T9, T10 | sekarang |
| 4 | `percobaan_soal` + RLS + pgTAP; XP baru (bobot dari revisi, lihat jawaban membakar XP); `bobotXp` di skema | T2 sebagian, T3, T12 | spec P1 |
| 5 | Spike edge function menjalankan engine (bab 16 satu kasus) | T14 | sebelum kelas |
| 6 | Paket bersama penilaian + dispatcher; edge function `catat-percobaan` (spec 2.6; dimajukan ke spec P1, keputusan pemilik 2026-11-20); `sesi_soal` (jangkar server) | T1(b), T2 penuh | spec P1 + P3, **blocker kelas** |
| 7 | `kelas`, `anggota_kelas`, `penugasan`, `peran_di_kelas()` + pgTAP lintas peran | T5, T15 | spec P4 |
| 8 | Penanganan entri antrean racun | T10 | sebelum kelas |
| boleh tunggu | T6 catatan, T11, T13, T16 | | |

Alasan urutan: 1–3 murah dan menentukan kualitas data yang terkumpul **mulai hari ini**; menunda berarti data lama
tidak bisa dinilai ulang. 5 adalah risiko teknis terbesar yang belum terbukti, jadi dibuktikan sebelum membangun 6–7.

---

## 6. Pertanyaan untuk pemilik

1. Urutan di bagian 5: setuju butir 1–3 dikerjakan sekarang, sebelum jenis soal tabel berikutnya (munasakhat dst.)?
2. T2: perbaiki sementara (batas laju) sekarang, atau langsung menunggu penilaian server (P1/P3) dan menerima risiko
   papan peringkat dipalsukan sampai saat itu?
3. T1: dispatcher orkestrator (`jalankan.ts`) masuk `packages/engine` (orkestrator teratas bab 12–14) atau paket baru
   `packages/latihan` bersama penilaian tabel?
4. T14: boleh menambah langkah bundel (esbuild) ke deploy edge function?
5. T6 catatan 1: keberadaan tautan berakses email boleh terungkap (`tidak_boleh`), atau disamakan menjadi `tidak_ada`
   untuk yang sudah login tapi tidak berhak?

---

## 7. Sekarang atau nanti: mana yang lebih murah?

Jawaban singkat: **tergantung jenis perbaikannya.** Ada tiga golongan, dan biayanya bergerak ke arah yang berbeda bila
ditunda.

| Golongan | Contoh | Bila dikerjakan sekarang | Bila ditunda sampai kelas | Putusan |
|---|---|---|---|---|
| **A. Biaya naik setiap hari** (kerusakan tidak bisa diulang) | Kejadian percobaan tanpa isian/jangkar/revisi/versi (T7–T9, S4, S6); celah XP (T2, T3); keamanan K1–K3; kewajiban UU PDP (bagian 9) | kecil (perubahan 1–3 hari per butir) | data lama **tidak pernah** bisa dinilai ulang; XP dan papan yang sudah tercemar tidak bisa dibersihkan dengan yakin; pelanggaran UU PDP sudah berlaku sejak 17 Oktober 2024 (Pasal 74) dan risiko insiden ada setiap hari | **Sekarang** |
| **B. Biaya naik seiring kode bertambah** (sambungan yang makin banyak) | Pisahkan penilaian dari diksi/localStorage dan kontrak `PercobaanTabel` (T1a, S1–S3) sebelum 6 jenis soal lain meniru pola lama | kecil: 1 komponen + 1 modul | 7 komponen dan 7 susunan tabel harus diubah; setiap jenis soal baru menggandakan biaya | **Sekarang**, sebelum jenis soal berikutnya |
| **C. Biaya sama atau lebih murah nanti** (belum ada pemakainya) | Tabel `kelas`/`penugasan`, edge function penilaian, paket bersama, layar pengajar (T1b, T5, T14 kecuali spike, P3–P4) | sedang–besar, dan harus dirawat tanpa ada yang memakai; desain bisa berubah sesudah wawancara pengajar | sama besarnya, tetapi dengan kebutuhan yang lebih jelas | **Nanti**, cukup jaga sambungannya tetap murah (golongan B) |

Perkiraan kasar (orang-hari, satu pengembang; **dugaan**, untuk membandingkan, bukan janji jadwal):

| Paket | Sekarang | Nanti (saat kelas) | Selisih |
|---|---|---|---|
| K1–K6 + pengerasan | 1–2 | 1–2 + biaya insiden bila terjadi lebih dulu | risiko, bukan hari |
| UU PDP minimal (P1–P5) | 3–5 | 3–5 + menata ulang data yang sudah terkumpul tanpa dasar | data lama tanpa persetujuan |
| S1–S6 (model kejadian di klien) | 3–4 | 6–10 (7 jenis soal sudah memakai pola lama) + data lama hilang | 2–3× |
| P1 (tabel kejadian server, XP baru) | 4–6 | 4–6 + migrasi XP dari log lama yang lebih besar | sedikit |
| P3–P4 (penilaian server + kelas) | 10–15 | 10–15 | nol, tetapi tanpa umpan balik pengajar bila dibangun sekarang |

Kesimpulan: kerjakan **golongan A dan B sekarang** (±1,5–2 minggu total), tunda **golongan C** sampai kelas benar-benar
akan dibangun. Satu pengecualian di golongan C: **spike edge function** (T14, ±1 hari) layak dikerjakan lebih awal karena
hasilnya bisa mengubah desain golongan B (letak paket bersama).

---

## 8. Keamanan: IDOR dan celah lain

Metode: membaca semua migrasi, kebijakan RLS, fungsi `security definer`, dua edge function, dan klien data; lalu
membandingkan dengan produksi lewat penasihat keamanan Supabase (`get_advisors`), daftar migrasi, dan kueri metadata
hanya-baca. Tidak ada uji penetrasi aktif ke produksi.

### 8a. Yang sudah baik [Fakta]

- Semua tabel data pengguna memakai RLS `user_id = auth.uid()` untuk baca **dan** tulis, dengan `default auth.uid()`
  (`20260926000004_rls.sql` bagian "data pengguna"; `log_kegiatan`, `profil`, `langganan_push`, `kirim_push`,
  `kasus_dibagikan`). Mengganti `user_id` di permintaan tidak bisa membaca atau menulis milik orang lain: **tidak
  ditemukan IDOR langsung pada tabel**.
- Kunci utama data pengguna berpasangan dengan `user_id` (`primary key (user_id, id)`), jadi id yang sama milik dua orang
  tidak bertabrakan.
- Fungsi lintas pengguna (peringkat, push) dicabut dari klien dan hanya dibuka lewat pembungkus yang memakai `auth.uid()`
  (`20260927000006_peringkat.sql:179-185`, `20261002000001_push.sql:102-103`).
- Kolom waktu server tidak bisa ditulis klien (`20260927000003_akun.sql:38-39`).
- Tidak ada `dangerouslySetInnerHTML`, `innerHTML`, `eval`, atau `new Function` di `apps/web/src` dan `apps/admin/src`.
- Isi push tidak memuat data kasus (`supabase/functions/kirim-push/index.ts:5`); kunci API AI hanya di edge function.

### 8b. Temuan

| Kode | Tingkat | Temuan | Bukti | Perbaikan |
|---|---|---|---|---|
| **K1** | **Tinggi** | **Penyedia login Email aktif dengan konfirmasi otomatis.** Produksi punya identitas `email` yang terkonfirmasi < 5 detik sesudah dibuat. Bila pendaftaran email masih terbuka, penyerang bisa mendaftar lewat API `auth/v1/signup` memakai email korban tanpa memilikinya. Akibat: (1) membaca kasus yang dibagikan "ke email" korban (`baca_kasus_dibagikan` memercayai klaim email JWT); (2) **pengambilalihan akun sebelum korban mendaftar**: bila korban kelak masuk dengan Google ber-email sama, Supabase dapat menautkan identitas Google ke akun yang sudah dibuat penyerang (yang tahu sandinya); (3) bila admin memberi peran portal lewat `atur_peran_email`, peran itu jatuh ke akun penyerang | [Fakta-prod] `auth.identities` per penyedia: email 1, google 1; konfirmasi otomatis. [Fakta] `supabase/config.toml` `[auth.email] enable_signup = true`, `enable_confirmations = false` (lokal). [Fakta] UI hanya memakai Google (`packages/data/src/supabase/index.ts:252`). [Dugaan] pengaturan dasbor produksi sama dengan lokal: **cek di Authentication → Providers → Email** | Matikan penyedia Email di produksi (UI tidak memakainya), atau wajibkan konfirmasi. Di SQL, `baca_kasus_dibagikan` dan fungsi kelas yang memakai email memeriksa `auth.jwt() -> 'app_metadata' ->> 'provider' = 'google'` atau `email_confirmed_at`. Periksa akun email yang ada (siapa pembuatnya) |
| **K2** | Tinggi (fungsi) / Sedang (keamanan) | **Migrasi produksi menyimpang dari repo.** Versi `20260928000002` di produksi bernama `rujukan_kb` (fitur yang sudah di-*revert* di repo, commit `8734e19`), sedangkan repo berisi `ajuan_diksi` di versi yang sama, yang **tidak pernah terpasang**: fungsi `perbarui_ajuan`, `perbarui_ajuan_diksi`, `terbitkan_langsung_diksi` tidak ada di produksi padahal dipanggil portal. Sisa `rujukan_kb` (trigger `daftarkan_rujukan_terbit`) masih ada | [Fakta-prod] `list_migrations`; kueri `pg_proc`. [Fakta] `packages/data/src/supabase/index.ts:107,139,141` | Migrasi baru yang memasang `ajuan_diksi` dan membuang sisa `rujukan_kb`; uji pgTAP di basis data yang direset dari nol; tambah pemeriksaan CI "migrasi repo = migrasi produksi" |
| **K3** | Tinggi (integritas) | XP dan papan peringkat bisa dipalsukan: klien menulis `benar` ke `log_kegiatan` | = T2 | = T2 |
| **K4** | Rendah | 14 fungsi `security definer` portal bisa dipanggil `anon` (mis. `setujui_revisi`, `ajukan_revisi`). Semuanya menolak karena `peran_saya()` kosong, jadi tidak bocor, tetapi permukaan serangan tidak perlu | [Fakta-prod] penasihat `anon_security_definer_function_executable`. [Fakta] `20260926000002_transisi.sql:113` hanya mencabut dua fungsi pembantu | `revoke execute ... from public, anon` untuk semua fungsi portal (pola `20260927000005`) |
| **K5** | Rendah | 18 fungsi tanpa `set search_path` (fungsi `security invoker`, jadi risikonya kecil) | [Fakta-prod] penasihat `function_search_path_mutable` | `alter function ... set search_path = public` |
| **K6** | Rendah–sedang (jejak audit) | Penulis bisa mengubah kolom apa pun pada drafnya sendiri, termasuk `dibuat_oleh` dan `entri_id`: kebijakan `ubah_draf` hanya mensyaratkan `status = 'draf'` dan tidak ada pembatasan kolom untuk `revisi`. Akibat [Dugaan, belum diuji]: penulis memalsukan pembuat draf (mis. atas nama reviewer, sehingga reviewer itu tidak boleh memeriksanya) | [Fakta] `20260926000004_rls.sql` kebijakan `ubah_draf`; `revoke update` hanya untuk `entri_konten, diksi` (baris 56-58) | `revoke update on revisi, revisi_diksi from authenticated; grant update (isi, refs) ...`; uji pgTAP |
| **K7** | Rendah | Kode/slug bisa diperiksa keberadaannya (`tautan_bagikan_tersedia`, dan `tidak_boleh` vs `tidak_ada`) | = T6 catatan 1 | diterima; catat sebagai keputusan |
| **K8** | Info | Perlindungan sandi bocor (HaveIBeenPwned) mati | [Fakta-prod] penasihat `auth_leaked_password_protection` | tidak relevan bila K1 diselesaikan dengan mematikan penyedia Email |

### 8c. Syarat keamanan untuk kelas dan pencatatan nilai

Ini kriteria terima P3–P4 (spec bagian 5). Setiap butir punya uji pgTAP atau uji edge function.

**Otorisasi (anti-IDOR)**
1. **Tidak ada parameter `user_id` di RPC atau edge function.** Identitas selalu dari `auth.uid()` / JWT terverifikasi.
   Id kelas, penugasan, sesi, dan percobaan memakai UUID acak, **tetapi keacakan bukan otorisasi**: setiap akses
   diperiksa keanggotaan.
2. Satu fungsi `peran_di_kelas(kelas_id) returns text` (`security definer`, `set search_path`, dicabut dari `anon`)
   dipakai semua kebijakan RLS kelas. Uji wajib: pelajar A tidak membaca percobaan/nilai pelajar B di kelas yang sama;
   pengajar kelas X tidak membaca kelas Y; pengajar tidak membaca percobaan mandiri; pelajar tidak membaca daftar email
   anggota; anggota yang keluar kehilangan akses seketika.
3. Pelajar tidak pernah menulis langsung ke `percobaan_soal` untuk penugasan, `nilai_*`, atau `sesi_soal`. Hanya edge
   function (service role) sesudah memverifikasi JWT, keanggotaan, jendela waktu, dan batas percobaan.
4. Edge function **membaca dengan JWT pengguna** (RLS tetap berlaku) dan memakai service role **hanya untuk menulis
   hasil** yang sudah diverifikasi (pola `ai-bantu/index.ts`: klien anon + Authorization, lalu servis untuk tulis).

**Integritas nilai**
5. **Nilai append-only.** Tidak ada `update`/`delete` untuk percobaan dan nilai. Koreksi pengajar = baris baru di
   `koreksi_nilai (id, percobaan_id, nilai_baru, alasan wajib, oleh, pada)`; nilai efektif = koreksi terakhir atau hasil
   server. Ini juga memenuhi hak keberatan atas keputusan otomatis (UU PDP Pasal 10, bagian 9).
6. **Batas percobaan tahan balapan**: hitung dan sisip dalam satu transaksi dengan `select ... for update` pada
   `sesi_soal`, atau kolom `nomor_percobaan` dengan `unique (sesi, nomor)`. Dua Kirim bersamaan tidak boleh melampaui
   batas.
7. **Idempoten**: id percobaan dibuat klien; kirim ulang id yang sama mengembalikan hasil yang sama, tidak menambah
   percobaan (pola `log_kegiatan` `ignoreDuplicates`).
8. **Tenggat dan waktu dari server** (`now()` di edge function), tidak dari klien.
9. **Jangkar dan revisi soal dari server** dan tersimpan (spec 5.4), supaya penilaian bisa diulang dan klien tidak
   memilih jangkar yang menguntungkan.
10. **Batas laju**: per pengguna per menit untuk Kirim dan untuk gabung kelas.

**Kode gabung kelas**
11. 6 karakter `[A-Z0-9]` ≈ 2,2 × 10⁹ kemungkinan: aman bila dibatasi laju (mis. 10 percobaan per jam per pengguna),
    bisa diganti pengajar, dan bisa dimatikan. Opsi "pengajar menyetujui permintaan gabung" untuk kelas tertutup.

**Batas yang harus jujur disampaikan**
12. **Aplikasi ini juga kalkulator.** Pelajar bisa memasukkan soal tugas ke kalkulator dan menyalin hasilnya; kunci
    jawaban selalu bisa diturunkan di perangkat karena engine berjalan di klien. Ini tidak bisa dicegah secara teknis
    tanpa pengawasan ujian (di luar cakupan). Konsekuensi desain: penugasan diperlakukan sebagai latihan terstruktur
    (*open book*), bukan ujian berisiko tinggi; pengajar diberi tahu di layar pembuatan tugas. Mematikan kalkulator
    selama tugas berjalan hanya menyulitkan, tidak mencegah. Pertanyaan pemilik nomor 8.

---

## 9. Privasi dan UU PDP (UU No. 27 Tahun 2022)

Dasar hukum dibaca dari teks UU (pasal.id dan id.wikisource, 2026-11-20); kutipan pasal di bawah adalah parafrase.
**Ini bukan nasihat hukum**; untuk peluncuran kelas ke lembaga pendidikan sebaiknya ditinjau konsultan hukum.
Masa penyesuaian 2 tahun (Pasal 74) **sudah berakhir 17 Oktober 2024**, jadi kewajiban di bawah berlaku sekarang.

### 9a. Data yang diproses

| Data | Di mana | Jenis menurut Pasal 4 | Milik siapa |
|---|---|---|---|
| Email, nama, foto Google | `auth.users` | umum | pengguna |
| Nama tampilan, zona waktu, avatar | `profil` | umum | pengguna |
| Kasus tersimpan / dibagikan: nama anggota keluarga, siapa wafat, nilai harta, anak, kehamilan, khuntsa, orang hilang | `riwayat_hitung`, `kasus_dibagikan` (jsonb) | **spesifik** bisa termasuk: data anak, data keuangan pribadi (harta), dan data yang berkaitan dengan kesehatan (khuntsa, kehamilan) [Dugaan tafsir] | **pihak ketiga** (keluarga pengguna) |
| Kegiatan belajar, XP, streak | `log_kegiatan`, `progres_*` | umum; bersifat **penskoran** (Pasal 34 ayat (2) huruf d) | pengguna |
| Langganan push | `langganan_push` | umum (pengenal perangkat) | pengguna |
| (kelas) nilai, percobaan, keanggotaan | tabel baru | umum; penskoran; **data anak** bila pelajar < 18 tahun | pelajar |

### 9b. Temuan

| Kode | Tingkat | Temuan | Pasal | Bukti |
|---|---|---|---|---|
| **P1** | **Tinggi** | **Tidak ada kebijakan privasi atau pemberitahuan pemrosesan** di aplikasi. Saat login tidak disampaikan tujuan, jenis data, retensi, dan hak subjek | Pasal 20 (dasar pemrosesan), 21 ayat (1) (informasi wajib), 22 (persetujuan tertulis/terekam; yang tidak memenuhi batal demi hukum) | [Fakta] pencarian "privasi" di `apps/web/src`, `apps/admin/src`, dan kunci diksi: tidak ada |
| **P2** | **Tinggi** | **Papan peringkat opt-out mempublikasikan nama depan Google, XP, dan streak semua pengguna yang login ke publik (`anon`)** tanpa persetujuan eksplisit | Pasal 20 ayat (2) huruf a, 22 | [Fakta] `20260928000001_peringkat_otomatis.sql:1-8`; `papan_peringkat` di-grant ke `anon` (`20260927000006_peringkat.sql:185`) |
| **P3** | Tinggi | **Tidak ada hapus akun dan unduh data.** Hak akses + salinan (Pasal 7), hapus (Pasal 8), tarik persetujuan (Pasal 9), portabilitas (Pasal 13); akses wajib dipenuhi ≤ 3 × 24 jam (Pasal 32 ayat (2)) | Pasal 7–9, 13, 32, 43 | [Fakta] tidak ada `hapus akun`/`unduh data` di klien, repositori, maupun SQL |
| **P4** | Sedang | **Data pihak ketiga dan data spesifik** (keluarga, harta, anak, khuntsa) disimpan di server saat pengguna menyimpan/membagikan kasus. Pengguna sendiri mungkin dikecualikan sebagai "kegiatan pribadi/rumah tangga", tetapi pengelola layanan tidak. Pemrosesan data spesifik termasuk risiko tinggi → **penilaian dampak (DPIA)** wajib | Pasal 4 ayat (2), 34 ayat (2) huruf b | [Fakta] `riwayat_hitung.kasus jsonb`, `kasus_dibagikan.kasus jsonb` |
| **P5** | Sedang | **Lokasi server di luar Indonesia** [Dugaan: proyek produksi = "fariqsutikno's Project", dibuat 2026-09-26, region `ap-south-1` (Mumbai)]. Transfer ke luar wilayah RI butuh negara tujuan berpelindungan setara, atau pelindungan memadai yang mengikat (mis. DPA Supabase), atau persetujuan subjek | Pasal 56 | [Fakta-prod] `list_projects` |
| **P6** | Sedang | **Tidak ada jadwal retensi**: `log_kegiatan`, `riwayat_hitung`, `kasus_dibagikan`, `kirim_push`, `pemakaian_ai` disimpan tanpa batas | Pasal 16 ayat (2) huruf g, 43–44 | [Fakta] tidak ada pembersihan terjadwal selain `riwayat.ts` lokal (30 hari) |
| **P7** | Sedang | **Tidak ada prosedur insiden**: kegagalan pelindungan wajib diberitahukan tertulis ke subjek dan lembaga ≤ 3 × 24 jam | Pasal 46 | tidak ada dokumen/runbook |
| **P8** | Sedang (kelas) | **Data anak**: pemrosesan wajib dengan persetujuan orang tua/wali | Pasal 25 | kelas belum ada; menentukan desain P4 |
| **P9** | Rendah (kelas) | **Keputusan otomatis**: nilai kelas dihitung mesin; subjek berhak keberatan atas keputusan otomatis yang berdampak signifikan | Pasal 10 | dipenuhi oleh koreksi pengajar (8c butir 5) + jalur keberatan |
| **P10** | Info | Prosesor pihak ketiga: Supabase (basis data, auth), Google (login), layanan Web Push peramban, Gemini/SumoPod (hanya konten portal, tanpa data pengguna, [Fakta] `ai-bantu/index.ts`). Tanggung jawab tetap pada pengendali | Pasal 37, 51 | daftar ini masuk kebijakan privasi |

Pejabat PDP (Pasal 53) [Dugaan]: belum wajib selama skala kecil, tetapi menjadi wajib bila kegiatan inti memproses data
spesifik dalam skala besar (ayat (1) huruf c), yang bisa terjadi bila kelas dipakai banyak sekolah dengan murid di bawah
umur. Catatan: Putusan MK 151/PUU-XXII/2024 mengubah tafsir Pasal 53 ayat (1) huruf b.

### 9c. Rekomendasi (urut biaya kecil → besar)

1. **Papan peringkat opt-in** (P2): migrasi `ikut_papan_peringkat` default `false` dan semua baris yang belum pernah
   memilih dikembalikan ke `false`; ajakan ikut di halaman Peringkat. Nama bawaan tetap nama depan, tetapi baru tampil
   sesudah pengguna menyetujui.
2. **Kebijakan privasi + pemberitahuan saat login pertama** (P1): halaman `#/privasi` berisi semua butir Pasal 21 ayat
   (1) (dasar, tujuan, jenis data, retensi, rincian, jangka waktu, hak subjek), daftar prosesor (P10), lokasi server (P5),
   dan kontak. Persetujuan dicatat (Pasal 22: terekam): tabel `persetujuan (user_id, versi_kebijakan, jenis, pada)`,
   append-only. Jenis persetujuan terpisah dan bisa ditarik: papan peringkat, push, (kelas) berbagi nilai ke pengajar.
3. **Hapus akun dan unduh data** (P3): fungsi `hapus_akun_saya()` lewat edge function (service role menghapus
   `auth.users`; semua tabel sudah `on delete cascade`) + tombol di profil dengan dialog tahan; `unduh_data_saya()`
   mengembalikan JSON semua baris milik pengguna. Keduanya dalam 3 × 24 jam terpenuhi karena seketika.
4. **Minimisasi data kasus** (P4): nama orang di kasus tidak wajib (cukup peran); lembar Bagikan sudah punya
   `sembunyiNominal`. Saat berbagi tautan, opsi "sembunyikan nama" bawaan menyala. Kasus tersimpan di server hanya bila
   pengguna login (sudah begitu).
5. **Retensi** (P6): `kirim_push` 90 hari, `pemakaian_ai` 1 tahun, `kasus_dibagikan` yang tidak dibuka 1 tahun
   diberi tahu lalu dihapus, akun tak aktif 3 tahun dihapus sesudah pemberitahuan (USULAN angka). Dijalankan `pg_cron`.
6. **Prosedur insiden** (P7): satu halaman runbook di `docs/` (siapa, cara menilai, templat surat ke pengguna dan
   lembaga, tenggat 3 × 24 jam).
7. **Lokasi data** (P5): pastikan proyek produksi; bila di luar negeri, pastikan DPA Supabase berlaku dan sebutkan di
   kebijakan privasi, atau pindahkan ke region yang lebih dekat sebelum data kelas masuk (lebih murah sebelum ada data
   kelas).
8. **DPIA** (P4, P8): satu dokumen sebelum kelas diluncurkan; isinya data spesifik, data anak, penskoran, dan mitigasi
   di bagian 8c dan 9c.
9. **Kelas dan anak** (P8): fase pertama kelas hanya untuk pelajar ≥ 18 tahun (konfirmasi usia saat gabung), atau
   lembaga (sekolah/pesantren) menjadi pihak yang mengumpulkan persetujuan wali dan menyatakannya saat membuat kelas.
   Pengajar tidak melihat data selain nama tampilan, email (bila perlu), dan hasil tugasnya.

---

## 10. Pertanyaan tambahan untuk pemilik

6. **K1**: boleh penyedia login Email dimatikan di dasbor Supabase hari ini? Siapa pemilik akun email yang sudah ada
   (akun uji)?
7. **K2**: boleh dibuat migrasi penyelaras (pasang `ajuan_diksi`, buang sisa `rujukan_kb`) dan dijalankan ke produksi?
8. **Kalkulator saat tugas**: setuju penugasan diperlakukan *open book* (8c butir 12), atau perlu mode tugas yang
   menyembunyikan kalkulator (hanya menyulitkan, tidak mencegah)?
9. **Papan peringkat**: setuju dikembalikan ke opt-in (P2)? Ini menurunkan jumlah peserta papan.
10. **Lokasi server**: apakah "fariqsutikno's Project" (ap-south-1) memang produksi ArifWaris? Bersedia pindah region
    sebelum kelas?
11. **Usia pelajar kelas**: fase pertama hanya ≥ 18 tahun, atau lembaga yang mengumpulkan persetujuan wali?
12. **Kontak pengendali data** untuk kebijakan privasi: nama/lembaga dan alamat email yang dipakai?
