# 04. Kejadian di server dan XP baru (G3, fase P1)

Induk: `00-induk.md` bagian 4 G3. Perilaku: spec 2.3–2.5 (skema, migrasi data), 3.1–3.2 (aturan XP, bobot). Audit T2, T3, T10, T12.
Prasyarat: G1 (kejadian lokal mengantre), G2 (semua jenis soal menghasilkan kejadian seragam).
Perkiraan: 4–6 orang-hari.

**Selesai bila:**
- [ ] Kejadian dari antrean terkirim ke `percobaan_soal`, append-only, tidak dobel saat dikirim ulang.
- [ ] XP dan hari aktif dihitung dari `log_kegiatan` (sebelum peralihan) ∪ `percobaan_soal` (sesudahnya) dengan aturan
      spec 3.1; total XP setiap pengguna lama **tidak berubah** pada hari peralihan (uji pgTAP).
- [ ] Lihat jawaban sebelum benar pertama membakar XP soal itu; ulang soal = 0 XP tapi tetap hari aktif.
- [ ] `bobotXp` ada di skema soal, terisi otomatis di portal ("Poin XP"), dan XP dibaca dari revisi yang dikerjakan.
- [ ] XP palsu terbatas: paling banyak Σ `bobotXp` semua soal kurasi, satu kali per soal (bagian 4).

---

## 1. Migrasi `…_percobaan_soal.sql`

- Tabel persis spec 2.4, **tanpa** kolom `id_penugasan` (ditambah di `06` bersama tabel tugas), dan dengan aksi tambahan
  `'buka'` di `check` kolom `aksi` (`05` bagian 2: waktu pengerjaan yang dipercaya untuk lencana kecepatan dan kelancaran).
- RLS: `insert` dan `select` baris sendiri (`user_id = auth.uid()`); tidak ada `update`/`delete` untuk `authenticated`.
  Kolom `hasil_kolom_server`, `benar_semua_server`, `diterima_pada` tidak di-grant untuk ditulis (pola
  `20260927000003_akun.sql:38-39`).
- `revisi_soal references revisi` (soal kurasi). Kejadian dari kartu lama tanpa revisi tidak dikirim ke tabel ini; tetap
  lewat `log_kegiatan`.
- **Batas laju** (audit 8c butir 10): trigger `before insert` menolak bila pengguna sudah menyisipkan > 60 baris dalam
  60 detik terakhir (USULAN). Galat batas laju membuat entri tetap di antrean dan dicoba lagi nanti.
- Indeks `(user_id, soal_id, diterima_pada)` sesuai spec.
- Uji pgTAP `20_percobaan_soal.test.sql`: tidak bisa membaca/menulis milik orang lain; tidak bisa `update`/`delete`;
  tidak bisa menulis kolom server; id sama dua kali → baris kedua diabaikan (klien memakai `ignoreDuplicates`); batas laju.

## 2. Repositori dan antrean

- `RepositoriPengguna.simpanPercobaan(kejadian: KejadianPercobaan[])` (sisip berkelompok, `ignoreDuplicates`) dan
  `bacaPercobaan(sejak?: string)` di `packages/data/src/antarmuka.ts`; implementasi Supabase dan memori.
- Pemetaan kejadian ↔ baris di `packages/data/src/supabase/peta.ts` (nama kolom snake_case, `aksi: 'lihatJawaban'` ↔
  `'lihat_jawaban'`, `jenisSoal: 'dzawilArham'` ↔ `'dzawil_arham'`). Pemetaan ini satu-satunya tempat terjemahan nama.
- Antrean: pengirim berhenti melewati entri `percobaan` (`02` langkah 5.3) dan mengirimnya berurutan.
- **Entri racun** (audit T10): entri yang ditolak server karena bentuknya (bukan karena jaringan/batas laju) dipindah ke
  `arif-waris:antrean-gagal` (maks 50) supaya tidak menyumbat antrean selamanya; ditampilkan sebagai jumlah di Profil.
- Login: `gabung.ts` menarik `bacaPercobaan()` dan menggabung per id dengan lokal (gabungan himpunan).

## 3. Fungsi XP dan hari aktif

