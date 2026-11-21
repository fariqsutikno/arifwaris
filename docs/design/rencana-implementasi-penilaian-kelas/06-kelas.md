# 06. Kelas dan soal bangkitan: mode tugas, kelas inti, generator jutaan soal, tugas otomatis, sesi langsung (G4, G7)

Induk: `00-induk.md` bagian 4 G7. Perilaku dan skema: spec 5.0–5.5 (tabel `kelas`, `anggota_kelas`, `tugas`, `sesi_soal`,
`koreksi_nilai`, `nilai_tambahan`, `pengajuan_pengajar`, `ButirTugas`, `KebijakanTugas`). Keamanan: audit 8c butir 1–12.
Alur pengguna: riset kelas bagian 7. Perkiraan: 22–36 orang-hari.

## 0. Syarat masuk G7

- [ ] G3 selesai (`percobaan_soal`, XP baru, UU PDP dasar). G6 bagian Ujian selesai (tugas bisa bermode Ujian).
- [ ] DPIA, keputusan usia pelajar, dan keputusan region (`01` bagian 2.7–2.9).
- [ ] Spike edge function lulus (`02` langkah 1); cara bundel tercatat di `hasil-spike-edge.md`.
- [ ] Mockup alur pelajar dan pengajar disetujui (bagian 2.4), memakai JTBD riset kelas bagian 3.
- [ ] Minimal satu dosen pilot bersedia mencoba (riset pasar bagian 8); jawabannya dipakai untuk menyesuaikan mockup.
- [ ] Pemilik menjawab spec 8.7 (engine berubah di tengah tugas) dan audit 10.8 (kalkulator saat tugas).

---

## 1. Fase P3: mode tugas di penilaian server (2–3 hari)

Edge function `catat-percobaan`, bundelnya, dan validasi ketat spec 2.6 sudah ada sejak G3 (`04` bagian 2) untuk latihan
mandiri. Di sini fungsi itu hanya diberi **mode tugas**:
- Masukan menambah `idTugas`; `sesi_soal` (bagian 2.1) wajib ada untuk pengguna itu. Revisi soal, benih soal pola, dan
  jangkar diambil dari `sesi_soal`/`tugas`; nilai kiriman klien untuk hal-hal itu diabaikan.
- Pemeriksaan tambahan: anggota aktif kelas, jendela waktu `mulai`/`tenggat` terhadap `now()` server, batas percobaan
  tahan balapan (audit 8c butir 3, 6, 8, 9).
- Uji `deno test`: kasus di bagian 2.5.

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
   `sesi_soal` (unik per tugas, pelajar, butir); benih jangkar `gen_random_uuid()`; soal pola: benih acak server
   (`gen_random_uuid()`) per pelajar bila `perPelajar`, atau satu benih acak per butir bila `sama`; tidak diturunkan dari
   id yang bisa ditebak (bagian 3.2).
4. RLS `percobaan_soal` diperluas: pengajar/asisten membaca baris dengan `tugas_id` milik kelasnya; tidak pernah baris
   mandiri (spec 5.2). Pelajar **tidak** bisa menyisipkan baris ber-`tugas_id` (hanya edge function, 8c butir 3).

### 2.2 Edge function
- `catat-percobaan` mode tugas: cek keanggotaan, jendela waktu (`now()` server, 8c butir 8), batas percobaan tahan balapan
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
| `catat-percobaan` (`deno test`) | batas percobaan tidak terlampaui oleh dua Kirim bersamaan; tenggat dari jam server; jangkar dari server dipakai walau klien mengirim jangkar lain |

### 2.6 Retensi dan hapus
- Hapus akun = kaskade semua baris pelajar, termasuk di kelas (spec 5.5). Pengajar diberi tahu di ekspor bahwa rekap yang
  sudah diunduh adalah tanggung jawab lembaganya.
- Data kelas dihapus 1 tahun sesudah `periode_selesai` (USULAN, `01` bagian 2.5); pengajar diingatkan mengekspor.

## 3. Soal bangkitan (generator jutaan soal) dan tugas otomatis

**Keputusan pemilik 2026-11-20:** soal dibangkitkan dulu dengan engine, disimpan, dan **terbuka untuk semua orang** di
Latihan, sehingga terlihat banyak sekali soal. Tujuannya pembiasaan lewat banyak latihan (*drill*); tidak ada yang bisa
menghafal atau menyalin sejuta soal. Pengajar bisa memilih **"buatkan pakai engine"** alih-alih memilih soal satu per satu.

Waktu: bagian 3.1–3.4 dikerjakan di **G4** (bagian dari "lengkapi materi dan latihan soal", sesudah G3, sebelum AMIN).
Bagian 3.5 (tugas otomatis) di G7 bersama kelas inti.

### 3.1 Pola (konten, ditinjau)
Jenis konten `pola_soal` (skema zod; masuk `JENIS_FIKIH`, wajib ditinjau): slug, versi, bab, topik, tingkat, `bobotXp`,
slot ahli waris dengan rentang jumlah, syarat atas keluaran engine (mis. "harus 'aul"), rentang harta, templat teks,
`refs`. Versi beku sesudah terbit. Skema membatasi jumlah slot dan jumlah orang per slot.

### 3.2 Membangkitkan (skrip, dijalankan pengembang)
1. `acakDariBenih`, `bangkitkanSoal(pola, benih)`, `verifikasiSoal(pola, kasus)` di `@waris/latihan` (murni, deterministik).
   Verifikasi: engine `OK`, `susunTabelSoal` didukung, batas B7, syarat pola. Kasus `PERLU_INPUT`, `TIDAK_DIDUKUNG`,
   titik blocked, atau di luar KB dibuang.
