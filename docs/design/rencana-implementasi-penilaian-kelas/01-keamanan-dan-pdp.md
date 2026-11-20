# 01. Keamanan produksi dan UU PDP

Induk: `00-induk.md`. Isi temuan: audit bagian 8 (K1–K8) dan 9 (PDP-1 … PDP-10 = audit 9b P1–P10).
Gelombang: G0 (bagian 1), G3 (bagian 2.1–2.6), syarat AMIN (2.2, 2.5), syarat kelas (2.7–2.9).

Aturan umum dokumen ini:
- Setiap perubahan basis data = migrasi baru di `supabase/migrations/` + uji pgTAP di `supabase/tests/database/`
  (nomor berkas uji melanjutkan yang ada, terakhir `15_bagikan.test.sql`). `pnpm db:reset && pnpm db:tes` lulus dari nol.
- **Tidak ada perubahan produksi tanpa izin pemilik** per perubahan (dasbor, `supabase db push`, edge function).
- Ini bukan nasihat hukum. Teks kebijakan privasi sebaiknya ditinjau konsultan sebelum kelas diluncurkan ke lembaga.

---

## 1. G0: keamanan produksi (1–2 hari)

### 1.1 K1: penyedia login Email (5 menit + 1 jam uji)
1. **Pemilik** membuka dasbor Supabase → Authentication → Providers → Email → matikan (UI hanya memakai Google,
   `packages/data/src/supabase/index.ts:252`). Bila ingin tetap ada, nyalakan "Confirm email".
2. Samakan lokal: `supabase/config.toml` bagian `[auth.email]` → `enable_signup = false`.
3. Pemilik memeriksa akun ber-identitas `email` yang sudah ada (audit: 1 akun). Bila bukan akun uji miliknya, hapus.
4. Pertahanan berlapis di SQL (migrasi `…_email_terverifikasi.sql`): `baca_kasus_dibagikan` hanya mencocokkan email bila
   `auth.jwt() -> 'app_metadata' ->> 'provider' = 'google'` (sekarang mencocokkan `auth.jwt() ->> 'email'` apa adanya,
   `20261003000001_bagikan_kasus.sql:29,37`). Fungsi kelas yang memakai email kelak memakai aturan yang sama.
5. Uji pgTAP `16_email_terverifikasi.test.sql`: JWT dengan provider `email` tidak bisa membaca kasus berakses `email`;
   JWT provider `google` dengan email sama bisa.

### 1.2 K2: migrasi produksi menyimpang
Masalah: versi `20260928000002` di produksi tercatat sebagai `rujukan_kb` (sudah di-*revert* di repo), sedangkan repo berisi
`ajuan_diksi` di versi yang sama yang tidak pernah terpasang. `supabase db push` akan melewatinya karena versinya dianggap
sudah terpasang.

Langkah:
1. Migrasi baru `…_selaraskan_ajuan_diksi.sql` yang **idempoten**: `create or replace function` untuk `perbarui_ajuan`,
   `perbarui_ajuan_diksi`, `terbitkan_langsung_diksi` (salin dari `20260928000002_ajuan_diksi.sql`), lalu buang sisa
   `rujukan_kb` dengan `drop trigger if exists daftarkan_rujukan_terbit …; drop function if exists …; drop table if exists …`.
   Di basis data yang direset dari nol, migrasi ini tidak mengubah apa-apa.
2. Uji pgTAP `17_selaras.test.sql`: tiga fungsi ada, trigger `daftarkan_rujukan_terbit` tidak ada.
3. Sebelum push, cek produksi hanya-baca (`list_migrations`, `pg_proc`) bahwa tidak ada perubahan lain yang belum tercatat.
4. **Pemilik** mengizinkan `supabase db push`. Sesudahnya ulangi cek hanya-baca.
5. Pencegahan: catat di `docs/` langkah "cek `list_migrations` produksi = daftar berkas repo" sebelum tiap push. Pemeriksaan
   otomatis di CI menyusul bila CI diberi akses baca proyek (belum ada).

