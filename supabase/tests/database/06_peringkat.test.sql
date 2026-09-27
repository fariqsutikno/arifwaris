-- supabase/tests/database/06_peringkat.test.sql
-- Spec tahap 5 (streak & papan peringkat): XP pertama kali per konten terbit menurut tingkat, bonus hari aktif, batas
-- hari per zona waktu dengan toleransi 00:00–01:59, minggu WIB, papan hanya opt-in, dan siapa boleh memanggil apa.
-- Waktu acuan: Rabu 2026-09-30 10:00 WIB, minggu ini mulai Senin 2026-09-28.
begin;
select plan(26);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', 'u1@tes.local', '{"avatar_url": "https://foto/u1"}'),
  ('00000000-0000-0000-0000-0000000000e2', 'u2@tes.local', '{"avatar_url": "https://foto/u2"}'),
  ('00000000-0000-0000-0000-0000000000e3', 'u3@tes.local', '{}'),
  ('00000000-0000-0000-0000-0000000000e4', 'u4@tes.local', '{}'),
  ('00000000-0000-0000-0000-0000000000e5', 'u5@tes.local', '{}');
insert into profil (user_id, nama_tampilan, ikut_papan_peringkat, tampilkan_avatar, zona_waktu) values
  ('00000000-0000-0000-0000-0000000000e1', 'Umar', true, true, 'Asia/Jakarta'),
  ('00000000-0000-0000-0000-0000000000e2', 'Zaid', true, false, 'Asia/Jakarta'),
  ('00000000-0000-0000-0000-0000000000e3', 'Tersembunyi', false, false, 'Asia/Jakarta'),
  ('00000000-0000-0000-0000-0000000000e4', 'Ani', true, false, 'Asia/Jayapura'),
  ('00000000-0000-0000-0000-0000000000e5', 'Budi', true, false, 'Asia/Jakarta');

-- Konten: materi m1; soal hitung H-1 dasar, H-2 sulit; kuis K-1 tanpa tingkat, K-2 menengah; K-draf belum terbit.
insert into entri_konten (id, jenis, slug) values
  ('10000000-0000-0000-0000-0000000000e1', 'materi', 'm1'),
  ('10000000-0000-0000-0000-0000000000e2', 'soal_hitung', 'H-1'),
  ('10000000-0000-0000-0000-0000000000e3', 'soal_hitung', 'H-2'),
  ('10000000-0000-0000-0000-0000000000e4', 'soal_kuis', 'K-1'),
  ('10000000-0000-0000-0000-0000000000e5', 'soal_kuis', 'K-2'),
  ('10000000-0000-0000-0000-0000000000e6', 'soal_kuis', 'K-draf');
insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into revisi (id, entri_id, isi, dibuat_oleh, status, refs) values
  ('20000000-0000-0000-0000-0000000000e1', '10000000-0000-0000-0000-0000000000e1', '{}', '00000000-0000-0000-0000-0000000000e1', 'disetujui', '{R09-7}'),
  ('20000000-0000-0000-0000-0000000000e2', '10000000-0000-0000-0000-0000000000e2', '{"tingkat": "dasar"}', '00000000-0000-0000-0000-0000000000e1', 'disetujui', '{R09-7}'),
  ('20000000-0000-0000-0000-0000000000e3', '10000000-0000-0000-0000-0000000000e3', '{"tingkat": "sulit"}', '00000000-0000-0000-0000-0000000000e1', 'disetujui', '{R09-7}'),
  ('20000000-0000-0000-0000-0000000000e4', '10000000-0000-0000-0000-0000000000e4', '{}', '00000000-0000-0000-0000-0000000000e1', 'disetujui', '{R09-7}'),
  ('20000000-0000-0000-0000-0000000000e5', '10000000-0000-0000-0000-0000000000e5', '{"tingkat": "menengah"}', '00000000-0000-0000-0000-0000000000e1', 'disetujui', '{R09-7}'),
  ('20000000-0000-0000-0000-0000000000e6', '10000000-0000-0000-0000-0000000000e6', '{"tingkat": "sulit"}', '00000000-0000-0000-0000-0000000000e1', 'draf', '{R09-7}');
update entri_konten set revisi_terbit_id = ('20000000' || substr(id::text, 9))::uuid, versi_terbit = 1
  where slug in ('m1', 'H-1', 'H-2', 'K-1', 'K-2');

