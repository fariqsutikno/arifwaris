# 06. Kelas: penilaian server, kelas inti, pola soal, sesi langsung (G7)

Induk: `00-induk.md` bagian 4 G7. Perilaku dan skema: spec 5.0–5.5 (tabel `kelas`, `anggota_kelas`, `tugas`, `sesi_soal`,
`koreksi_nilai`, `nilai_tambahan`, `pengajuan_pengajar`, `ButirTugas`, `KebijakanTugas`). Keamanan: audit 8c butir 1–12.
Alur pengguna: riset kelas bagian 7. Perkiraan: 25–40 orang-hari.

## 0. Syarat masuk G7

- [ ] G3 selesai (`percobaan_soal`, XP baru, UU PDP dasar). G6 bagian Ujian selesai (tugas bisa bermode Ujian).
- [ ] DPIA, keputusan usia pelajar, dan keputusan region (`01` bagian 2.7–2.9).
- [ ] Spike edge function lulus (`02` langkah 1); cara bundel tercatat di `hasil-spike-edge.md`.
- [ ] Mockup alur pelajar dan pengajar disetujui (bagian 2.4), memakai JTBD riset kelas bagian 3.
- [ ] Minimal satu dosen pilot bersedia mencoba (riset pasar bagian 8); jawabannya dipakai untuk menyesuaikan mockup.
- [ ] Pemilik menjawab spec 8.7 (engine berubah di tengah tugas) dan audit 10.8 (kalkulator saat tugas).

---

## 1. Fase P3: penilaian server tanpa kelas (4–6 hari)

Dibangun dan diuji **sebelum** tabel kelas, supaya risiko teknis terbesar selesai lebih dulu.

1. **Bundel**: skrip `pnpm bundel:edge` (cara dari hasil spike) membuat satu berkas ESM `@waris/latihan` + engine untuk edge
   function, dengan `__VERSI_ENGINE__` disuntik (`02` langkah 5.2). Bundel dibuat saat deploy, tidak di-commit.
2. **Edge function `nilai-percobaan`** (pola `ai-bantu/index.ts`: klien anon + Authorization untuk membaca dengan RLS,
   service role hanya untuk menulis hasil yang sudah diverifikasi; audit 8c butir 4):
   - Masukan: `{ id, idSesiSoal, soalId, revisiSoal, aksi, isian, mode, konteks }`. **Tanpa `user_id`** (8c butir 1).
   - Memuat revisi soal dari basis data (bukan dari klien), `muatSoal` → `jalankan` → `susunTabelSoal` →
     `nilaiSemuaKolom` dengan jangkar dari benih server (mandiri: benih dikirim klien dan dicatat, karena latihan mandiri
     memang tidak berisiko; tugas: dari `sesi_soal`, bagian 2).
   - Menyisipkan baris `percobaan_soal` lengkap dengan `hasil_kolom_server`, `benar_semua_server`; idempoten per `id`
     (8c butir 7).
3. **Mandiri saat daring** memakai fungsi ini (bukan sisip langsung); saat luring tetap sisip langsung lewat antrean tanpa
   kolom server. Fungsi XP memakai kolom server bila ada (`04` bagian 4).
4. Uji: `deno test` untuk fungsi (tanpa JWT ditolak; id sama dua kali → hasil sama, satu baris; hasil untuk fixture B7 sama
   dengan vitest); uji beban kecil (100 permintaan berurutan) untuk melihat waktu respons.

## 2. Fase P4: kelas inti (12–18 hari)

### 2.1 Migrasi (urutan berkas)
1. `…_pengajuan_pengajar.sql`: tabel spec 5.4b, bucket penyimpanan privat `verifikasi-pengajar` (hanya pengunggah dan
   peninjau), fungsi `boleh_membuat_kelas()`, fungsi tinjau untuk admin portal (`setujui_pengajar(id)`,
   `tolak_pengajar(id, alasan)`), jadwal penghapusan berkas 30 hari sesudah diputuskan (D12) di `jadwal-retensi.sql`.
2. `…_kelas.sql`: `kelas`, `anggota_kelas`, `peran_di_kelas(kelas_id)` (`security definer`, `set search_path`, dicabut dari
   `anon`), RPC `buat_kelas(...)` (cek `boleh_membuat_kelas()` dan batas paket: Pengajar Gratis maks 20 pelajar, D2, lewat
   satu konstanta sampai `hakFitur` ada di `07`), `gabung_kelas(kode)` (batas laju 10 per jam per pengguna, 8c butir 11;
   catat `persetujuan` `usia_18` dan pemberitahuan pantauan periode/lencana, D14, D20), `atur_kode_gabung(kelas_id)`
   (reset/matikan), `keluar_kelas(kelas_id)`, `daftar_anggota(kelas_id)` (email hanya untuk pengajar/asisten, pola
   `daftar_peran`).
