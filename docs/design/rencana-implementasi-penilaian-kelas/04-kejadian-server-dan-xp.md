# 04. Kejadian di server, penilaian server, dan XP baru (G3, fase P1)

Induk: `00-induk.md` bagian 4 G3. Perilaku: spec 2.3–2.6 (skema, migrasi data, **validasi dan anti-manipulasi**), 3.1–3.2
(aturan XP, bobot). Audit T2, T3, T10, T12, 8c.
Prasyarat: G1 (paket `@waris/latihan`, spike edge function lulus, kejadian lokal mengantre), G2 (semua jenis soal
menghasilkan kejadian seragam).
Perkiraan: 8–12 orang-hari (naik dari 4–6 karena penilaian server dimajukan dari G7, keputusan pemilik 2026-11-20).

**Keputusan pemilik 2026-11-20:** tidak ada kebenaran yang diterima dari sisi klien. Klien hanya mengirim isian dan klik
pelajar; benar/salah, XP, waktu, urutan, dan versi selalu dihitung server (spec 2.6).

**Selesai bila:**
- [x] Satu-satunya jalan menulis `percobaan_soal` adalah edge function `catat-percobaan`; `authenticated` dan `anon` tidak
      punya `insert`/`update`/`delete` (pgTAP `20`).
- [x] `catat-percobaan` menolak setiap kiriman yang melanggar spec 2.6 (uji vitest `penilai.test.ts` per butir: logika
      murni di `packages/latihan/src/penilai.ts`; aturan urutan/idempoten/laju di SQL `catat_percobaan`, pgTAP `21`;
      uji integrasi runtime edge asli `scripts/uji-integrasi-catat-percobaan.mjs`). `deno` tidak terpasang di mesin
      pengembang, jadi tidak ada `deno test`.
- [x] Kuis konsep dan pelajaran juga lewat fungsi server; `log_kegiatan` tidak bisa lagi ditulis langsung oleh klien (pgTAP `04`, `23`).
- [x] XP dan hari aktif dihitung dari baris tulisan server dengan aturan spec 3.1 (`xp_soal_baru`); total XP pengguna lama
      **tidak berubah** pada hari peralihan (pgTAP `23`).
- [x] Lihat jawaban sebelum benar pertama membakar XP soal itu; ulang soal = 0 XP tapi tetap hari aktif (pgTAP `22`, dari `xp-kasus.json` yang sama dengan vitest).
- [~] `bobotXp` ada di skema soal, diisi di portal sebagai "Poin XP" (kosong = ikut tingkat), dan XP dibaca dari revisi
      yang dikerjakan. **Belum**: pengisian otomatis dari jenis soal (tabel 3.2) di portal.
- [ ] **Soal gharqa belum dinilai server** (kejadiannya memuat keputusan + beberapa tabel; kontrak kiriman perlu
      diperluas). Sampai itu selesai server menolak kiriman gharqa (`SOAL_TIDAK_DIDUKUNG`) dan soal gharqa tidak memberi XP.
- Soal bangkitan (`soal_bangkitan`) belum ada; kiriman `soalId` pola ditolak (`SOAL_BANGKITAN_BELUM_ADA`) sampai G4.

---

## 1. Migrasi `…_percobaan_soal.sql`

- Tabel persis spec 2.4: kolom `aksi` memuat `'buka'`; kolom hasil bernama `hasil_kolom` dan `benar_semua` (tidak ada
  kolom "versi klien" dari hasil); **tanpa** kolom `tugas_id` (ditambah di `06` bersama tabel `tugas`).
- Hak akses: `revoke all on percobaan_soal from anon, authenticated; grant select on percobaan_soal to authenticated;`
  RLS `select` hanya `user_id = auth.uid()`. Tidak ada kebijakan `insert`. Penulis = service role di edge function.
- Indeks unik parsial `(id_sesi_soal) where aksi = 'kirim' and mode = 'ujian'` (satu Kirim per sesi Ujian) dan
  `(id_sesi_soal) where aksi = 'buka'` (satu buka per sesi).
- `revisi_soal references revisi`. Kejadian kartu lama tanpa revisi tidak masuk tabel ini (kartu lama dihapus di G2).
- Indeks `(user_id, soal_id, diterima_pada)` sesuai spec.
- Uji pgTAP `20_percobaan_soal.test.sql`: `authenticated` tidak bisa sisip/ubah/hapus, termasuk barisnya sendiri; tidak
  bisa membaca milik orang lain; `anon` tidak bisa apa pun; indeks unik menolak Kirim Ujian kedua.

## 2. Edge function `catat-percobaan` (satu-satunya pintu tulis)