### 1.3 K4–K6: pengerasan murah (satu migrasi `…_pengerasan.sql`, satu uji `18_pengerasan.test.sql`)
- **K4**: `revoke execute on function … from public, anon` untuk 14 fungsi portal yang ditandai penasihat
  `anon_security_definer_function_executable` (ambil daftar persisnya dari `get_advisors` saat mengerjakan; pola
  `20260927000005_atur_urutan_cabut_anon.sql`). Uji: `has_function_privilege('anon', '<fungsi>', 'execute')` = false.
- **K5**: `alter function … set search_path = public` untuk 18 fungsi yang ditandai `function_search_path_mutable`.
- **K6**: penulis hanya boleh mengubah isi drafnya:
  `revoke update on revisi, revisi_diksi from authenticated;`
  `grant update (isi, refs) on revisi to authenticated;`
  `grant update (id_teks, ar_teks, catatan) on revisi_diksi to authenticated;`
  (kolom dari `20260926000001_konten.sql:34-68`). Sebelum menulis, pastikan perpindahan status memang lewat fungsi
  `security definer` dan tidak lewat `update` langsung dari portal (`packages/data/src/supabase/index.ts`); bila ada yang
  lewat `update` langsung, ganti dulu dengan fungsi. Uji: penulis gagal mengubah `dibuat_oleh`, `entri_id`, `status`.
- K7 diterima sebagai keputusan (keberadaan slug bisa diperiksa). K8 gugur bila K1 mematikan penyedia Email.

**Kriteria selesai G0:** penasihat keamanan produksi tidak lagi menampilkan K1, K4, K5; `list_migrations` produksi sama
dengan repo; semua uji pgTAP lulus dari reset.

---

## 2. UU PDP

### 2.1 Papan peringkat opt-in (PDP-2; boleh sebelum G3 bila pemilik setuju; 0,5–1 hari)
- Migrasi `…_peringkat_opt_in.sql`: `alter table profil alter column ikut_papan_peringkat set default false;`
  `update profil set ikut_papan_peringkat = false;`. Semua baris di-*reset* karena migrasi opt-out
  (`20260928000001_peringkat_otomatis.sql:6-8`) menimpa semua pilihan dengan `true`, jadi pilihan eksplisit tidak bisa
  dibedakan. Pengguna tanpa baris `profil` tidak tampil (ubah `papan_peringkat_pada` agar hanya `ikut_papan_peringkat = true`).
- Halaman Peringkat: kalimat ajakan + tautan "Tampilkan namaku di papan" (aksi sekunder = tautan, aturan UI). Pilihan
  dicatat lewat `atur_persetujuan('papan_peringkat', true)` (2.2).
- Uji pgTAP di `06_peringkat.test.sql`: pengguna baru tidak muncul di papan; muncul setelah ikut.

### 2.2 Kebijakan privasi dan persetujuan terekam (PDP-1, PDP-10; syarat AMIN; 2–3 hari + teks pemilik)
**Isi halaman** `#/privasi` (rute baru di `apps/web/src/rute.ts`), semua butir Pasal 21 ayat (1): dasar pemrosesan,
tujuan, jenis data (audit 9a), retensi (2.5), lokasi server (2.7), daftar prosesor (Supabase, Google, layanan Web Push
peramban, penyedia LLM untuk portal dan **AMIN**), hak subjek (akses, salinan, hapus, tarik persetujuan, keberatan) dan cara
memakainya (2.3), kontak pengendali. Teksnya konten yang bisa diedit di portal (jenis `teks_edukasi`, tanpa kode teknis
di layar, sesuai aturan admin), versinya = `versiTerbit` revisi.