3. `…_tugas.sql`: `tugas`, `sesi_soal`, `koreksi_nilai`, `nilai_tambahan`; `alter table percobaan_soal add column
   tugas_id uuid references tugas on delete set null` (spec 2.4 menyebutnya `id_penugasan`; pakai `tugas_id` supaya sama
   dengan `sesi_soal.tugas_id`, dan perbarui spec). RPC `terbitkan_tugas(id)` mengunci revisi tiap butir.
   RPC `mulai_sesi_soal(tugas_id, indeks_butir)`: cek anggota aktif + jendela waktu server; buat atau kembalikan
   `sesi_soal` (unik per tugas, pelajar, butir); benih jangkar `gen_random_uuid()`; soal pola: benih turunan (tugas,
   pelajar, butir) bila `perPelajar`.
4. RLS `percobaan_soal` diperluas: pengajar/asisten membaca baris dengan `tugas_id` milik kelasnya; tidak pernah baris
   mandiri (spec 5.2). Pelajar **tidak** bisa menyisipkan baris ber-`tugas_id` (hanya edge function, 8c butir 3).

### 2.2 Edge function
- `nilai-percobaan` mode tugas: cek keanggotaan, jendela waktu (`now()` server, 8c butir 8), batas percobaan tahan balapan
  (`select … for update` pada `sesi_soal` atau `unique (sesi, nomor_percobaan)`, 8c butir 6), jangkar dan revisi dari
  `sesi_soal`/`tugas` (8c butir 9), batas laju (8c butir 10).
- `rekap-kelas`: `nilaiTugas(kejadian, kebijakan)` dan `statusTugas(...)` dari `@waris/latihan` (satu sumber aturan, tidak
  disalin ke SQL), koreksi terakhir dan nilai tambahan digabung; keluaran JSON untuk layar dan CSV untuk ekspor.
  XLSX menyusul bila dosen pilot memintanya.