### 2.1 Letak dan bundel
`supabase/functions/catat-percobaan/`, memakai bundel `@waris/latihan` + engine dari cara yang terbukti di spike G1
(`hasil-spike-edge.md`), dengan `__VERSI_ENGINE__` disuntik saat bundel. Pola akses mengikuti `ai-bantu/index.ts`: klien
anon + header Authorization untuk memverifikasi pengguna dan membaca dengan RLS, service role hanya untuk menulis baris
yang sudah lolos validasi.

### 2.2 Urutan pemeriksaan (spec 2.6; berhenti di pemeriksaan pertama yang gagal)
1. **Identitas**: `auth.getUser(jwt)`; tanpa sesi sah → 401. Badan tidak punya `user_id`; bila ada → 400.
2. **Batas laju**: per pengguna, USULAN 30 kejadian/menit dan 2.000/hari (tabel kecil `batas_laju` atau hitung dari
   `percobaan_soal` 60 detik terakhir). Lewat batas → 429; klien membiarkan entri di antrean.
3. **Bentuk**: skema ketat (zod atau validasi tulisan tangan setara) dengan `strict()`: ukuran badan ≤ 32 KB; `id`,
   `idSesiSoal`, `revisiSoal` UUID; `soalId` sesuai pola kurasi atau pola soal; `aksi` ∈ {buka, periksa, kirim,
   lihatJawaban}; `mode` ∈ {latihan, ujian}; kunci tak dikenal → 400. Tidak ada koreksi diam-diam (memotong, mengubah).
4. **Soal**: revisi dimuat dari basis data; harus revisi soal yang disebut `soalId` dan pernah terbit (bukan draf, bukan
   milik soal lain). Soal bangkitan: `soalId` harus ada di katalog `soal_bangkitan` dan terbit (`06` bagian 3); soal dibangkitkan
   ulang dan diverifikasi di server.
5. **Isian terhadap tabel**: server menyusun tabel sendiri (`muatSoal` → `jalankan` → `susunTabelSoal`), lalu:
   hanya id kolom dan id baris yang ada; sel `pilih` hanya dari daftar pilihannya; sel `bulat` hanya `^\d{0,6}$` sesudah
   `angkaLatin`; sel terkunci, sel tanpa kunci, dan sel jangkar tidak boleh diisi; jangkar ∈ calon `pilihJangkar`.
   `isian` wajib untuk periksa/kirim, wajib kosong untuk buka.
6. **Urutan**: Kirim Ujian kedua dalam sesi yang sama → 409; `periksa` dalam sesi Ujian → 400; kejadian sesudah Kirim
   Ujian dalam sesi yang sama selain `lihatJawaban` → 409.
7. **Idempoten**: `id` sudah ada dengan isi sama → kembalikan hasil lama (200); isi berbeda → 409.
8. **Nilai dan tulis**: `nilaiSemuaKolom` di server; tulis `hasil_kolom`, `benar_semua`, `versi` (engine dari bundel,
   `kunci` = hash `tabelKanonik`), `diterima_pada = now()`. Balasan: hasil per kolom/sel (tanpa kunci jawaban kecuali aksi
   `lihatJawaban` atau sesudah Kirim Ujian, sama dengan yang memang tampil di layar).

### 2.3 Uji (`deno test` di folder fungsi + satu uji integrasi dengan `supabase functions serve`)
Satu kasus uji per butir 2.2 (termasuk: `user_id` disisipkan di badan; revisi draf; revisi soal lain; kolom/baris karangan;
nilai pilih di luar daftar; `1/8` di sel bulat; isian di sel jangkar; jangkar bukan calon; Kirim Ujian dua kali, juga
bersamaan; id sama isi beda; badan 33 KB; `soalId` bangkitan di luar katalog). Hasil server untuk fixture B7
sama persis dengan vitest.

## 3. Kuis konsep dan pelajaran lewat server

Supaya `log_kegiatan` tidak lagi menjadi celah (audit T2):
- Fungsi yang sama menerima `{ jenis: 'kuis', id, slug, revisi, indeksPilihan }`: server membaca `indeksBenar` dari revisi
  soal kuis dan menulis `log_kegiatan` dengan `benar` hitungan server.
- `{ jenis: 'pelajaran', id, slug }`: slug harus pelajaran terbit; XP pelajaran tetap sekali per slug (aturan yang ada).
- Migrasi: `revoke insert on log_kegiatan from authenticated` (sekarang `grant insert (id, jenis, slug, benar)`,
  `20260927000003_akun.sql:38-39`). Dipasang bersamaan dengan rilis klien baru; entri antrean dari klien lama yang ditolak
  masuk `arif-waris:antrean-gagal` (bagian 4).

## 4. Klien: repositori dan antrean