2. Skrip `scripts/bangkitkan-soal.ts <slug-pola> --jumlah N`: menjalankan benih 0, 1, 2, … sampai N soal lolos, membuang
   duplikat (susunan ahli waris + harta sama dianggap soal yang sama), lalu menulis baris katalog. Dijalankan lokal, hasil
   diunggah dengan migrasi data/`copy` ke tabel katalog (tidak lewat klien).
3. Laporan per pola: jumlah lolos, persentase gagal per alasan, sebaran jenis/tingkat. Pola dengan < 80% benih lolos
   ditinjau ulang (USULAN).

### 3.3 Katalog `soal_bangkitan`
```sql
create table soal_bangkitan (
  soal_id text primary key,            -- `${slugPola}@${versi}#${benih}`
  revisi_pola uuid not null references revisi,
  bab int not null, topik text not null, jenis_soal text not null, tingkat text not null,
  bobot_xp int not null check (bobot_xp between 1 and 200),
  nomor bigint generated always as identity,   -- nomor tampil "Soal 1.204.311"
  terbit boolean not null default true
);
-- select untuk anon dan authenticated (soal terbuka); tidak ada tulis untuk klien.
create index on soal_bangkitan (bab, jenis_soal, tingkat, nomor);
```
- Isi kasus **tidak disimpan**: selalu dibangkitkan ulang persis sama dari benih (klien untuk tampil, server untuk
  menilai). Perkiraan ±100 byte per baris dengan indeks → ±100 MB per sejuta soal: muat di Supabase Pro (8 GB), **tidak**
  di paket gratis (500 MB). Gerbang G4: pemilik memutuskan paket Supabase sebelum pembangkitan massal.
- Menarik soal = `terbit = false` (bukan hapus), supaya kejadian lama tetap merujuk soal yang ada.

### 3.4 Tampil di Latihan
- Daftar bernomor, dimuat per halaman dari server, dengan saringan bab/jenis/tingkat dan jumlah total ("1.204.311 soal").
  Aturan soal buta berlaku (`05` bagian 1): sebelum dikerjakan hanya nomor, bab, tingkat, jenis.
- Tombol/tautan "Soal acak" memilih dari saringan yang aktif. Soal serupa = soal lain dari pola yang sama (`05` bagian 4).
- Soal kurasi tetap dibundel dan bisa luring; soal bangkitan butuh daring kecuali yang sudah pernah dibuka (kasusnya
  dibangkitkan lokal dari benih, jadi cukup menyimpan `soal_id`).
- Ditandai "dibangkitkan otomatis, diperiksa engine"; tim keilmuan meninjau **pola** dan **sampel acak** 20 soal per pola
  sebelum pola terbit, bukan tiap soal.

### 3.5 Tugas otomatis "buatkan pakai engine" (G7)
- Butir tugas `{ jenis: 'otomatis', saring, sebaran }` (spec 5.1): pengajar mengisi bab/topik/jenis/tingkat dan jumlah
  butir; pratinjau beberapa contoh; boleh mengganti butir sebelum terbit.
- Saat pelajar membuka butir, `mulai_sesi_soal` memilih soal acak server (`gen_random_uuid()`) dari katalog yang cocok,
  sama untuk semua atau berbeda per pelajar, sebisa mungkin yang belum pernah dikerjakan pelajar itu, lalu menyimpannya di
  `sesi_soal`. Soal itu juga ada di katalog publik; konsisten dengan tugas *open book*.

### 3.6 Pengamanan

| Celah | Pengaman |
|---|---|
| Klien mengirim soal karangan atau mengaku benar | server hanya menerima `soalId` yang ada di katalog dan terbit; soal dibangkitkan ulang dan dinilai di server (spec 2.6 butir 7) |
| Pelajar memilih soal untuk tugas | soal tugas dipilih server dan dikunci di `sesi_soal` |
| Katalog diubah dari luar | tidak ada hak tulis klien; pembangkitan hanya lewat skrip pengembang + migrasi |
| Pola menghasilkan kasus di luar KB/blocked | engine menolak, soal tidak masuk katalog; pola wajib `refs` dan ditinjau |
| Pola dengan rentang besar membuat hitungan berat | batas skema + batas "dunia" taqdir engine; pembangkitan di skrip, bukan saat permintaan |
| Klien dan server membangkitkan soal berbeda | uji 1.000 benih sama persis di vitest dan `deno test`; versi engine di tiap kejadian; pola beku per versi |
| Ladang XP | satu kali per soal + penilaian server + batas laju. Tidak ada batas XP harian (pemilik: tujuan *drill*, menyalin sejuta soal tidak sanggup). Bila ukuran "tanda menebak" (`07` bagian 2) menunjukkan penyalahgunaan di papan, batas harian bisa dinyalakan sebagai satu konstanta |

### 3.7 Uji
Property test: setiap soal di katalog lolos `verifikasiSoal`; `bangkitkanSoal` sama di vitest dan `deno test`; pgTAP:
klien tidak bisa menulis `soal_bangkitan`, `anon` bisa membaca hanya yang terbit; `deno test`: `soalId` di luar katalog
ditolak.

## 4. Fase P4c: sesi langsung dan data pengajar lanjutan (5–8 hari)
- Sesi langsung: Supabase Realtime (broadcast) untuk soal yang sedang dibahas; layar proyektor menampilkan **agregat tanpa
  nama** per kolom, tanpa peringkat kecepatan (KL7). Kiriman tetap lewat `catat-percobaan`.
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