### 2.3 Fungsi murni baru di `@waris/latihan`
`nilaiTugas`, `statusTugas`, `ringkasanPerKolom(kejadianTugas)` (berapa pelajar salah di tiap kolom/sel, untuk "di mana
kelas salah"), `nilaiEfektif(hasilServer, koreksi[])`. Uji tabel kasus untuk tiap `ambilNilai`, `terlambat`,
`bolehLihatJawaban`, `rilisNilai`.

### 2.4 Layar (mockup dulu; kosakata riset kelas 1b: Kelas, Tugas, Nilai, Pengajar, Asisten, Pelajar)
- **Pelajar**: menu **Kelas** di navigasi; gabung lewat kode atau tautan `#/gabung/{kode}` (≤ 2 ketukan sesudah login);
  daftar **Tugas** lintas kelas terurut tenggat; halaman tugas (aturan di atas, tanpa XP/streak/lencana, spec 4A.8);
  mengerjakan dengan `TabelLatihan` mode dari kebijakan dan hero tugas (spec 1.3); **Nilai** dan pembahasan sesuai rilis;
  **Arsip**. Kirim luring → "Belum terkirim, akan dikirim saat tersambung" (spec 5.5).
- **Pengajar**: Ajukan akses pengajar; Buat kelas; anggota + kode/tautan; Buat tugas (pilih soal kurasi dari katalog yang
  memakai aturan soal buta, kebijakan dengan bawaan, pemberitahuan *open book*); Pantau (status per pelajar, ringkasan per
  kolom, isian); Koreksi (alasan wajib); Rilis; Ekspor; pantauan periode (D20) dan lencana (D14).
- **Admin portal**: antrean pengajuan pengajar (Menunggu/Disetujui/Ditolak + alasan), tanpa kode teknis di layar.

### 2.5 Uji keamanan wajib (pgTAP + `deno test`; kriteria terima audit 8c)
| Berkas | Membuktikan |
|---|---|
| `30_kelas_rls.test.sql` | pelajar A tidak membaca percobaan/nilai pelajar B sekelas; pengajar X tidak membaca kelas Y; pengajar tidak membaca kejadian mandiri; pelajar tidak membaca email anggota; anggota yang keluar langsung kehilangan akses |
| `31_kelas_tulis.test.sql` | pelajar tidak bisa menyisipkan `percobaan_soal` ber-`tugas_id`, `koreksi_nilai`, `nilai_tambahan`, `sesi_soal`; tidak ada `update`/`delete` pada nilai |
| `32_gabung.test.sql` | batas laju gabung; kode yang dimatikan menolak; kelas penuh (paket Gratis 20) menolak dengan alasan |
| `33_pengajar.test.sql` | tanpa pengajuan disetujui tidak bisa membuat kelas; berkas verifikasi tidak terbaca pengguna lain |
| `nilai-percobaan` (`deno test`) | batas percobaan tidak terlampaui oleh dua Kirim bersamaan; tenggat dari jam server; jangkar dari server dipakai walau klien mengirim jangkar lain |

### 2.6 Retensi dan hapus
- Hapus akun = kaskade semua baris pelajar, termasuk di kelas (spec 5.5). Pengajar diberi tahu di ekspor bahwa rekap yang
  sudah diunduh adalah tanggung jawab lembaganya.
- Data kelas dihapus 1 tahun sesudah `periode_selesai` (USULAN, `01` bagian 2.5); pengajar diingatkan mengekspor.

## 3. Fase P4b: pola soal (6–10 hari + pola dari tim keilmuan)

Model: riset kelas 5b. Langkah:
1. Jenis konten `pola_soal` (skema zod; ditinjau seperti revisi lain): slug, versi, bab, topik, tingkat, `bobotXp`, slot
   ahli waris dengan rentang jumlah, syarat atas keluaran engine (mis. "harus 'aul"), rentang harta, templat teks, `refs`.
2. `acakDariBenih(benih)` di `@waris/latihan`: PRNG deterministik kecil (mis. mulberry32 dari 32 bit pertama benih), tanpa
   `Math.random`.
3. `bangkitkanSoal(pola, benih) → Kasus | GAGAL` dan `verifikasiSoal(pola, kasus)`: engine `OK`, `susunTabelSoal` didukung,
   batas B7, syarat pola. Benih yang gagal dilewati secara deterministik (benih berikutnya), dengan batas percobaan.
4. `muatSoal` cabang `pola` aktif (`02` bagian 6.3). `IdSoal` pola = `${slug}@${versi}#${benih}`.
5. Katalog pola untuk pengajar dan pelajar (saring bab/topik/jenis/tingkat); pratinjau beberapa benih contoh.
6. Portal: tinjau pola dengan pratinjau 10 benih dan persentase benih yang lolos verifikasi; pola < 80% lolos ditolak
   (USULAN).
7. XP soal pola hanya dari penilaian server (`04` bagian 4). Statistik per pola dari kejadian menandai pola yang variannya
   terlalu beragam (riset kelas 5a).
8. Uji: `bangkitkanSoal` sama persis di vitest dan `deno test` untuk 1.000 benih; property test: semua soal hasil pola yang
   lolos verifikasi punya kunci tabel.

## 4. Fase P4c: sesi langsung dan data pengajar lanjutan (5–8 hari)
- Sesi langsung: Supabase Realtime (broadcast) untuk soal yang sedang dibahas; layar proyektor menampilkan **agregat tanpa
  nama** per kolom, tanpa peringkat kecepatan (KL7). Kiriman tetap lewat `nilai-percobaan`.
- Asisten pengajar (diundang per kelas, hak spec 5.2); salin tugas ke periode baru (pola dengan benih baru).
- Data perlakuan lapis 2–3 (spec 5.4c): matriks pelajar × topik dan profil 5 dimensi dalam rentang periode, kelompok
  kesalahan; dihitung di edge function memakai `kemahiranTopik` dan `profilKecakapan` yang sama dengan tampilan pribadi
  (`05` bagian 5).

## 5. Kriteria selesai G7
- [ ] Semua uji bagian 2.5 lulus; penasihat keamanan Supabase tanpa temuan baru.
- [ ] Dosen pilot menjalankan satu tugas utuh: buat kelas → pelajar gabung → kerjakan → koreksi → rilis → ekspor.
- [ ] Nilai pelajar dapat dihitung ulang dari `percobaan_soal` + `koreksi_nilai` + kebijakan tugas, hasilnya sama dengan rekap.
- [ ] Layar tugas tidak memuat XP, streak, lencana, atau saran (spec 4A.8).

## 6. Jangan
- Parameter `user_id` di RPC atau edge function (8c butir 1).
- Menyalin aturan nilai ke SQL; nilai dihitung di edge function dengan fungsi paket yang sama.
- Memakai enum `peran` portal untuk pengajar (audit T5).
- Membangun lembaga, pembayaran, atau undangan email di G7 (itu `07`).