- `RepositoriPengguna.kirimPercobaan(kejadian)` memanggil `catat-percobaan` (bukan sisip tabel) dan mengembalikan hasil
  server; `bacaPercobaan(sejak?)` membaca tabel (RLS). Pemetaan nama kolom di `packages/data/src/supabase/peta.ts`.
- Antrean mengirim entri `percobaan` berurutan. Hasil server **menggantikan** hasil lokal untuk status soal, centang, XP,
  dan kemahiran; bila berbeda dari hasil lokal, layar mengikuti server.
- Klien tetap menilai sendiri hanya untuk umpan langsung (dan saat luring). Status lokal yang belum dinilai server
  ditandai "belum tersinkron" dan tidak menambah XP di layar.
- **Entri racun** (audit T10): ditolak karena bentuk (400/409) → pindah ke `arif-waris:antrean-gagal` (maks 50), terlihat
  jumlahnya di Profil. 401/429/jaringan → tetap di antrean.
- Login: `gabung.ts` menarik `bacaPercobaan()` dan menggabung per id (gabungan himpunan).

## 5. Fungsi XP dan hari aktif

### 5.1 Satu sumber aturan, dua bahasa
`xpSoal()` TS di `@waris/latihan` (tampilan) dan SQL di server (papan, streak, kebenaran). Supaya tidak menyimpang:
berkas kasus uji tunggal `packages/latihan/src/__tests__/xp-kasus.json`, dibaca vitest langsung dan diubah menjadi
`supabase/tests/database/21_xp_kasus.test.sql` oleh `scripts/xp-kasus-ke-sql.ts` (`vite-node`, pola `pnpm db:refs`);
CI gagal bila berkas SQL berbeda dari hasil skrip. Kasus: benar pertama, lihat jawaban sebelum/sesudah benar, ulang,
Ujian parsial lalu Latihan benar, Ujian ulang, revisi berbeda, soal bangkitan.

### 5.2 SQL
- `xp_percobaan(p_user uuid)` (`set search_path`, tidak diekspos ke `anon`) menerapkan spec 3.1 per `soal_id` atas baris
  `percobaan_soal` (semuanya tulisan server), bobot dari `revisi.isi ->> 'bobotXp'` milik `revisi_soal`; cadangan
  `xp_konten` untuk revisi lama.
- Peralihan: soal yang sudah memberi XP lewat `log_kegiatan` lama tidak memberi lagi (spec 2.5 butir 2). Gabungkan di
  `peristiwa_xp` (`20260927000006_peringkat.sql`).
- `hari_aktif`: tambahkan `percobaan_soal.diterima_pada`. Klien berhenti mengirim `log_kegiatan` untuk soal tabel.
- `progres_latihan.benar` diisi ulang sekali sebagai "pernah benar" (spec 2.5 butir 3).
- Biaya (audit T12): hitung per pengguna saat diminta; papan hanya peserta opt-in (`01` 2.1).
  `-- ponytail: XP dihitung ulang per permintaan; tabel ringkasan bila papan > ±1 detik`.

### 5.3 XP soal bangkitan
Sama dengan soal kurasi: sekali per soal, dinilai server, bobot dari `soal_bangkitan.bobot_xp` (salinan `bobotXp` revisi
pola). Tidak ada batas XP harian (keputusan pemilik 2026-11-20: tujuannya *drill*). Batas harian tersedia sebagai satu
konstanta bila papan menunjukkan penyalahgunaan (`06` bagian 3.6).

## 6. `bobotXp` di konten dan portal

- Skema zod `soal_hitung` (`packages/content/src/skema.ts`, ±baris 103): `bobotXp: z.number().int().min(1).max(200).optional()`.
- Tabel bobot usulan spec 3.2 = konstanta `BOBOT_XP_USULAN` di `@waris/latihan`. Portal mengisi **Poin XP** otomatis setelah
  berkas kasus diunggah dan jenisnya diketahui dari engine; penulis boleh mengubah (tetap dibatasi 1–200 di skema dan di
  server). Tidak ada nama field teknis di layar.

## 7. Batas yang jujur
Server menjamin *apa yang dihitung*. Server tidak bisa menjamin pelajar tidak menghitung kunci di kalkulator, atau tidak
membuka jawaban di perangkat lalu membuang kejadian `lihatJawaban` dari antrean (engine berjalan di perangkat). Ini batas
yang sama dengan audit 8c butir 12 dan alasan tugas diperlakukan *open book*.

## 8. Jangan
- Membuka `insert` ke `percobaan_soal` atau `log_kegiatan` untuk klien, "sementara" sekalipun.
- Menyimpan atau memakai hasil benar/salah kiriman klien.
- Mengonversi `log_kegiatan` lama menjadi kejadian palsu (spec 2.5 butir 1).
- Membaca bobot dari revisi terbit saat menghitung; selalu dari revisi di kejadian.