-- Log ditulis langsung (sebagai pemilik tabel) supaya terjadi_pada bisa ditentukan.
insert into log_kegiatan (user_id, jenis, slug, benar, terjadi_pada) values
  -- u1: 10 + 5 + 30 + 10 = 55 konten, hari aktif 09-20, 09-28, 09-29, 09-30.
  ('00000000-0000-0000-0000-0000000000e1', 'pelajaran', 'm1', null, '2026-09-20 09:00+07'),
  ('00000000-0000-0000-0000-0000000000e1', 'pelajaran', 'm1', null, '2026-09-20 09:05+07'),
  ('00000000-0000-0000-0000-0000000000e1', 'kuis', 'K-1', false, '2026-09-28 09:00+07'),
  ('00000000-0000-0000-0000-0000000000e1', 'kuis', 'K-1', true, '2026-09-28 09:10+07'),
  ('00000000-0000-0000-0000-0000000000e1', 'soal', 'H-2', true, '2026-09-29 20:00+07'),
  ('00000000-0000-0000-0000-0000000000e1', 'kuis', 'K-2', true, '2026-09-30 01:00+07'),
  ('00000000-0000-0000-0000-0000000000e1', 'kuis', 'K-draf', true, '2026-09-30 08:00+07'),
  ('00000000-0000-0000-0000-0000000000e1', 'kuis', 'K-1', true, '2026-09-30 09:00+07'),
  -- u2: 01:30 tanggal 28 menutup tanggal 27 yang kosong → hari aktif 09-26, 09-27, 09-29.
  ('00000000-0000-0000-0000-0000000000e2', 'soal', 'H-1', true, '2026-09-26 21:00+07'),
  ('00000000-0000-0000-0000-0000000000e2', 'pelajaran', 'm1', null, '2026-09-28 01:30+07'),
  ('00000000-0000-0000-0000-0000000000e2', 'kuis', 'K-1', true, '2026-09-29 12:00+07'),
  -- u3 tidak ikut papan.
  ('00000000-0000-0000-0000-0000000000e3', 'soal', 'H-2', true, '2026-09-29 12:00+07'),
  -- u4 (WIT): 23:30 WIB = 01:30 WIT tanggal 30 → menutup tanggal 29.
  ('00000000-0000-0000-0000-0000000000e4', 'kuis', 'K-2', true, '2026-09-29 23:30+07'),
  ('00000000-0000-0000-0000-0000000000e5', 'kuis', 'K-2', true, '2026-09-29 12:00+07'),
  -- slug karangan tidak memberi apa pun.
  ('00000000-0000-0000-0000-0000000000e5', 'kuis', 'K-palsu', true, '2026-09-29 13:00+07');

-- ===== hari aktif & streak =====
select results_eq($$select tanggal from hari_aktif('00000000-0000-0000-0000-0000000000e1') order by 1$$,
  $$values ('2026-09-20'::date), ('2026-09-28'), ('2026-09-29'), ('2026-09-30')$$,
  '00:30–01:59 tetap hari ini bila kemarin sudah aktif; salah menjawab tetap hari aktif; konten draf tidak');
select results_eq($$select tanggal from hari_aktif('00000000-0000-0000-0000-0000000000e2') order by 1$$,
  $$values ('2026-09-26'::date), ('2026-09-27'), ('2026-09-29')$$, 'kegiatan dini hari menutup kemarin yang kosong');
select results_eq($$select tanggal from hari_aktif('00000000-0000-0000-0000-0000000000e4')$$,
  $$values ('2026-09-29'::date)$$, 'batas hari mengikuti zona waktu profil');
select is((select count(*) from hari_aktif('00000000-0000-0000-0000-0000000000e5')), 1::bigint, 'slug tak terbit bukan hari aktif');

select results_eq($$select streak_sekarang, streak_terpanjang, aktif_hari_ini from ringkasan_pada('00000000-0000-0000-0000-0000000000e1', '2026-09-30 10:00+07')$$,
  $$values (3, 3, true)$$, 'streak berturut sampai hari ini');
select results_eq($$select streak_sekarang, streak_terpanjang, aktif_hari_ini from ringkasan_pada('00000000-0000-0000-0000-0000000000e2', '2026-09-30 10:00+07')$$,
  $$values (1, 2, false)$$, 'streak yang berakhir kemarin masih hidup; yang terputus hanya jadi terpanjang');
