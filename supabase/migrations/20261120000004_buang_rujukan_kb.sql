-- supabase/migrations/20261120000004_buang_rujukan_kb.sql
-- Sisa fitur rujukan_kb yang di-revert di repo tetapi masih ada di produksi (keputusan pemilik 2026-11-20): buang 129 entri
-- jenis 'rujukan' (revisinya ikut terhapus lewat cascade) dan kembalikan constraint ke bentuk repo. daftar_refs TIDAK disentuh:
-- tabel itu registri kode rujukan yang dipakai konten lain. Di basis data dari nol tidak mengubah apa-apa.
delete from entri_konten where jenis = 'rujukan';
alter table entri_konten drop constraint if exists rujukan_slug_kode;
alter table entri_konten drop constraint entri_konten_jenis_check;
alter table entri_konten add constraint entri_konten_jenis_check check (jenis in (
  'modul', 'materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'kitab', 'syahid',
  'glosarium_ar', 'ahwal', 'teks_edukasi', 'cheatsheet'));