**Tabel** (migrasi `…_persetujuan.sql`):
```sql
create table persetujuan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  jenis text not null check (jenis in ('kebijakan_privasi','papan_peringkat','push','ai_konteks','usia_18','kelas_berbagi_nilai')),
  versi int not null,            -- versiTerbit kebijakan yang dibaca saat memilih
  setuju boolean not null,
  pada timestamptz not null default now()
);
-- append-only: hanya select + insert milik sendiri; tidak ada update/delete
```
- Fungsi `atur_persetujuan(p_jenis text, p_setuju boolean, p_versi int)` (`security definer`, `set search_path`, dicabut
  dari `anon`): sisip baris, lalu menyetel keadaan efektif yang perlu cepat dibaca (`profil.ikut_papan_peringkat` untuk
  `papan_peringkat`). Keadaan efektif jenis lain = baris terakhir per jenis (`persetujuan_saya()` mengembalikan peta jenis →
  setuju).
- Jenis `ai_konteks` dipakai AMIN: tanpa persetujuan ini AMIN hanya menerima pertanyaan teks, tanpa konteks halaman.
- Repositori: `RepositoriPengguna.aturPersetujuan`, `bacaPersetujuan` (`packages/data/src/antarmuka.ts`), implementasi
  Supabase + memori untuk uji.
- **UI** (perlu mockup kecil dulu, aturan "UI lewat JTBD/HMW"): dialog sekali setelah login pertama dan setiap versi
  kebijakan naik; isi ringkas + tautan "Baca kebijakan lengkap"; tombol utama **Setuju**. Menolak = keluar dari akun;
  kalkulator dan belajar tanpa akun tetap jalan.
- Uji: pgTAP `19_persetujuan.test.sql` (append-only, tidak bisa membaca milik orang lain, `atur_persetujuan` menyetel
  profil); uji komponen dialog muncul sekali per versi.

### 2.3 Hapus akun dan unduh data (PDP-3; 2 hari)
- **Unduh**: fungsi `unduh_data_saya() returns jsonb` (`security definer`, memakai `auth.uid()`, tanpa parameter
  `user_id`) mengumpulkan semua baris milik pengguna dari tiap tabel data pengguna (`profil`, `log_kegiatan`, `progres_*`,
  `riwayat_hitung`, `kasus_dibagikan`, `langganan_push`, `persetujuan`, dan tabel baru `percobaan_soal` dari `04`).
  Uji pgTAP: hanya baris milik pemanggil.
- **Hapus**: edge function `hapus-akun`: verifikasi JWT, lalu service role `auth.admin.deleteUser(uid)`. Semua tabel data
  pengguna berelasi `on delete cascade` ke `auth.users`; uji pgTAP memastikan setiap tabel data pengguna (termasuk tabel baru
  di `04` dan `06`) punya `on delete cascade`, supaya tabel yang ditambah kelak tidak lupa. Ini juga berlaku untuk data
  kelas (spec 5.5).
- **UI** di `apps/web/src/akun/ModalProfil.tsx`: tautan **Unduh dataku** (berkas JSON) dan tautan merah **Hapus akun**
  (dialog tahan yang sudah dipakai di Lihat jawaban). Sesudah hapus: `aturAkunLokal(null)`; data lokal di perangkat tetap,
  dengan pilihan "Hapus juga dari perangkat ini".
- Kedua hak dipenuhi seketika, jadi tenggat 3 × 24 jam (Pasal 32) terpenuhi.

### 2.4 Minimisasi data kasus (PDP-4; 0,5 hari)
Saat membagikan tautan kasus, pilihan "sembunyikan nama" menyala sebagai bawaan (lembar Bagikan sudah punya
`sembunyiNominal`). Nama orang di kasus tetap tidak wajib.

### 2.5 Retensi (PDP-6; 1 hari; angka = USULAN pemilik)
Satu berkas `supabase/jadwal-retensi.sql` (pola `supabase/jadwal-push.sql`, `pg_cron`):