select is((select streak_sekarang from ringkasan_pada('00000000-0000-0000-0000-0000000000e2', '2026-10-01 01:00+07')), 1,
  'pukul 01:00 kemarin masih bisa ditutup, streak belum putus');
select is((select streak_sekarang from ringkasan_pada('00000000-0000-0000-0000-0000000000e2', '2026-10-01 10:00+07')), 0,
  'lewat 02:00 tanpa kegiatan kemarin, streak putus');
select results_eq($$select xp_total, streak_sekarang, aktif_hari_ini from ringkasan_pada('00000000-0000-0000-0000-0000000000e9', '2026-09-30 10:00+07')$$,
  $$values (0, 0, false)$$, 'tanpa kegiatan: nol, bukan kosong');

-- ===== XP =====
select is((select xp_total from ringkasan_pada('00000000-0000-0000-0000-0000000000e1', '2026-09-30 10:00+07')), 63,
  'XP total: pertama kali saja, per tingkat, kuis tanpa tingkat = dasar, + 2 per hari aktif');
select is((select xp_minggu_ini from ringkasan_pada('00000000-0000-0000-0000-0000000000e1', '2026-09-30 10:00+07')), 51,
  'XP minggu ini mulai Senin WIB');
select is((select xp_minggu_ini from ringkasan_pada('00000000-0000-0000-0000-0000000000e2', '2026-09-30 10:00+07')), 17,
  'XP konten ikut minggu terjadi_pada, bonus hari aktif ikut minggu tanggalnya');
select is((select xp_total from ringkasan_pada('00000000-0000-0000-0000-0000000000e5', '2026-09-30 10:00+07')), 12,
  'slug karangan tidak memberi XP');

-- ===== papan peringkat =====
select results_eq(
  $$select peringkat, nama_tampilan, avatar, xp, saya from papan_peringkat_pada('semua', 10, '2026-09-30 10:00+07', null)$$,
  $$values (1, 'Umar', 'https://foto/u1', 63, false), (2, 'Zaid', null, 31, false), (3, 'Ani', null, 12, false), (3, 'Budi', null, 12, false)$$,
  'sepanjang waktu: hanya yang ikut, seri berbagi peringkat, avatar hanya bila diizinkan');
select results_eq(
  $$select peringkat, nama_tampilan, xp, saya from papan_peringkat_pada('minggu', 2, '2026-09-30 10:00+07', '00000000-0000-0000-0000-0000000000e5')$$,
  $$values (1, 'Umar', 51, false), (2, 'Zaid', 17, false), (3, 'Budi', 12, true)$$,
  'mingguan: baris pemanggil ditambahkan meski di luar batas');
select is((select streak_sekarang from papan_peringkat_pada('semua', 10, '2026-09-30 10:00+07', null) where nama_tampilan = 'Umar'), 3,
  'papan memuat streak');
select is((select count(*) from papan_peringkat_pada('minggu', 10, '2026-10-12 10:00+07', null)), 0::bigint,
  'minggu tanpa kegiatan: papan kosong, bukan baris nol');

-- ===== profil =====
select throws_ok($$insert into profil (user_id, nama_tampilan, zona_waktu) values ('00000000-0000-0000-0000-0000000000e3', 'x', 'Mars/Olympus')
  on conflict (user_id) do update set zona_waktu = excluded.zona_waktu$$, '22023', null, 'zona waktu tidak dikenal ditolak');
select throws_ok($$update profil set nama_tampilan = '  ' where user_id = '00000000-0000-0000-0000-0000000000e3'$$,
  '23514', null, 'nama tampilan kosong ditolak');

-- ===== hak akses =====
set local role anon;
select lives_ok($$select * from papan_peringkat('semua', 10)$$, 'anon bisa melihat papan');
select throws_ok($$select * from profil$$, '42501', null, 'anon tidak bisa membaca profil');
select throws_ok($$select * from ringkasan_saya()$$, '42501', null, 'anon tidak punya ringkasan');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e1", "role": "authenticated"}';
select is((select count(*) from profil), 1::bigint, 'profil orang lain tidak terbaca');
select is((select xp_total from ringkasan_saya()), 63, 'ringkasan_saya = ringkasan pemanggil');
select throws_ok($$select * from peristiwa_xp(null)$$, '42501', null, 'fungsi internal tidak bisa dipanggil klien');
select throws_ok($$select * from papan_peringkat('bulan', 10)$$, '22023', null, 'periode tidak dikenal ditolak');

select * from finish();
rollback;