### 3.1 Satu sumber aturan, dua bahasa
Aturan spec 3.1 ditulis dua kali: `xpSoal()` TS di `@waris/latihan` (dipakai klien untuk tampilan langsung) dan SQL di
server (sumber kebenaran papan dan streak). Supaya tidak menyimpang:
- Berkas kasus uji tunggal `packages/latihan/src/__tests__/xp-kasus.json` (urutan kejadian → XP yang diharapkan), mencakup
  tiap butir spec 3.1 (benar pertama, lihat jawaban sebelum/sesudah benar, ulang, Ujian parsial lalu Latihan benar, Ujian
  ulang, revisi berbeda).
- vitest membacanya langsung. Skrip `scripts/xp-kasus-ke-sql.ts` (jalankan dengan `vite-node`, pola `pnpm db:refs`)
  menulis `supabase/tests/database/21_xp_kasus.test.sql` dari JSON yang sama; uji CI gagal bila berkas SQL tidak sama
  dengan hasil skrip.

### 3.2 SQL
- Fungsi `xp_percobaan(p_user uuid)` (`security definer` hanya bila perlu, `set search_path`, tidak diekspos ke `anon`)
  menerapkan spec 3.1 per `soal_id`, membaca `bobotXp` dari `revisi.isi ->> 'bobotXp'` milik `revisi_soal` kejadian
  benar pertama; cadangan `xp_konten` untuk revisi lama tanpa `bobotXp`.
- Peralihan: soal yang sudah memberi XP lewat `log_kegiatan` tidak memberi lagi lewat `percobaan_soal` (spec 2.5 butir 2).
  Gabungkan di fungsi XP yang dipakai papan (`peristiwa_xp`, `20260927000006_peringkat.sql`).
- `hari_aktif`: tambahkan `percobaan_soal.diterima_pada` ke sumber hari aktif. Sesudah itu klien **berhenti** mengirim
  baris `log_kegiatan` untuk soal tabel (kuis konsep dan pelajaran tetap).
- `progres_latihan.benar` diisi ulang sekali sebagai "pernah benar" (`bool_or(benar)` dari `log_kegiatan` per soal),
  spec 2.5 butir 3.
- Biaya (audit T12): hitung per pengguna saat diminta, papan hanya untuk peserta opt-in (`01` 2.1). Bila lambat di data
  nyata, baru tambah tabel ringkasan yang diperbarui trigger.
  `-- ponytail: XP dihitung ulang per permintaan; tabel ringkasan bila papan > ±1 detik`.

## 4. Kenapa latihan mandiri tidak dinilai server dulu (gerbang G3, spec 8.6)

Kejadian mandiri tetap ditulis klien, jadi `benar_semua_klien` masih bisa dipalsukan. Yang berubah: XP hanya bisa diklaim
**sekali per soal** dengan bobot dari revisinya, dan dibatasi laju. Dengan soal kurasi yang jumlahnya terbatas, XP palsu
paling banyak Σ `bobotXp` semua soal; tidak lagi tak terbatas seperti `log_kegiatan` sekarang (T2).

Dua titik yang mengubah keputusan ini:
1. Saat fase P3 ada (`06` bagian 1), fungsi XP memakai `benar_semua_server` bila terisi. Mengaktifkan penilaian server untuk
   mandiri cukup dengan memanggil edge function yang sama dari klien saat daring.
2. **Soal pola** (fase P4b) membuat jumlah soal tak terbatas. Sejak saat itu XP dari soal pola **hanya** dihitung dari
   `benar_semua_server`; tanpa itu, XP palsu kembali tak terbatas.

## 5. `bobotXp` di konten dan portal

- Skema zod `soal_hitung` (`packages/content/src/skema.ts`, ±baris 103): `bobotXp: z.number().int().min(1).max(200).optional()`.
- Tabel bobot usulan spec 3.2 menjadi satu konstanta `BOBOT_XP_USULAN` di `@waris/latihan` (jenis + tingkat/jumlah mayit →
  angka). Portal memakainya untuk mengisi field **Poin XP** secara otomatis setelah berkas kasus diunggah dan jenisnya
  diketahui dari engine; penulis boleh mengubah. Tidak ada nama field teknis di layar.
- Revisi lama tanpa `bobotXp` memakai `xp_konten` (sama dengan sekarang), jadi XP soal biasa tidak bergeser.

## 6. Jangan
- Mengonversi `log_kegiatan` lama menjadi kejadian palsu (spec 2.5 butir 1).
- Membaca bobot dari revisi terbit saat menghitung (XP lama bergeser diam-diam); selalu dari revisi di kejadian.
- Memberi XP dari soal pola tanpa penilaian server.
