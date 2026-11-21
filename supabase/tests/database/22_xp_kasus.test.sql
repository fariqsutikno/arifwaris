-- supabase/tests/database/22_xp_kasus.test.sql
-- DIBUAT OTOMATIS dari packages/latihan/src/__tests__/xp-kasus.json oleh scripts/xp-kasus-ke-sql.ts (pnpm db:xp-kasus).
begin;
select plan(10);
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'xp@tes.local');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0001-000000000001', 'soal_hitung', 'X-1');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', '{"bobotXp": 10}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000001', 'X-1', '00000000-0000-0000-0002-000000000001', 'biasa', 'latihan', 'periksa', null, false, timestamptz '2026-11-01 10:00+00' + interval '1 minute', '{}');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000001', 'X-1', '00000000-0000-0000-0002-000000000001', 'biasa', 'latihan', 'periksa', null, true, timestamptz '2026-11-01 10:00+00' + interval '2 minute', '{}');
select is(coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = 'X-1'), 0)::int, 10, 'benar pertama setelah satu salah');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0001-000000000002', 'soal_hitung', 'X-2');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000002', '{"bobotXp": 10}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000101', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000101', 'X-2', '00000000-0000-0000-0002-000000000002', 'biasa', 'latihan', 'periksa', null, false, timestamptz '2026-11-01 10:00+00' + interval '1 minute', '{}');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000102', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000101', 'X-2', '00000000-0000-0000-0002-000000000002', 'biasa', 'latihan', 'lihat_jawaban', null, false, timestamptz '2026-11-01 10:00+00' + interval '2 minute', '{}');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000103', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000101', 'X-2', '00000000-0000-0000-0002-000000000002', 'biasa', 'latihan', 'periksa', null, true, timestamptz '2026-11-01 10:00+00' + interval '3 minute', '{}');
select is(coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = 'X-2'), 0)::int, 0, 'lihat jawaban sebelum benar = 0 selamanya');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0001-000000000003', 'soal_hitung', 'X-3');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000003', '{"bobotXp": 10}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000201', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000201', 'X-3', '00000000-0000-0000-0002-000000000003', 'biasa', 'latihan', 'periksa', null, true, timestamptz '2026-11-01 10:00+00' + interval '1 minute', '{}');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000202', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000201', 'X-3', '00000000-0000-0000-0002-000000000003', 'biasa', 'latihan', 'lihat_jawaban', null, false, timestamptz '2026-11-01 10:00+00' + interval '2 minute', '{}');
select is(coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = 'X-3'), 0)::int, 10, 'lihat jawaban sesudah benar tidak mencabut');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0001-000000000004', 'soal_hitung', 'X-4');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000004', '{"bobotXp": 20}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000301', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000301', 'X-4', '00000000-0000-0000-0002-000000000004', 'biasa', 'latihan', 'periksa', null, true, timestamptz '2026-11-01 10:00+00' + interval '1 minute', '{}');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000302', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000301', 'X-4', '00000000-0000-0000-0002-000000000004', 'biasa', 'latihan', 'periksa', null, true, timestamptz '2026-11-01 10:00+00' + interval '2 minute', '{}');
select is(coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = 'X-4'), 0)::int, 20, 'ulang soal yang sudah benar = 0 tambahan');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0001-000000000005', 'soal_hitung', 'X-5');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000005', '{"bobotXp": 10}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000401', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000401', 'X-5', '00000000-0000-0000-0002-000000000005', 'biasa', 'latihan', 'buka', null, false, timestamptz '2026-11-01 10:00+00' + interval '1 minute', '{}');
select is(coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = 'X-5'), 0)::int, 0, 'hanya buka = 0');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0001-000000000006', 'soal_hitung', 'X-6');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0001-000000000006', '{"bobotXp": 40}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000501', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000502', 'X-6', '00000000-0000-0000-0002-000000000006', 'biasa', 'ujian', 'kirim', '[{"status":"benar"},{"status":"benar"},{"status":"salah"},{"status":"salah"}]'::jsonb, false, timestamptz '2026-11-01 10:00+00' + interval '1 minute', '{}');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000502', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000501', 'X-6', '00000000-0000-0000-0002-000000000006', 'biasa', 'latihan', 'periksa', null, true, timestamptz '2026-11-01 10:00+00' + interval '2 minute', '{}');
select is(coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = 'X-6'), 0)::int, 40, 'Ujian parsial lalu Latihan benar menambah sisa');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0001-000000000007', 'soal_hitung', 'X-7');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0001-000000000007', '{"bobotXp": 40}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000601', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000602', 'X-7', '00000000-0000-0000-0002-000000000007', 'biasa', 'ujian', 'kirim', '[{"status":"benar"},{"status":"salah"},{"status":"salah"},{"status":"salah"}]'::jsonb, false, timestamptz '2026-11-01 10:00+00' + interval '1 minute', '{}');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000602', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000601', 'X-7', '00000000-0000-0000-0002-000000000007', 'biasa', 'ujian', 'lihat_jawaban', null, false, timestamptz '2026-11-01 10:00+00' + interval '2 minute', '{}');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000603', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000601', 'X-7', '00000000-0000-0000-0002-000000000007', 'biasa', 'latihan', 'periksa', null, true, timestamptz '2026-11-01 10:00+00' + interval '3 minute', '{}');
select is(coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = 'X-7'), 0)::int, 10, 'Ujian parsial lalu lihat jawaban membakar sisa');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0001-000000000008', 'soal_hitung', 'X-8');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0001-000000000008', '{"bobotXp": 40}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000701', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000702', 'X-8', '00000000-0000-0000-0002-000000000008', 'biasa', 'ujian', 'kirim', '[{"status":"benar"},{"status":"benar"},{"status":"salah"},{"status":"salah"}]'::jsonb, false, timestamptz '2026-11-01 10:00+00' + interval '1 minute', '{}');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000702', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000703', 'X-8', '00000000-0000-0000-0002-000000000008', 'biasa', 'ujian', 'kirim', '[{"status":"benar"},{"status":"benar"},{"status":"benar"},{"status":"salah"}]'::jsonb, false, timestamptz '2026-11-01 10:00+00' + interval '2 minute', '{}');
select is(coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = 'X-8'), 0)::int, 20, 'Ujian ulang parsial tidak menaikkan XP');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0001-000000000009', 'soal_hitung', 'X-9');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0001-000000000009', '{"bobotXp": 30}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000801', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000801', 'X-9', '00000000-0000-0000-0002-000000000009', 'biasa', 'latihan', 'lihat_jawaban', null, false, timestamptz '2026-11-01 10:00+00' + interval '1 minute', '{}');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000802', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000803', 'X-9', '00000000-0000-0000-0002-000000000009', 'biasa', 'ujian', 'kirim', '[{"status":"benar"},{"status":"benar"},{"status":"benar"},{"status":"benar"}]'::jsonb, true, timestamptz '2026-11-01 10:00+00' + interval '2 minute', '{}');
select is(coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = 'X-9'), 0)::int, 0, 'lihat jawaban sebelum Kirim Ujian = 0');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0001-000000000010', 'soal_hitung', 'X-10');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000010', '{"bobotXp": 30}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values ('00000000-0000-0000-0003-000000000901', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0004-000000000902', 'X-10', '00000000-0000-0000-0002-000000000010', 'biasa', 'ujian', 'kirim', '[{"status":"benar"},{"status":"benar"},{"status":"benar"},{"status":"benar"}]'::jsonb, true, timestamptz '2026-11-01 10:00+00' + interval '1 minute', '{}');
select is(coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = 'X-10'), 0)::int, 30, 'Ujian benar penuh langsung memberi bobot penuh');
select * from finish();
rollback;
