# Audit arsitektur: kesiapan untuk fitur kelas

Tanggal: 2026-11-20. Basis: branch `main` lokal (commit `4862fc3`). Tanpa perubahan kode.
Pendamping: `spec-model-percobaan-dan-penilaian.md` (bagian dan butir S1–S6 dirujuk dari sana).

**Fitur kelas** yang diaudit: pengajar membuat kelas, pelajar bergabung, pengajar menerbitkan penugasan soal tabel
faraidh dengan kebijakan (mode, batas percobaan, tenggat, cara ambil nilai), nilai dihitung server, pengajar melihat
nilai kelasnya.

Penanda: **[Fakta]** = terbaca di kode dengan `file:baris`. **[Dugaan]** = kesimpulan yang belum diverifikasi dengan
menjalankan sesuatu; ditulis apa yang perlu dicek.

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
  `progres_latihan`; ini hanya menyulitkan. (2) benar: XP soal tabel dihitung dari `percobaan_soal.hasil_kolom_server`
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
- Catatan 2 [Dugaan]: pemeriksaan akses `email` membandingkan `auth.jwt() ->> 'email'` (baris 29, 37). Aman selama
  satu-satunya penyedia login adalah Google (email terverifikasi). Bila kelak ditambah login email/sandi tanpa
  verifikasi, seseorang bisa mendaftar dengan email orang lain dan membaca kasus yang dibagikan ke email itu. Perlu
  dicek saat menambah penyedia login: pakai `email_confirmed_at`.
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

| Urutan | Kerjakan | Temuan | Status |
|---|---|---|---|
| 1 | S5: catat Lihat jawaban selalu; `benar` tidak mundur | T3, T4 | sekarang, kecil |
| 2 | S1–S3: penilaian semua kolom, modul penilaian tanpa diksi/localStorage, jangkar sebagai prop + kontrak `PercobaanTabel` | T1(a), T8 | sekarang, sebelum jenis soal lain |
| 3 | S4 + S6: kejadian lokal dengan `revisiId`, jenis soal, versi engine | T7, T9, T10 | sekarang |
| 4 | `percobaan_soal` + RLS + pgTAP; XP baru (bobot dari revisi, lihat jawaban membakar XP); `bobotXp` di skema | T2 sebagian, T3, T12 | spec P1 |
| 5 | Spike edge function menjalankan engine (bab 16 satu kasus) | T14 | sebelum kelas |
| 6 | Paket bersama penilaian + dispatcher; edge function `nilai-percobaan`; `sesi_soal` (jangkar server) | T1(b), T2 penuh | spec P3, **blocker kelas** |
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