| Data | Retensi | Cara |
|---|---|---|
| `kirim_push` | 90 hari | hapus terjadwal |
| `pemakaian_ai` | 1 tahun | hapus terjadwal |
| Log percakapan AMIN (tabel baru di AMIN) | 90 hari, atau tidak disimpan sama sekali | ditetapkan **sebelum** AMIN |
| `kasus_dibagikan` tidak dibuka 1 tahun | dihapus | hapus terjadwal; pemberitahuan menunggu jalur email (G8) |
| Akun tak aktif 3 tahun | dihapus sesudah pemberitahuan | **ditunda** sampai ada pengiriman email (G8); tanpa pemberitahuan tidak dijalankan |
| `percobaan_soal` mandiri | selama akun ada | data belajar milik pengguna; hapus akun = hapus |
| Data kelas | dihapus 1 tahun sesudah periode berakhir; pengajar diingatkan mengekspor | `06` bagian 2.6 |

### 2.6 Prosedur insiden (PDP-7; 0,5 hari)
`docs/operasional/runbook-insiden-data.md`: siapa yang dihubungi, cara menilai cakupan (tabel, jumlah subjek, jenis data),
templat surat ke pengguna dan ke lembaga, tenggat 3 × 24 jam (Pasal 46), daftar langkah teknis (cabut kunci, rotasi
service role, audit log Supabase).

### 2.7 Lokasi server (PDP-5; keputusan sebelum G7)
- Fakta: proyek "fariqsutikno's Project" di `ap-south-1` (Mumbai). Pemilik memastikan ini produksi.
- [Dugaan, cek dokumen Supabase saat memutuskan] Supabase tidak memindahkan region di tempat; pindah = proyek baru +
  salin data + ganti kunci di build. Juga [Dugaan] belum ada region di Indonesia, jadi pindah ke Singapura **tidak
  menghapus** kewajiban Pasal 56 (tetap transfer ke luar wilayah); yang berubah hanya latensi.
- Jadi jalur minimal: pastikan DPA Supabase berlaku, sebut lokasi dan dasar transfer di kebijakan privasi. Pindah region
  hanya bila alasan latensi/biaya, dan **sebelum** data kelas masuk.

### 2.8 DPIA (PDP-4, PDP-8; 1–2 hari; syarat G7)
`docs/operasional/dpia-kelas.md`: data spesifik (kasus keluarga), data anak, penskoran, profil kecakapan; risiko dan
mitigasi dari audit 8c dan dokumen ini; keputusan usia (2.9). Ditulis sebelum kelas dibuka ke lembaga.

### 2.9 Usia pelajar (PDP-8; keputusan pemilik di gerbang G7)
USULAN: fase pertama kelas hanya untuk pelajar ≥ 18 tahun. Saat gabung kelas, kotak centang "Saya berusia 18 tahun atau
lebih" dicatat sebagai `persetujuan` jenis `usia_18`. Madrasah/pesantren menunggu fase lembaga (G8), dengan lembaga sebagai
pihak yang mengumpulkan persetujuan wali.

---

## 3. Kriteria selesai

- [ ] G0: bagian 1 terpenuhi, diverifikasi di produksi dengan alat hanya-baca.
- [ ] Papan peringkat: pengguna baru tidak tampil; nama baru tampil setelah memilih ikut.
- [ ] Kebijakan privasi memuat semua butir Pasal 21 ayat (1) dan daftar prosesor termasuk penyedia LLM.
- [ ] Persetujuan append-only; menarik persetujuan langsung berlaku (papan, push, `ai_konteks`).
- [ ] Unduh data berisi semua tabel data pengguna; hapus akun menghapus semua baris (uji pgTAP per tabel).
- [ ] Jadwal retensi terpasang; retensi log AMIN ditetapkan sebelum AMIN dimulai.
- [ ] Runbook insiden ada; DPIA dan keputusan usia ada sebelum G7.
